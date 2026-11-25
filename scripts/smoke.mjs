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
  assert.deepEqual(await catalogue.json(), { total: 0, properties: [] });
  const search = await fetch(url + '/api/properties/search?location=Dublin');
  assert.deepEqual(await search.json(), []);
  assert.equal((await fetch(url + '/api/properties?pageSize=51')).status, 400);
  assert.equal((await fetch(url + '/api/properties/invalid')).status, 400);
  assert.equal((await fetch(url + '/api/properties', { method: 'POST' })).status, 403);
  assert.deepEqual(await (await fetch(url + '/api/auth/session')).json(), {});
  assert.equal((await fetch(url + '/properties/add', { redirect: 'manual' })).status, 307);
  assert.equal((await fetch(url + '/icon.svg')).status, 200);
  console.log('TN-08 provider-free HTTP smoke checks passed');
} finally {
  child.kill();
}
