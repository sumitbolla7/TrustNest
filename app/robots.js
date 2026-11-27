import { siteOrigin } from '@/utils/siteOrigin.mjs';

export default function robots() {
  return {
    rules: { userAgent: '*', disallow: process.env.VERCEL_ENV === 'preview' ? '/' : ['/dashboard', '/account', '/profile', '/messages', '/properties/saved', '/properties/add', '/api/'] },
    sitemap: siteOrigin() + '/sitemap.xml',
  };
}
