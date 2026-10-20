import { test, expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { serviceMatrix, serviceById } from '../../src/lib/commerce/catalog';
import {
  galleryReferenceHref,
  galleryServiceLabels,
  type GalleryFamily,
} from '../../src/lib/gallery';
import { gallery } from '../../src/data/catalog';
import { configuredBuild, configureInBrowser, setOption } from './commerce-fixtures';
const cases: [GalleryFamily, string][] = [
  ['stippling', 'glock-core-lvl-stippling-package'],
  ['milling', 'glock-optic-cut-full-size'],
  ['cerakote', 'slide-only-cerakote'],
  ['porting', 'bodyguard-2-0-viper-ports'],
];
const imagePaths = new Set(
  serviceMatrix.services.flatMap((s) => [
    ...s.visualReferences.map((r) => r.image),
    ...s.fields.flatMap((f) => f.options.flatMap((o) => (o.reference ? [o.reference.image] : []))),
  ]),
);
function sourceImage(url: string) {
  const u = new URL(url);
  return u.pathname === '/_next/image' ? u.searchParams.get('url') || '' : u.pathname;
}
async function state(page: Page) {
  return page.locator('.configuration-panel').evaluate((el) => ({
    text: el.textContent,
    controls: Array.from(el.querySelectorAll('input,select')).map((node) => {
      const input = node as HTMLInputElement;
      return { id: input.id, name: input.name, value: input.value, checked: input.checked };
    }),
    storage: localStorage.getItem('dmw-cart-v3'),
  }));
}
export async function pass05Axe(page: Page, info: TestInfo, label: string) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  await info.attach('pass05-axe-' + label, {
    body: JSON.stringify({ label, violations: result.violations }),
    contentType: 'application/json',
  });
  expect(result.violations).toEqual([]);
}
for (const width of [390, 1440])
  for (const [family, id] of cases)
    test(`text choices and one state-preserving ${family} Gallery escape at ${width}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 900 });
      const requests: string[] = [];
      page.on('request', (r) => {
        if (imagePaths.has(sourceImage(r.url()))) requests.push(r.url());
      });
      const build = configuredBuild(id);
      if (family === 'stippling') setOption(build, id, 'texture', 'Kevlar');
      await configureInBrowser(page, build, false);
      await expect(page.locator('.configuration-panel img,.commerce-summary img')).toHaveCount(0);
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      const section = page.locator('.service-options'),
        link = section.locator('a.gallery-reference');
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute('href', galleryReferenceHref(family));
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(section.locator('.option-card a')).toHaveCount(0);
      await expect(section.locator('img,picture,video')).toHaveCount(0);
      const before = await state(page),
        originalUrl = page.url();
      const popupPromise = page.waitForEvent('popup');
      await link.click();
      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded');
      await expect(popup.locator('.filter-bar button[aria-pressed=true]')).toHaveText(
        galleryServiceLabels[family],
      );
      const items = gallery.filter((i) => i.service === galleryServiceLabels[family]);
      await expect(popup.locator('.gallery-tile')).toHaveCount(items.length);
      await expect(popup.locator('.gallery-caption small')).toHaveText(items.map((i) => i.service));
      await expect(popup.locator('.gallery-tile img').first()).toBeVisible();
      expect(page.url()).toBe(originalUrl);
      await popup.close();
      await page.bringToFront();
      expect(await state(page)).toEqual(before);
      await pass05Axe(page, info, `${family}-${width}`);
      const preloads = await page
        .locator('link[rel="preload"][as="image"]')
        .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
      expect(preloads.filter((href) => imagePaths.has(sourceImage(href)))).toEqual([]);
      await info.attach('pass05-wizard-images', {
        body: JSON.stringify({
          family,
          width,
          imageRequests: requests,
          optionImagePreloads: preloads.filter((href) => imagePaths.has(sourceImage(href))),
        }),
        contentType: 'application/json',
      });
      expect(requests).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      const selectedFamily = page
        .locator('.service-family')
        .filter({ has: page.locator(`input[aria-label="${serviceById.get(id)!.displayName}"]`) });
      await expect(selectedFamily.locator('a.gallery-reference')).toHaveCount(1);
      await expect(selectedFamily.locator('img')).toHaveCount(0);
      await expect(
        selectedFamily.getByRole('checkbox', {
          name: serviceById.get(id)!.displayName,
          exact: true,
        }),
      ).toBeChecked();
    });
for (const width of [375, 430])
  test(`compact text radios, keyboard, errors and image-free choices at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 844 });
    const b = configuredBuild('glock-core-lvl-stippling-package');
    setOption(b, b.services[0].serviceId, 'texture', 'Kevlar');
    await configureInBrowser(page, b, false);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.locator('.configuration-panel h2')).toBeFocused();
    const radio = page.getByRole('radio', { name: 'Kevlar / included', exact: true });
    await page.bringToFront();
    await radio.focus();
    await radio.press('ArrowRight');
    await expect(radio).not.toBeChecked();
    await expect(page.locator('.option-card:has(input:focus-visible)')).toHaveCount(1);
    const sizes = await page.locator('.option-picker .option-card').evaluateAll((els) =>
      els.map((el) => ({
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
      })),
    );
    expect(sizes.every((s) => s.width >= 140 && s.height >= 44 && s.height < 190)).toBe(true);
    await expect(page.locator('.configuration-panel img')).toHaveCount(0);
    await pass05Axe(page, info, 'compact-' + width);
    // A blank required texture is still associated with its field error.
    await page.goto('/customize?product=glock-core-lvl-stippling-package');
    await page.getByLabel('Model', { exact: true }).selectOption('glock-17');
    await page.getByLabel('Variant / existing work').selectOption('uncut');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    const f = serviceById.get(b.services[0].serviceId)!.fields.find((f) => f.role === 'texture')!;
    await expect(page.locator(`#${b.services[0].serviceId}-${f.id}`)).toHaveAttribute(
      'aria-describedby',
      `${b.services[0].serviceId}-${f.id}-error`,
    );
    await expect(page.locator(`#${b.services[0].serviceId}-${f.id}-error`)).toBeVisible();
  });
