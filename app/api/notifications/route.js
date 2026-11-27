import { getSessionUser } from '@/utils/getSessionUser';
import { Notification } from '@/models/Marketplace';
import { privateJson, problem } from '@/utils/workspace';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return problem('Sign in first.', 401);
  try {
    const scope = { user: session.userId };
    const [items, unread] = await Promise.all([
      Notification.find(scope).select('label href readAt createdAt').sort({ createdAt: -1 }).limit(8).lean(),
      Notification.countDocuments({ ...scope, readAt: null }),
    ]);
    return privateJson({ items, unread });
  } catch {
    return problem('Notifications are unavailable.', 503);
  }
}
