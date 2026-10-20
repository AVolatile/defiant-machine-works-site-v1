import { randomUUID } from 'node:crypto';
import { expect, type Page } from '@playwright/test';
import { catalogVersion, platforms, serviceById } from '../../src/lib/commerce/catalog';
import { activeSourceFields, sourceSelections } from '../../src/lib/commerce/service-configuration';
import type { BuildConfiguration, CartItem } from '../../src/lib/commerce/schema';
export function configuredBuild(serviceId = 'glock-optic-cut-full-size'): BuildConfiguration {
  const service = serviceById.get(serviceId)!;
  const manufacturerId = service.compatibleManufacturers[0],
    platform = platforms.find((p) => p.id === manufacturerId)!;
  const modelId = service.compatibleModels[0] || platform.models[0].id,
    variantId = service.compatibleVariants[0] || platform.variants[0].id;
  const build: BuildConfiguration = {
    schemaVersion: 3,
    id: randomUUID(),
    firearm: {
      manufacturerId,
      modelId,
      variantId,
      generationId: 'unspecified',
      componentType: service.componentScope,
    },
    services: [{ serviceId, optionIds: [], attributes: {} }],
    createdAt: new Date().toISOString(),
  };
  const choice = build.services[0];
  for (let pass = 0; pass < 5; pass++) {
    choice.attributes = sourceSelections(choice, build);
    for (const field of activeSourceFields(serviceId, choice.attributes)) {
      if (!choice.attributes[field.id]) {
        const option =
          field.options.find((o) => o.neutral && o.deltaCents === 0) ||
          field.options.find((o) => o.deltaCents === 0 && o.existingCut === null) ||
          field.options[0];
        choice.attributes[field.id] = option.id;
      }
    }
  }
  return build;
}
export function confirmedBuild() {
  const build = configuredBuild();
  build.firearm.modelId = 'glock-19';
  return build;
}
export function setOption(
  build: BuildConfiguration,
  serviceId: string,
  role: string,
  label: string,
) {
  const service = serviceById.get(serviceId)!;
  const field = service.fields.find(
    (f) => f.role === role && f.options.some((o) => o.displayName === label),
  )!;
  const option = field.options.find((o) => o.displayName === label)!;
  build.services.find((s) => s.serviceId === serviceId)!.attributes[field.id] = option.id;
  return build;
}
export async function seedCart(
  page: Page,
  builds = [confirmedBuild()],
  extra: CartItem[] = [],
  options: { version?: string; needsReview?: boolean } = {},
) {
  await page.goto('/cart');
  const items: CartItem[] = [
    ...builds.map((build) => ({ kind: 'build' as const, id: build.id, build })),
    ...extra,
  ];
  await page.evaluate(
    ({ items, version, needsReview }) => {
      localStorage.removeItem('dmw-cart-v2');
      localStorage.setItem(
        'dmw-cart-v3',
        JSON.stringify({
          schemaVersion: 3,
          catalogVersion: version,
          items,
          needsReview,
          acceptedSubtotalCents: null,
        }),
      );
    },
    { items, version: options.version || catalogVersion, needsReview: !!options.needsReview },
  );
  await page.reload();
  await expect(page.locator('.cart-item')).toHaveCount(items.length);
}
export async function fillDetails(page: Page, build: BuildConfiguration) {
  for (const choice of build.services) {
    const service = serviceById.get(choice.serviceId)!;
    const tabs = page.locator('.service-detail-tabs');
    await tabs.getByRole('button', { name: service.displayName, exact: true }).click();
    for (let pass = 0; pass < 3; pass++)
      for (const field of activeSourceFields(choice.serviceId, sourceSelections(choice, build))) {
        if (field.role === 'model') continue;
        const id = `${choice.serviceId}-${field.id}`,
          value = choice.attributes[field.id];
        if (!value) continue;
        if (['texture', 'finish', 'finish-secondary', 'camo'].includes(field.role)) {
          const group = page.locator(`#${id}`),
            option = field.options.find((o) => o.id === value)!;
          const input = group.locator(`input[type=radio][value="${value}"]`);
          if (!(await input.count())) {
            const search = group.getByRole('searchbox');
            if (await search.count()) await search.fill(option.displayName);
            else await group.getByRole('button', { name: /Show all/ }).click();
          }
          await input.check();
        } else {
          const select = page.locator(`select[id="${id}"]`);
          if (await select.count()) await select.selectOption(value);
        }
      }
  }
}
export async function configureInBrowser(page: Page, build: BuildConfiguration, save = true) {
  await page.goto('/customize');
  await page.getByLabel('Manufacturer', { exact: true }).selectOption(build.firearm.manufacturerId);
  await page.getByLabel('Model', { exact: true }).selectOption(build.firearm.modelId);
  await page
    .getByLabel('Variant / existing work', { exact: true })
    .selectOption(build.firearm.variantId);
  await page
    .getByLabel('Component being sent', { exact: true })
    .selectOption(build.firearm.componentType);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  for (const choice of build.services) {
    const service = serviceById.get(choice.serviceId)!;
    const family = page
      .locator('.service-family')
      .filter({ has: page.locator(`input[aria-label="${service.displayName}"]`) });
    await family.locator('summary').first().click();
    await page.getByRole('checkbox', { name: service.displayName, exact: true }).check();
  }
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await fillDetails(page, build);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.configuration-panel')).toContainText('Ready for checkout');
  if (save) {
    await page.getByRole('button', { name: 'Add build to cart', exact: true }).click();
    await expect(page).toHaveURL(/\/cart$/);
  }
}
export async function addConfirmedBuild(page: Page) {
  await configureInBrowser(page, confirmedBuild());
}
export async function checkoutContact(page: Page) {
  for (const [label, value] of [
    ['First name', 'Demo'],
    ['Last name', 'Customer'],
    ['Email', 'demo@example.com'],
    ['Phone', '2025550123'],
  ])
    await page.getByRole('textbox', { name: label, exact: true }).fill(value);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}
export async function checkoutAddress(page: Page) {
  const billing = page.getByRole('group', { name: 'Billing address', exact: true });
  await billing.getByLabel('Street address', { exact: true }).fill('123 Example Street');
  await billing.getByLabel('City', { exact: true }).fill('Example City');
  await billing.getByLabel('State', { exact: true }).selectOption('TN');
  await billing.getByLabel('ZIP code', { exact: true }).fill('37040');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}
