import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const route of [
  '/',
  '/stippling',
  '/gallery',
  '/products/pistol-cerakote',
  '/customize',
  '/custom-inquiry',
  '/cart',
  '/checkout',
  '/contact',
])
  test(`WCAG 2.2 AA automated audit: ${route}`, async ({ page }) => {
    await page.goto(route);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });
test('mobile menu and gallery modal accessibility', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.goto('/gallery');
  await page.locator('.gallery-tile').first().click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
