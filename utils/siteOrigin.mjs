export function siteOrigin() {
  for (const value of [process.env.NEXT_PUBLIC_DOMAIN, process.env.NEXTAUTH_URL]) {
    if (!value) continue;
    try {
      const url = new URL(value);
      if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.origin;
    } catch {
      // Try the next configured origin.
    }
  }
  return 'http://localhost:3000';
}
