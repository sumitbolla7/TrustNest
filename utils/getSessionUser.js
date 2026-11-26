import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utils/authOptions';

export const getSessionUser = async () => {
  try {
    if (!process.env.NEXTAUTH_SECRET || !process.env.MONGODB_URI) return null;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return null;
    }

    return {
      user: session.user,
      userId: session.user.id,
    };
  } catch (error) {
    return null;
  }
};
