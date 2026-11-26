import { objectId } from '@/utils/security.mjs';
import connectDB from '@/config/database';
import User from '@/models/User';
import { writeLimit } from '@/utils/writeLimit';
import { normalEmail, tokenHash, verifyPassword } from '@/utils/passwords.mjs';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const enabled = Boolean(process.env.MONGODB_URI && process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL);
const google = enabled && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
export const authOptions = {
  pages: { signIn: '/account' },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 },
  providers: [
    ...(enabled ? [CredentialsProvider({
      credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
      async authorize(credentials) {
        const email = normalEmail(credentials?.email);
        if (!email || typeof credentials?.password !== 'string' || credentials.password.length > 128) return null;
        const limited = await writeLimit(tokenHash(email), 'sign-in', 8, 900);
        if (limited) return null;
        const user = await User.findOne({ email }).select('+passwordHash role suspended sessionVersion emailVerified').lean();
        const match = await verifyPassword(credentials.password, user?.passwordHash);
        if (!match || user.suspended || (process.env.TRUSTNEST_REQUIRE_VERIFIED_EMAIL === 'true' && !user.emailVerified)) return null;
        return { id: String(user._id), email, role: user.role, version: user.sessionVersion ?? 0 };
      },
    })] : []),
    ...(google ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })] : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return true;
      const email = normalEmail(profile?.email);
      if (!email || profile.email_verified !== true) return false;
      await connectDB();
      const user = await User.findOne({ email }).select('suspended emailVerified').lean();
      if (user?.suspended) return false;
      if (user && !user.emailVerified) {
        await User.updateOne({ _id: user._id, emailVerified: { $ne: true } }, { $set: { emailVerified: true }, $unset: { passwordHash: 1, resetLink: 1, verifyLink: 1 }, $inc: { sessionVersion: 1 } });
        return true;
      }
      await User.updateOne({ email }, { $set: { emailVerified: true }, $setOnInsert: { username: (profile.name || email.split('@')[0]).slice(0, 40), image: profile.picture } }, { upsert: true });
      return true;
    },
    async jwt({ token, user, account }) {
      if (!account || !user) return token;
      if (account.provider === 'credentials') return { ...token, uid: user.id, version: user.version };
      const record = await User.findOne({ email: normalEmail(user.email) }).select('sessionVersion').lean();
      return { ...token, uid: record ? String(record._id) : null, email: normalEmail(user.email), version: record?.sessionVersion ?? 0 };
    },
    async session({ session, token }) {
      const id = token.uid ?? token.sub;
      if (typeof id !== 'string' || !objectId.test(id) || !normalEmail(session.user?.email)) return { expires: session.expires };
      await connectDB();
      const user = await User.findOne({ _id: id, email: normalEmail(session.user.email) }).select('username role image suspended sessionVersion').lean();
      if (!user || user.suspended || (user.sessionVersion ?? 0) !== (token.version ?? 0)) return { expires: session.expires };
      session.user = { id: String(user._id), name: user.username, email: session.user.email, image: user.image, role: user.role ?? 'tenant' };
      return session;
    },
  },
};
