import { readJsonObject } from '@/utils/requestBody.mjs';
import { objectId } from '@/utils/security.mjs';
import connectDB from '@/config/database';
import User from '@/models/User';
import { getSessionUser } from '@/utils/getSessionUser';

export async function POST(request) {
  const session = await getSessionUser();
  if (!session?.userId) return new Response('Sign in to view saved rentals', { status: 401 });
  const input = await readJsonObject(request, 2048, ['propertyId']);
  if (input.status) return new Response('Invalid rental request', { status: input.status });
  const { propertyId } = input.data;
  if (typeof propertyId !== 'string' || !objectId.test(propertyId)) return new Response('Invalid rental ID', { status: 400 });
  try {
    await connectDB();
    return Response.json({ isBookmarked: Boolean(await User.exists({ _id: session.userId, bookmarks: propertyId })) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return new Response('Saved rentals are unavailable', { status: 503 });
  }
}
