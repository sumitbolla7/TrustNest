import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const authenticate = withAuth({});

export function proxy(request) {
  if (!process.env.NEXTAUTH_SECRET || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.MONGODB_URI) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return authenticate(request);
}

export const config = {
  matcher: ['/properties/add', '/properties/:id/edit', '/profile', '/properties/saved', '/messages'],
};
