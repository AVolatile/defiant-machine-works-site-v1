import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { configuredBuild, configureInBrowser, setOption } from '../e2e/commerce-fixtures';
import { galleryReferenceHref, type GalleryFamily } from '../../src/lib/gallery';
const dir = 'tests/visual/pass-05';
for (const width of [390, 1440])
  test(`Pass 05 text configurator and filtered Gallery visual review at ${width}`, async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    await mkdir(dir, { recursive: true });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const results: unknown[] = [];
    async function capture(name: string) {
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        scrollTo({ top: 0, behavior: 'instant' });
      });
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
    const pairs: [GalleryFamily, string][] = [
      ['stippling', 'glock-core-lvl-stippling-package'],
      ['milling', 'glock-optic-cut-full-size'],
      ['cerakote', 'slide-only-cerakote'],
      ['porting', 'bodyguard-2-0-viper-ports'],
    ];
    for (const [family, id] of pairs) {
      const b = configuredBuild(id);
      if (family === 'stippling') setOption(b, id, 'texture', 'Kevlar');
      await configureInBrowser(page, b, false);
      if (family === 'stippling') await capture('build-review');
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await capture(`${family}-details`);
      if (family === 'stippling') {
        await page.getByRole('button', { name: 'Back', exact: true }).click();
        await capture('configurator-services');
      }
      await page.goto(galleryReferenceHref(family));
      await capture(`gallery-${family}`);
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      await info.attach(`pass05-axe-gallery-${family}-${width}`, {
        body: JSON.stringify({ label: `gallery-${family}-${width}`, violations: axe.violations }),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
    }
    await writeFile(`${dir}/results-${width}.json`, JSON.stringify(results, null, 2) + '\n');
  });
