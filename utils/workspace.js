import User from '@/models/User';
import { Notification } from '@/models/Marketplace';
import { objectId } from '@/utils/security.mjs';

export const validId = value => typeof value === 'string' && objectId.test(value);
export const cleanText = (value, max) => typeof value === 'string' && value.trim().length <= max ? value.trim() : null;
export const privateJson = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
export const problem = (message, status = 400) => privateJson({ message }, status);

export async function notify(user, label, href = '/dashboard') {
  if (await User.exists({ _id: user, suspended: { $ne: true }, notificationsEnabled: { $ne: false } })) {
    await Notification.create({ user, label, href });
  }
}
