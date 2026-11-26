import { randomBytes, scrypt as derive, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(derive);
export const validPassword = value => typeof value === 'string' && value.length >= 12 && value.length <= 128;
export const normalEmail = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? value.trim().toLowerCase() : null;
export const tokenHash = value => createHash('sha256').update(value).digest('hex');

export async function passwordHash(value) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + (await scrypt(value, salt, 64)).toString('hex');
}

export async function verifyPassword(value, stored) {
  if (typeof value !== 'string' || value.length > 128) return false;
  const [salt, hash] = (stored || '').split(':');
  const valid = /^[a-f0-9]{32}$/.test(salt ?? '') && /^[a-f0-9]{128}$/.test(hash ?? '');
  const actual = await scrypt(value, valid ? salt : 'trustnest-login-placeholder', 64);
  return valid && timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
