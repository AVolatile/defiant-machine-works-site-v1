import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import {
  configuredBuild,
  configureInBrowser,
  setOption,
  checkoutContact,
  checkoutAddress,
} from '../e2e/commerce-fixtures';
import { serviceById } from '../../src/lib/commerce/catalog';
const dir = process.env.VISUAL_OUTPUT_DIR || 'tests/visual/pass-04';
for (const width of [375, 390, 430, 768, 1024, 1280, 1440, 1728])
  test(`visual review matrix ${width}`, async ({ page }) => {
    test.setTimeout(180000);
    await mkdir(dir, { recursive: true });
    await page.setViewportSize({ width, height: width <= 430 ? 844 : 1000 });
    const results: unknown[] = [];
    async function capture(name: string) {
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: `${dir}/${name}-${width}.png`, fullPage: true });
      const status = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        brokenImages: Array.from(document.images)
          .filter((i) => i.complete && !i.naturalWidth)
          .map((i) => i.src),
      }));
      results.push({ name, width, route: new URL(page.url()).pathname, ...status });
      expect(status.overflow, name).toBe(false);
      expect(status.brokenImages, name).toEqual([]);
    }
    await page.goto('/');
    await capture('home');
    if (width <= 430) {
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await page.locator('#mobile-nav').evaluate((el) => el.getAnimations().map((a) => a.finish()));
      await capture('menu-open');
      await page.keyboard.press('Escape');
    }
    const stipple = configuredBuild('glock-core-lvl-stippling-package');
    setOption(stipple, stipple.services[0].serviceId, 'texture', 'Kevlar');
    await configureInBrowser(page, stipple, false);
    await capture('build-review');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await capture('stippling-picker');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await capture('build-services');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await capture('build-platform');
    for (const [id, name] of [
      ['bodyguard-2-0-viper-ports', 'porting-picker'],
      ['slide-only-cerakote', 'cerakote-picker'],
      ['glock-optic-cut-full-size', 'milling-details'],
    ]) {
      const b = configuredBuild(id);
      if (id === 'slide-only-cerakote') {
        const service = serviceById.get(id)!;
        for (const field of service.fields.filter((f) =>
          ['finish', 'finish-secondary'].includes(f.role),
        ))
          delete b.services[0].attributes[field.id];
        setOption(
          b,
          id,
          'coating',
          service.fields
            .find((f) => f.role === 'coating')!
            .options.find((o) => o.coatingId === 'camo')!.displayName,
        );
        setOption(b, id, 'camo', 'Midnight Chocolate Chip');
      }
      await configureInBrowser(page, b, false);
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await capture(name);
      if (name === 'porting-picker') {
        await page.getByRole('button', { name: 'Back', exact: true }).click();
        await capture('porting-packages');
      }
      if (name === 'milling-details') {
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await page.getByRole('button', { name: 'Add build to cart', exact: true }).click();
      }
    }
    await expect(page).toHaveURL(/\/cart$/);
    await capture('cart');
    await page.getByRole('link', { name: 'Checkout', exact: true }).click();
    await capture('checkout-customer');
    await checkoutContact(page);
    await capture('checkout-address');
    await checkoutAddress(page);
    await capture('checkout-review');
    for (const checkbox of await page.locator('.order-acknowledgements input').all())
      await checkbox.check();
    await page.getByRole('button', { name: 'Place test order', exact: true }).click();
    await expect(page).toHaveURL(/\/confirmation$/);
    await capture('confirmation');
    for (const [route, name] of [
      ['/custom-inquiry', 'custom-inquiry'],
      ['/about', 'about'],
      ['/slide-milling', 'service-page'],
    ]) {
      await page.goto(route);
      await capture(name);
    }
    await writeFile(`${dir}/results-${width}.json`, JSON.stringify(results, null, 2) + '\n');
  });
