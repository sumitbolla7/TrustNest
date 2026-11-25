import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { floorArea, normaliseEircode, rentalPrice } from '../utils/ireland.mjs';
import { imageMime, literalSearch, sameOrigin } from '../utils/security.mjs';
import { readListing } from '../utils/listingInput.mjs';
import { invalidEnvironment } from '../config/environment.mjs';

test('TN-01 normalises Eircodes and rejects malformed input', () => {
  assert.equal(normaliseEircode(' d6w ac12 '), 'D6W AC12');
  assert.throws(() => normaliseEircode('bad'));
});

test('TN-02 prioritises monthly EUR rent and converts legacy floor area', () => {
  assert.match(rentalPrice({ weekly: 500, monthly: 1600 }), /^€1,600 \/ month$/);
  assert.equal(floorArea({ square_feet: 1000 }), 93);
});

test('TN-03 uses literal and case-insensitive search', () => {
  const search = literalSearch('Dublin (2).*');
  assert.equal(search.test('dublin (2).*'), true);
  assert.equal(search.test('Dublin 222'), false);
});

test('TN-04 requires canonical origin for custom mutations', () => {
  const request = new Request('http://localhost:3000', { headers: { origin: 'http://localhost:3000' } });
  assert.equal(sameOrigin(request, 'http://localhost:3000/'), true);
  assert.equal(sameOrigin(request, 'https://example.com'), false);
  assert.equal(sameOrigin(new Request(request.url), request.url), false);
});

test('TN-05 accepts supported upload signatures and rejects text', () => {
  assert.equal(imageMime(Uint8Array.of(255, 216, 255)), 'image/jpeg');
  assert.equal(imageMime(Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10)), 'image/png');
  assert.equal(imageMime(Buffer.from('not an image')), null);
});

test('TN-06 validates environment without printing values', () => {
  assert.deepEqual(invalidEnvironment({}), []);
  assert.deepEqual(invalidEnvironment({ NEXTAUTH_URL: 'file:///tmp', MONGODB_URI: 'invalid', NEXT_PUBLIC_MAPBOX_TOKEN: 'invalid' }), ['NEXTAUTH_URL', 'MONGODB_URI', 'NEXT_PUBLIC_MAPBOX_TOKEN']);
  assert.ok(invalidEnvironment({}, true).includes('NEXTAUTH_SECRET'));
});

test('TN-07 fixtures represent five Irish cities without contact details', () => {
  const fixtures = JSON.parse(readFileSync(new URL('../properties.json', import.meta.url)));
  assert.deepEqual(fixtures.map(item => item.location.city), ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford']);
  for (const fixture of fixtures) {
    assert.match(fixture.description, /Fictional/);
    assert.equal(fixture.seller_info, undefined);
  }
});

test('TN-09 parses only allowlisted rental inputs and rejects malformed amounts', () => {
  const form = new URLSearchParams({
    name: 'Sample studio', type: 'Studio', 'location.city': 'Galway',
    'location.county': 'Galway', beds: '0', baths: '1',
    square_metres: '28.5', 'rates.monthly': '950', owner: 'untrusted',
  });
  const result = readListing(form);
  assert.equal(result.square_metres, 28.5);
  assert.equal(result.rates.monthly, 950);
  assert.equal(result.owner, undefined);
  form.set('rates.monthly', '-5');
  assert.throws(() => readListing(form));
});
