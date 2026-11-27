import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { chromium } = require('../build/browser/node_modules/playwright-core');
const base = process.env.TRUSTNEST_BROWSER_ORIGIN || 'http://localhost:3000';
const db = process.env.TRUSTNEST_DEMO_DATABASE;
const mongo = process.env.TRUSTNEST_DEMO_MONGODB_URI;
if (!/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(base) ||
    !/^trustnest_demo(?:_[a-z0-9]+)*$/.test(db ?? '') || !/^mongodb:\/\/127\.0\.0\.1:\d+$/.test(mongo ?? '')) {
  throw new Error('Use the loopback app and an explicitly named dedicated loopback demonstration database.');
}
const password = randomBytes(20).toString('base64');
const suffix = randomBytes(5).toString('hex');
const email = role => 'phase6-' + role + '-' + suffix + '@example.test';
const title = 'Fictional Phase 6 browser rental ' + suffix;
execFileSync(process.execPath, ['scripts/bootstrap-account.mjs', 'admin', '--confirm-demo'], {
  env: { ...process.env, TRUSTNEST_BOOTSTRAP_EMAIL: email('admin'), TRUSTNEST_BOOTSTRAP_PASSWORD: password },
  stdio: 'pipe',
});
const browser = await chromium.launch({ executablePath: process.env.TRUSTNEST_BROWSER_EXECUTABLE, headless: true });
const errors = [];
async function browserPage(width, context) {
  const page = context ? await context.newPage() : await browser.newPage();
  await page.setViewportSize({ width, height: 900 });
  page.setDefaultTimeout(25000);
  page.on('pageerror', error => errors.push(error.message));
  return page;
}
const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const post = (page, path, data) => page.request.post(base + path, { headers: { origin: base }, data });

async function account(role, width) {
  const page = await browserPage(width);
  if (role !== 'admin') {
    await page.goto(base + '/account?mode=register&role=' + role);
    await page.getByLabel('Name', { exact: true }).fill('Fictional ' + role);
    await page.getByLabel('Email', { exact: true }).fill(email(role));
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Show password' }).click();
    assert.equal(await page.locator('#account-password').getAttribute('type'), 'text');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await page.getByRole('button', { name: 'Create your account' }).click();
    await page.getByText(/Registration submitted/).waitFor();
  }
  await page.goto(base + '/account');
  await page.getByLabel('Email', { exact: true }).fill(email(role));
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('heading', { name: (role === 'admin' ? 'Administrator' : role === 'tenant' ? 'Tenant' : 'Landlord') + ' dashboard', exact: true }).waitFor();
  assert.ok(await noOverflow(page));
  return page;
}

