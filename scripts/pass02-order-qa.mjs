import { chromium } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const results = [];
const dir = 'tests/visual/pass-02';
for (const width of [1440, 375]) {
  const context = await browser.newContext({
    viewport: { width, height: width === 375 ? 812 : 900 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3000/');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.proof-bar').screenshot({ path: `${dir}/proof-${width}.png` });
  const build = {
    id: randomUUID(),
    firearm: {
      manufacturer: 'Glock',
      model: '19',
      variant: 'OEM / no existing optic cut',
      componentType: 'complete-firearm',
    },
    services: [
      {
        serviceId: 'glock-base-lvl-stippling-package',
        optionIds: ['kevlar-pattern'],
        attributes: {},
      },
      {
        serviceId: 'slide-only-cerakote',
        optionIds: [],
        attributes: { Finish: 'Midnight Bronze H-294' },
      },
    ],
    createdAt: new Date().toISOString(),
  };
  const items = [
    { kind: 'build', id: build.id, build },
    { kind: 'product', id: randomUUID(), productId: 'dmw-sticker-pack', quantity: 1 },
  ];
  await page.evaluate((items) => localStorage.setItem('dmw-cart-v2', JSON.stringify(items)), items);
  await page.goto('http://127.0.0.1:3000/cart');
  await page.reload();
  await page.getByRole('link', { name: 'Development checkout', exact: true }).waitFor();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `${dir}/cart-final-${width}.png`, fullPage: true });
  await page.getByRole('link', { name: 'Development checkout', exact: true }).click();
  for (const [label, value] of [
    ['First name', 'Demo'],
    ['Last name', 'Customer'],
    ['Email', 'demo@example.com'],
    ['Phone', '2025550123'],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Street address', { exact: true }).fill('123 Example Street');
  await page.getByLabel('City', { exact: true }).fill('Example City');
  await page.getByLabel('State', { exact: true }).selectOption('TN');
  await page.getByLabel('ZIP code', { exact: true }).fill('37040');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `${dir}/checkout-final-${width}.png`, fullPage: true });
  for (const input of await page.locator('.order-acknowledgements input').all())
    await input.check();
  await page.getByRole('button', { name: 'Place test order' }).click();
  await page.waitForURL('**/confirmation');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `${dir}/confirmation-${width}.png`, fullPage: true });
  results.push({
    width,
    confirmation: await page.locator('.order-number').textContent(),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  });
  await context.close();
}
await writeFile(`${dir}/order-visual-results.json`, JSON.stringify(results, null, 2));
await browser.close();
console.log(results);
