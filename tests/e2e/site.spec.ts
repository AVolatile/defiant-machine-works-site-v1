import { test, expect } from '@playwright/test';
import { products, articles } from '../../src/data/catalog';
const routes = [
  '/',
  '/services',
  '/stippling',
  '/slide-milling',
  '/cerakote',
  '/porting',
  '/gallery',
  '/products',
  '/products/pistol-cerakote',
  '/customize',
  '/custom-inquiry',
  '/cart',
  '/checkout',
  '/about',
  '/contact',
  '/shipping',
  '/warranty',
  '/faq',
  '/blog',
  '/privacy',
  '/terms',
  '/cookies',
  '/accessibility',
  '/resources',
  '/resources/stippling-guide',
];
for (const viewport of [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
])
  test(`routes, browser errors, and overflow at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (entry) => {
      if (entry.type() === 'error') errors.push(entry.text());
    });
    for (const route of routes) {
      const r = await page.goto(route);
      expect(r?.status(), route).toBe(200);
      await expect(page.locator('main h1'), route).toHaveCount(1);
      await expect(page.locator('main h1')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        route,
      ).toBeTruthy();
    }
    expect(errors).toEqual([]);
  });
test('all migrated detail pages and internal links resolve', async ({ page, request }) => {
  const all = [
    ...routes,
    ...products.map((p) => '/products/' + p.slug),
    ...articles.map((a) => '/blog/' + a.slug),
  ];
  const links = new Set<string>();
  for (const route of all) {
    const r = await request.get(route);
    expect(r.status(), route).toBe(200);
  }
  for (const route of routes) {
    await page.goto(route);
    for (const href of await page
      .locator('a[href^="/"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('href')!)))
      links.add(href.split(/[?#]/)[0]);
  }
  for (const href of links) expect((await request.get(href)).status(), href).toBe(200);
});
test('legacy routes redirect, unknown routes are genuine 404s', async ({ request }) => {
  for (const path of ['/shop', '/customize-now', '/guarantees', '/connect', '/stippling-info']) {
    const r = await request.get(path, { maxRedirects: 0 });
    expect(r.status()).toBe(308);
  }
  expect((await request.get('/not-a-real-defiant-route')).status()).toBe(404);
});
test('mobile navigation, focus, and escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Open navigation' });
  await toggle.click();
  await expect(page.getByRole('dialog', { name: 'Site navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole('dialog').getByRole('link', { name: 'Cerakote', exact: true }).click();
  await expect(page).toHaveURL(/\/cerakote$/);
  await expect(page.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});
test('catalog filters, search, empty reset and price sorting', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('button', { name: 'Merch', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(5);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByLabel('Search the catalog').fill('no-such-item');
  await expect(page.getByRole('heading', { name: 'No matching work or products.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.product-card')).toHaveCount(63);
  await page.getByLabel('Sort by').selectOption('price-desc');
  await expect(page.locator('.product-card h3').first()).toContainText('Glock Crown');
});
test('gallery filtering, keyboard lightbox, focus restoration', async ({ page }) => {
  await page.goto('/gallery');
  await page.getByRole('button', { name: 'Stippling', exact: true }).click();
  await expect(page.locator('.gallery-tile')).toHaveCount(1);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByLabel('Search finish names').fill('Flectarn');
  await expect(page.locator('.gallery-tile')).toHaveCount(1);
  const tile = page.locator('.gallery-tile').first();
  await tile.click();
  await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { name: 'Flectarn', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tile).toBeFocused();
  await page.getByLabel('Search finish names').fill('');
  await page.locator('.gallery-tile').first().click();
  const title = await page.locator('#lightbox-title').textContent();
  await page.keyboard.press('ArrowRight');
  expect(await page.locator('#lightbox-title').textContent()).not.toBe(title);
});
test('contact validation, delivery error, and confirmed success state', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByText('Enter your name (at least 2 characters).')).toBeVisible();
  await expect(page.getByLabel('Name (required)')).toBeFocused();
  await page.getByLabel('Name (required)').fill('Test Customer');
  await page.getByLabel('Email (required)').fill('test@example.com');
  await page.getByLabel('Subject (required)').selectOption('Build inquiry');
  await page
    .getByLabel('Tell us about your project')
    .fill('I would like to discuss a custom finish.');
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.locator('.form-error')).toContainText('Your inquiry has not been sent');
  await expect(page.getByLabel('Email (required)')).toHaveValue('test@example.com');
  await page.route('**/api/inquiry', (route) => route.fulfill({ status: 200, json: { ok: true } }));
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('heading', { name: 'Let’s talk about your project.' })).toBeVisible();
});
test('build wizard preserves back/next state, draft, and completes reviewed inquiry', async ({
  page,
}) => {
  await page.goto('/custom-inquiry?service=Stippling');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Manufacturer / platform').selectOption('Glock');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Model', { exact: true }).fill('19 Gen 5');
  await page.getByRole('button', { name: 'Back', exact: false }).click();
  await expect(page.getByLabel('Manufacturer / platform')).toHaveValue('Glock');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Model', { exact: true })).toHaveValue('19 Gen 5');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Kevlar', { exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Finish or color').fill('Midnight Bronze H-294');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await page.getByLabel('Name', { exact: true }).fill('Test Customer');
  await page.getByLabel('Email', { exact: true }).fill('test@example.com');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('.review-summary')).toContainText('19 Gen 5');
  await expect(page.locator('.review-summary')).toContainText('Kevlar');
  await page.getByRole('button', { name: 'Send project request' }).click();
  await expect(
    page.getByText('Please acknowledge the final confirmation requirement.'),
  ).toBeVisible();
  await page.getByLabel('I understand this is an inquiry.').check();
  await page.route('**/api/inquiry', (route) => route.fulfill({ status: 200, json: { ok: true } }));
  await page.getByRole('button', { name: 'Send project request' }).click();
  await expect(page.getByRole('heading', { name: 'Your project starts here.' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('dmw-build-draft-v1'))).toBeNull();
});
test('catalog service preselects the order configurator', async ({ page }) => {
  await page.goto('/products/pistol-cerakote');
  await page
    .locator('.product-detail-copy')
    .getByRole('link', { name: 'Configure this service' })
    .click();
  await expect(page).toHaveURL(/\/customize\?product=/);
  await page.getByLabel('Manufacturer', { exact: true }).selectOption('glock');
  await page.getByLabel('Model', { exact: true }).selectOption('glock-19');
  await page.getByLabel('Variant / existing work').selectOption('uncut');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Pistol Cerakote' })).toBeChecked();
});
test('server rejects malformed, cross-origin and invalid input; no delivery success without configuration', async ({
  request,
}) => {
  expect((await request.post('/api/inquiry', { data: { name: '' } })).status()).toBe(422);
  expect(
    (
      await request.post('/api/inquiry', {
        headers: { Origin: 'https://unrelated.example' },
        data: {},
      })
    ).status(),
  ).toBe(403);
  const valid = {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '',
    subject: 'Build inquiry',
    message: 'Testing the unconfigured delivery path.',
    website: '',
  };
  const response = await request.post('/api/inquiry', { data: valid });
  expect(response.status()).toBe(503);
  expect((await response.json()).error).toContain('has not been sent');
});
