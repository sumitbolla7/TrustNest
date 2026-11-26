import test from 'node:test';
import assert from 'node:assert/strict';
import { counties, listingFilters, normaliseTown, validCalendarDate } from '../utils/marketplace.mjs';
import { demoListings } from '../config/demoListings.mjs';
import { readListing } from '../utils/listingInput.mjs';

test('marketplace uses 26 counties and 30 labelled fixtures with no private fields', () => {
  assert.equal(new Set(counties).size, 26);
  assert.equal(demoListings.length, 30);
  assert.equal(new Set(demoListings.map(item => item._id)).size, 30);
  assert.deepEqual(new Set(demoListings.map(item => item.location.county)), new Set(counties));
  for (const item of demoListings) {
    assert.equal(item.is_demo, true);
    assert.match(item._id, /^[a-f0-9]{24}$/);
    assert.equal(item.owner, undefined);
    assert.equal(item.seller_info, undefined);
    assert.equal(item.location.street, undefined);
  }
});

test('filter schema accepts typed values and exact accented town names', () => {
  const result = listingFilters(new URLSearchParams('county=Dublin&town=D%C3%BAn+Laoghaire&minRent=701.50&maxRent=2300&beds=0&baths=1&furnishing=Furnished&availableBy=2028-02-29&shared=1&student=1&amenity=Garden&amenity=Parking&sort=rentAsc&page=2&pageSize=9'));
  assert.equal(result.town, normaliseTown('Dún Laoghaire'));
  assert.equal(result.minRent, 701.5);
  assert.equal(result.beds, 0);
  assert.equal(result.page, 2);
  assert.deepEqual(result.amenities, ['Garden', 'Parking']);
  assert.ok(result.shared && result.student);
});

test('filter schema rejects operators, duplicates, unknown values and invalid bounds', () => {
  for (const input of ['county[$ne]=Dublin', 'county=Belfast', 'town=.*', 'sort=unknown', 'pageSize=40', 'page=0', 'page=201', 'page=1&page=2', 'baths=-1', 'beds=1.5', 'minRent=1e3', 'maxRent=10&minRent=20', 'availableBy=2027-02-29', 'shared=true', 'amenity=$where']) {
    assert.throws(() => listingFilters(new URLSearchParams(input)));
  }
  assert.equal(validCalendarDate('2028-02-29'), true);
});

test('listing writes validate new fields and ignore attempts to assign privileged fields', () => {
  const form = new URLSearchParams({
    name: '<b>Fictional</b>', type: 'Student Accommodation', 'location.city': 'Galway',
    'location.county': 'Galway', beds: '1', baths: '1', square_metres: '30',
    'rates.monthly': '850', availability: '2027-02-28', furnishing: 'Furnished',
    owner: 'other-user', is_featured: 'true', is_demo: 'true',
  });
  const result = readListing(form);
  assert.equal(result.student, true);
  assert.equal(result.location.town_key, 'galway');
  assert.equal(result.owner, undefined);
  assert.equal(result.is_demo, undefined);
  assert.equal(result.is_featured, undefined);
  assert.equal(result.name, '<b>Fictional</b>');
  form.set('availability', '2027-02-30');
  assert.throws(() => readListing(form));
});

test('photo decoder re-encodes valid PNG and rejects corrupt or unsupported files', async () => {
  const { default: sharp } = await import('sharp');
  const { sanitiseRentalImage } = await import('../utils/rentalImage.mjs');
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#064e3b' } }).png().toBuffer();
  const clean = await sanitiseRentalImage(new File([png], 'synthetic.png', { type: 'image/png' }));
  assert.equal((await sharp(clean).metadata()).format, 'jpeg');
  await assert.rejects(sanitiseRentalImage(new File([png.subarray(0, 12)], 'corrupt.png', { type: 'image/png' })));
  await assert.rejects(sanitiseRentalImage(new File([png], 'unsupported.svg', { type: 'image/svg+xml' })));
});
