import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const port = process.env.TRUSTNEST_SMOKE_PORT ?? '3187';
const url = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', port], {
  stdio: 'inherit',
  env: { ...process.env, MONGODB_URI: '', GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', NEXTAUTH_SECRET: '', NEXTAUTH_URL: url },
});
try {
  let response;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) throw new Error('Next.js stopped before tests ran');
    response = await fetch(url).catch(() => null);
    if (response) break;
    await wait(500);
  }
  assert.equal(response?.status, 200);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.match(await response.text(), /Find your next home in Ireland/);
  const demo = await fetch(url + '/properties/demo');
  assert.equal(demo.status, 200);
  assert.match(await demo.text(), /Waterford/);
  const community = await fetch(url + '/community');
  assert.equal(community.status, 200);
  assert.match(await community.text(), /Coming soon/);
  const catalogue = await fetch(url + '/api/properties');
  const first = await catalogue.json();
  assert.equal(first.total, 30);
  assert.equal(first.properties.length, 9);
  const filters = await (await fetch(url + '/api/properties?county=Dublin&minRent=600&maxRent=3000&sort=rentAsc')).json();
  assert.equal(filters.total, 2);
  assert.ok(filters.properties.every(item => item.location.county === 'Dublin' && item.rates.monthly >= 600 && item.rates.monthly <= 3000));
  assert.ok(filters.properties[0].rates.monthly <= filters.properties[1].rates.monthly);
  const second = await (await fetch(url + '/api/properties?page=2')).json();
  assert.ok(second.properties.every(item => !first.properties.find(other => other._id === item._id)));
  const id = first.properties[0]._id;
  const details = await fetch(url + '/properties/' + id);
  assert.equal(details.status, 200);
  assert.match(await details.text(), /Fictional sample listing/);
  const detail = await (await fetch(url + '/api/properties/' + id)).json();
  assert.equal(detail.location.street, undefined);
  assert.equal(detail.seller_info, undefined);
  assert.equal((await fetch(url + '/api/properties?county%5B%24ne%5D=Dublin')).status, 400);
  assert.equal((await fetch(url + '/api/properties?availableBy=2027-02-30')).status, 400);
  assert.equal((await fetch(url + '/api/bookmarks')).status, 401);
  assert.equal((await fetch(url + '/api/bookmarks', { method: 'POST', headers: { origin: url } })).status, 401);
  assert.equal((await fetch(url + '/api/properties/' + id + '?edit=1')).status, 401);
  assert.equal((await fetch(url + '/api/properties/' + id, { method: 'DELETE', headers: { origin: url } })).status, 401);
  const search = await fetch(url + '/api/properties/search?location=Dublin');
  assert.ok((await search.json()).length >= 2);
  assert.equal((await fetch(url + '/api/properties?pageSize=51')).status, 400);
  assert.equal((await fetch(url + '/api/properties/invalid')).status, 400);
  assert.equal((await fetch(url + '/api/properties', { method: 'POST' })).status, 403);
  assert.deepEqual(await (await fetch(url + '/api/auth/session')).json(), {});
  assert.equal((await fetch(url + '/properties/add', { redirect: 'manual' })).status, 307);
  assert.equal((await fetch(url + '/icon.svg')).status, 200);
  const robots = await (await fetch(url + '/robots.txt')).text();
  assert.match(robots, /Disallow: \/dashboard/);
  const sitemap = await (await fetch(url + '/sitemap.xml')).text();
  assert.match(sitemap, /<loc>[^<]+\/properties<\/loc>/);
  assert.doesNotMatch(sitemap, /\/dashboard|\/account/);
  assert.equal((await fetch(url + '/account')).headers.get('x-robots-tag'), 'noindex, nofollow');
  console.log('TN-08 provider-free HTTP and search indexing smoke checks passed');
} finally {
  child.kill();
}
