import { test, expect, type Page } from '@playwright/test';
import { configuredBuild, seedCart } from './commerce-fixtures';

declare global {
  interface Window {
    configuratorScrollTrace?: { positions: number[]; frame: number };
  }
}

async function expectStepAnchor(page: Page, title: string) {
  const heading = page.locator('.configuration-panel > h2');
  await expect(heading).toHaveText(title);
  await expect(heading).toBeFocused();
  await expect
    .poll(() =>
      page.locator('.configuration-panel').evaluate((panel) => {
        const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
        return Math.abs(panel.getBoundingClientRect().top - offset);
      }),
    )
    .toBeLessThan(2);
  const geometry = await heading.evaluate((node) => ({
    headingTop: node.getBoundingClientRect().top,
    headerBottom: document.querySelector('.site-header')!.getBoundingClientRect().bottom,
    scrollY: window.scrollY,
    behavior: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  expect(geometry.headingTop).toBeGreaterThan(geometry.headerBottom);
  expect(geometry.scrollY).toBeGreaterThan(0);
  return geometry;
}

async function navigate(
  page: Page,
  direction: 'Continue' | 'Back',
  title: string,
  keyboard: boolean,
) {
  const button = page.getByRole('button', { name: direction, exact: true });
  await button.scrollIntoViewIfNeeded();
  if (keyboard) await button.focus();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.evaluate(() => {
    const trace = { positions: [window.scrollY], frame: 0 };
    window.configuratorScrollTrace = trace;
    function sample() {
      trace.positions.push(window.scrollY);
      trace.frame = requestAnimationFrame(sample);
    }
    trace.frame = requestAnimationFrame(sample);
  });
  if (keyboard) await page.keyboard.press(direction === 'Continue' ? 'Enter' : 'Space');
  else await button.click();
  const geometry = await expectStepAnchor(page, title);
  const positions = await page.evaluate(() => {
    const trace = window.configuratorScrollTrace!;
    cancelAnimationFrame(trace.frame);
    delete window.configuratorScrollTrace;
    return trace.positions;
  });
  expect(Math.min(...positions)).toBeGreaterThan(0);
  // Tab moves naturally from the focused stage heading into this stage's controls.
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('.configuration-panel'))).toBe(
    true,
  );
  return geometry;
}

for (const width of [390, 1440])
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test.describe(`${width}px / motion ${reducedMotion}`, () => {
      test.use({ viewport: { width, height: 900 }, reducedMotion });

      test('standalone Cerakote Next and Back stay within the configurator', async ({ page }) => {
        await page.goto('/customize?product=slide-only-cerakote');
        await expect(page.getByRole('radio', { name: 'Slide Only', exact: true })).toBeChecked();
        const geometry = await navigate(page, 'Continue', 'Choose your finish.', false);
        expect(geometry.behavior).toBe(reducedMotion === 'reduce' ? 'auto' : 'smooth');
        await page.getByLabel('Coating Type', { exact: false }).selectOption('1');
        await page.locator('#slide-only-cerakote-field_2 input[value="33"]').check();
        await navigate(page, 'Continue', 'Review your coating.', true);
        await navigate(page, 'Back', 'Choose your finish.', true);
        await expect(page.locator('#slide-only-cerakote-field_2 input[value="33"]')).toBeChecked();
        await navigate(page, 'Back', 'What are we coating?', false);
        await expect(page.getByRole('radio', { name: 'Slide Only', exact: true })).toBeChecked();
      });

      test('existing platform-based flow anchors every forward and backward stage', async ({
        page,
      }) => {
        await seedCart(page, [configuredBuild('fn-reflex-stippling-package')]);
        await page.getByRole('link', { name: 'Edit build', exact: true }).click();
        await expect(page.locator('.configuration-panel > h2')).toHaveText('Choose your platform.');
        await navigate(page, 'Continue', 'Choose the work.', true);
        await navigate(page, 'Continue', 'Make it your own.', false);
        await navigate(page, 'Continue', 'Review your build.', true);
        await navigate(page, 'Back', 'Make it your own.', false);
        await navigate(page, 'Back', 'Choose the work.', true);
        await navigate(page, 'Back', 'Choose your platform.', false);
        await expect(page.getByLabel('Model', { exact: true })).toHaveValue('fn-reflex');
      });
    });
  }
