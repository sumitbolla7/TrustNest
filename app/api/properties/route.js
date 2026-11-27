import { readRentalForm } from '@/utils/requestBody.mjs';
import { listRentals } from '@/utils/catalogue';
import { listingFilters } from '@/utils/marketplace.mjs';
import { writeLimit } from '@/utils/writeLimit';
import { discardUploads, readPhotos, uploadPhotos } from '@/utils/listingPhotos';
import { sameOrigin } from '@/utils/security.mjs';
import { readListing } from '@/utils/listingInput.mjs';
import Property from '@/models/Property';
import { getSessionUser } from '@/utils/getSessionUser';

export async function GET(request) {
  let filters;
  try {
    filters = listingFilters(request.nextUrl.searchParams);
  } catch {
    return new Response('Invalid rental filters', { status: 400 });
  }
  try {
    return Response.json(await listRentals(filters));
  } catch {
    return new Response('Rentals are temporarily unavailable', { status: 503 });
  }
}

export const POST = async (request) => {
  if (!sameOrigin(request, process.env.NEXTAUTH_URL)) return new Response('Forbidden origin', { status: 403 });
  const uploaded = [];
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.userId) {
      return new Response('User ID is required', { status: 401 });
    }

    if (sessionUser.user.role !== 'landlord') return new Response('Landlord access required', { status: 403 });
    const { userId } = sessionUser;
    const limited = await writeLimit(userId, "listing-create", 5);
    if (limited) return limited;

    const input = await readRentalForm(request);
    if (input.status) return new Response('Invalid rental form', { status: input.status });
    const formData = input.data;
    let propertyData;
    try {
      propertyData = readListing(formData);
    } catch {
      return new Response('Check the listing fields and try again', { status: 400 });
    }
    propertyData.owner = userId;
    propertyData.status = formData.get('intent') === 'submit' ? 'pending' : 'draft';

    let photos;
    try {
      photos = await readPhotos(formData, 4);
    } catch {
      return new Response('Use valid JPEG or PNG photos of at most 1 MB each', { status: 400 });
    }
    if (photos.length && !process.env.CLOUDINARY_CLOUD_NAME) return new Response('Image storage is unavailable', { status: 503 });
    propertyData.images = await uploadPhotos(photos, uploaded);

    const newProperty = new Property(propertyData);
    await newProperty.save();

    if (request.headers.get("accept") === "application/json") return Response.json({ _id: String(newProperty._id) }, { status: 201 });
    return Response.redirect(
      new URL(`/properties/${newProperty._id}?preview=1`, process.env.NEXTAUTH_URL), 303
    );

  } catch {
    await discardUploads(uploaded);
    return new Response('Failed to add property', { status: 500 });
  }
};
