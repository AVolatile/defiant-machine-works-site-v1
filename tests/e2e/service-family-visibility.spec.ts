import { test, expect, type Page } from '@playwright/test';
import type { BuildConfiguration } from '../../src/lib/commerce/schema';
import { configuredBuild, seedCart, fillDetails } from './commerce-fixtures';
import { serviceById } from '../../src/lib/commerce/catalog';

type Component = BuildConfiguration['firearm']['componentType'];
const cases: [Component, string[]][] = [
  ['frame', ['stippling', 'cerakote']],
  ['slide', ['milling']],
  ['slide-and-barrel', ['milling', 'porting']],
  ['complete-firearm', ['stippling', 'milling', 'cerakote', 'porting']],
];

async function services(
  page: Page,
  component: Component,
  manufacturer = 'fn',
  model = 'fn-reflex',
  variant = 'standard',
) {
  await page.goto('/customize');
  await page.getByLabel('Manufacturer', { exact: true }).selectOption(manufacturer);
  await page.getByLabel('Model', { exact: true }).selectOption(model);
  await page.getByLabel('Variant / existing work', { exact: true }).selectOption(variant);
  await page.getByLabel('Component being sent', { exact: true }).selectOption(component);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.configuration-panel > h2')).toHaveText('Choose the work.');
}

async function selectPackage(page: Page, family: string, name: string) {
  const group = page.locator(`.service-family[data-service-family="${family}"]`);
  await group.locator(':scope > summary').click();
  await group.getByRole('checkbox', { name, exact: true }).check();
}

async function onlyFields(page: Page, serviceId: string) {
  await expect(page.locator('.service-detail-tabs button')).toHaveCount(1);
  const ids = await page
    .locator('.service-options select,.service-options .option-picker')
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(ids.length).toBeGreaterThan(0);
  expect(ids.every((id) => id.startsWith(serviceId + '-'))).toBe(true);
}

for (const width of [390, 1440])
  for (const [component, families] of cases)
    test(`${component} family visibility at ${width}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await services(page, component, 'sw', 'sw-bodyguard20', 'uncut');
      expect(
        await page
          .locator('.service-family')
          .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.serviceFamily)),
      ).toEqual(families);
      if (component === 'slide-and-barrel' || component === 'slide')
        await expect(page.getByRole('checkbox', { name: /stippling/i })).toHaveCount(0);
      if (component === 'slide-and-barrel' || component === 'slide')
        await expect(page.locator('.service-family[data-service-family="cerakote"]')).toHaveCount(
          0,
        );
      // Open the family states to review both package choices and inquiry-only explanations.
      await page
        .locator('.service-family')
        .evaluateAll((nodes) =>
          nodes.forEach((node) => ((node as HTMLDetailsElement).open = true)),
        );
      await page.locator('.configuration-panel > h2').focus();
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (component === 'slide' || component === 'slide-and-barrel')
        await info.attach(`package-coating-${component}-${width}`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        });
      await expect(page.locator('.service-options')).toHaveCount(0);
    });

test('families with no current package offer inquiry without a selectable substitute', async ({
  page,
}) => {
  await services(page, 'complete-firearm');
  for (const family of ['milling', 'porting']) {
    const group = page.locator(`.service-family[data-service-family="${family}"]`);
    await group.locator(':scope > summary').click();
    await expect(group.getByRole('checkbox')).toHaveCount(0);
    await expect(group).toContainText('No listed package');
    await expect(group.getByRole('link', { name: 'Ask about this work' })).toHaveAttribute(
      'href',
      '/custom-inquiry',
    );
  }
});

test('complete-firearm Stippling-only edit retains its selection without unrelated question groups', async ({
  page,
}) => {
  const build = configuredBuild('fn-reflex-stippling-package');
  build.firearm.componentType = 'complete-firearm';
  await seedCart(page, [build]);
  await page.getByRole('link', { name: 'Edit build', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'FN Reflex Stippling Package', exact: true }),
  ).toBeChecked();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await onlyFields(page, build.services[0].serviceId);
  await expect(page.locator('.service-options')).not.toContainText('BUIS');
  await expect(page.locator('.service-options')).not.toContainText('Optic Cut');
});

for (const [component, name, id] of [
  ['complete-firearm', 'Pistol Cerakote', 'pistol-cerakote'],
  ['frame', 'Frame Only Cerakote', 'frame-only-cerakote'],
] as const)
  test(`${component} Cerakote-only details contain coating questions only`, async ({ page }) => {
    await services(page, component);
    await selectPackage(page, 'cerakote', name);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await onlyFields(page, id);
    await expect(page.getByLabel('Coating Type', { exact: false })).toBeVisible();
    await expect(page.locator('.service-options')).not.toContainText('BUIS');
    await expect(page.locator('.service-options')).not.toContainText('Texture');
  });

for (const width of [390, 1440])
  test(`milling keeps its source coating controls inside the package at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await services(page, 'slide', 'glock', 'glock-17', 'uncut');
    await expect(page.locator('.service-options')).toHaveCount(0);
    await selectPackage(page, 'milling', 'GLOCK Optic Cut – Full Size');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await onlyFields(page, 'glock-optic-cut-full-size');
    await expect(page.locator('.service-options')).toContainText('Optic');
    await expect(page.locator('.service-options')).not.toContainText('Texture');
    const build = configuredBuild('glock-optic-cut-full-size');
    build.firearm.modelId = 'glock-17';
    await fillDetails(page, build);
    const source = serviceById.get(build.services[0].serviceId)!;
    const coating = source.fields.find((field) => field.role === 'coating')!;
    const finish = source.fields.find((field) => field.role === 'finish')!;
    await expect(page.locator(`select[id="${source.serviceId}-${coating.id}"]`)).toHaveValue(
      build.services[0].attributes[coating.id],
    );
    await expect(page.locator(`#${source.serviceId}-${finish.id}`)).toBeVisible();
    await expect(page.locator('.service-detail-tabs button')).toHaveCount(1);
    await page.locator('.configuration-panel > h2').focus();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await info.attach(`package-coating-milling-details-${width}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

test('complete project hides standalone coating only while a selected package owns it', async ({
  page,
}) => {
  await services(page, 'complete-firearm', 'glock', 'glock-17', 'uncut');
  const separate = page.locator('.service-family[data-service-family="cerakote"]');
  await expect(separate).toHaveCount(1);
  await selectPackage(page, 'milling', 'GLOCK Optic Cut – Full Size');
  await expect(separate).toHaveCount(0);
  await expect(page.locator('.service-family')).toHaveCount(3);
  await page.getByRole('checkbox', { name: 'GLOCK Optic Cut – Full Size', exact: true }).uncheck();
  await expect(separate).toHaveCount(1);
});

test('Porting uses existing supported package state; Coming Soon remains disabled', async ({
  page,
}) => {
  await services(page, 'slide-and-barrel', 'sw', 'sw-bodyguard20', 'uncut');
  const group = page.locator('.service-family[data-service-family="porting"]');
  await expect(group.locator('.service-package input')).toHaveCount(1);
  await selectPackage(page, 'porting', 'Bodyguard 2.0 Viper Ports');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await onlyFields(page, 'bodyguard-2-0-viper-ports');
  await expect(page.locator('.service-options')).not.toContainText('BUIS');
  await services(page, 'slide-and-barrel', 'sw', 'sw-bodyguard20', 'carry-comp');
  await expect(group.locator('.service-package input')).toHaveCount(0);
  await group.locator(':scope > summary').click();
  await group.locator('.upcoming-config > summary').click();
  await expect(group.locator('.unavailable-package input')).toBeDisabled();
});
