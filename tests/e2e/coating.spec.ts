import { test, expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { catalogVersion, serviceById } from '../../src/lib/commerce/catalog';
import { checkoutAddress, checkoutContact, configuredBuild, seedCart } from './commerce-fixtures';

const scopes = [
  ['Slide Only', 'slide-only-cerakote'],
  ['Frame Only', 'frame-only-cerakote'],
  ['Complete Pistol', 'pistol-cerakote'],
] as const;

async function capture(page: Page, info: TestInfo, label: string) {
  await page.locator('.configuration-panel h2').focus();
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  await info.attach(label, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

test('Cerakote service-page entry opens coating scope directly', async ({ page }) => {
  await page.goto('/cerakote');
  const link = page.locator('main a[href="/customize?service=Cerakote"]');
  await link.click();
  await expect(page.getByRole('heading', { name: 'What are we coating?' })).toBeVisible();
});

async function singleColor(page: Page, id: string) {
  await page
    .getByLabel('Coating Type', { exact: false })
    .selectOption({ label: 'Single Color / included' });
  await page
    .locator(`#${id}-field_2`)
    .getByRole('radio', { name: 'Carbon Black F-102 / included', exact: true })
    .check();
}

async function noPlatformFields(page: Page) {
  await expect(page.locator('#manufacturer,#model,#variant,#generation,#component')).toHaveCount(0);
  await expect(page.locator('.configuration-panel')).not.toContainText('BUIS');
  await expect(page.locator('.configuration-panel')).not.toContainText('Optic Cut');
}

for (const [label, id] of scopes)
  test(`standalone cosmetic coating: ${label} → finish → cart → edit without platform questions`, async ({
    page,
  }) => {
    await page.goto('/customize?service=cerakote');
    await noPlatformFields(page);
    await page.getByRole('radio', { name: label, exact: true }).check();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await singleColor(page, id);
    await noPlatformFields(page);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.locator('.configuration-panel')).toContainText('Ready for checkout');
    await expect(page.locator('.configuration-panel')).toContainText('Carbon Black F-102');
    await page.getByRole('button', { name: 'Add build to cart', exact: true }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.locator('.cart-item')).toHaveCount(1);
    const envelope = await page.evaluate(() => JSON.parse(localStorage.getItem('dmw-cart-v3')!));
    expect(envelope.schemaVersion).toBe(3);
    expect(envelope.catalogVersion).toBe(catalogVersion);
    expect(envelope.items[0].build.firearm.manufacturerId).toBe('');
    expect(envelope.items[0].build.services[0].attributes).toEqual({ field_1: '1', field_2: '33' });
    await page.reload();
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await page.getByRole('link', { name: 'Edit build', exact: true }).click();
    await expect(page.getByRole('radio', { name: label, exact: true })).toBeChecked();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.locator(`#${id}-field_2 input[value="33"]`)).toBeChecked();
    await noPlatformFields(page);
  });

test('coating entry link, scope/finish errors, Gallery new tab and keyboard controls', async ({
  page,
}) => {
  await page.goto('/customize');
  await page
    .getByRole('link', { name: 'Cerakote only? Choose scope and finish', exact: true })
    .click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.configuration-panel [role="alert"]')).toContainText(
    'Choose a coating scope',
  );
  await expect(page.locator('.configuration-panel [role="alert"]')).toBeFocused();
  const scope = page.getByRole('radio', { name: 'Slide Only', exact: true });
  await scope.focus();
  await page.keyboard.press('Space');
  await expect(scope).toBeChecked();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.configuration-panel [role="alert"]')).toContainText('Coating Type');
  await expect(page.getByLabel('Coating Type', { exact: false })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await singleColor(page, 'slide-only-cerakote');
  const link = page.locator('.configuration-panel a.gallery-reference');
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  const popupPromise = page.waitForEvent('popup');
  await link.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/\/gallery\?service=Cerakote/);
  await popup.close();
  await expect(page.locator('#slide-only-cerakote-field_2 input[value="33"]')).toBeChecked();
  await expect(page.locator('.configuration-panel img')).toHaveCount(0);
});

