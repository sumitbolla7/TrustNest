import { siteOrigin } from '@/utils/siteOrigin.mjs';
import connectDB from '@/config/database';
import Property from '@/models/Property';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const root = siteOrigin();
  const pages = ['', '/properties', '/info/about', '/info/guide', '/info/faq', '/info/safety', '/info/contact', '/info/help', '/photo-credits'].map(path => ({ url: root + path }));
  if (!process.env.MONGODB_URI) return pages;
  try {
    await connectDB();
    const active = await Property.find({ status: 'active', is_demo: { $ne: true } }).select('_id updatedAt').sort({ updatedAt: -1 }).limit(500).lean().maxTimeMS(2500);
    return [...pages, ...active.map(item => ({ url: root + '/properties/' + item._id, lastModified: item.updatedAt }))];
  } catch {
    return pages;
  }
}
