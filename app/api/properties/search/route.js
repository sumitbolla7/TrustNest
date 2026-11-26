import { listRentals } from '@/utils/catalogue';
import { listingFilters } from '@/utils/marketplace.mjs';

export async function GET(request) {
  let filters;
  try {
    filters = listingFilters(request.nextUrl.searchParams);
  } catch {
    return new Response('Invalid rental filters', { status: 400 });
  }
  try {
    return Response.json((await listRentals(filters)).properties);
  } catch {
    return new Response('Could not search rentals', { status: 503 });
  }
}