test('coating treatment change prunes hidden options and scope change resets finish choices', async ({
  page,
}) => {
  await page.goto('/customize?product=slide-only-cerakote');
  await expect(page.getByRole('radio', { name: 'Slide Only', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await singleColor(page, 'slide-only-cerakote');
  await page.getByLabel('Coating Type', { exact: false }).selectOption('2');
  await page.locator('#slide-only-cerakote-field_3 input[value="34"]').check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.configuration-panel .service-price-total')).toContainText('$115');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByLabel('Coating Type', { exact: false }).selectOption('1');
  await expect(page.locator('#slide-only-cerakote-field_3')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.configuration-panel .service-price-total')).toContainText('$90');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('radio', { name: 'Frame Only', exact: true }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Coating Type', { exact: false })).toHaveValue('');
});

test('prior platform-specific cosmetic coating carts edit without data migration', async ({
  page,
}) => {
  const build = configuredBuild('frame-only-cerakote');
  await seedCart(page, [build]);
  await page.getByRole('link', { name: 'Edit build', exact: true }).click();
  await noPlatformFields(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Add build to cart', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  const envelope = await page.evaluate(() => JSON.parse(localStorage.getItem('dmw-cart-v3')!));
  expect(envelope.items[0].build).toEqual(build);
});

test('scope-only cosmetic coating continues through existing test checkout and private confirmation', async ({
  page,
  browser,
}) => {
  await page.goto('/customize?product=slide-only-cerakote');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await singleColor(page, 'slide-only-cerakote');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Add build to cart', exact: true }).click();
  await page.getByRole('link', { name: 'Checkout', exact: true }).click();
  await checkoutContact(page);
  await checkoutAddress(page);
  await expect(page.locator('.checkout-layout')).toContainText('Carbon Black F-102');
  for (const acknowledgement of await page.locator('.order-acknowledgements input').all())
    await acknowledgement.check();
  await page.getByRole('button', { name: 'Place test order', exact: true }).click();
  await expect(page).toHaveURL(/\/order\/DMW-TEST-.+\/confirmation$/);
  await expect(page.locator('.order-confirmation')).toContainText('Carbon Black F-102');
  await expect(page.locator('.order-confirmation')).toContainText('Slide coating');
  const other = await browser.newContext();
  const stranger = await other.newPage();
  expect((await stranger.goto(page.url()))?.status()).toBe(404);
  await other.close();
});

test('coating quote independently rejects forged hidden fields and invalid scopes', async ({
  request,
}) => {
  const build = configuredBuild('slide-only-cerakote');
  Object.assign(build.firearm, { manufacturerId: '', modelId: '', variantId: '' });
  async function quote() {
    return request.post('/api/commerce/quote', {
      data: { catalogVersion, items: [{ kind: 'build', id: build.id, build }] },
    });
  }
  let response = await quote();
  expect(response.status()).toBe(200);
  expect((await response.json()).quote.subtotalCents).toBe(
    serviceById.get('slide-only-cerakote')!.basePriceCents,
  );
  build.services[0].attributes['forged-unrelated-field'] = 'yes';
  response = await quote();
  expect((await response.json()).quote.orderability).toBe('invalid');
  delete build.services[0].attributes['forged-unrelated-field'];
  build.firearm.componentType = 'frame';
  response = await quote();
  expect((await response.json()).quote.orderability).toBe('invalid');
});

for (const width of [390, 1440])
  test(`cosmetic coating visual and Axe review at ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/customize?service=cerakote');
    await expect(page.getByRole('heading', { name: 'What are we coating?' })).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await capture(page, info, `coating-scope-${width}`);
    await page.getByRole('radio', { name: 'Slide Only', exact: true }).check();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await singleColor(page, 'slide-only-cerakote');
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await capture(page, info, `coating-finish-${width}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await capture(page, info, `coating-review-${width}`);
  });

test.describe('default cosmetic coating checkout', () => {
  test.use({ baseURL: process.env.PLAYWRIGHT_DISABLED_URL || 'http://127.0.0.1:3003' });
  test('scope-only coating reaches review while real payment remains disabled', async ({
    page,
  }) => {
    await page.goto('/customize?product=slide-only-cerakote');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await singleColor(page, 'slide-only-cerakote');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Add build to cart', exact: true }).click();
    await page.getByRole('link', { name: 'Checkout', exact: true }).click();
    await checkoutContact(page);
    await checkoutAddress(page);
    await expect(page.getByRole('button', { name: 'Place order', exact: true })).toBeDisabled();
    await expect(page.locator('.checkout-layout')).toContainText('Carbon Black F-102');
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
      'demo@example.com',
    );
  });
});
