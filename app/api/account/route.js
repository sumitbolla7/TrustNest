import { readJsonObject } from '@/utils/requestBody.mjs';
import { accountFields } from '@/utils/actionFields.mjs';
import connectDB from '@/config/database';
import User from '@/models/User';
import Property from '@/models/Property';
import { getSessionUser } from '@/utils/getSessionUser';
import { sameOrigin } from '@/utils/security.mjs';
import { passwordHash, normalEmail, tokenHash, validPassword, verifyPassword } from '@/utils/passwords.mjs';
import { emailEnabled, sendAccountLink } from '@/utils/account';
import { writeLimit } from '@/utils/writeLimit';

const failure = (message, status = 400) => Response.json({ message }, { status });
const okay = message => Response.json({ message });
const emailResponse = 'If the account is eligible, an email will be sent.';

export async function POST(request) {
  if (!sameOrigin(request, process.env.NEXTAUTH_URL)) return failure('Forbidden origin', 403);
  if (!process.env.MONGODB_URI || !process.env.NEXTAUTH_SECRET) return failure('Account services are unavailable', 503);
  const input = await readJsonObject(request, 8192, accountFields);
  if (input.status) return failure('Invalid request body.', input.status);
  const body = input.data;
  const action = body?.action;
  try {
    await connectDB();
    if (['register', 'forgot', 'resend'].includes(action)) {
      const email = normalEmail(body.email);
      if (!email) return failure('Enter a valid email address.');
      if (action !== 'register' && !emailEnabled()) return failure('Email delivery is unavailable.', 503);
      const limited = await writeLimit(tokenHash(email), 'account-' + action, 4, 900);
      if (limited) return limited;
      if (action === 'register') {
        if (!['tenant', 'landlord'].includes(body.role) || typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 60 || !validPassword(body.password)) {
          return failure('Enter a name, tenant or landlord role, and a password of 12–128 characters.');
        }
        if (process.env.TRUSTNEST_REQUIRE_VERIFIED_EMAIL === 'true' && !emailEnabled()) return failure('Registration is temporarily unavailable.', 503);
        const hash = await passwordHash(body.password);
        try {
          const user = await User.create({ email, username: body.name.trim(), role: body.role, passwordHash: hash });
          await sendAccountLink(user, 'verify').catch(() => {});
        } catch (error) {
          if (error.code !== 11000) throw error;
        }
        return okay('Registration submitted. Sign in, or check your inbox if verification is required.');
      }
      const user = await User.findOne({ email, suspended: { $ne: true } }).select('+passwordHash emailVerified email').lean();
      if (user && (action === 'forgot' ? user.passwordHash : !user.emailVerified)) await sendAccountLink(user, action === 'forgot' ? 'reset' : 'verify').catch(() => {});
      return okay(emailResponse);
    }
    if (['reset', 'verify'].includes(action)) {
      if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token) || (action === 'reset' && !validPassword(body.password))) return failure('Invalid or expired account link.');
      const field = action === 'reset' ? 'resetLink' : 'verifyLink';
      const query = { [field + '.hash']: tokenHash(body.token), [field + '.expires']: { $gt: new Date() }, suspended: { $ne: true } };
      if (action === 'reset' && !await User.exists(query)) return failure('Invalid or expired account link.');
      const change = action === 'reset' ? { $set: { passwordHash: await passwordHash(body.password) }, $inc: { sessionVersion: 1 } } : { $set: { emailVerified: true } };
      const result = await User.updateOne(query, { ...change, $unset: { [field]: 1 } });
      return result.modifiedCount ? okay('Account updated. You can now sign in.') : failure('Invalid or expired account link.');
    }
    const session = await getSessionUser();
    if (!session) return failure('Sign in first.', 401);
    const limited = await writeLimit(session.userId, 'account-change', 8, 900);
    if (limited) return limited;
    if (action === 'profile') {
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 60 || typeof body.notifications !== 'boolean') return failure('Check your profile details.');
      await User.updateOne({ _id: session.userId }, { $set: { username: body.name.trim(), notificationsEnabled: body.notifications } });
      return okay('Profile saved.');
    }
    const user = await User.findById(session.userId).select('+passwordHash').lean();
    if (!user) return failure('Account unavailable', 404);
    if (action === 'password') {
      if (!validPassword(body.password) || !await verifyPassword(body.current, user.passwordHash)) return failure('Check your current and new passwords.');
      const result = await User.updateOne({ _id: user._id, passwordHash: user.passwordHash }, { $set: { passwordHash: await passwordHash(body.password) }, $unset: { resetLink: 1 }, $inc: { sessionVersion: 1 } });
      return result.modifiedCount ? okay('Password changed. Sign in again.') : failure('Account changed. Try again.', 409);
    }
    if (action === 'delete') {
      if (body.confirmation !== 'DELETE' || (user.passwordHash && !await verifyPassword(body.current, user.passwordHash))) return failure('Confirm account deletion and provide your current password where applicable.');
      const result = await User.updateOne({ _id: user._id, ...(user.passwordHash ? { passwordHash: user.passwordHash } : {}) }, { $set: { suspended: true, deleted: true, username: 'Deleted account', email: String(user._id) + '@deleted.invalid', bookmarks: [], notificationsEnabled: false }, $unset: { passwordHash: 1, image: 1, resetLink: 1, verifyLink: 1 }, $inc: { sessionVersion: 1 } });
      if (!result.modifiedCount) return failure('Account changed. Try again.', 409);
      await Property.updateMany({ owner: user._id, is_demo: { $ne: true }, status: { $ne: 'removed' } }, { $set: { status: 'removed' } });
      return okay('Account deleted.');
    }
    return failure('Unknown account operation.');
  } catch {
    return failure('Account operation unavailable.', 503);
  }
}
