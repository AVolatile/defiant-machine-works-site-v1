import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch();
const routes = [
  '/',
  '/services',
  '/stippling',
  '/slide-milling',
  '/cerakote',
  '/porting',
  '/gallery',
  '/products',
  '/products/pistol-cerakote',
  '/customize',
  '/resources',
  '/blog/unlocking-the-power-of-cerakote-what-is-cerakote-and-why-you-should-choose-it',
  '/about',
  '/contact',
  '/shipping',
  '/warranty',
  '/faq',
  '/blog',
  '/privacy',
  '/terms',
  '/cookies',
  '/accessibility',
  '/resources/stippling-guide',
];
await mkdir('tests/visual/screenshots', { recursive: true });
const results = [];
for (const width of [375, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: width === 375 ? 812 : 900 } });
  for (const route of routes) {
    await page.goto(base + route);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      const images = [...document.images];
      images.forEach((i) => (i.loading = 'eager'));
      await Promise.all(images.map((i) => i.decode().catch(() => {})));
    });
    const info = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      brokenImages: [...document.images]
        .filter((i) => i.complete && i.naturalWidth === 0)
        .map((i) => i.src),
      fonts: [...document.fonts].map((f) => ({ name: f.family, status: f.status })),
    }));
    const file = `tests/visual/screenshots/${width}-${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}.png`;
    await page.screenshot({
      path: file,
      fullPage: ['/', '/services', '/cerakote', '/contact', '/customize', '/porting'].includes(
        route,
      ),
    });
    results.push({ width, route, file, ...info });
  }
  await page.close();
}
const page = await browser.newPage({ viewport: { width: 320, height: 812 } });
for (const route of routes) {
  await page.goto(base + route);
  results.push({
    width: 320,
    route,
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  });
}
await writeFile('tests/visual/results.json', JSON.stringify(results, null, 2));
await browser.close();
console.log(
  'Visual captures',
  results.length,
  'Overflow',
  results.filter((r) => r.overflow),
);

if (
  results.some(
    (r) => r.overflow || r.brokenImages?.length || r.fonts?.some((f) => f.status !== 'loaded'),
  )
)
  throw Error('Visual QA found overflow, broken imagery or unloaded fonts.');
