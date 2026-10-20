import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { serviceById, catalogVersion } from '../../src/lib/commerce/catalog';
import { priceBuild } from '../../src/lib/commerce/pricing';
import {
  configuredBuild,
  confirmedBuild,
  configureInBrowser,
  fillDetails,
  seedCart,
  setOption,
} from './commerce-fixtures';
function camo(id: string) {
  const b = configuredBuild(id),
    s = serviceById.get(id)!,
    c = b.services[0];
  for (const f of s.fields.filter((f) => ['finish', 'finish-secondary', 'camo'].includes(f.role)))
    delete c.attributes[f.id];
  setOption(
    b,
    id,
    'coating',
    s.fields.find((f) => f.role === 'coating')!.options.find((o) => o.coatingId === 'camo')!
      .displayName,
  );
  setOption(b, id, 'camo', 'Midnight Chocolate Chip');
  return b;
}
async function selectPackage(page: Page, id: string) {
  const s = serviceById.get(id)!,
    input = page.getByRole('checkbox', { name: s.displayName, exact: true }),
    family = page
      .locator('.service-family')
      .filter({ has: page.locator(`input[aria-label="${s.displayName}"]`) });
  if (!(await family.evaluate((el) => (el as HTMLDetailsElement).open)))
    await family.locator('summary').first().click();
  await input.click();
}
for (const [id, choice] of [
  ['glock-core-lvl-stippling-package', 'Kevlar'],
  ['beretta-px4-stipple-package-2', ''],
  ['bodyguard-2-0-viper-ports', ''],
  ['genesis-oem-slide-mill', ''],
] as const) {
  test(`visual service choices persist to cart and checkout: ${id}`, async ({ page }) => {
    const service = serviceById.get(id)!;
    const b = configuredBuild(service.serviceId);
    if (choice) setOption(b, service.serviceId, 'texture', choice);
    await configureInBrowser(page, b);
    await expect(page.locator('.cart-item')).toContainText(service.displayName);
    if (choice) await expect(page.locator('.cart-item')).toContainText(choice);
    await page.getByRole('link', { name: 'Checkout', exact: true }).click();
    await expect(page.locator('.commerce-summary')).toContainText(service.displayName);
    expect(priceBuild(b).errors).toEqual([]);
  });
}
test('standalone Cerakote retains its finish and verified treatment delta without wizard imagery', async ({
  page,
}) => {
  const b = camo('slide-only-cerakote');
  await configureInBrowser(page, b, false);
  await expect(page.locator('.review-service')).toContainText('Midnight Chocolate Chip');
  await expect(page.locator('.review-service')).toContainText('$150.00');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(
    page.locator('.option-card').filter({ hasText: 'Midnight Chocolate Chip' }).locator('img'),
  ).toHaveCount(0);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
for (const reverse of [false, true])
  test(`human regression: Glock 17 Midnight Chocolate Chip / reverse=${reverse}`, async ({
    page,
    request,
  }) => {
    const first = camo(reverse ? 'glock-optic-cut-full-size' : 'slide-only-cerakote');
    first.firearm.modelId = 'glock-17';
    if (reverse) setOption(first, first.services[0].serviceId, 'optic', 'C SERIES');
    await configureInBrowser(page, first, false);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await selectPackage(page, reverse ? 'slide-only-cerakote' : 'glock-optic-cut-full-size');
    await expect(page.locator('.normalization-notice')).toContainText('separate slide Cerakote');
    await expect(page.locator('input[aria-label="Slide Only Cerakote"]')).not.toBeChecked();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    const final = camo('glock-optic-cut-full-size');
    final.firearm.modelId = 'glock-17';
    setOption(final, final.services[0].serviceId, 'optic', 'C SERIES');
    await fillDetails(page, final);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.locator('.review-service')).toHaveCount(1);
    await expect(page.locator('.review-service')).toContainText('$285.00');
    await expect(page.locator('.review-service')).toContainText('Keep Factory');
    await page.getByRole('button', { name: 'Add build to cart', exact: true }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.locator('.cart-item')).toContainText('Midnight Chocolate Chip');
    const envelope = JSON.parse(
      (await page.evaluate(() => localStorage.getItem('dmw-cart-v3'))) || '{}',
    );
    const response = await request.post('/api/commerce/quote', {
      data: { items: envelope.items, catalogVersion },
    });
    expect(response.ok()).toBe(true);
    expect((await response.json()).quote.subtotalCents).toBe(28500);
  });
test('saved catalog changes require explicit review before checkout', async ({ page }) => {
  await seedCart(page, [confirmedBuild()], [], { version: 'dmw-obsolete' });
  await expect(page.locator('.cart-review-notice')).toContainText('Some build details changed');
  await expect(page.getByRole('link', { name: 'Checkout', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Accept current details and subtotal' }).click();
  await page.getByRole('link', { name: 'Checkout', exact: true }).click();
  await expect(page.locator('.checkout-fields')).toBeVisible();
});
test('legacy cart migrates safely and requires price acceptance', async ({ page }) => {
  const build = confirmedBuild();
  await page.goto('/cart');
  await page.evaluate((b) => {
    localStorage.removeItem('dmw-cart-v3');
    localStorage.setItem(
      'dmw-cart-v2',
      JSON.stringify([
        {
          kind: 'build',
          id: b.id,
          build: {
            id: b.id,
            createdAt: b.createdAt,
            firearm: {
              manufacturer: 'Glock',
              model: '19',
              variant: 'OEM / no existing optic cut',
              componentType: 'slide',
            },
            services: b.services,
          },
        },
      ]),
    );
  }, build);
  await page.reload();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await expect(page.locator('.cart-review-notice')).toBeVisible();
  await page.getByRole('button', { name: 'Accept current details and subtotal' }).click();
  await expect(page.getByRole('link', { name: 'Checkout', exact: true })).toBeVisible();
});
for (const width of [375, 390, 430])
  test(`mobile visual controls, keyboard and continuous hero at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const hero = page.locator('.hero');
    expect(
      await hero.evaluate((el) => {
        const photo = el.querySelector('img')!,
          r = photo.getBoundingClientRect();
        return Array.from(
          el.querySelectorAll('.hero-topline,h1,.hero-content > p,.button-row'),
        ).every((child) => {
          const c = child.getBoundingClientRect();
          return c.top >= r.top && c.bottom <= r.bottom;
        });
      }),
    ).toBe(true);
    await expect(hero.getByRole('link', { name: /Start your build/i })).toBeVisible();
    await expect(hero.getByRole('link', { name: /Explore our work/i })).toBeVisible();
    const b = configuredBuild('glock-core-lvl-stippling-package');
    setOption(b, b.services[0].serviceId, 'texture', 'Kevlar');
    await configureInBrowser(page, b, false);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    const f = serviceById.get(b.services[0].serviceId)!.fields.find((f) => f.role === 'texture')!,
      group = page.locator(`#${b.services[0].serviceId}-${f.id}`);
    await expect(group).toContainText('Aggression');
    const radio = group.getByRole('radio', { name: 'Kevlar / included', exact: true });
    await radio.focus();
    await radio.press('ArrowRight');
    await expect(radio).not.toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
  });
test('coming-soon porting cannot be selected or injected and model-specific choices stay relevant', async ({
  page,
  request,
}) => {
  await page.goto('/customize?product=coming-soon-1');
  await page.getByLabel('Manufacturer', { exact: true }).selectOption('sw');
  await page.getByLabel('Model', { exact: true }).selectOption('sw-bodyguard20');
  await page.getByLabel('Variant / existing work').selectOption('carry-comp');
  await page.getByLabel('Component being sent').selectOption('slide-and-barrel');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Bodyguard 2.0 Viper Ports', exact: true }),
  ).toHaveCount(0);
  await page
    .locator('.service-family')
    .filter({ hasText: 'Porting' })
    .locator('summary')
    .first()
    .click();
  await page.getByText('Upcoming porting · not available to order').click();
  await expect(page.locator('.unavailable-package')).toHaveCount(1);
  await expect(page.locator('.unavailable-package input')).toBeDisabled();
  const b = confirmedBuild();
  b.services[0].serviceId = 'coming-soon-1';
  const r = await request.post('/api/commerce/quote', {
    data: { items: [{ kind: 'build', id: b.id, build: b }], catalogVersion },
  });
  expect((await r.json()).quote.errors.length).toBeGreaterThan(0);
});
test('breadcrumbs retain navigation without duplicate page eyebrows', async ({ page }) => {
  for (const route of [
    '/cart',
    '/checkout',
    '/products',
    '/services',
    '/resources',
    '/about',
    '/contact',
    '/customize',
    '/gallery',
  ]) {
    await page.goto(route);
    if (route === '/services') {
      await expect(page.locator('.page-intro > .eyebrow')).toHaveText('The work / All services');
    } else {
      await expect(page.getByRole('navigation', { name: 'Breadcrumb', exact: true })).toHaveCount(
        1,
      );
      await expect(page.locator('.page-intro > .eyebrow')).toHaveCount(0);
    }
  }
});
test('mobile menu hierarchy, close animation and reduced motion preserve focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const open = page.getByRole('button', { name: 'Open navigation' });
  await open.click();
  const menu = page.getByRole('dialog', { name: 'Site navigation' });
  await expect(menu.getByRole('link', { name: 'Stippling', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(open).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open.click();
  expect(
    await menu.evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration)),
  ).toBeLessThan(0.02);
  await menu.getByRole('link', { name: 'Shipping & lead time', exact: true }).click();
  await expect(page).toHaveURL(/\/shipping$/);
});