test('service URL filters compose with the existing finish search and invalid values fall back safely', async ({
  page,
}) => {
  await page.goto('/gallery?service=Cerakote&finish=Midnight');
  await expect(page.getByRole('button', { name: 'Cerakote', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('searchbox')).toHaveValue('Midnight');
  await expect(page.locator('.gallery-tile')).toHaveCount(
    gallery.filter(
      (i) =>
        i.service === 'Cerakote' && `${i.title} ${i.finish}`.toLowerCase().includes('midnight'),
    ).length,
  );
  await page.goto('/gallery?service=unknown');
  await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.gallery-tile')).toHaveCount(gallery.length);
});
test('protected data, rules, checkout, hero and navigation remain unchanged outside documented coating-context changes', () => {
  const baseline = JSON.parse(readFileSync('source-audit/pass-05/preserved-baseline.json', 'utf8'));
  // Pass 06 adds scope-only cosmetic coating context without changing stored shape or prices.
  // Its schema, pricing and summary behavior have dedicated coating-context regressions.
  const coatingContextFiles = new Set([
    'src/lib/commerce/catalog.ts',
    'src/lib/commerce/pricing.ts',
    'src/lib/commerce/schema.ts',
    'src/components/commerce/build-summary.tsx',
  ]);
  for (const [file, hash] of Object.entries(baseline.hashes).filter(
    ([file]) => !coatingContextFiles.has(file),
  ))
    expect(createHash('sha256').update(readFileSync(file)).digest('hex'), file).toBe(hash);
  expect(serviceMatrix.services).toHaveLength(32);
  expect(serviceMatrix.services.reduce((n, s) => n + s.fields.length, 0)).toBe(180);
});
