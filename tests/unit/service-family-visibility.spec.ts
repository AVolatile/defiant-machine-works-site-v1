import { test, expect } from '@playwright/test';
import { eligibleService, platforms, serviceCatalog } from '../../src/lib/commerce/catalog';
import {
  componentServiceFamilies,
  visibleServiceFamilyGroups,
} from '../../src/lib/commerce/service-family-visibility';
import type { BuildConfiguration } from '../../src/lib/commerce/schema';

const cases = [
  ['frame', ['stippling', 'cerakote']],
  ['slide', ['milling', 'cerakote']],
  ['slide-and-barrel', ['milling', 'cerakote', 'porting']],
  ['complete-firearm', ['stippling', 'milling', 'cerakote', 'porting']],
  ['extension', ['stippling']],
] as const;

for (const [component, families] of cases)
  test(`${component}: visible families follow canonical component scopes`, () => {
    expect(componentServiceFamilies(component)).toEqual(families);
  });

test('every displayed package still matches the unchanged canonical eligibility predicate', () => {
  for (const platform of platforms)
    for (const model of platform.models)
      for (const variant of platform.variants)
        for (const [componentType] of cases) {
          const firearm: BuildConfiguration['firearm'] = {
            manufacturerId: platform.id,
            modelId: model.id,
            variantId: variant.id,
            generationId: 'unspecified',
            componentType,
          };
          for (const group of visibleServiceFamilyGroups(firearm)) {
            expect(group.entries).toEqual(
              serviceCatalog.filter(
                (s) => s.serviceFamily === group.family && eligibleService(s, firearm),
              ),
            );
            expect(group.entries.every((s) => s.status === 'active')).toBe(true);
          }
        }
});

test('an ancillary extension does not establish Stippling for slide projects', () => {
  const firearm: BuildConfiguration['firearm'] = {
    manufacturerId: 'glock',
    modelId: 'glock-17',
    variantId: 'uncut',
    generationId: 'unspecified',
    componentType: 'slide-and-barrel',
  };
  const extension = serviceCatalog.find((s) => s.componentScope === 'extension')!;
  // Existing separately supplied extension semantics remain a purchase-domain decision.
  expect(eligibleService(extension, firearm)).toBe(true);
  expect(visibleServiceFamilyGroups(firearm).some((g) => g.family === 'stippling')).toBe(false);
});

test('relevant families without a matching package remain informational, not newly eligible', () => {
  const groups = visibleServiceFamilyGroups({
    manufacturerId: 'fn',
    modelId: 'fn-reflex',
    variantId: 'standard',
    generationId: 'unspecified',
    componentType: 'complete-firearm',
  });
  expect(groups.map((g) => g.family)).toEqual(cases[3][1]);
  expect(groups.find((g) => g.family === 'milling')!.entries).toEqual([]);
  expect(groups.find((g) => g.family === 'porting')!.entries).toEqual([]);
});

test('slide-plus-barrel coating choices describe the supported slide scope only', () => {
  const groups = visibleServiceFamilyGroups({
    manufacturerId: 'sw',
    modelId: 'sw-bodyguard20',
    variantId: 'uncut',
    generationId: 'unspecified',
    componentType: 'slide-and-barrel',
  });
  expect(groups.find((g) => g.family === 'cerakote')!.entries.map((s) => s.componentScope)).toEqual(
    ['slide'],
  );
  expect(groups.find((g) => g.family === 'porting')!.entries).toHaveLength(1);
  expect(
    groups.find((g) => g.family === 'porting')!.upcoming.every((s) => s.status === 'coming-soon'),
  ).toBe(true);
});
