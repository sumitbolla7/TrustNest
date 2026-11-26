import { MongoClient } from 'mongodb';
import { passwordHash, normalEmail, validPassword } from '../utils/passwords.mjs';

const target = process.env.TRUSTNEST_DEMO_MONGODB_URI;
const database = process.env.TRUSTNEST_DEMO_DATABASE;
const role = process.argv[2];
const email = normalEmail(process.env.TRUSTNEST_BOOTSTRAP_EMAIL);
const password = process.env.TRUSTNEST_BOOTSTRAP_PASSWORD;
if (!target || !/^trustnest_demo(?:_[a-z0-9]+)*$/.test(database ?? '') || !['tenant', 'landlord', 'admin'].includes(role) || !email || !validPassword(password) || !process.argv.includes('--confirm-demo')) {
  console.error('Provide the dedicated demo database, bootstrap email/password, a role and --confirm-demo.');
  process.exit(1);
}
const client = new MongoClient(target, { serverSelectionTimeoutMS: 5000 });
try {
  const users = client.db(database).collection('users');
  await users.createIndex({ email: 1 }, { unique: true });
  const now = new Date();
  await users.insertOne({ email, username: 'Demo ' + role, passwordHash: await passwordHash(password), role, emailVerified: true, sessionVersion: 0, createdAt: now, updatedAt: now });
  console.log('Created a dedicated demonstration ' + role + ' account.');
} catch {
  console.error('Account creation failed. An existing account is never promoted or overwritten by this script.');
  process.exitCode = 1;
} finally {
  await client.close();
}
