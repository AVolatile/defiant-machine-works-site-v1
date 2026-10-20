import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const dir = 'tests/visual/pass-02';
await mkdir(dir, { recursive: true });
const results = [];
for (const width of [1728, 1440, 1280, 1024, 768, 430, 390, 375]) {
  const page = await browser.newPage({ viewport: { width, height: width < 650 ? 812 : 900 } });
  await page.goto('http://127.0.0.1:3000');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].slice(0, 2).map((i) => i.decode().catch(() => {})));
  });
  await page.screenshot({ path: `${dir}/hero-${width}.png`, fullPage: false });
  await page.locator('.hero').screenshot({ path: `${dir}/hero-section-${width}.png` });
  results.push({
    width,
    route: '/',
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    diagonalIcons: await page.locator('.icon-diagonal').count(),
  });
  await page.close();
}
const routes = [
  '/about',
  '/resources',
  '/customize',
  '/custom-inquiry',
  '/cart',
  '/checkout',
  '/products/dmw-sticker-pack',
];
for (const width of [375, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: width === 375 ? 812 : 900 } });
  for (const route of routes) {
    await page.goto('http://127.0.0.1:3000' + route);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `${dir}/${width}-${route.slice(1).replaceAll('/', '-')}.png`,
      fullPage: true,
    });
    results.push({
      width,
      route,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      diagonalIcons: await page.locator('.icon-diagonal').count(),
    });
  }
  await page.close();
}
await writeFile(`${dir}/results.json`, JSON.stringify(results, null, 2));
await browser.close();
console.log({ checks: results.length, overflow: results.filter((r) => r.overflow) });
