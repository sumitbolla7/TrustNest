import { randomBytes } from 'node:crypto';
import User from '@/models/User';
import { tokenHash } from '@/utils/passwords.mjs';

export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.TRUSTNEST_EMAIL_FROM);

export async function sendAccountLink(user, purpose) {
  if (!emailEnabled()) return;
  const token = randomBytes(32).toString('hex');
  const field = purpose === 'reset' ? 'resetLink' : 'verifyLink';
  const expires = new Date(Date.now() + (purpose === 'reset' ? 30 : 1440) * 60000);
  await User.updateOne({ _id: user._id }, { $set: { [field]: { hash: tokenHash(token), expires } } });
  const link = new URL('/account', process.env.NEXTAUTH_URL);
  link.searchParams.set('mode', purpose);
  link.searchParams.set('token', token);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.TRUSTNEST_EMAIL_FROM, to: [user.email], subject: purpose === 'reset' ? 'Reset your TrustNest password' : 'Verify your TrustNest email', text: 'Open this TrustNest link to continue: ' + link.href }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Account email unavailable');
}
