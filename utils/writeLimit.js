import connectDB from '@/config/database';
import WriteLimit from '@/models/WriteLimit';

export async function writeLimit(userId, operation, maximum, seconds = 60) {
  await connectDB();
  const now = Date.now();
  const window = Math.floor(now / (seconds * 1000));
  const expiresAt = new Date((window + 1) * seconds * 1000);
  const key = { _id: `${userId}:${operation}:${window}` };
  const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt } };
  let counter;
  try {
    counter = await WriteLimit.findOneAndUpdate(key, update, { upsert: true, new: true, setDefaultsOnInsert: false });
  } catch (error) {
    if (error.code !== 11000) throw error;
    counter = await WriteLimit.findOneAndUpdate(key, update, { new: true });
  }
  if (counter.count <= maximum) return null;
  return new Response('Too many changes. Try again shortly.', {
    status: 429,
    headers: { 'Retry-After': String(Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000))) },
  });
}
