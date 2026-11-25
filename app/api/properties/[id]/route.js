import { objectId, sameOrigin } from '@/utils/security.mjs';
import { readListing } from '@/utils/listingInput.mjs';
import connectDB from '@/config/database';
import Property from '@/models/Property';
import { getSessionUser } from '@/utils/getSessionUser';

// GET /api/properties/:id
export const GET = async (request, { params }) => {
  try {
    const { id } = await params;
    if (!objectId.test(id)) return new Response('Invalid listing ID', { status: 400 });
    if (!process.env.MONGODB_URI) return new Response('Property not found', { status: 404 });
    await connectDB();
    const session = await getSessionUser().catch(() => null);
    const property = await Property.findById(id).lean();
    if (property && property.owner.toString() !== session?.userId) delete property.seller_info;

    if (!property) return new Response('Property Not Found', { status: 404 });

    return new Response(JSON.stringify(property), {
      status: 200,
    });
  } catch (error) {

    return new Response('Something Went Wrong', { status: 500 });
  }
};

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

    await connectDB();

    const property = await Property.findById(propertyId);

    if (!property) return new Response('Property Not Found', { status: 404 });

    // Verify ownership
    if (property.owner.toString() !== userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    await property.deleteOne();

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
  try {
    await connectDB();

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.userId) {
      return new Response('User ID is required', { status: 401 });
    }

    const { id } = await params;
    if (!objectId.test(id)) return new Response('Invalid listing ID', { status: 400 });
    const { userId } = sessionUser;

    const formData = await request.formData();

    // Get property to update
    const existingProperty = await Property.findById(id);

    if (!existingProperty) {
      return new Response('Property does not exist', { status: 404 });
    }

    // Verify ownership
    if (existingProperty.owner.toString() !== userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    let propertyData;
    try {
      propertyData = readListing(formData, existingProperty.type);
    } catch {
      return new Response('Check the listing fields and try again', { status: 400 });
    }

    // Update property in database
    const updatedProperty = await Property.findOneAndUpdate({ _id: id, owner: userId }, propertyData, { runValidators: true, new: true });

    if (!updatedProperty) return new Response('Property not found', { status: 404 });
    return new Response(JSON.stringify(updatedProperty), {
      status: 200,
    });
  } catch (error) {

    return new Response('Failed to add property', { status: 500 });
  }
};
