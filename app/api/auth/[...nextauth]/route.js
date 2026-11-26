import { authOptions } from '@/utils/authOptions';
import NextAuth from 'next-auth/next';

const authHandler = NextAuth(authOptions);

async function handler(request, context) {
  if (authOptions.providers.length) return authHandler(request, context);
  const { nextauth } = await context.params;
  if (request.method === 'GET' && ['session', 'providers'].includes(nextauth[0])) return Response.json({});
  return new Response('Sign-in is unavailable', { status: 503 });
}

export { handler as GET, handler as POST };
