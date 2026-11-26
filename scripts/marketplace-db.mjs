import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import { MongoClient, ObjectId } from 'mongodb';
import nextAuthJwt from 'next-auth/jwt';

const base = process.env.TRUSTNEST_TEST_MONGO;
if (!/^mongodb:\/\/127\.0\.0\.1:\d{1,5}$/.test(base ?? '')) {
  throw new Error('TRUSTNEST_TEST_MONGO must point to your dedicated loopback MongoDB daemon without a database path.');
}
const database = `trustnest_demo_test_${randomBytes(6).toString('hex')}`;
const port = process.env.TRUSTNEST_DB_TEST_PORT ?? '3188';
const origin = `http://127.0.0.1:${port}`;
const secret = randomBytes(32).toString('base64');
const uri = `${base}/${database}`;
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
let server;

try {
  const db = client.db(database);
  const seed = () => execFileSync(process.execPath, ['scripts/seed-demo.mjs', '--confirm-demo'], {
    env: { ...process.env, TRUSTNEST_DEMO_MONGODB_URI: base, TRUSTNEST_DEMO_DATABASE: database },
    encoding: 'utf8',
  });
  assert.match(seed(), /30 new and matched 0/);
  assert.match(seed(), /0 new and matched 30/);
  assert.equal(await db.collection('properties').countDocuments(), 30);
  const users = [
    { _id: new ObjectId(), email: 'tenant@example.test', username: 'Tenant', bookmarks: [] },
    { _id: new ObjectId(), email: 'owner@example.test', username: 'Owner', role: 'landlord', bookmarks: [] },
  ];
  await db.collection('users').insertMany(users);

  const [{ _id: listingId }] = await db.collection('properties').find({ 'location.county': 'Dublin' }).limit(1).toArray();
  const liveRental = {
    _id: new ObjectId(), name: '<b>Fictional friendly listing</b>', description: '<em>Displayed as text</em>',
    location: { city: 'Bray', county: 'Wicklow', town_key: 'bray', street: 'Private synthetic street', eircode: 'A98 C123' },
    owner: users[1]._id, seller_info: { email: 'private@example.test' }, beds: 2, baths: 1,
    type: 'Apartment', rates: { monthly: 1600 }, availability: '2027-02-01', createdAt: new Date(),
  };
  await db.collection('properties').insertOne(liveRental);
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', port], {
    stdio: 'inherit',
    env: { ...process.env, MONGODB_URI: uri, NEXTAUTH_SECRET: secret, NEXTAUTH_URL: origin,
      GOOGLE_CLIENT_ID: 'local-test-only', GOOGLE_CLIENT_SECRET: 'local-test-only' },
  });
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error('Local test server stopped');
    const ready = await fetch(origin + '/api/properties').catch(() => null);
    if (ready?.ok) break;
    if (attempt === 59) throw new Error('Local test server did not become ready');
    await wait(500);
  }

  const cookies = await Promise.all(users.map(async user => ({
    cookie: 'next-auth.session-token=' + await nextAuthJwt.encode({ secret, token: { sub: String(user._id), email: user.email, name: user.username }, maxAge: 300 }),
    origin,
  })));
  const api = (path, options) => fetch(origin + path, options);
  const save = (headers, request) => api('/api/bookmarks', {
    method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
  assert.equal((await api('/api/bookmarks')).status, 401);
  assert.equal((await api('/api/auth/session', { headers: cookies[0] }).then(res => res.json())).user.id, String(users[0]._id));
  assert.equal((await save(cookies[0], { propertyId: { $ne: null }, saved: true })).status, 400);
  assert.equal((await save(cookies[0], { propertyId: String(listingId), saved: true, userId: String(users[1]._id) })).status, 400);
  for (let attempt = 0; attempt < 2; attempt++) assert.equal((await save(cookies[0], { propertyId: String(listingId), saved: true })).status, 200);
  assert.equal((await api('/api/bookmarks', { headers: cookies[0] }).then(res => res.json())).length, 1);
  assert.deepEqual(await api('/api/bookmarks', { headers: cookies[1] }).then(res => res.json()), []);
  assert.equal((await save(cookies[0], { propertyId: String(listingId), saved: false })).status, 200);
  assert.deepEqual(await api('/api/bookmarks', { headers: cookies[0] }).then(res => res.json()), []);

  const filtered = await api('/api/properties?county=Wicklow&town=Bray&minRent=1500&maxRent=1700&sort=rentAsc').then(res => res.json());
  assert.ok(filtered.properties.some(item => item._id === String(liveRental._id)));
  assert.ok(filtered.properties.every(item => item.location.county === 'Wicklow'));
  const privateRoute = '/api/properties/' + liveRental._id;
  assert.equal((await api(privateRoute + '?edit=1', { headers: cookies[0] })).status, 404);
  assert.equal((await api(privateRoute, { method: 'DELETE', headers: cookies[0] })).status, 404);
  assert.equal((await api(privateRoute + '?edit=1', { headers: cookies[1] }).then(res => res.json())).seller_info.email, 'private@example.test');
  const publicRental = await api(privateRoute).then(res => res.json());
  assert.equal(publicRental.seller_info, undefined);
  assert.equal(publicRental.owner, undefined);
  assert.equal(publicRental.location.street, undefined);
  const html = await api('/properties/' + liveRental._id).then(res => res.text());
  assert.match(html, /&lt;em&gt;Displayed as text&lt;\/em&gt;/);
  assert.doesNotMatch(html, /<em>Displayed as text<\/em>/);

  const form = new FormData();
  for (const [field, value] of Object.entries({
    name: 'Synthetic owner listing', type: 'Apartment', 'location.city': 'Bray', 'location.county': 'Wicklow',
    beds: '2', baths: '1', square_metres: '48', 'rates.monthly': '1700', furnishing: 'Furnished',
    owner: String(users[0]._id), is_demo: 'true', is_featured: 'true',
  })) form.set(field, value);
  const add = await api('/api/properties', { method: 'POST', headers: cookies[1], body: form, redirect: 'manual' });
  assert.equal(add.status, 303);
  const newPath = '/api' + new URL(add.headers.get('location')).pathname;
  const created = await api(newPath + '?edit=1', { headers: cookies[1] }).then(res => res.json());
  assert.equal(created.owner, String(users[1]._id));
  assert.equal(created.is_demo, false);
  assert.equal(created.is_featured, false);
  assert.equal((await api(newPath, { method: 'PUT', headers: cookies[0], body: form })).status, 404);
  form.set('furnishing', '');
  form.set('name', 'Updated synthetic listing');
  assert.equal((await api(newPath, { method: 'PUT', headers: cookies[1], body: form })).status, 200);
  const updated = await api(newPath + '?edit=1', { headers: cookies[1] }).then(res => res.json());
  assert.equal(updated.name, 'Updated synthetic listing');
  assert.equal(updated.furnishing, undefined);

  const enquiry = (headers, id) => api('/api/messages', {
    method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Tenant', email: 'tenant@example.test', property: String(id), message: 'Is a viewing available?' }),
  });
  assert.equal((await enquiry(cookies[0], listingId)).status, 404);
  assert.equal((await enquiry(cookies[0], liveRental._id)).status, 200);
  assert.equal((await api('/api/messages', { headers: cookies[0] }).then(res => res.json())).length, 0);
  assert.equal((await api('/api/messages', { headers: cookies[1] }).then(res => res.json())).length, 1);
  let limited;
  for (let attempt = 0; attempt < 11; attempt++) {
    const response = await enquiry(cookies[0], liveRental._id);
    if (response.status === 429) { limited = response; break; }
    assert.equal(response.status, 200);
  }
  assert.ok(Number(limited?.headers.get('retry-after')) > 0);
  console.log('MongoDB integration passed: double seed, signed sessions, filter, bookmark isolation, owner access, escaped text, enquiry isolation and rate limits.');
} finally {
  server?.kill();
  await client.close();
}
