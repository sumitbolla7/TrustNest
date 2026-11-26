import connectDB from '@/config/database';
import User from '@/models/User';

import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 },
  providers: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.NEXTAUTH_SECRET && process.env.MONGODB_URI ? [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ] : [],
  callbacks: {
    async signIn({ profile }) {
      if (typeof profile?.email !== 'string' || !profile.email || profile.email_verified !== true) return false;
      await connectDB();
      const username = (typeof profile.name === 'string' && profile.name.trim() || profile.email.split('@')[0]).slice(0, 20);
      try {
        await User.updateOne({ email: profile.email }, { $setOnInsert: {
          username, image: typeof profile.picture === 'string' ? profile.picture : undefined,
        } }, { upsert: true, runValidators: true });
      } catch (error) {
        if (error.code !== 11000 || !await User.exists({ email: profile.email })) throw error;
      }
      return true;
    },
    // Modifies the session object
    async session({ session }) {
      // 1. Get user from database
      await connectDB();
      if (typeof session.user?.email !== 'string') return { expires: session.expires };
      const user = await User.findOne({ email: session.user.email }).select('_id').lean();
      if (!user) return { expires: session.expires };
      // 2. Assign the user id to the session
      session.user.id = user._id.toString();
      // 3. return session
      return session;
    },
  },
};
