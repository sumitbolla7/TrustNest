import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { photos } from '../config/photoLibrary.mjs';
import { demoListings } from '../config/demoListings.mjs';

test('every credited WebP is unique, decodable and free of embedded metadata', async () => {
  assert.ok(photos.length >= 60 && photos.length <= 80);
  const digests = new Set();
  const files = readdirSync('public/images', { recursive: true }).filter(file => file.endsWith('.webp')).map(file => '/images/' + file.replaceAll('\\', '/'));
  assert.deepEqual(new Set(files), new Set(photos.map(photo => photo.path)));
  for (const photo of photos) {
    assert.ok(photo.title && photo.creator && photo.alt);
    assert.match(photo.source, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.match(photo.licenseUrl, /^https:\/\/creativecommons\.org\/(?:licenses|publicdomain)\//);
    const bytes = readFileSync('public' + photo.path);
    const digest = createHash('sha256').update(bytes).digest('hex');
    assert.ok(!digests.has(digest), photo.path);
    digests.add(digest);
    const image = sharp(bytes);
    const metadata = await image.metadata();
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.width, photo.width);
    assert.equal(metadata.height, photo.height);
    assert.ok(!metadata.exif && !metadata.iptc && !metadata.xmp, photo.path);
    await image.resize(8, 8).toBuffer();
  }
});

test('fictional listings have three credited photographs and unique cover images', () => {
  const paths = new Set(photos.map(photo => photo.path));
  assert.equal(new Set(demoListings.map(listing => listing.images[0])).size, demoListings.length);
  for (const listing of demoListings) {
    assert.equal(listing.images.length, 3);
    assert.equal(new Set(listing.images).size, 3);
    assert.ok(listing.images.every(image => paths.has(image)));
    assert.equal(listing.location.street, undefined);
    assert.equal(listing.owner, undefined);
  }
});
