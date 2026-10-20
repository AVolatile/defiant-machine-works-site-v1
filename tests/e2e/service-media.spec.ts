import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
import { gallery } from '../../src/data/catalog';
import { galleryReferenceHref } from '../../src/lib/gallery';

for (const width of [390, 1440])
  for (const [slug, family, label] of [
    ['stippling', 'stippling', 'Stippling'],
    ['slide-milling', 'milling', 'Slide Milling'],
    ['porting', 'porting', 'Porting'],
  ] as const)
    for (const view of ['service', 'gallery'])
      test(`${label} ${view} media at ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const expected = gallery.filter((item) => item.service === label);
        const url = view === 'service' ? `/${slug}` : galleryReferenceHref(family);
        await page.goto(url);
        if (view === 'service') {
          await expect(page.locator('.gallery-tile')).toHaveCount(
            expected.filter((item) => item.servicePageExample).length,
          );
          await expect(
            page.getByRole('link', { name: 'More work in the Gallery' }),
          ).toHaveAttribute('href', galleryReferenceHref(family));
        } else {
          await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute(
            'aria-pressed',
            'true',
          );
          await expect(page.locator('.gallery-tile')).toHaveCount(expected.length);
          expect(await page.locator('.gallery-tile strong').allTextContents()).toEqual(
            expected.map((item) => item.title),
          );
        }
        const failures: string[] = [];
        // Scroll through lazy images so the check covers the entire page, not just its first screen.
        for (const image of await page.locator('main img').all()) {
          await image.scrollIntoViewIfNeeded();
          await expect(image).toHaveJSProperty('complete', true);
          if ((await image.evaluate((image: HTMLImageElement) => image.naturalWidth)) === 0)
            failures.push((await image.getAttribute('src')) || 'missing source');
        }
        expect(failures).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        if (family === 'porting') {
          const upcoming = page.locator('.gallery-tile').filter({ hasText: 'Coming soon' });
          await expect(upcoming).toHaveCount(view === 'service' ? 2 : 8);
          await expect(upcoming.first()).toContainText('Reference only');
          await upcoming.first().click();
          await expect(page.locator('dialog')).toContainText('not available to order');
          await expect(page.locator('dialog a')).toHaveAttribute('href', /\/custom-inquiry\?/);
          await page.keyboard.press('Escape');
          await expect(upcoming.first()).toBeFocused();
        }
        await page.locator('h1').focus();
        await page.evaluate(() => {
          (document.activeElement as HTMLElement)?.blur();
          window.scrollTo({ top: 0, behavior: 'instant' });
        });
        mkdirSync('source-audit/pass-06c/screens', { recursive: true });
        await page.screenshot({
          path: `source-audit/pass-06c/screens/${slug}-${view}-${width}.jpg`,
          quality: 80,
          fullPage: true,
        });
        expect(
          (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze())
            .violations,
        ).toEqual([]);
      });

test('service Gallery lightbox preserves keyboard navigation, focus and combined query filtering', async ({
  page,
}) => {
  await page.goto('/gallery?service=Slide+Milling&finish=Genesis');
  await expect(page.locator('.gallery-tile')).toHaveCount(2);
  const first = page.locator('.gallery-tile').first();
  await first.click();
  const title = await page.locator('#lightbox-title').textContent();
  await page.keyboard.press('ArrowRight');
  expect(await page.locator('#lightbox-title').textContent()).not.toBe(title);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#lightbox-title')).toHaveText(title!);
  await page.keyboard.press('Escape');
  await expect(first).toBeFocused();
});
