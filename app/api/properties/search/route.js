import connectDB from '@/config/database';
import Property from '@/models/Property';
import { literalSearch } from '@/utils/security.mjs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const location = (searchParams.get('location') ?? '').trim();
  const type = searchParams.get('propertyType');
  if (location.length > 100 || (type && type.length > 40)) {
    return new Response('Search fields are too long', { status: 400 });
  }
  const query = {};
  if (location) {
    const pattern = literalSearch(location);
    const fields = ['name', 'description', 'location.street', 'location.city', 'location.county', 'location.eircode', 'location.state', 'location.zipcode'];
    query.$or = fields.map(field => ({ [field]: pattern }));
  }
  if (type && type !== 'All') query.type = type;

  try {
    if (!process.env.MONGODB_URI) return Response.json([]);
    await connectDB();
    return Response.json(await Property.find(query).select('-seller_info').limit(100));
  } catch {
    return new Response('Could not search rentals', { status: 500 });
  }
}
