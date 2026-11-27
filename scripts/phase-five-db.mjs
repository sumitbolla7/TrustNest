import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import { MongoClient } from 'mongodb';
import { passwordHash, tokenHash } from '../utils/passwords.mjs';

const base = process.env.TRUSTNEST_TEST_MONGO;
if (!/^mongodb:\/\/127\.0\.0\.1:\d{1,5}$/.test(base ?? '')) throw new Error('Set TRUSTNEST_TEST_MONGO to a dedicated loopback daemon without a database path.');
const database = 'trustnest_demo_phase5_' + randomBytes(6).toString('hex');
const client = new MongoClient(base, { serverSelectionTimeoutMS: 3000 });
const port = process.env.TRUSTNEST_PHASE_FIVE_TEST_PORT ?? '3195';
const origin = 'http://127.0.0.1:' + port;
const password = randomBytes(24).toString('base64');
let server;
const api = (path, options) => fetch(origin + path, options);
const page = (path, cookie) => api(path, { headers: { cookie }, redirect: 'manual' });
const submit = (path, payload, cookie) => api(path, {
  method: 'POST', headers: { origin, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(payload),
});
const cookies = response => response.headers.getSetCookie().map(header => header.split(';')[0]).join('; ');
async function authRequest(endpoint, fields, existing = '') {
  const csrf = await api('/api/auth/csrf', { headers: { cookie: existing } });
  const { csrfToken } = await csrf.json();
  const cookie = [existing, cookies(csrf)].filter(Boolean).join('; ');
  const result = await api('/api/auth/' + endpoint, {
    method: 'POST', redirect: 'manual', headers: { origin, cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...fields, csrfToken, callbackUrl: origin + '/dashboard', json: 'true' }),
  });
  return result;
}

async function login(email, loginPassword = password) {
  const result = await authRequest('callback/credentials', { email, password: loginPassword });
  const sessionCookie = cookies(result).split('; ').find(cookie => cookie.startsWith('next-auth.session-token='));
  assert.ok(sessionCookie, 'credentials login issues a session cookie');
  const response = await api('/api/auth/session', { headers: { cookie: sessionCookie } });
  const { user } = await response.json();
  assert.equal(user.email, email);
  return sessionCookie;
}

