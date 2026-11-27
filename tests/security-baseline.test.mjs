import test from 'node:test';
import assert from 'node:assert/strict';
import { readJsonObject, readRentalForm } from '../utils/requestBody.mjs';
import { accountFields, workspaceFields } from '../utils/actionFields.mjs';
import { readListing } from '../utils/listingInput.mjs';

const json = (body, headers = {}) => new Request('https://trustnest.invalid', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
});

test('SEC-04 accepts only fields declared for the selected operation', async () => {
  assert.deepEqual(await readJsonObject(json({ action: 'notifications-read' }), 512, workspaceFields), { data: { action: 'notifications-read' } });
  assert.equal((await readJsonObject(json({ action: 'notifications-read', id: 'unexpected-field' }), 512, workspaceFields)).status, 400);
  assert.equal((await readJsonObject(json({ action: 'profile', name: 'Demo tenant', role: 'admin' }), 512, accountFields)).status, 400);
  assert.equal((await readJsonObject(json(['verification']), 512, workspaceFields)).status, 400);
});

test('SEC-04 bounds actual body bytes and rejects an unexpected content type', async () => {
  assert.equal((await readJsonObject(json({ action: 'profile', name: 'é'.repeat(100) }), 100, accountFields)).status, 413);
  assert.equal((await readJsonObject(json({ action: 'profile' }, { 'Content-Type': 'text/plain' }), 100, accountFields)).status, 415);
  const multipart = new FormData();
  multipart.set('name', 'Demo room');
  const request = new Request('https://trustnest.invalid', { method: 'POST', body: multipart });
  assert.equal((await readRentalForm(request, 8192)).data.get('name'), 'Demo room');
});

test('SEC-04 rejects repeated scalar rental fields', () => {
  const form = new URLSearchParams({ type: 'Apartment' });
  form.append('type', 'House');
  assert.throws(() => readListing(form), /Duplicate listing field/);
});
