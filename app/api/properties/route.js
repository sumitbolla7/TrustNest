import { imageMime, sameOrigin } from '@/utils/security.mjs';
import { readListing } from '@/utils/listingInput.mjs';
import connectDB from '@/config/database';
import Property from '@/models/Property';
import { getSessionUser } from '@/utils/getSessionUser';
import cloudinary from '@/config/cloudinary';

// GET /api/properties
export const GET = async (request) => {
  try {
    const page = Number(request.nextUrl.searchParams.get('page') ?? 1);
    const pageSize = Number(request.nextUrl.searchParams.get('pageSize') ?? 6);
    if (!Number.isInteger(page) || page < 1 || page > 1000 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
      return new Response('Invalid pagination', { status: 400 });
    }
    if (!process.env.MONGODB_URI) return Response.json({ total: 0, properties: [] });
    await connectDB();

    const skip = (page - 1) * pageSize;

    const total = await Property.countDocuments({});
    const properties = await Property.find({}).select('-seller_info').sort({ createdAt: -1, _id: -1 }).skip(skip).limit(pageSize);

    const result = {
      total,
      properties,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
    });
  } catch (error) {

    return new Response('Something Went Wrong', { status: 500 });
  }
};

export const POST = async (request) => {
  if (!sameOrigin(request, process.env.NEXTAUTH_URL)) return new Response('Forbidden origin', { status: 403 });
  try {
    await connectDB();

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.userId) {
      return new Response('User ID is required', { status: 401 });
    }

    const { userId } = sessionUser;

    const formData = await request.formData();
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

    if (images.length > 4 || images.some(image => typeof image.arrayBuffer !== 'function' || image.size > 5 * 1024 * 1024)) {
      return new Response('Use up to four images of at most 5 MB each', { status: 400 });
    }
    const uploads = [];
    for (const image of images) {
      const bytes = Buffer.from(await image.arrayBuffer());
      const mime = imageMime(bytes);
      if (!mime || mime !== image.type) return new Response('Use valid JPEG or PNG images', { status: 400 });
      uploads.push({ bytes, mime });
    }
    propertyData.images = [];
    for (const { bytes, mime } of uploads) {
      const result = await cloudinary.uploader.upload(`data:${mime};base64,${bytes.toString('base64')}`, {
        folder: 'trustnest',
      });
      propertyData.images.push(result.secure_url);
    }

    const newProperty = new Property(propertyData);
    await newProperty.save();

    return Response.redirect(
      `${process.env.NEXTAUTH_URL}/properties/${newProperty._id}`
    );

    // return new Response(JSON.stringify({ message: 'Success' }), {
    //   status: 200,
    // });
  } catch (error) {
    return new Response('Failed to add property', { status: 500 });
  }
};