try {
  const db = client.db(database);
  await db.collection('users').insertOne({ email: 'admin@example.test', username: 'Test admin', role: 'admin', passwordHash: await passwordHash(password), sessionVersion: 0, emailVerified: true });
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', port], {
    stdio: 'inherit',
    env: { ...process.env, MONGODB_URI: base + '/' + database, NEXTAUTH_SECRET: randomBytes(32).toString('base64'), NEXTAUTH_URL: origin, RESEND_API_KEY: '', TRUSTNEST_EMAIL_FROM: '', TRUSTNEST_REQUIRE_VERIFIED_EMAIL: 'false', GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '' },
  });
  for (let n = 0; n <= 60; n++) {
    const result = await api('/api/auth/providers').catch(() => null);
    if (result?.ok) break;
    if (n === 60 || server.exitCode !== null) throw new Error('Application did not start.');
    await wait(500);
  }

  const account = (role, email) => submit('/api/account', { action: 'register', role, email, password, name: 'Test ' + role });
  assert.equal((await account('admin', 'spoof@example.test')).status, 400);
  assert.equal((await account('tenant', 'tenant@example.test')).status, 200);
  assert.equal((await account('landlord', 'landlord@example.test')).status, 200);
  const verify = randomBytes(32).toString('hex');
  await db.collection('users').updateOne({ email: 'tenant@example.test' }, { $set: { verifyLink: { hash: tokenHash(verify), expires: new Date(Date.now() + 60000) } } });
  assert.equal((await submit('/api/account', { action: 'verify', token: verify })).status, 200);
  assert.equal((await submit('/api/account', { action: 'verify', token: verify })).status, 400);
  const tenant = await login('tenant@example.test');
  const landlord = await login('landlord@example.test');
  const admin = await login('admin@example.test');
  assert.equal((await api('/api/admin', { headers: { cookie: tenant } })).status, 403);
  assert.equal((await page('/dashboard', tenant)).status, 200);
  assert.equal((await page('/dashboard', landlord)).status, 200);
  assert.equal((await page('/dashboard/admin', admin)).status, 200);

  const form = new FormData();
  Object.entries({ name: 'Fictional Galway apartment', type: 'Apartment', description: 'Fictional apartment for testing', 'location.city': 'Galway', 'location.county': 'Galway', 'location.street': 'Private test address', 'rates.monthly': '1400', deposit: '750', beds: '2', baths: '1', square_metres: '72', ber: 'B1', intent: 'draft' }).forEach(([key, value]) => form.set(key, value));
  const listingRequest = (cookie, property = '') => api('/api/properties' + property, { method: property ? 'PUT' : 'POST', headers: { origin, cookie, accept: 'application/json' }, body: form });
  assert.equal((await listingRequest(tenant)).status, 403);
  const created = await listingRequest(landlord);
  assert.equal(created.status, 201);
  const { _id: property } = await created.json();
  const path = '/api/properties/' + property;
  assert.equal((await api(path)).status, 404);
  assert.equal((await listingRequest(tenant, '/' + property)).status, 404);
  assert.equal((await page('/properties/' + property + '?preview=1', landlord)).status, 200);
  assert.equal((await api(path + '?edit=1', { headers: { cookie: landlord } }).then(res => res.json())).status, 'draft');
  form.set('intent', 'submit');
  assert.equal((await listingRequest(landlord, '/' + property)).status, 200);
  const workspace = (cookie, data) => submit('/api/workspace', data, cookie);
  const moderation = (action, id, status, cookie = admin) => submit('/api/admin', { action, id, status }, cookie);
  assert.equal((await moderation('listing', property, 'active', tenant)).status, 403);
  assert.equal((await moderation('listing', property, 'active')).status, 200);
  const rental = await api(path).then(res => res.json());
  assert.equal(rental.deposit, 750);
  assert.equal(rental.location.street, undefined);
  assert.equal(rental.landlord.verified, false);
  assert.equal((await workspace(landlord, { action: 'verification', name: 'Fictional landlord', statement: 'I manage this fictional property for the academic test.' })).status, 201);
  const adminData = await api('/api/admin?search=landlord', { headers: { cookie: admin } }).then(res => res.json());
  assert.equal(adminData.users.length, 1);
  assert.equal((await moderation('verification', adminData.verifications[0]._id, 'approved')).status, 200);
  const results = await api('/api/properties?county=Galway&verified=1&minRent=1300&maxRent=1500&view=list').then(res => res.json());
  assert.equal(results.properties[0]._id, property);
  assert.equal((await api(path).then(res => res.json())).landlord.verified, true);

  assert.equal((await submit('/api/bookmarks', { propertyId: property, saved: true }, tenant)).status, 200);
  assert.equal((await api('/api/bookmarks', { headers: { cookie: landlord } }).then(res => res.json())).length, 0);
  assert.equal((await api('/api/bookmarks', { headers: { cookie: tenant } }).then(res => res.json())).length, 1);
  assert.equal((await submit('/api/bookmarks', { propertyId: property, saved: false }, tenant)).status, 200);
  const enquiry = await workspace(tenant, { action: 'enquiry', property, message: 'Could I view the rental?' });
  assert.equal(enquiry.status, 201);
  const { conversation } = await enquiry.json();
  assert.equal((await api('/api/workspace?conversation=' + conversation, { headers: { cookie: admin } })).status, 404);
  assert.equal((await workspace(landlord, { action: 'message', id: conversation, message: 'Yes, please request a time.' })).status, 201);
  assert.equal((await api('/api/workspace?conversation=' + conversation, { headers: { cookie: tenant } }).then(res => res.json())).messages.length, 2);
  assert.equal((await page('/dashboard/conversations/' + conversation, tenant)).status, 200);
  assert.equal((await workspace(tenant, { action: 'thread-read', id: conversation })).status, 200);

  const date = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);
  assert.equal((await workspace(tenant, { action: 'viewing', property, date, time: '13:30', message: '' })).status, 201);
  const viewing = await db.collection('viewings').findOne();
  assert.equal((await workspace(landlord, { action: 'viewing-update', id: String(viewing._id), status: 'accepted' })).status, 200);
  assert.equal((await workspace(tenant, { action: 'viewing-update', id: String(viewing._id), status: 'cancelled' })).status, 200);
  const report = { action: 'report', property, reason: 'Other suspicious activity', description: 'Synthetic moderation report' };
  assert.equal((await workspace(tenant, report)).status, 201);
  assert.equal((await workspace(tenant, report)).status, 409);
  const submitted = await db.collection('scamreports').findOne();
  assert.equal((await moderation('report', String(submitted._id), 'resolved')).status, 200);
  assert.ok(await db.collection('notifications').countDocuments({ readAt: null }) >= 5);
  const before = await api('/api/notifications', { headers: { cookie: tenant } }).then(response => response.json());
  assert.ok(before.unread > 0);
  assert.equal((await api('/api/notifications')).status, 401);
  assert.equal((await api('/api/admin?section=properties&status=pending&page=201', { headers: { cookie: admin } })).status, 400);
  await db.collection('users').insertMany(Array.from({ length: 16 }, (_, index) => ({ email: 'paging-' + index + '@example.test', username: 'Paging test tenant', role: 'tenant', createdAt: new Date() })));
  const secondPage = await api('/api/admin?section=users&search=Paging+test+tenant&page=2', { headers: { cookie: admin } }).then(response => response.json());
  assert.equal(secondPage.totalRows, 16);
  assert.equal(secondPage.users.length, 1);
  const active = await api('/api/admin?section=properties&status=active&page=1', { headers: { cookie: admin } }).then(response => response.json());
  assert.equal(active.totalRows, 1);
  assert.equal(String(active.properties[0]._id), property);
  assert.equal((await workspace(tenant, { action: 'notifications-read' })).status, 200);
  const tenantId = (await db.collection('users').findOne({ email: 'tenant@example.test' }))._id;
  assert.equal(await db.collection('notifications').countDocuments({ user: tenantId, readAt: null }), 0);
  assert.equal((await api('/api/notifications', { headers: { cookie: tenant } }).then(response => response.json())).unread, 0);
  assert.ok(await db.collection('adminaudits').countDocuments({ outcome: 'applied' }) >= 3);
  const ownerId = (await db.collection('users').findOne({ email: 'landlord@example.test' }))._id;
  assert.equal((await moderation('account', String(ownerId), 'suspended')).status, 200);
  assert.equal((await api('/api/bookmarks', { headers: { cookie: landlord } })).status, 401);
  assert.equal((await moderation('account', String(ownerId), 'active')).status, 200);
  const activeLandlord = await login('landlord@example.test');

  assert.equal((await submit('/api/account', { action: 'profile', name: 'Updated tenant', notifications: false }, tenant)).status, 200);
  const nextPassword = randomBytes(24).toString('base64');
  assert.equal((await submit('/api/account', { action: 'password', current: password, password: nextPassword }, tenant)).status, 200);
  assert.equal((await api('/api/bookmarks', { headers: { cookie: tenant } })).status, 401);
  const changed = await login('tenant@example.test', nextPassword);
  const reset = randomBytes(32).toString('hex');
  await db.collection('users').updateOne({ _id: tenantId }, { $set: { resetLink: { hash: tokenHash(reset), expires: new Date(Date.now() + 60000) } } });
  assert.equal((await submit('/api/account', { action: 'forgot', email: 'tenant@example.test' })).status, 503);
  assert.equal((await submit('/api/account', { action: 'reset', token: reset, password })).status, 200);
  assert.equal((await submit('/api/account', { action: 'reset', token: reset, password })).status, 400);
  assert.equal((await api('/api/bookmarks', { headers: { cookie: changed } })).status, 401);
  const afterReset = await login('tenant@example.test');
  const logout = await authRequest('signout', {}, afterReset);
  assert.ok(logout.headers.getSetCookie().some(header => header.startsWith('next-auth.session-token=;')));
  assert.equal((await submit('/api/account', { action: 'delete', current: password, confirmation: 'DELETE' }, afterReset)).status, 200);
  assert.equal((await api('/api/bookmarks', { headers: { cookie: afterReset } })).status, 401);
  assert.equal((await workspace(activeLandlord, { action: 'listing-status', id: property, status: 'rented' })).status, 200);
  assert.equal((await api(path)).status, 404);
  assert.equal((await api(path, { method: 'DELETE', headers: { origin, cookie: activeLandlord } })).status, 200);
  assert.equal((await api(path)).status, 404);
  console.log('Phase 5 integration passed: real credential sign-in, roles, listing approval, verified search, bookmarks, enquiries, viewing, reports, notifications, account lifecycle and deletion.');
} finally {
  server?.kill();
  await client.close();
}
