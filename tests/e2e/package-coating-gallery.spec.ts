import { test, expect, type Page } from '@playwright/test';
import { serviceById } from '../../src/lib/commerce/catalog';
import { galleryReferenceHref } from '../../src/lib/gallery';
import { configuredBuild, configureInBrowser, setOption } from './commerce-fixtures';

const cerakoteHref = galleryReferenceHref('cerakote');
const reference = (page: Page) =>
  page.locator(`.configuration-panel a.gallery-reference[href="${cerakoteHref}"]`);

async function selectedState(page: Page) {
  return page.locator('.configuration-panel').evaluate((panel) => ({
    text: panel.textContent,
    fields: Array.from(panel.querySelectorAll('input,select')).map((node) => {
      const input = node as HTMLInputElement;
      return { id: input.id, value: input.value, checked: input.checked };
    }),
    cart: localStorage.getItem('dmw-cart-v3'),
  }));
}

for (const width of [390, 1440])
  test(`package-owned coating: Milling finish reference preserves state and keyboard focus at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const build = configuredBuild();
    const id = build.services[0].serviceId;
    const source = serviceById.get(id)!;
    build.firearm.modelId = 'glock-17';
    setOption(build, id, 'optic', 'C SERIES');
    setOption(build, id, 'coating', 'Camo');
    setOption(build, id, 'camo', 'Midnight Chocolate Chip');
    await configureInBrowser(page, build, false);
    await expect(page.locator('.review-service')).toContainText('$285.00');
    await page.getByRole('button', { name: 'Back', exact: true }).click();

    const coating = source.fields.find((field) => field.role === 'coating')!;
    const finish = source.fields.find((field) => field.role === 'camo')!;
    const link = reference(page);
    const milling = page.locator(`.service-options a[href="${galleryReferenceHref('milling')}"]`);
    await expect(link).toHaveCount(1);
    await expect(milling).toHaveCount(1);
    await expect(milling).toContainText('See milling examples in the Gallery');
    await expect(link).toHaveAccessibleName(
      'See Cerakote examples in the Gallery (opens in a new tab)',
    );
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('class', (await milling.getAttribute('class'))!);
    expect(
      await page
        .locator(`#${id}-${finish.id}`)
        .evaluate((field) => field.previousElementSibling?.getAttribute('href')),
    ).toBe(cerakoteHref);
    await expect(page.locator('.option-card a')).toHaveCount(0);

    const before = await selectedState(page);
    const url = page.url();
    await page.locator(`select[id="${id}-${coating.id}"]`).focus();
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    const opened = page.waitForEvent('popup');
    await page.keyboard.press('Enter');
    const popup = await opened;
    await expect(popup).toHaveURL(new RegExp('/gallery\\?service=Cerakote$'));
    await expect(popup.getByRole('button', { name: 'Cerakote', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await popup.close();
    await page.bringToFront();
    expect(page.url()).toBe(url);
    expect(await selectedState(page)).toEqual(before);
    await expect(link).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator('.configuration-panel > h2').focus();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await info.attach(`package-cerakote-${width}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    await page.goto('/customize?product=slide-only-cerakote');
    await expect(reference(page)).toHaveCount(1);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(reference(page)).toHaveCount(1);
    await page.getByLabel('Coating Type', { exact: false }).selectOption('3');
    await expect(reference(page)).toHaveCount(1);
    await expect(page.locator('.option-card a')).toHaveCount(0);
  });

test('package-owned coating: optional frame finish reference follows active choices without duplicates', async ({
  page,
}) => {
  const build = configuredBuild('glock-core-lvl-stippling-package');
  await configureInBrowser(page, build, false);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(reference(page)).toHaveCount(0);
  const source = serviceById.get(build.services[0].serviceId)!;
  const coating = source.fields.find((field) => field.role === 'coating')!;
  const control = page.locator(`select[id="${source.serviceId}-${coating.id}"]`);
  for (const option of coating.options.filter((option) =>
    ['single', 'battleworn', 'camo'].includes(option.coatingId || ''),
  )) {
    await control.selectOption(option.id);
    await expect(reference(page)).toHaveCount(1);
    await expect(page.locator('.option-card a')).toHaveCount(0);
  }
  await control.selectOption(coating.options.find((option) => option.coatingId === 'none')!.id);
  await expect(reference(page)).toHaveCount(0);
});

test('package-owned coating: Porting retains one finish reference across one/two-color and camo choices', async ({
  page,
}) => {
  const build = configuredBuild('bodyguard-2-0-viper-ports');
  await configureInBrowser(page, build, false);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  const source = serviceById.get(build.services[0].serviceId)!;
  const coating = source.fields.find((field) => field.role === 'coating')!;
  for (const option of coating.options.filter((option) =>
    ['single', 'battleworn', 'camo'].includes(option.coatingId || ''),
  )) {
    await page.locator(`select[id="${source.serviceId}-${coating.id}"]`).selectOption(option.id);
    await expect(reference(page)).toHaveCount(1);
    await expect(page.locator('.option-card a')).toHaveCount(0);
  }
});
