import { listingFilters } from './marketplace.mjs';

export function searchReturn(value, fallback = '/properties') {
  if (typeof value !== 'string' || value.length > 2000 || !value.startsWith('/') || value.startsWith('//')) return fallback;
  try {
    const url = new URL(value, 'https://trustnest.invalid');
    if (url.origin !== 'https://trustnest.invalid' || !['/properties', '/properties/demo'].includes(url.pathname) || url.hash) return fallback;
    listingFilters(url.searchParams);
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}
