import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { serviceMatrixSchema } from '../../src/lib/commerce/catalog-schema';
import {
  serviceMatrix,
  serviceCatalog,
  serviceById,
  catalogVersion,
} from '../../src/lib/commerce/catalog';
import { priceBuild, quoteCart } from '../../src/lib/commerce/pricing';
import { normalizeBuild } from '../../src/lib/commerce/build-rules';
import {
  sourceConfiguration,
  activeSourceFields,
} from '../../src/lib/commerce/service-configuration';
import { migrateLegacyCart } from '../../src/lib/commerce/cart-migration';
import { buildSchema, customerSchema } from '../../src/lib/commerce/schema';
import { configuredBuild, confirmedBuild, setOption } from '../e2e/commerce-fixtures';
const pages = JSON.parse(readFileSync('source-audit/pass-04/pages.json', 'utf8'));
const api = JSON.parse(readFileSync('source-audit/pass-04/products-api.json', 'utf8'));
test('canonical typed matrix accounts for every current configurable service and all source choices', () => {
  expect(serviceMatrixSchema.safeParse(serviceMatrix).success).toBe(true);
  expect(serviceCatalog).toHaveLength(32);
  expect(serviceMatrix.addOns).toHaveLength(23);
  expect(serviceMatrix.upcoming).toHaveLength(8);
  const source = api.filter(
    (p: { id: number; permalink: string; slug: string }) =>
      p.slug !== 'bear-bones-iron-sights' &&
      pages.find((page: { url: string; fields: unknown[] }) => page.url === p.permalink)?.fields
        .length,
  );
  expect(source.map((p: { id: number }) => p.id).sort()).toEqual(
    serviceCatalog.map((s) => s.sourceProductId).sort(),
  );
  for (const service of serviceCatalog) {
    const page = pages.find((p: { url: string }) => p.url === service.sourceUrls[0]);
    expect(service.fields.map((f) => f.sourceFieldId)).toEqual(
      page.fields.map((f: { Id: number }) => String(f.Id)),
    );
    for (const field of service.fields) {
      const raw = page.fields.find((f: { Id: number }) => String(f.Id) === field.sourceFieldId);
      expect(field.options.map((o) => o.id)).toEqual(
        raw.Options.map((o: { Id: number }) => String(o.Id)),
      );
    }
    expect(service.visualReferences.length).toBeGreaterThan(0);
  }
});
for (const service of serviceCatalog) {
  test(`complete service fixture: ${service.serviceId}`, () => {
    const build = configuredBuild(service.serviceId),
      priced = priceBuild(build);
    expect(buildSchema.safeParse(build).success).toBe(true);
    expect(priced.errors).toEqual([]);
    expect(priced.services).toHaveLength(1);
    expect(priced.estimatedSubtotalCents).toBeGreaterThanOrEqual(service.basePriceCents);
    expect(priced.orderability).toBe(
      service.reviewRequirements.length ? 'requires-review' : 'ready',
    );
  });
  test(`required field validation: ${service.serviceId}`, () => {
    const build = configuredBuild(service.serviceId),
      choice = build.services[0];
    const field = activeSourceFields(service.serviceId, choice.attributes).find(
      (f) => f.required && f.role !== 'model',
    )!;
    delete choice.attributes[field.id];
    expect(priceBuild(build).errors.join()).toContain(`Choose ${field.displayName}`);
    choice.attributes[field.id] = 'forged';
    expect(priceBuild(build).errors.join()).toContain('Unverified');
  });
}
function coating(
  serviceId: string,
  type: 'single' | 'battleworn' | 'camo',
  finish = 'Midnight Chocolate Chip',
) {
  const b = configuredBuild(serviceId),
    service = serviceById.get(serviceId)!,
    choice = b.services[0],
    field = service.fields.find((f) => f.role === 'coating')!;
  choice.attributes[field.id] = field.options.find((o) => o.coatingId === type)!.id;
  for (const f of service.fields.filter((f) =>
    ['camo', 'finish', 'finish-secondary'].includes(f.role),
  ))
    delete choice.attributes[f.id];
  const f = service.fields.find((f) => f.role === (type === 'camo' ? 'camo' : 'finish'))!;
  choice.attributes[f.id] = (f.options.find((o) => o.displayName === finish) || f.options[0]).id;
  if (type === 'battleworn') {
    const second = service.fields.find((f) => f.role === 'finish-secondary')!;
    choice.attributes[second.id] = second.options[1].id;
  }
  return b;
}
for (const reverse of [false, true]) {
  test(`double charge: slide Cerakote and milling / reverse=${reverse}`, () => {
    const b = coating('glock-optic-cut-full-size', 'camo'),
      slide = coating('slide-only-cerakote', 'camo').services[0];
    b.firearm.modelId = 'glock-17';
    setOption(b, b.services[0].serviceId, 'optic', 'C SERIES');
    b.services = reverse ? [b.services[0], slide] : [slide, b.services[0]];
    const priced = priceBuild(b);
    expect(priced.errors).toEqual([]);
    expect(priced.services.map((s) => s.serviceId)).toEqual(['glock-optic-cut-full-size']);
    expect(priced.estimatedSubtotalCents).toBe(28500);
    expect(priced.adjustments.join()).toContain('separate slide Cerakote');
    expect(priced.orderability).toBe('ready');
  });
  test(`double charge: complete pistol and slide coating / reverse=${reverse}`, () => {
    const b = coating('pistol-cerakote', 'single'),
      slide = coating('slide-only-cerakote', 'single').services[0];
    b.services = reverse ? [b.services[0], slide] : [slide, b.services[0]];
    const price = priceBuild(b);
    expect(price.errors).toEqual([]);
    expect(price.services).toHaveLength(1);
    expect(price.estimatedSubtotalCents).toBe(17500);
  });
  test(`double charge: complete pistol and milling / reverse=${reverse}`, () => {
    const b = coating('pistol-cerakote', 'single'),
      mill = coating('glock-optic-cut-full-size', 'single').services[0];
    b.services = reverse ? [b.services[0], mill] : [mill, b.services[0]];
    const price = priceBuild(b);
    expect(price.errors).toEqual([]);
    expect(price.services.map((s) => s.serviceId)).toEqual([
      'frame-only-cerakote',
      'glock-optic-cut-full-size',
    ]);
    expect(price.estimatedSubtotalCents).toBe(28500);
  });
  test(`package and included add-on / reverse=${reverse}`, () => {
    const b = configuredBuild('glock-core-lvl-stippling-package');
    if (reverse) b.services[0].attributes = {};
    b.services[0].optionIds = ['single-undercut-mod'];
    const n = normalizeBuild(b);
    expect(n.build.services[0].optionIds).toEqual([]);
    expect(n.build.services[0].attributes.field_4).toBe('1');
    if (!reverse) expect(priceBuild(b).estimatedSubtotalCents).toBe(32500);
    expect(n.adjustments[0].relationship).toBe('INCLUDED');
  });
}
test('frame coating uses Core package upgrade instead of a second frame service', () => {
  const b = configuredBuild('glock-core-lvl-stippling-package'),
    frame = coating('frame-only-cerakote', 'single').services[0];
  b.services.push(frame);
  const price = priceBuild(b);
  expect(price.errors).toEqual([]);
  expect(price.services).toHaveLength(1);
  expect(price.estimatedSubtotalCents).toBe(37500);
});
test('Viper and Bodyguard optic cut share finishing through the explicit source option', () => {
  const b = coating('bodyguard-2-0-viper-ports', 'battleworn');
  b.services.push(coating('smith-wesson-bodyguard-2-0-optic-cut', 'battleworn').services[0]);
  const price = priceBuild(b);
  expect(price.errors).toEqual([]);
  expect(price.estimatedSubtotalCents).toBe(47000);
  expect(
    price.services.find((s) => s.serviceId === 'bodyguard-2-0-viper-ports')?.attributes.field_1,
  ).toBe('4');
});
test('standalone porting shared-coating bypass is rejected', () => {
  const b = configuredBuild('bodyguard-2-0-viper-ports');
  b.services[0].attributes = { field_1: '4' };
  expect(priceBuild(b).errors.join()).toContain('requires the Bodyguard optic-cut');
});
test('generation-specific choices, wrong models, existing cuts and Coming Soon are independently rejected', () => {
  const b = confirmedBuild();
  b.firearm.variantId = 'existing-cut';
  expect(priceBuild(b).errors.join()).toContain('not listed');
  b.firearm.variantId = 'uncut';
  b.firearm.modelId = 'glock-43';
  expect(priceBuild(b).errors.join()).toContain('not listed');
  b.services = [{ serviceId: 'coming-soon-1', optionIds: [], attributes: {} }];
  expect(priceBuild(b).errors.join()).toContain('coming-soon');
  const stip = configuredBuild('glock-base-lvl-stippling-package');
  stip.services[0].attributes.field_8 = '1';
  expect(priceBuild(stip).errors.join()).toContain('generation group');
  stip.firearm.generationId = 'gen-3-or-earlier';
  expect(priceBuild(stip).errors).toEqual([]);
});
test('slimline MOS exception supports only the published rear-stud option', () => {
  const b = configuredBuild('glock-optic-cut-slimline');
  b.firearm.modelId = 'glock-43';
  b.firearm.variantId = 'existing-cut';
  b.services[0].attributes = { field_2: '6', field_7: '1', field_4: '33' };
  expect(priceBuild(b).errors).toEqual([]);
  expect(priceBuild(b).estimatedSubtotalCents).toBe(11000);
  b.services[0].attributes.field_2 = '2';
  expect(priceBuild(b).errors.join()).toContain('rear-stud-delete');
});
test('mutually exclusive packages and contradictory legacy options cannot proceed', () => {
  const b = configuredBuild('glock-core-lvl-stippling-package');
  b.services.push(configuredBuild('glock-base-lvl-stippling-package').services[0]);
  expect(priceBuild(b).errors.join()).toContain('Choose one stippling');
  const c = configuredBuild('glock-core-lvl-stippling-package');
  c.services[0].attributes.field_4 = '2';
  c.services[0].optionIds = ['single-undercut-mod'];
  expect(priceBuild(c).errors.join()).toContain('conflicts');
});
test('unknown legacy charges remain review-only and are excluded from payable service amounts', () => {
  const b = configuredBuild('glock-base-lvl-stippling-package');
  b.services[0].optionIds = ['palm-swell-mod'];
  const p = priceBuild(b);
  expect(p.orderability).toBe('requires-review');
  expect(p.estimatedSubtotalCents).toBe(24500);
  expect(p.reviewReasons.join()).toContain('legacy add-on');
});
test('legacy carts migrate supported IDs and require explicit current-price review', () => {
  const b = confirmedBuild();
  const old = {
    id: b.id,
    firearm: {
      manufacturer: 'Glock',
      model: '19',
      variant: 'OEM / no existing optic cut',
      componentType: 'slide',
    },
    services: b.services,
    createdAt: b.createdAt,
  };
  const result = migrateLegacyCart([{ kind: 'build', id: b.id, build: old }]);
  expect(result.envelope.items).toHaveLength(1);
  expect(result.envelope.needsReview).toBe(true);
  expect(result.envelope.catalogVersion).toBe(catalogVersion);
  expect(result.message).toContain('Review your build');
  expect(
    migrateLegacyCart([
      { kind: 'build', id: b.id, build: { ...old, firearm: { ...old.firearm, model: 'unknown' } } },
    ]).envelope.items,
  ).toEqual([]);
  expect(migrateLegacyCart({ bad: true }).envelope.items).toEqual([]);
});
test('review-only source conflicts are explicit and structured prices never accept browser totals', () => {
  const b = configuredBuild('cz-p-07');
  expect(priceBuild(b).reviewReasons.join()).toContain('75 Series');
  const item = { kind: 'build' as const, id: b.id, build: b };
  expect(quoteCart([item]).catalogVersion).toBe(catalogVersion);
  const c = confirmedBuild();
  expect(
    sourceConfiguration(c.services[0], c)?.details.some(
      (d) => d.label === 'Model' && d.value === '19',
    ),
  ).toBe(true);
});
for (const reverse of [false, true]) {
  test(`complete pistol and frame scope normalize once / reverse=${reverse}`, () => {
    const b = coating('pistol-cerakote', 'single'),
      frame = coating('frame-only-cerakote', 'single').services[0];
    b.services = reverse ? [frame, b.services[0]] : [b.services[0], frame];
    const p = priceBuild(b);
    expect(p.errors).toEqual([]);
    expect(p.estimatedSubtotalCents).toBe(17500);
    expect(p.services).toHaveLength(1);
  });
  test(`Core frame upgrade and standalone frame normalize once / reverse=${reverse}`, () => {
    const b = configuredBuild('glock-core-lvl-stippling-package'),
      frame = coating('frame-only-cerakote', 'single').services[0];
    b.services = reverse ? [frame, b.services[0]] : [b.services[0], frame];
    const p = priceBuild(b);
    expect(p.errors).toEqual([]);
    expect(p.estimatedSubtotalCents).toBe(37500);
    expect(p.services).toHaveLength(1);
  });
  test(`complete pistol and porting own separate coating scopes / reverse=${reverse}`, () => {
    const b = coating('bodyguard-2-0-viper-ports', 'single');
    b.firearm.componentType = 'complete-firearm';
    const whole = coating('pistol-cerakote', 'single').services[0];
    b.services = reverse ? [whole, b.services[0]] : [b.services[0], whole];
    const p = priceBuild(b);
    expect(p.errors).toEqual([]);
    expect(p.services.map((s) => s.serviceId)).toEqual([
      'bodyguard-2-0-viper-ports',
      'frame-only-cerakote',
    ]);
    expect(p.estimatedSubtotalCents).toBe(32500);
  });
  test(`porting finish transfers to new milling and is billed once / reverse=${reverse}`, () => {
    const b = coating('bodyguard-2-0-viper-ports', 'battleworn'),
      milling = {
        serviceId: 'smith-wesson-bodyguard-2-0-optic-cut',
        optionIds: [],
        attributes: {},
      };
    b.services = reverse ? [milling, b.services[0]] : [b.services[0], milling];
    const normalized = normalizeBuild(b).build;
    const optic = normalized.services.find((s) => s.serviceId === milling.serviceId)!;
    expect(optic.attributes.field_9).toBeDefined();
    const p = priceBuild(normalized);
    expect(p.errors).toEqual([]);
    expect(p.estimatedSubtotalCents).toBe(47000);
  });
}

test('phone is optional until the business confirms a requirement, and provided numbers are validated', () => {
  const customer = {
    firstName: 'Demo',
    lastName: 'Customer',
    email: 'demo@example.com',
    phone: '',
  };
  expect(customerSchema.safeParse(customer).success).toBe(true);
  expect(customerSchema.safeParse({ ...customer, phone: 'invalid' }).success).toBe(false);
});
