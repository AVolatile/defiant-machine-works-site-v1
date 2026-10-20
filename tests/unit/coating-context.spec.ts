import { test, expect } from '@playwright/test';
import { buildSchema } from '../../src/lib/commerce/schema';
import { buildTitle, serviceById } from '../../src/lib/commerce/catalog';
import { priceBuild } from '../../src/lib/commerce/pricing';
import {
  hasScopeOnlyCoatingContext,
  standaloneCoatingIds,
} from '../../src/lib/commerce/coating-context';
import { configuredBuild } from '../e2e/commerce-fixtures';

export function coatingBuild(id = 'slide-only-cerakote') {
  const build = configuredBuild(id);
  build.firearm.manufacturerId = '';
  build.firearm.modelId = '';
  build.firearm.variantId = '';
  return build;
}

for (const id of standaloneCoatingIds) {
  test(`${id}: scope-only record uses verified coating fields and canonical price`, () => {
    const build = coatingBuild(id);
    const entry = serviceById.get(id)!;
    expect(entry.serviceFamily).toBe('cerakote');
    expect(entry.compatibleModels).toEqual([]);
    expect(entry.compatibleVariants).toEqual([]);
    expect(
      entry.fields.every((field) =>
        ['coating', 'finish', 'finish-secondary', 'camo'].includes(field.role),
      ),
    ).toBe(true);
    expect(hasScopeOnlyCoatingContext(build)).toBe(true);
    expect(buildSchema.safeParse(build).success).toBe(true);
    const priced = priceBuild(build);
    expect(priced.errors).toEqual([]);
    expect(priced.orderability).toBe('ready');
    expect(priced.estimatedSubtotalCents).toBe(entry.basePriceCents);
    expect(buildTitle(build)).toMatch(/coating$/);
  });
}

test('scope-only exception rejects partial identities, generation claims, add-ons and unknown services', () => {
  const mutations = [
    (build: ReturnType<typeof coatingBuild>) => {
      build.firearm.manufacturerId = 'glock';
    },
    (build: ReturnType<typeof coatingBuild>) => {
      build.firearm.generationId = 'gen-4-or-later';
    },
    (build: ReturnType<typeof coatingBuild>) => {
      build.services[0].optionIds = ['unverified'];
    },
    (build: ReturnType<typeof coatingBuild>) => {
      build.services[0].serviceId = 'unverified';
    },
    (build: ReturnType<typeof coatingBuild>) => {
      build.services.push(structuredClone(build.services[0]));
    },
  ];
  for (const mutate of mutations) {
    const build = coatingBuild();
    mutate(build);
    expect(hasScopeOnlyCoatingContext(build)).toBe(false);
    expect(buildSchema.safeParse(build).success).toBe(false);
    expect(priceBuild(build).errors.length).toBeGreaterThan(0);
  }
});

test('coating still rejects incompatible scope, hidden source fields and invented field names', () => {
  const wrongScope = coatingBuild();
  wrongScope.firearm.componentType = 'frame';
  expect(priceBuild(wrongScope).errors.join(' ')).toContain('not listed');
  const hidden = coatingBuild();
  hidden.services[0].attributes.field_3 = hidden.services[0].attributes.field_2;
  expect(priceBuild(hidden).errors.join(' ')).toContain('not available');
  const unknown = coatingBuild();
  unknown.services[0].attributes['unrelated-service-field'] = 'forged';
  expect(priceBuild(unknown).errors.join(' ')).toContain('options changed');
});

test('existing version-3 platform-specific coating records retain their identity and price', () => {
  const build = configuredBuild('frame-only-cerakote');
  expect(hasScopeOnlyCoatingContext(build)).toBe(false);
  expect(buildSchema.parse(build)).toEqual(build);
  expect(priceBuild(build).errors).toEqual([]);
  expect(buildTitle(build)).not.toContain('coating');
});