try {
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    const page = await browserPage(width);
    assert.equal((await page.goto(base)).status(), 200);
    await page.getByRole('heading', { name: 'Find your next home in Ireland' }).waitFor();
    assert.ok(await noOverflow(page), 'home overflow at ' + width);
    if (width < 1024) {
      await page.locator('summary[aria-label="Open main menu"]').click();
      await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Rent a Home' }).click();
    } else {
      await page.getByRole('navigation', { name: 'Rental navigation' }).getByRole('link', { name: 'Rent a Home' }).click();
    }
    await page.getByRole('heading', { name: 'Find a home', exact: true }).waitFor();
    if (width < 1024) await page.getByRole('button', { name: 'Filters', exact: true }).click();
    const filters = width < 1024 ? page.getByRole('dialog') : page.getByRole('complementary');
    await filters.getByRole('combobox', { name: 'County', exact: true }).selectOption('Dublin');
    await filters.getByRole('button', { name: 'Apply filters' }).click();
    await page.waitForURL(/county=Dublin/);
    await page.getByRole('heading', { name: /rentals? found/ }).waitFor();
    assert.ok(await noOverflow(page), 'catalogue overflow at ' + width);
    const url = page.url();
    await page.getByRole('link', { name: 'View details' }).first().click();
    await page.getByRole('button', { name: 'Open rental image 1' }).click();
    const gallery = page.getByRole('dialog', { name: 'Rental photo gallery' });
    await gallery.waitFor();
    if (width === 360) await page.keyboard.press('Escape');
    else await gallery.getByRole('button', { name: 'Close gallery' }).click();
    await gallery.waitFor({ state: 'hidden' });
    await page.getByRole('link', { name: 'Back to rentals' }).click();
    await page.waitForURL(target => new URL(target).searchParams.get('county') === 'Dublin');
    assert.equal(new URL(page.url()).searchParams.get('view'), new URL(url).searchParams.get('view'));
    await page.close();
    console.log('Responsive homepage, navigation, filters, details and gallery passed at ' + width + 'px.');
  }

  const landlord = await account('landlord', 768);
  await landlord.getByRole('link', { name: 'Create a listing' }).click();
  await landlord.getByRole('heading', { name: 'Create a rental listing' }).waitFor();
  await landlord.locator('input[name=name]').fill(title);
  await landlord.locator('select[name=type]').selectOption('Apartment');
  await landlord.locator('select[name="location.county"]').selectOption('Galway');
  await landlord.locator('input[name="location.city"]').fill('Galway');
  await landlord.locator('input[name="rates.monthly"]').fill('1450');
  await landlord.locator('input[name=beds]').fill('2');
  await landlord.locator('input[name=baths]').fill('1');
  await landlord.locator('input[name=square_metres]').fill('65');
  const image = await sharp({ create: { width: 24, height: 24, channels: 3, background: '#059669' } }).png().toBuffer();
  await landlord.locator('input[type=file]').setInputFiles({ name: 'synthetic.png', mimeType: 'image/png', buffer: image });
  await landlord.getByAltText('Selected photo preview').waitFor();
  await landlord.getByRole('button', { name: 'Remove selected photo 1' }).click();
  await landlord.getByRole('button', { name: 'Submit for approval' }).click();
  await landlord.getByText(/Private preview.*pending/).waitFor();
  const property = new URL(landlord.url()).pathname.split('/').pop();

  const admin = await account('admin', 1440);
  await admin.getByRole('button', { name: 'Listings', exact: true }).click();
  const listing = admin.getByRole('listitem').filter({ hasText: title });
  await listing.getByRole('button', { name: 'Approve', exact: true }).click();
  await listing.getByText(/active/).waitFor();
  await admin.getByRole('navigation', { name: 'Administration pages' }).waitFor();

  const tenant = await account('tenant', 390);
  await tenant.goto(base + '/properties/' + property);
  await tenant.getByRole('heading', { name: 'Approximate location' }).waitFor();
  const bookmark = tenant.getByRole('button', { name: 'Save ' + title, exact: true });
  await bookmark.click();
  await tenant.getByRole('button', { name: 'Remove ' + title + ' from saved rentals' }).waitFor();
  await tenant.getByText('Contact landlord', { exact: true }).click();
  await tenant.getByLabel('Message', { exact: true }).fill('Is a viewing available?');
  await tenant.getByRole('button', { name: 'Send enquiry' }).click();
  await tenant.getByText('Enquiry sent.', { exact: true }).waitFor();
  const threads = await landlord.request.get(base + '/api/notifications');
  const notice = (await threads.json()).items.find(item => item.label === 'New rental enquiry');
  assert.ok(notice);
  await landlord.goto(base + notice.href);
  await landlord.getByRole('navigation', { name: 'Conversations' }).waitFor();
  await landlord.getByText('Is a viewing available?').waitFor();
  await landlord.getByLabel('Message', { exact: true }).fill('Please request a time.');
  await landlord.getByRole('button', { name: 'Send message', exact: true }).click();
  await landlord.getByText('Please request a time.', { exact: true }).waitFor();
  await tenant.goto(base + '/dashboard');
  const notificationButton = tenant.locator('summary[aria-label^="Notifications"]');
  await notificationButton.click();
  await tenant.locator('header').getByRole('link', { name: 'New rental message' }).waitFor();
  await tenant.locator('header').getByRole('button', { name: 'Mark all as read', exact: true }).click();
  await notificationButton.getByText(/^[0-9]+$/).waitFor({ state: 'hidden' });
  assert.ok(await noOverflow(tenant));
  assert.equal((await post(tenant, '/api/workspace', { action: 'report', property, reason: 'Other suspicious activity', description: 'Synthetic report' })).status(), 201);
  assert.deepEqual(errors, []);
  console.log('Browser role workflows passed: password visibility, registration, listing approval, saved rental, conversation, notification and report.');
} finally {
  await browser.close();
}
