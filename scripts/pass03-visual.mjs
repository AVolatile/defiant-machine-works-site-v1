import { chromium } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3002';
const dir = 'tests/visual/pass-03';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const results = [];
async function capture(page, name, fullPage = true) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage });
  results.push({
    name,
    width: page.viewportSize().width,
    route: new URL(page.url()).pathname,
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    brokenImages: await page
      .locator('img')
      .evaluateAll((images) =>
        images
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.getAttribute('src')),
      ),
  });
}
for (const width of [1728, 1440, 1280, 1024, 768, 430, 390, 375]) {
  const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 844 : 1000 } });
  await page.goto(base);
  await capture(page, `home-${width}`, false);
  await page.locator('.hero').screenshot({ path: `${dir}/hero-${width}.png` });
  if (width <= 430) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.waitForFunction(() => {
      const menu = document.getElementById('mobile-nav');
      return menu && getComputedStyle(menu).opacity === '1';
    });
    await capture(page, `menu-open-${width}`, false);
    await page.locator('#mobile-nav').evaluate((menu) => {
      menu.scrollTop = menu.scrollHeight;
    });
    await capture(page, `menu-lower-${width}`, false);
    await page.getByRole('button', { name: 'Close navigation' }).click();
    await page.locator('#mobile-nav').waitFor({ state: 'detached' });
    await capture(page, `menu-closed-${width}`, false);
  }
  await page.close();
}
for (const width of [1440, 390]) {
  const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 1000 },
    }),
    page = await context.newPage();
  for (const route of ['/customize', '/products/glock-optic-cut-full-size', '/about']) {
    await page.goto(base + route);
    await capture(page, `${route.split('/').filter(Boolean).join('-')}-${width}`);
  }
  const build = {
    id: randomUUID(),
    firearm: {
      manufacturer: 'Glock',
      model: '19',
      variant: 'OEM / no existing optic cut',
      componentType: 'slide',
    },
    services: [
      {
        serviceId: 'glock-optic-cut-full-size',
        optionIds: [],
        attributes: { field_2: '1', field_3: '2', field_10: '1', field_7: '33' },
      },
    ],
    createdAt: new Date().toISOString(),
  };
  const items = [
    { kind: 'build', id: build.id, build },
    { kind: 'product', id: randomUUID(), productId: 'dmw-sticker-pack', quantity: 1 },
  ];
  await page.evaluate((items) => localStorage.setItem('dmw-cart-v2', JSON.stringify(items)), items);
  await page.goto(base + '/cart');
  await page.getByRole('link', { name: 'Checkout', exact: true }).waitFor();
  await capture(page, `cart-${width}`);
  await page.getByRole('link', { name: 'Edit build', exact: true }).click();
  await page.waitForFunction(() => document.getElementById('model')?.value === '19');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await capture(page, `configurator-details-${width}`);
  await page.goto(base + '/cart');
  await page.getByRole('link', { name: 'Checkout', exact: true }).click();
  await capture(page, `checkout-contact-${width}`);
  for (const [label, value] of [
    ['First name', 'Demo'],
    ['Last name', 'Customer'],
    ['Email', 'demo@example.com'],
    ['Phone', '2025550123'],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await capture(page, `checkout-address-${width}`);
  await page.getByLabel('Street address', { exact: true }).fill('123 Example Street');
  await page.getByLabel('City', { exact: true }).fill('Example City');
  await page.getByLabel('State', { exact: true }).selectOption('TN');
  await page.getByLabel('ZIP code', { exact: true }).fill('37040');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await capture(page, `checkout-review-${width}`);
  for (const input of await page.locator('.order-acknowledgements input').all())
    await input.check();
  await page.getByRole('button', { name: 'Place test order', exact: true }).click();
  await page.waitForURL('**/confirmation');
  await capture(page, `confirmation-${width}`);
  await context.close();
}
await writeFile(`${dir}/results.json`, JSON.stringify(results, null, 2) + '\n');
await browser.close();
console.log({
  checks: results.length,
  overflow: results.filter((r) => r.overflow),
  brokenImages: results.flatMap((r) => r.brokenImages),
});
