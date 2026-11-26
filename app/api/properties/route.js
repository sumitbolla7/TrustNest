import { listRentals } from '@/utils/catalogue';
import { listingFilters } from '@/utils/marketplace.mjs';
import { writeLimit } from '@/utils/writeLimit';
import { randomUUID } from 'node:crypto';
import { sanitiseRentalImage } from '@/utils/rentalImage.mjs';
import { sameOrigin } from '@/utils/security.mjs';
import { readListing } from '@/utils/listingInput.mjs';
import Property from '@/models/Property';
import { getSessionUser } from '@/utils/getSessionUser';
import cloudinary from '@/config/cloudinary';

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

    const { userId } = sessionUser;
    const limited = await writeLimit(userId, "listing-create", 5);
    if (limited) return limited;
    const contentLength = Number(request.headers.get("content-length"));
    if (!Number.isSafeInteger(contentLength) || contentLength <= 0) return new Response("Content-Length required", { status: 411 });
    if (contentLength > 4 * 1024 * 1024) return new Response("Upload exceeds 4 MB", { status: 413 });

    const formData = await request.formData().catch(() => null);
    if (!formData) return new Response("Invalid listing form", { status: 400 });
    const images = formData
      .getAll('images')
      .filter((image) => image.name !== '');

    let propertyData;
    try {
      propertyData = readListing(formData);
    } catch {
      return new Response('Check the listing fields and try again', { status: 400 });
    }
    propertyData.owner = userId;

    if (images.length > 4 || images.some(image => typeof image.arrayBuffer !== 'function' || image.size > 1024 * 1024)) {
      return new Response('Use up to four images of at most 1 MB each', { status: 400 });
    }
    if (images.length && !process.env.CLOUDINARY_CLOUD_NAME) return new Response("Image storage is unavailable", { status: 503 });
    let uploads;
    try {
      uploads = await Promise.all(images.map(sanitiseRentalImage));
    } catch {
      return new Response('Use valid JPEG or PNG photos of at most 1 MB each', { status: 400 });
    }
    propertyData.images = [];
    for (const bytes of uploads) {
      const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${bytes.toString('base64')}`, {
        folder: 'trustnest',
        public_id: randomUUID(),
        resource_type: 'image',
        overwrite: false,
      });
      uploaded.push(result.public_id);
      propertyData.images.push(result.secure_url);
    }

    const newProperty = new Property(propertyData);
    await newProperty.save();

    return Response.redirect(
      new URL(`/properties/${newProperty._id}`, process.env.NEXTAUTH_URL), 303
    );

  } catch {
    await Promise.allSettled(uploaded.map(id => cloudinary.uploader.destroy(id)));
    return new Response('Failed to add property', { status: 500 });
  }
};
