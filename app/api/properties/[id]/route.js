import { readRentalForm } from '@/utils/requestBody.mjs';
import { discardUploads, readPhotos, uploadPhotos } from '@/utils/listingPhotos';
import { findRental } from '@/utils/catalogue';
import { writeLimit } from '@/utils/writeLimit';
import { objectId, sameOrigin } from '@/utils/security.mjs';
import { readListing } from '@/utils/listingInput.mjs';
import connectDB from '@/config/database';
import Property from '@/models/Property';
import { getSessionUser } from '@/utils/getSessionUser';

export async function GET(request, { params }) {
  const { id } = await params;
  if (!objectId.test(id)) return new Response('Invalid listing ID', { status: 400 });
  try {
    if (request.nextUrl.searchParams.get('edit') === '1') {
      const session = await getSessionUser();
      if (!session?.userId) return new Response('Sign in to edit rentals', { status: 401 });
      await connectDB();
      const property = await Property.findOne({ _id: id, owner: session.userId, is_demo: { $ne: true } }).lean();
      return property ? Response.json(property, { headers: { 'Cache-Control': 'private, no-store' } }) : new Response('Rental not found', { status: 404 });
    }
    const property = await findRental(id);
    return property ? Response.json(property) : new Response('Rental not found', { status: 404 });
  } catch {
    return new Response('Rental is temporarily unavailable', { status: 503 });
  }
}

// DELETE /api/properties/:id
export const DELETE = async (request, { params }) => {
  if (!sameOrigin(request, process.env.NEXTAUTH_URL)) return new Response('Forbidden origin', { status: 403 });
  try {
    const propertyId = (await params).id;
    if (!objectId.test(propertyId)) return new Response('Invalid listing ID', { status: 400 });

    const sessionUser = await getSessionUser();

    // Check for session
    if (!sessionUser || !sessionUser.userId) {
      return new Response('User ID is required', { status: 401 });
    }

    const { userId } = sessionUser;

    const limited = await writeLimit(userId, 'listing-delete', 10);
    if (limited) return limited;
    const result = await Property.deleteOne({ _id: propertyId, owner: userId, is_demo: { $ne: true } });
    if (!result.deletedCount) return new Response('Rental not found', { status: 404 });

    return new Response('Property Deleted', {
      status: 200,
    });
  } catch (error) {

    return new Response('Something Went Wrong', { status: 500 });
  }
};

// PUT /api/properties/:id
export const PUT = async (request, { params }) => {
  if (!sameOrigin(request, process.env.NEXTAUTH_URL)) return new Response('Forbidden origin', { status: 403 });
  const uploaded = [];
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.userId) {
      return new Response('User ID is required', { status: 401 });
    }

    const { id } = await params;
    if (!objectId.test(id)) return new Response('Invalid listing ID', { status: 400 });
    const { userId } = sessionUser;

    const limited = await writeLimit(userId, "listing-edit", 15);
    if (limited) return limited;

    const ownerQuery = { _id: id, owner: userId, is_demo: { $ne: true }, status: { $ne: 'removed' } };
    const existingProperty = await Property.findOne(ownerQuery).select('type status images updatedAt').lean();
    if (!existingProperty) return new Response('Rental not found', { status: 404 });
    const input = await readRentalForm(request);
    if (input.status) return new Response('Invalid rental form', { status: input.status });
    const formData = input.data;

    let propertyData;
    try {
      propertyData = readListing(formData, existingProperty.type);
    } catch {
      return new Response('Check the listing fields and try again', { status: 400 });
    }

    const existingImages = existingProperty.images ?? [];
    const removal = formData.getAll('removeImage');
    if (removal.some(index => typeof index !== 'string' || !/^\d{1,3}$/.test(index) || Number(index) >= existingImages.length)) return new Response('Invalid photo selection', { status: 400 });
    const kept = existingImages.filter((_, index) => !removal.includes(String(index)));
    let photos;
    try { photos = await readPhotos(formData, Math.max(0, 4 - kept.length)); }
    catch { return new Response('Use valid JPEG or PNG photos of at most 1 MB each', { status: 400 }); }
    if (photos.length && !process.env.CLOUDINARY_CLOUD_NAME) return new Response('Image storage is unavailable', { status: 503 });
    propertyData.images = [...kept, ...await uploadPhotos(photos, uploaded)];

    // Update property in database
    propertyData.status = formData.get('intent') === 'submit' ? 'pending' : 'draft';
    const unset = {};
    for (const key of ['furnishing', 'availability', 'deposit']) {
      if (propertyData[key] == null) {
        delete propertyData[key];
        unset[key] = 1;
      }
    }
    const updatedProperty = await Property.findOneAndUpdate({ ...ownerQuery, status: existingProperty.status ?? null, updatedAt: existingProperty.updatedAt ?? null }, { $set: propertyData, $unset: unset }, { runValidators: true, new: true });

    if (!updatedProperty) {
      await discardUploads(uploaded);
      return new Response('Listing changed. Reload and try again.', { status: 409 });
    }
    return new Response(JSON.stringify(updatedProperty), {
      status: 200,
    });
  } catch (error) {

    await discardUploads(uploaded);
    return new Response('Failed to update rental', { status: 500 });
  }
};
