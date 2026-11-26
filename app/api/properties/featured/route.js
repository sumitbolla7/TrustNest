import { listRentals } from '@/utils/catalogue';

export async function GET() {
  try {
    const result = await listRentals({ page: 1, pageSize: 6, sort: 'newest' }, { featured: true });
    return Response.json(result.properties);
  } catch {
    return new Response('Featured rentals are unavailable', { status: 503 });
  }
}
