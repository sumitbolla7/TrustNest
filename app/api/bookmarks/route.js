import { readJsonObject } from '@/utils/requestBody.mjs';
import { objectId, sameOrigin } from '@/utils/security.mjs';
import { publicListing, publicListingFields } from '@/utils/catalogue';
import { writeLimit } from '@/utils/writeLimit';
import connectDB from '@/config/database';
import User from '@/models/User';
import Property from '@/models/Property';
import { getSessionUser } from '@/utils/getSessionUser';

export const dynamic = 'force-dynamic';
const privateHeaders = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  const session = await getSessionUser();
  if (!session?.userId) return new Response('Sign in to view saved rentals', { status: 401 });
  try {
    await connectDB();
    const user = await User.findById(session.userId).select('bookmarks').lean();
    if (!user) return new Response('Sign in to view saved rentals', { status: 401 });
    const rentals = await Property.find({ _id: { $in: user.bookmarks }, status: { $in: ['active', null] } }).select(publicListingFields).sort({ createdAt: -1, _id: -1 }).lean();
    return Response.json(rentals.map(publicListing), { headers: privateHeaders });
  } catch {
    return new Response('Saved rentals are unavailable', { status: 503 });
  }
}

export async function POST(request) {
  if (!sameOrigin(request, process.env.NEXTAUTH_URL)) return new Response('Forbidden origin', { status: 403 });
  const session = await getSessionUser();
  if (!session?.userId) return new Response('Sign in to save rentals', { status: 401 });
  const input = await readJsonObject(request, 2048, ['propertyId', 'saved']);
  if (input.status) return new Response('Invalid saved rental request', { status: input.status });
  const payload = input.data;
  if (typeof payload.propertyId !== 'string' || !objectId.test(payload.propertyId) || typeof payload.saved !== 'boolean') {
    return new Response('Invalid saved rental request', { status: 400 });
  }
  try {
    const limited = await writeLimit(session.userId, 'bookmark', 30);
    if (limited) return limited;
    if (payload.saved && !await Property.exists({ _id: payload.propertyId, status: { $in: ['active', null] } })) return new Response('Rental not found', { status: 404 });
    const update = payload.saved
      ? { $addToSet: { bookmarks: payload.propertyId } }
      : { $pull: { bookmarks: payload.propertyId } };
    const user = await User.updateOne({ _id: session.userId }, update);
    if (!user.matchedCount) return new Response('Sign in to save rentals', { status: 401 });
    return Response.json({ isBookmarked: payload.saved }, { headers: privateHeaders });
  } catch {
    return new Response('Could not update saved rentals', { status: 503 });
  }
}
