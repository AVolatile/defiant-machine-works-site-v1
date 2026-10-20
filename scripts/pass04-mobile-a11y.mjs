import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const matrix = JSON.parse(await readFile('src/data/service-matrix.json', 'utf8'));
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3002';
const visualDir = process.env.VISUAL_OUTPUT_DIR || 'tests/visual/pass-04';
const auditDir = process.env.AUDIT_OUTPUT_DIR || 'source-audit/pass-04';
await mkdir(visualDir, { recursive: true });
await mkdir(auditDir, { recursive: true });
const browser = await chromium.launch(),
  results = [];
for (const width of [375, 390, 430]) {
  const context = await browser.newContext({ viewport: { width, height: 844 } });
  const page = await context.newPage();
  await page.goto(base + '/cart');
  const id = randomUUID();
  // Audited full-size optic fixture: RMR, factory BUIS, single-color Carbon Black.
  const build = {
    schemaVersion: 3,
    id,
    firearm: {
      manufacturerId: 'glock',
      modelId: 'glock-17',
      variantId: 'uncut',
      generationId: 'unspecified',
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
  await page.evaluate(
    ({ build, version }) =>
      localStorage.setItem(
        'dmw-cart-v3',
        JSON.stringify({
          schemaVersion: 3,
          catalogVersion: version,
          items: [{ kind: 'build', id: build.id, build }],
          needsReview: false,
          acceptedSubtotalCents: null,
        }),
      ),
    { build, version: matrix.catalogVersion },
  );
  await page.reload();
  await page.getByRole('link', { name: 'Checkout', exact: true }).click();
  for (const [name, value] of [
    ['First name', 'Demo'],
    ['Last name', 'Customer'],
    ['Email', 'demo@example.com'],
  ])
    await page.getByRole('textbox', { name, exact: true }).fill(value);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const billing = page.getByRole('group', { name: 'Billing address', exact: true });
  for (const [name, value] of [
    ['Street address', '123 Example Street'],
    ['City', 'Example City'],
    ['ZIP code', '37040'],
  ])
    await billing.getByLabel(name, { exact: true }).fill(value);
  await billing.getByLabel('State', { exact: true }).selectOption('TN');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Review your service order.', exact: true }).waitFor();
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  results.push({
    width,
    state: 'Populated customer/billing/return/order/payment review, optional phone omitted',
    axeViolations: axe.violations,
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
  });
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.screenshot({
    path: `${visualDir}/mobile-checkout-a11y-${width}.png`,
    fullPage: true,
  });
  await context.close();
}
await browser.close();
await writeFile(`${auditDir}/mobile-checkout-a11y.json`, JSON.stringify(results, null, 2) + '\n');
if (results.some((r) => r.axeViolations.length || r.overflow))
  throw Error('Mobile checkout accessibility or overflow failed.');
console.log('Three populated mobile checkout Axe/overflow checks passed; no order submitted.');
