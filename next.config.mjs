import { fileURLToPath } from 'node:url';
import { invalidEnvironment } from './config/environment.mjs';

/** @type {import('next').NextConfig} */
const invalid = invalidEnvironment(process.env);
if (invalid.length) throw new Error(`Invalid environment settings: ${invalid.join(', ')}`);

const root = fileURLToPath(new URL('.', import.meta.url));

const nextConfig = {
  agentRules: false,
  turbopack: { root },
  outputFileTracingRoot: root,
  experimental: { cpus: 2 },
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
      ],
    }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
