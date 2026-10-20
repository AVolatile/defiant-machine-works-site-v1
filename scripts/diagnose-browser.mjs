import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 375, height: 812 } });
await p.goto('http://127.0.0.1:3000');
console.log(
  await p.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .map((e) => ({
        tag: e.tagName,
        cls: e.className,
        text: e.textContent?.slice(0, 45),
        left: e.getBoundingClientRect().left,
        right: e.getBoundingClientRect().right,
      }))
      .filter((e) => e.right > 376 || e.left < 0)
      .slice(0, 30),
  ),
);
await p.screenshot({ path: '/tmp/dmw-mobile-viewport.png' });
await p.setViewportSize({ width: 1440, height: 900 });
await p.reload();
await p.screenshot({ path: '/tmp/dmw-desktop-viewport.png' });
await b.close();
