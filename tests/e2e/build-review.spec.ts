import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  componentLabels,
  platformTitle,
  variantLabel,
  serviceById,
  catalogVersion,
} from '../../src/lib/commerce/catalog';
import { priceBuild } from '../../src/lib/commerce/pricing';
import { money } from '../../src/lib/commerce/schema';
import { configuredBuild, configureInBrowser, seedCart, setOption } from './commerce-fixtures';

function reviewBuild(kind: string) {
  const id = kind === 'standalone' ? 'slide-only-cerakote' : 'glock-optic-cut-full-size';
  const build = configuredBuild(id);
  const service = serviceById.get(id)!;
  for (const field of service.fields.filter((field) =>
    ['finish', 'finish-secondary', 'camo'].includes(field.role),
  ))
    delete build.services[0].attributes[field.id];
  setOption(
    build,
    id,
    'coating',
    service.fields
      .find((field) => field.role === 'coating')!
      .options.find((option) => option.coatingId === 'camo')!.displayName,
  );
  setOption(build, id, 'camo', 'Midnight Chocolate Chip');
  if (kind !== 'standalone') {
    build.firearm.modelId = 'glock-17';
    setOption(build, id, 'optic', 'C SERIES');
  }
  if (kind === 'multiple') {
    build.firearm.componentType = 'complete-firearm';
    const stippling = configuredBuild('glock-core-lvl-stippling-package');
    setOption(stippling, stippling.services[0].serviceId, 'texture', 'Kevlar');
    build.services.push(stippling.services[0]);
  }
  return build;
}

for (const width of [390, 1440])
  for (const kind of ['single', 'multiple', 'standalone'])
    test(`build review preserves all details, prices and status: ${kind} at ${width}`, async ({
      page,
      request,
    }, info) => {
      await page.setViewportSize({ width, height: 900 });
      const build = reviewBuild(kind);
      const priced = priceBuild(build);
      expect(priced.errors).toEqual([]);
      expect(priced.orderability).toBe('ready');
      if (kind === 'single') expect(priced.estimatedSubtotalCents).toBe(28500);
      await configureInBrowser(page, build, false);
      const panel = page.locator('.configuration-panel');
      await expect(panel.locator('> h2')).toBeFocused();
      if (kind !== 'standalone') {
        await expect(
          panel.getByRole('heading', { name: platformTitle(build.firearm), exact: true }),
        ).toBeVisible();
        await expect(panel).toContainText(componentLabels[build.firearm.componentType]);
        await expect(panel).toContainText(variantLabel(build.firearm));
      }
      const services = panel.locator('.review-service');
      await expect(services).toHaveCount(priced.services.length);
      for (const [index, service] of priced.services.entries()) {
        const section = services.nth(index);
        await expect(section.getByRole('heading')).toHaveText(service.title);
        const details = section.locator('.configured-details > div');
        await expect(details).toHaveCount(service.details.length);
        for (const [row, detail] of service.details.entries()) {
          await expect(details.nth(row).locator('dt')).toHaveText(detail.label);
          await expect(details.nth(row).locator('dd')).toHaveText(detail.value);
        }
        const prices = section.locator('.service-price-breakdown > div');
        await expect(prices).toHaveCount(service.breakdown.length + 1);
        for (const [row, line] of service.breakdown.entries()) {
          await expect(prices.nth(row).locator('dt')).toHaveText(line.label);
          await expect(prices.nth(row).locator('dd')).toHaveText(
            line.kind === 'included'
              ? 'Included'
              : `${line.kind === 'upgrade' && line.amountCents > 0 ? '+' : ''}${money(line.amountCents)}`,
          );
        }
        await expect(section.locator('.service-price-total dd')).toHaveText(
          money(service.calculatedPriceCents),
        );
      }
      const status = panel.locator('.notice');
      await expect(status.locator('.eyebrow')).toHaveText('Ready for checkout');
      await expect(status.locator('p')).toHaveText(
        kind === 'standalone'
          ? 'Your coating choices and published prices are complete. Continue to the cart.'
          : 'Your required choices and published option prices are complete. Continue to the cart. Live payment remains disabled in this build.',
      );
      const response = await request.post('/api/commerce/quote', {
        data: { items: [{ kind: 'build', id: build.id, build }], catalogVersion },
      });
      expect(response.ok()).toBe(true);
      expect((await response.json()).quote.subtotalCents).toBe(priced.estimatedSubtotalCents);
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
      await panel.locator('> h2').focus();
      await info.attach(`review-${kind}-${width}`, {
        body: await panel.screenshot(),
        contentType: 'image/png',
      });
      // Existing Back/Continue and keyboard focus preserve the complete reviewed state.
      const before = await services.allTextContents();
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await page.getByRole('button', { name: 'Continue', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(panel.locator('> h2')).toBeFocused();
      expect(await services.allTextContents()).toEqual(before);
    });

test('review-required build preserves its source reasons and inquiry action', async ({ page }) => {
  const build = configuredBuild('cz-p-07');
  const priced = priceBuild(build);
  expect(priced.errors).toEqual([]);
  expect(priced.orderability).not.toBe('ready');
  await seedCart(page, [build]);
  await page.getByRole('link', { name: 'Edit build', exact: true }).click();
  for (let step = 0; step < 3; step++)
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const status = page.locator('.configuration-panel .notice');
  await expect(status.locator('.eyebrow')).toHaveText('Configuration review required');
  await expect(status.locator('p')).toHaveText(priced.reviewReasons.join(' '));
  await expect(
    status.getByRole('link', { name: 'Request a configuration review', exact: true }),
  ).toHaveAttribute('href', '/custom-inquiry');
});
