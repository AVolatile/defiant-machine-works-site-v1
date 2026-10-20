import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { randomUUID } from 'node:crypto';
import { catalogVersion } from '../../src/lib/commerce/catalog';
import { quoteCart } from '../../src/lib/commerce/pricing';
import { communicateOrder } from '../../src/lib/commerce/communications';
import { developmentCheckoutEnabled, paymentProvider } from '../../src/lib/commerce/payment';
import type { OrderSnapshot } from '../../src/lib/commerce/schema';
import {
  confirmedBuild,
  configuredBuild,
  seedCart,
  checkoutContact,
  checkoutAddress,
  configureInBrowser,
} from './commerce-fixtures';
const address = {
  line1: '123 Example Street',
  line2: '',
  city: 'Example City',
  state: 'TN',
  postalCode: '37040',
  country: 'US',
};
function orderInput() {
  const build = confirmedBuild(),
    items = [{ kind: 'build' as const, id: build.id, build }];
  return {
    catalogVersion,
    items,
    customer: {
      firstName: 'Demo',
      lastName: 'Customer',
      email: 'demo@example.com',
      phone: '2025550123',
    },
    billingAddress: address,
    address,
    shippingMethod: 'test-return',
    acknowledgements: { inspection: true, shipping: true, leadTime: true, testOrder: true },
    expectedSubtotalCents: quoteCart(items).subtotalCents,
    idempotencyKey: randomUUID(),
    testPayment: 'approved',
  };
}
test('cart groups multiple builds and merchandise; edit, duplicate, remove and persistence remain intact', async ({
  page,
}) => {
  await seedCart(
    page,
    [confirmedBuild(), configuredBuild('fn-reflex-stippling-package')],
    [{ kind: 'product', id: randomUUID(), productId: 'dmw-sticker-pack', quantity: 2 }],
  );
  await expect(page.locator('.cart-item')).toHaveCount(3);
  await page.reload();
  await expect(page.locator('.cart-item')).toHaveCount(3);
  await page
    .locator('.cart-item')
    .first()
    .getByRole('button', { name: 'Duplicate build', exact: true })
    .click();
  await expect(page.locator('.cart-item')).toHaveCount(4);
  await page
    .locator('.cart-item')
    .first()
    .getByRole('link', { name: 'Edit build', exact: true })
    .click();
  await expect(page.getByLabel('Model', { exact: true })).toHaveValue('glock-19');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Add build to cart', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.locator('.cart-item')).toHaveCount(4);
  while (await page.getByRole('button', { name: 'Remove build', exact: true }).count())
    await page.getByRole('button', { name: 'Remove build', exact: true }).first().click();
  await page.getByRole('button', { name: 'Remove product', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No builds yet.' })).toBeVisible();
});
test('customer and address validation, back navigation, decline/retry, private confirmation and frozen optic choices', async ({
  page,
  browser,
}) => {
  await configureInBrowser(page, confirmedBuild());
  await page.getByRole('link', { name: 'Checkout', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.form-error')).toContainText('first name');
  await checkoutContact(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.form-error')).toContainText('street address');
  await checkoutAddress(page);
  await page.getByRole('button', { name: 'Edit contact details' }).click();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('demo@example.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Street address', { exact: true })).toHaveValue(
    '123 Example Street',
  );
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Place test order', exact: true }).click();
  await expect(page.locator('.form-error')).toContainText('Acknowledge');
  for (const input of await page.locator('.order-acknowledgements input').all())
    await input.check();
  await page.getByLabel('Test payment result').selectOption('declined');
  await page.getByRole('button', { name: 'Place test order', exact: true }).click();
  await expect(page.locator('.form-error')).toContainText('declined');
  await page.getByLabel('Test payment result').selectOption('approved');
  await page.getByRole('button', { name: 'Place test order', exact: true }).click();
  await expect(page).toHaveURL(/\/order\/DMW-TEST-.+\/confirmation$/);
  await expect(page.locator('.order-confirmation')).toContainText('RMR');
  await expect(page.locator('.confirmation-next')).toContainText('shipping instructions');
  await expect(page.locator('.communication-status')).toContainText(
    'No confirmation or shipping-instructions email has been sent',
  );
  const url = page.url();
  await page.reload();
  await expect(page.locator('.order-number')).toContainText('DMW-TEST');
  const storage = await page.evaluate(() => JSON.stringify(localStorage));
  expect(storage).not.toContain('demo@example.com');
  expect(storage).not.toContain('Example Street');
  expect(
    JSON.parse((await page.evaluate(() => localStorage.getItem('dmw-cart-v3'))) || '{}').items,
  ).toEqual([]);
  const stranger = await browser.newContext();
  const other = await stranger.newPage();
  expect((await other.goto(url))?.status()).toBe(404);
  await stranger.close();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test('server rejects tampered totals, stale catalog, bad fields, cross-site requests, duplicate mismatches and unapproved items', async ({
  request,
}) => {
  const payload = orderInput();
  await request.post('/api/commerce/quote', { data: { items: payload.items, catalogVersion } });
  expect(
    (
      await request.post('/api/commerce/orders', { data: { ...payload, expectedSubtotalCents: 1 } })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post('/api/commerce/orders', { data: { ...payload, catalogVersion: 'old' } })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post('/api/commerce/quote', {
        data: { items: payload.items, catalogVersion: 'old' },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post('/api/commerce/orders', {
        data: { ...payload, customer: { ...payload.customer, email: 'invalid' } },
      })
    ).status(),
  ).toBe(422);
  expect(
    (
      await request.post('/api/commerce/orders', {
        headers: { Origin: 'https://unrelated.example' },
        data: payload,
      })
    ).status(),
  ).toBe(403);
  const responses = await Promise.all([
    request.post('/api/commerce/orders', { data: payload }),
    request.post('/api/commerce/orders', { data: payload }),
  ]);
  expect(responses.every((r) => [200, 409].includes(r.status()))).toBe(true);
  const body = await responses.find((r) => r.ok())!.json();
  const repeat = await request.post('/api/commerce/orders', { data: payload });
  expect((await repeat.json()).orderNumber).toBe(body.orderNumber);
  expect(
    (
      await request.post('/api/commerce/orders', {
        data: { ...payload, address: { ...payload.address, city: 'Changed' } },
      })
    ).status(),
  ).toBe(409);
  expect((await request.get(body.confirmationUrl)).status()).toBe(200);
  const bad = orderInput();
  bad.items[0].build.services[0].serviceId = 'coming-soon-1';
  expect((await request.post('/api/commerce/orders', { data: bad })).status()).toBe(422);
  const bytes = 'x'.repeat(70000);
  expect(
    (
      await request.post('/api/commerce/orders', {
        headers: { 'Content-Type': 'application/json' },
        data: bytes,
      })
    ).status(),
  ).toBe(400);
});
test('separate return address is validated and kept in memory through review', async ({ page }) => {
  await seedCart(page);
  await page.getByRole('link', { name: 'Checkout', exact: true }).click();
  await checkoutContact(page);
  await page.getByLabel('Use my billing address as my return address').uncheck();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.form-error')).toContainText('street address');
  for (const [groupName, street] of [
    ['Billing address', '123 Billing Street'],
    ['Return shipping address', '456 Return Street'],
  ]) {
    const group = page.getByRole('group', { name: groupName, exact: true });
    await group.getByLabel('Street address', { exact: true }).fill(street);
    await group.getByLabel('City', { exact: true }).fill('Example City');
    await group.getByLabel('State', { exact: true }).selectOption('TN');
    await group.getByLabel('ZIP code', { exact: true }).fill('37040');
  }
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.checkout-review-section').first()).toContainText('456 Return Street');
  await page.getByRole('button', { name: 'Edit addresses' }).click();
  await expect(
    page
      .getByRole('group', { name: 'Return shipping address', exact: true })
      .getByLabel('Street address', { exact: true }),
  ).toHaveValue('456 Return Street');
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('Return Street');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test('rapid duplicate clicks make one request and server failure retains progress', async ({
  page,
}) => {
  await seedCart(page);
  await page.getByRole('link', { name: 'Checkout', exact: true }).click();
  await checkoutContact(page);
  await checkoutAddress(page);
  for (const input of await page.locator('.order-acknowledgements input').all())
    await input.check();
  let attempts = 0;
  await page.route('**/api/commerce/orders', async (route) => {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({
      status: 503,
      json: {
        error: 'Order storage is unavailable. Your cart is unchanged; please try again later.',
      },
    });
  });
  const button = page.getByRole('button', { name: 'Place test order', exact: true });
  await expect(button).toBeEnabled();
  await button.evaluate((el: HTMLButtonElement) => {
    el.click();
    el.click();
  });
  await expect(page.locator('.form-error')).toContainText('Order storage is unavailable');
  expect(attempts).toBe(1);
  await page.getByRole('button', { name: 'Edit contact details' }).click();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('demo@example.com');
});
test('actual source conflict remains a review path and cannot produce a successful order', async ({
  page,
  request,
}) => {
  const b = configuredBuild('cz-p-07');
  await seedCart(page, [b]);
  await page.getByRole('link', { name: 'Review checkout requirements', exact: true }).click();
  await checkoutContact(page);
  await checkoutAddress(page);
  await expect(page.locator('.configuration-review')).toContainText('75 Series');
  await expect(
    page.getByRole('link', { name: 'Request a configuration review', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place test order' })).toBeDisabled();
  const payload = orderInput();
  payload.items = [{ kind: 'build', id: b.id, build: b }];
  payload.expectedSubtotalCents = quoteCart(payload.items).subtotalCents;
  expect((await request.post('/api/commerce/orders', { data: payload })).status()).toBe(422);
});
test('provider and communication boundaries remain honest when absent or failed', async () => {
  const mode = process.env.COMMERCE_MODE,
    provider = process.env.PAYMENT_PROVIDER;
  try {
    delete process.env.COMMERCE_MODE;
    delete process.env.PAYMENT_PROVIDER;
    expect(developmentCheckoutEnabled()).toBe(false);
    expect(() => paymentProvider()).toThrow('Live payment');
    process.env.COMMERCE_MODE = 'test';
    expect(developmentCheckoutEnabled()).toBe(false);
    process.env.PAYMENT_PROVIDER = 'unapproved';
    expect(() => paymentProvider()).toThrow('Live payment');
  } finally {
    if (mode === undefined) delete process.env.COMMERCE_MODE;
    else process.env.COMMERCE_MODE = mode;
    if (provider === undefined) delete process.env.PAYMENT_PROVIDER;
    else process.env.PAYMENT_PROVIDER = provider;
  }
  const order = {
    orderNumber: 'TEST',
    shippingInstructions: { status: 'pending' },
  } as OrderSnapshot;
  expect(await communicateOrder(order, 'confirmation')).toEqual({ status: 'not-configured' });
  expect(
    (
      await communicateOrder(order, 'confirmation', {
        send: async () => {
          throw Error('unavailable');
        },
      })
    ).status,
  ).toBe('failed');
  expect(
    (
      await communicateOrder(order, 'shippingInstructions', {
        send: async () => ({ reference: 'unused' }),
      })
    ).status,
  ).toBe('not-requested');
});
test.describe('production-disabled environment', () => {
  test.use({ baseURL: process.env.PLAYWRIGHT_DISABLED_URL || 'http://127.0.0.1:3003' });
  test('confirmed cart reaches customer, billing and final review without a quote fallback', async ({
    page,
    request,
  }) => {
    await seedCart(page);
    await page.getByRole('link', { name: 'Checkout', exact: true }).click();
    await expect(page.getByRole('link', { name: /quote|configuration review/i })).toHaveCount(0);
    await checkoutContact(page);
    await checkoutAddress(page);
    await expect(page.getByRole('button', { name: 'Place order', exact: true })).toBeDisabled();
    await expect(page.locator('.payment-boundary')).toContainText('Live payment is not configured');
    expect((await request.post('/api/commerce/orders', { data: orderInput() })).status()).toBe(503);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
  });
});
