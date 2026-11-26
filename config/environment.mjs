export function invalidEnvironment(env, full = false) {
  const bad = [];
  for (const name of ['NEXTAUTH_URL', 'NEXTAUTH_URL_INTERNAL', 'NEXT_PUBLIC_DOMAIN', 'NEXT_PUBLIC_API_DOMAIN']) {
    if (!env[name]) {
      if (full && name === 'NEXTAUTH_URL') bad.push(name);
      continue;
    }
    try {
      const url = new URL(env[name]);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash ||
        (env.VERCEL === '1' && name === 'NEXTAUTH_URL' && url.protocol !== 'https:')) bad.push(name);
    } catch {
      bad.push(name);
    }
  }
  if ((full || env.MONGODB_URI) && !/^mongodb(?:\+srv)?:\/\/.+/.test(env.MONGODB_URI ?? '')) bad.push('MONGODB_URI');
  if ((full || env.NEXTAUTH_SECRET) && (env.NEXTAUTH_SECRET?.length ?? 0) < 32) bad.push('NEXTAUTH_SECRET');
  for (const name of [...(env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_SECRET ? ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'] : [])]) {
    if (full && !env[name]?.trim()) bad.push(name);
  }
  if ((env.RESEND_API_KEY || env.TRUSTNEST_EMAIL_FROM || (full && env.TRUSTNEST_REQUIRE_VERIFIED_EMAIL === 'true')) && (!env.RESEND_API_KEY || !env.TRUSTNEST_EMAIL_FROM)) bad.push('RESEND_API_KEY/TRUSTNEST_EMAIL_FROM');
  const storage = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  if (storage.some(name => env[name])) {
    bad.push(...storage.filter(name => !env[name]?.trim()));
  }
  if (env.NEXT_PUBLIC_MAPBOX_TOKEN && !env.NEXT_PUBLIC_MAPBOX_TOKEN.startsWith('pk.')) bad.push('NEXT_PUBLIC_MAPBOX_TOKEN');
  return bad;
}
