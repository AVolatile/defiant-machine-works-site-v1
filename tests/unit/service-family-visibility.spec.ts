import { test, expect } from '@playwright/test';
import { eligibleService, platforms, serviceCatalog } from '../../src/lib/commerce/catalog';
import {
  componentServiceFamilies,
  visibleServiceFamilyGroups,
} from '../../src/lib/commerce/service-family-visibility';
import type { BuildConfiguration } from '../../src/lib/commerce/schema';
import { configuredBuild, setOption } from '../e2e/commerce-fixtures';

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

test('slide coating stays canonically eligible while its separate family uses the dedicated entry', () => {
  const firearm: BuildConfiguration['firearm'] = {
    manufacturerId: 'sw',
    modelId: 'sw-bodyguard20',
    variantId: 'uncut',
    generationId: 'unspecified',
    componentType: 'slide-and-barrel',
  };
  const groups = visibleServiceFamilyGroups(firearm);
  expect(groups.some((g) => g.family === 'cerakote')).toBe(false);
  expect(
    serviceCatalog
      .filter((s) => s.serviceFamily === 'cerakote' && eligibleService(s, firearm))
      .map((s) => s.componentScope),
  ).toEqual(['slide']);
  expect(groups.find((g) => g.family === 'porting')!.entries).toHaveLength(1);
  expect(
    groups.find((g) => g.family === 'porting')!.upcoming.every((s) => s.status === 'coming-soon'),
  ).toBe(true);
});

for (const [componentType, expected] of [
  ['slide', ['milling']],
  ['slide-and-barrel', ['milling', 'porting']],
] as const)
  test(`${componentType}: normal build selection omits standalone coating`, () => {
    const f = configuredBuild().firearm;
    expect(visibleServiceFamilyGroups({ ...f, componentType }).map((g) => g.family)).toEqual(
      expected,
    );
  });

for (const id of ['glock-optic-cut-full-size', 'bodyguard-2-0-viper-ports'])
  test(`complete project hides the separate family when ${id} owns included coating`, () => {
    const build = configuredBuild(id);
    build.firearm.componentType = 'complete-firearm';
    build.services[0].attributes = {};
    const before = structuredClone(build);
    expect(visibleServiceFamilyGroups(build.firearm, build.services).map((g) => g.family)).toEqual([
      'stippling',
      'milling',
      'porting',
    ]);
    expect(build).toEqual(before);
    expect(visibleServiceFamilyGroups(build.firearm).some((g) => g.family === 'cerakote')).toBe(
      true,
    );
  });

test('optional frame coating suppresses duplicates only when selected; None keeps the family', () => {
  const build = configuredBuild('glock-core-lvl-stippling-package');
  build.firearm.componentType = 'complete-firearm';
  expect(
    visibleServiceFamilyGroups(build.firearm, build.services).some((g) => g.family === 'cerakote'),
  ).toBe(true);
  const coating = serviceCatalog
    .find((s) => s.serviceId === build.services[0].serviceId)!
    .fields.find((f) => f.role === 'coating')!;
  setOption(
    build,
    build.services[0].serviceId,
    'coating',
    coating.options.find((o) => o.coatingId === 'single')!.displayName,
  );
  expect(
    visibleServiceFamilyGroups(build.firearm, build.services).some((g) => g.family === 'cerakote'),
  ).toBe(false);
});

test('an incompatible saved owner does not suppress valid standalone scope choices', () => {
  const build = configuredBuild();
  Object.assign(build.firearm, {
    manufacturerId: 'fn',
    modelId: 'fn-reflex',
    variantId: 'standard',
    componentType: 'complete-firearm',
  });
  expect(
    visibleServiceFamilyGroups(build.firearm, build.services).some((g) => g.family === 'cerakote'),
  ).toBe(true);
});
