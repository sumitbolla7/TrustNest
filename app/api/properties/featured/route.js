import connectDB from '@/config/database';
import Property from '@/models/Property';

// GET /api/properties/featured
export const GET = async (request) => {
  try {
    if (!process.env.MONGODB_URI) return Response.json([]);
    await connectDB();

    const properties = await Property.find({
      is_featured: true,
    }).select('-seller_info').limit(12);

    return new Response(JSON.stringify(properties), {
      status: 200,
    });
  } catch (error) {

    return new Response('Something Went Wrong', { status: 500 });
  }
};
