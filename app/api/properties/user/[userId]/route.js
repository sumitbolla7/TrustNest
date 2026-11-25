import { getSessionUser } from '@/utils/getSessionUser';
import connectDB from '@/config/database';
import Property from '@/models/Property';

// GET /api/properties/user/:userId
export const GET = async (request, { params }) => {
  try {

    const userId = (await params).userId;

    if (!userId) {
      return new Response('User ID is required', { status: 400 });
    }

    const session = await getSessionUser();
    if (session?.userId !== userId) return new Response('Forbidden', { status: 403 });
    await connectDB();
    const properties = await Property.find({ owner: userId });

    return new Response(JSON.stringify(properties), {
      status: 200,
    });
  } catch (error) {

    return new Response('Something Went Wrong', { status: 500 });
  }
};
