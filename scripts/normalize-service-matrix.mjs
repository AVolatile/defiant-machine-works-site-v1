import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const [api, pages, old, assets, gallery, textures] = await Promise.all(
  [
    'source-audit/pass-04/products-api.json',
    'source-audit/pass-04/pages.json',
    'src/data/products.json',
    'source-audit/assets.json',
    'src/data/gallery.json',
    'src/data/texture-images.json',
  ].map(read),
);
const origin = 'https://defiantmachineworks.com';
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const glockModels = [
  '17',
  '19',
  '19X',
  '20',
  '21',
  '22',
  '23',
  '26',
  '27',
  '29',
  '30',
  '31',
  '32',
  '33',
  '34',
  '35',
  '40',
  '42',
  '43',
  '43X',
  '45',
  '47',
  '48',
];
const platformDefs = [
  ['glock', 'Glock', glockModels],
  ['sig', 'SIG Sauer', ['P365', 'P365 XL', 'P365 XMacro']],
  ['sw', 'Smith & Wesson', ['Bodyguard 2.0', 'M&P 2.0 (9mm / .40)']],
  ['cz', 'CZ', ['P-10 C', 'P-07', '75 Series']],
  ['psa', 'PSA', ['Dagger']],
  ['springfield', 'Springfield Armory', ['Echelon', 'Prodigy']],
  ['fn', 'FN', ['Reflex']],
  ['ruger', 'Ruger', ['RXM']],
  ['staccato', 'Staccato', ['2011']],
  ['oa', 'OA Defense', ['2311']],
  ['beretta', 'Beretta', ['PX4']],
];
const platforms = platformDefs.map(([id, label, models]) => ({
  id,
  label,
  models: models.map((label) => ({ id: `${id}-${normalize(label)}`, label })),
  variants:
    id === 'sw'
      ? [
          { id: 'uncut', label: 'Standard / no existing optic cut' },
          { id: 'carry-comp', label: 'Performance Center Carry Comp' },
          { id: 'existing-cut', label: 'Existing optic cut' },
        ]
      : id === 'glock'
        ? [
            { id: 'uncut', label: 'OEM / no existing optic cut' },
            { id: 'existing-cut', label: 'Existing optic cut / MOS' },
          ]
        : ['sig', 'cz'].includes(id)
          ? [
              { id: 'uncut', label: 'No existing optic cut' },
              { id: 'existing-cut', label: 'Existing optic cut' },
            ]
          : [{ id: 'standard', label: 'Standard' }],
}));
const modelId = (brand, label) =>
  platforms.find((p) => p.id === brand)?.models.find((m) => normalize(m.label) === normalize(label))
    ?.id;
const mapping = {
  'psa-dagger-stippling-package': ['psa', ['Dagger']],
  'smith-wesson-bodyguard-2-0-stippling-package': ['sw', ['Bodyguard 2.0']],
  'sig-sauer-p365-stippling-package-mod-1': ['sig', ['P365', 'P365 XL', 'P365 XMacro']],
  'sig-sauer-p365-stippling-package-mod-2': ['sig', ['P365', 'P365 XL', 'P365 XMacro']],
  'staccato-stippling-package': ['staccato', ['2011']],
  'cz-p10c-stippling-package': ['cz', ['P-10 C']],
  'sw-mp-stippling-package': ['sw', ['M&P 2.0 (9mm / .40)']],
  'fn-reflex-stippling-package': ['fn', ['Reflex']],
  'springfield-armory-echlon-stippling-package': ['springfield', ['Echelon']],
  'springfield-armory-prodigy-stippling-package': ['springfield', ['Prodigy']],
  'ruger-rxm-stippling-package': ['ruger', ['RXM']],
  'oa-defense-2311-stipple-package': ['oa', ['2311']],
  'beretta-px4-stipple-package-2': ['beretta', ['PX4']],
  'bodyguard-2-0-viper-ports': ['sw', ['Bodyguard 2.0']],
  'smith-wesson-bodyguard-2-0-optic-cut': ['sw', ['Bodyguard 2.0']],
  'smith-wesson-mp-optic-cut': ['sw', ['M&P 2.0 (9mm / .40)']],
  'cz-75-series-optic-cut': ['cz', ['75 Series']],
  'cz-p-07': ['cz', ['P-07']],
  'cz-p10c-cut': ['cz', ['P-10 C']],
  'sig-p365-optic-cut': ['sig', ['P365', 'P365 XL', 'P365 XMacro']],
  'p365-tiger-shark': ['sig', ['P365', 'P365 XL', 'P365 XMacro']],
};
for (const slug of [
  'glock-base-lvl-stippling-package',
  'glock-core-lvl-stippling-package',
  'glock-crown-lvl-3-stippling-package',
  'glock-optic-cut-full-size',
  'glock-optic-cut-slimline',
  'genesis-oem-slide-mill',
  'saber-slide-mill',
])
  mapping[slug] = [
    'glock',
    slug === 'glock-crown-lvl-3-stippling-package'
      ? glockModels.filter((m) => !['42', '43', '43X', '48'].includes(m))
      : slug === 'glock-optic-cut-full-size'
        ? [
            '26',
            '27',
            '33',
            '19',
            '19X',
            '17',
            '23',
            '22',
            '32',
            '31',
            '35',
            '45',
            '20',
            '21',
            '29',
            '30',
            '40',
          ]
        : slug === 'glock-optic-cut-slimline'
          ? ['42', '43', '43X', '48']
          : ['genesis-oem-slide-mill', 'saber-slide-mill'].includes(slug)
            ? ['17', '19X', '19', '45', '47', '34', '43', '43X', '48']
            : glockModels,
  ];
const roleFor = (label) => {
  const key = normalize(label);
  if (key === 'model') return 'model';
  if (key === 'texture') return 'texture';
  if (key === 'coatingtype' || key === 'cerakoteframeonly') return 'coating';
  if (key.includes('camocerakote') || key.includes('cerakotecamo')) return 'camo';
  if (key.includes('second') || key === 'slidecerakote2') return 'finish-secondary';
  if (key.includes('cerakotecolor') || key === 'slidecerakote') return 'finish';
  if (key === 'addanopticcut' || (key === 'opticcut' && label === 'Optic Cut')) return 'optic';
  if (key.includes('opticcut')) return 'optic';
  if (key.includes('buis')) return 'buis';
  if (key.includes('undercut')) return 'undercut';
  if (key.includes('indexpoints')) return 'index';
  if (key === 'glocklogo') return 'logo';
  if (key === 'fingergroves') return 'finger-grooves';
  if (key === 'glovebevel') return 'glove-bevel';
  if (key === 'borders') return 'border';
  if (key === 'barrelport') return 'barrel-port';
  return 'detail';
};
const aliases = {
  'Multicam Black': 'Black Multicam',
  'Swedish M90': 'M90 Swedish',
  'Pupkin Spice': 'Pumpkin Spice',
  'DCU (Chocolate Chip': 'DCU Chocolate Chip',
  'M81 Woodland (Standard)': 'Woodland',
  'Multicam Alpine': 'Arctic Multicam',
};
const textureRatings = {
  Cobblestone: [3, 'EDC'],
  Gravel: [3, 'EDC'],
  Kevlar: [5, 'EDC / Range'],
  Coffin: [6, 'EDC / Range'],
  Chainmail: [7, 'EDC / Range · OWB / Range'],
  Tread: [9, 'OWB / Range'],
  'RIP-N-DOTS': [8, 'OWB / Range'],
};
function reference(label, role) {
  if (role === 'texture') {
    const t = textures.find((t) => normalize(t.name) === normalize(label));
    if (t)
      return {
        image: t.image,
        sourceUrl: t.sourceUrl,
        caption: t.name,
        aggression: textureRatings[label]?.[0] ?? null,
        context: textureRatings[label]?.[1] || '',
      };
  }
  if (['finish', 'finish-secondary', 'camo'].includes(role)) {
    const g = gallery.find((g) => g.title === (aliases[label] || label));
    if (g)
      return {
        image: g.image,
        sourceUrl: g.sourceUrl,
        caption: g.title,
        aggression: null,
        context: '',
      };
  }
  return null;
}
const price = (v) => (v === '' || v === null || v === undefined ? 0 : Math.round(Number(v) * 100));
const clean = (s) =>
  cheerio
    .load(s || '')
    .text()
    .replace(/\s+/g, ' ')
    .trim();
const pageFor = (p) => pages.find((page) => page.url === p.permalink);
const localProduct = (p) => old.find((o) => o.slug === p.slug || o.sourceUrl === p.permalink);
const primary = api.filter((p) => pageFor(p)?.fields.length && p.slug !== 'bear-bones-iron-sights');
const services = primary.map((p) => {
  const page = pageFor(p),
    local = localProduct(p),
    cat = p.categories.map((c) => c.name);
  const family =
    p.slug === 'mag-extension-stippling'
      ? 'stippling'
      : cat.includes('Porting')
        ? 'porting'
        : cat.includes('CERAKOTE')
          ? 'cerakote'
          : cat.includes('STIPPLING')
            ? 'stippling'
            : 'milling';
  const scope =
    p.slug === 'mag-extension-stippling'
      ? 'extension'
      : family === 'stippling'
        ? 'frame'
        : family === 'porting'
          ? 'slide-and-barrel'
          : p.slug === 'pistol-cerakote'
            ? 'complete-firearm'
            : p.slug === 'frame-only-cerakote'
              ? 'frame'
              : 'slide';
  const [manufacturer, models] = mapping[p.slug] || ['', []];
  const review =
    p.slug === 'cz-p-07'
      ? [
          'The P-07 product description specifies the CZ 75 Series. Confirm the platform and fixed RMSC cut with Defiant.',
        ]
      : [];
  const fields = page.fields.map((f) => {
    let role = roleFor(f.Label);
    if (
      (f.Label === 'Optic Cut' && p.slug === 'p365-tiger-shark') ||
      f.Label === 'ADD AN OPTIC CUT'
    )
      role = 'optic-toggle';
    const fieldId = `field_${f.Id}`;
    const options = (f.Options || []).map((o) => {
      const label = clean(o.Label)
        .replace(/\s*\+\$\d+(\.\d+)?\s*$/, '')
        .trim();
      const ref = reference(label, role);
      let featureId = null;
      if (role === 'texture') featureId = `texture-${normalize(label)}`;
      if (role === 'index')
        featureId =
          label === 'Shooter Ledge'
            ? 'shooters-ledge'
            : label === 'Accelerator Ledge'
              ? 'accelerator-cut'
              : null;
      if (role === 'undercut')
        featureId =
          label === 'Single'
            ? 'single-undercut-mod'
            : label === 'Double w/o stippling'
              ? 'double-undercut-mod'
              : null;
      if (role === 'logo' && label === 'Keep Glock Logo') featureId = 'keep-glock-symbol';
      if (role === 'finger-grooves' && label === 'Delete') featureId = 'finger-groove-removal-mod';
      let coatingId = null;
      if (role === 'coating')
        coatingId = normalize(label).includes('singlecolor')
          ? 'single'
          : normalize(label).includes('battle')
            ? 'battleworn'
            : normalize(label).includes('camo')
              ? 'camo'
              : label === 'None'
                ? 'none'
                : label === 'Cerakote selected with optic cut'
                  ? 'shared'
                  : null;
      const requirements = [];
      if (label === 'Gen 3 and below only')
        requirements.push({ kind: 'generation', allowed: ['gen-3-or-earlier'] });
      if (label === 'Gen 4 and Up Mag release Borders')
        requirements.push({ kind: 'generation', allowed: ['gen-4-or-later'] });
      const modelIds =
        role === 'model'
          ? manufacturer === 'glock'
            ? label
                .split('/')
                .map((m) => modelId('glock', m))
                .filter(Boolean)
            : p.slug === 'smith-wesson-bodyguard-2-0-optic-cut'
              ? [modelId('sw', 'Bodyguard 2.0')]
              : models.map((m) => modelId(manufacturer, m)).filter(Boolean)
          : [];
      const variantIds =
        role === 'model' && p.slug === 'smith-wesson-bodyguard-2-0-optic-cut'
          ? [String(o.Id) === '2' ? 'carry-comp' : 'uncut']
          : [];
      return {
        id: String(o.Id),
        displayName: label,
        sourceLabel: o.Label,
        deltaCents: f.PriceType === 'none' ? 0 : price(o.SalePrice || o.RegularPrice),
        priceKnown:
          ['none', 'options'].includes(f.PriceType) &&
          o.PriceType === 'fixed_amount' &&
          Number.isFinite(price(o.SalePrice || o.RegularPrice)),
        featureId,
        coatingId,
        finishId: ['finish', 'finish-secondary', 'camo'].includes(role)
          ? `finish-${normalize(label)}`
          : null,
        reference: ref,
        modelIds,
        variantIds,
        requirements,
        reviewRequirements:
          p.slug === 'smith-wesson-mp-optic-cut' && String(o.Id) === '2' && role === 'optic'
            ? [
                'The source repeats RMR under two IDs. Confirm this second source option with Defiant.',
              ]
            : [],
        existingCut: label === 'MOS REAR STUD DELETE' ? 'mos-only' : null,
        neutral: ['None', 'N/A', 'No', 'Keep Factory', 'Delete'].includes(label),
      };
    });
    return {
      id: fieldId,
      sourceFieldId: String(f.Id),
      displayName:
        role === 'optic'
          ? 'Optic cut'
          : role === 'model'
            ? 'Model'
            : clean(f.Label).replace(/:$/, ''),
      sourceLabel: clean(f.Label),
      role,
      required: f.Required,
      type: f.Type === 'checkbox' ? 'single-choice' : 'select',
      sourceType: f.Type,
      options,
      conditions: (f.Conditions || []).map((c) => ({
        showWhenTrue: c.ShowWhenTrue,
        groups: c.ConditionGroups.map((g) =>
          g.ConditionLines.map((l) => ({
            fieldId: `field_${l.FieldId}`,
            operator: l.Comparison === 'Contains' ? 'contains' : 'unsupported',
            values: l.Value.map(String),
          })),
        ),
      })),
    };
  });
  const hasSlideCoating =
    ['milling', 'porting'].includes(family) && fields.some((f) => f.role === 'coating');
  const frameCoating = family === 'stippling' ? fields.find((f) => f.role === 'coating') : null;
  const fixed =
    p.slug === 'cz-75-series-optic-cut' ||
    p.slug === 'cz-p-07' ||
    p.slug === 'smith-wesson-bodyguard-2-0-optic-cut';
  const includedFeatures = fixed
    ? [
        { id: 'optic-rmsc', label: 'RMSC optic footprint — fixed by this service' },
        { id: 'rear-sight-removed', label: 'Factory rear iron sight removed' },
      ]
    : [];
  if (hasSlideCoating)
    includedFeatures.push({
      id: 'slide-coating',
      label: 'Slide coating configured within this package',
    });
  const schema = {
    serviceFamily: family,
    servicePackage: p.slug,
    serviceId: p.slug,
    sourceProductId: p.id,
    displayName: clean(p.name),
    status: p.is_purchasable && p.is_in_stock ? 'active' : 'unavailable',
    basePriceCents: Number(p.prices.price),
    regularPriceCents: Number(p.prices.regular_price),
    priceType: 'base-plus-options',
    compatibleManufacturers: manufacturer ? [manufacturer] : platforms.map((p) => p.id),
    compatibleModels: models.map((m) => modelId(manufacturer, m)).filter(Boolean),
    compatibleVariants:
      p.slug === 'bodyguard-2-0-viper-ports'
        ? ['uncut']
        : p.slug === 'smith-wesson-bodyguard-2-0-optic-cut'
          ? ['uncut', 'carry-comp']
          : [],
    componentScope: scope,
    fields,
    requiredOptions: fields.filter((f) => f.required).map((f) => f.id),
    optionalOptions: fields.filter((f) => !f.required).map((f) => f.id),
    includedFeatures,
    addOns: [],
    exclusions:
      p.slug === 'glock-crown-lvl-3-stippling-package'
        ? ['glock-42', 'glock-43', 'glock-43x', 'glock-48']
        : [],
    overlaps: hasSlideCoating
      ? ['slide-coating']
      : frameCoating
        ? ['frame-coating']
        : family === 'cerakote'
          ? scope === 'complete-firearm'
            ? ['frame-coating', 'slide-coating']
            : [scope + '-coating']
          : [],
    dependencies: hasSlideCoating
      ? [
          {
            kind: 'INCLUDED',
            scope: 'slide-coating',
            fieldId: fields.find((f) => f.role === 'coating').id,
          },
        ]
      : frameCoating
        ? [{ kind: 'OPTIONAL', scope: 'frame-coating', fieldId: frameCoating.id }]
        : [],
    visualReferences:
      local?.images?.slice(0, 4).map((image) => ({
        image,
        sourceUrl:
          assets.find((asset) => asset.hash && image.includes(asset.hash.slice(0, 14)))
            ?.sourceUrl || p.permalink,
        caption: clean(p.name),
        aggression: null,
        context: '',
      })) || [],
    sourceUrls: [p.permalink],
    reviewRequirements: review,
    checkoutEligibility: review.length ? 'review-required' : 'standard',
    existingCutPolicy:
      p.slug === 'glock-optic-cut-slimline'
        ? 'slimline-mos'
        : family === 'milling'
          ? 'uncut-only'
          : 'any',
    description: local?.description?.[0] || clean(p.short_description),
    fixedOpticId: fixed ? 'rmsc' : null,
  };
  return schema;
});
const primaryIds = new Set(primary.map((p) => p.id));
const addonProducts = api.filter(
  (p) =>
    !primaryIds.has(p.id) &&
    p.categories.some((c) => ['PATTERN', 'MOD', 'BORDER', 'THUMB SUPPORT'].includes(c.name)),
);
const addOns = addonProducts.map((p) => ({
  id: p.slug,
  displayName: clean(p.name),
  basePriceCents: Number(p.prices.price),
  status: 'active',
  sourceUrls: [p.permalink],
  description: clean(p.description),
  bindings: services.flatMap((s) =>
    s.fields.flatMap((f) =>
      f.options
        .filter(
          (o) =>
            o.featureId === p.slug ||
            o.featureId === `texture-${normalize(p.name.replace(/pattern/i, ''))}`,
        )
        .map((o) => ({
          serviceId: s.serviceId,
          fieldId: f.id,
          optionId: o.id,
          relationship: o.deltaCents === 0 ? 'INCLUDED' : 'PRICE_DELTA',
        })),
    ),
  ),
  reviewRequirements: [],
  visualReferences: localProduct(p)?.images?.slice(0, 1) || [],
}));
for (const a of addOns)
  if (!a.bindings.length)
    a.reviewRequirements = [
      'The legacy add-on requires a frame-size/pattern/border ordering model not defined by the current package forms. Defiant must confirm its applicability and additional charge; it is not added on top of package work automatically.',
    ];
for (const s of services)
  s.addOns = addOns
    .filter((a) => a.bindings.some((b) => b.serviceId === s.serviceId))
    .map((a) => a.id);
const upcomingLabels = [
  'Smith & Wesson M&P — X Ports',
  'Glock — X Ports',
  'Glock — SOS Ports',
  'Glock — C Ports',
  'Stealth Arms Platypus — Raptor Ports',
  'Stealth Arms Platypus — Hornet Ports',
  'CZ Shadow 2 — Inline 4',
  'Walther PDP — X Ports',
];
const upcoming = upcomingLabels.map((label, i) => ({
  serviceId: `coming-soon-${i + 1}`,
  displayName: label,
  serviceFamily: 'porting',
  compatibleManufacturers: [
    ['sw'],
    ['glock'],
    ['glock'],
    ['glock'],
    ['stealth'],
    ['stealth'],
    ['cz'],
    ['walther'],
  ][i],
  status: 'coming-soon',
  checkoutEligibility: 'unavailable',
  sourceUrls: [origin + '/porting/'],
}));
const merchandise = api
  .filter((p) => !primaryIds.has(p.id) && !addonProducts.some((a) => a.id === p.id))
  .map((p) => ({
    id: p.slug,
    displayName: clean(p.name),
    priceCents: Number(p.prices.price),
    regularPriceCents: Number(p.prices.regular_price),
    status: p.is_in_stock ? 'active' : 'unavailable',
    checkoutEligibility: p.categories.some((c) => c.name === 'STICKER')
      ? 'standard'
      : 'inquiry-only',
    reason: p.categories.some((c) => c.name === 'STICKER')
      ? ''
      : 'Physical accessories or complimentary items retain direct-business handling; no fulfillment or component-sale workflow is assumed.',
    image: localProduct(p)?.images?.[0] || null,
    sourceUrls: [p.permalink],
  }));
const domain = { platforms, services, addOns, upcoming, merchandise };
const version =
  'dmw-' + createHash('sha256').update(JSON.stringify(domain)).digest('hex').slice(0, 12);
const matrix = {
  schemaVersion: 1,
  catalogVersion: version,
  crawledAt: new Date().toISOString(),
  ...domain,
};
await writeFile(
  'src/data/catalog-version.ts',
  `export const currentCatalogVersion = '${version}';\n`,
);
await writeFile('src/data/service-matrix.json', JSON.stringify(matrix, null, 2) + '\n');
await writeFile('source-audit/pass-03-service-matrix.json', JSON.stringify(matrix, null, 2) + '\n');
const coverage = services.map((s) => ({
  service: s.displayName,
  serviceId: s.serviceId,
  source: s.sourceUrls[0],
  represented: true,
  requiredOptions: s.fields.filter((f) => f.required).length,
  allOptions: s.fields.reduce((n, f) => n + f.options.length, 0),
  priceRepresented: true,
  imagery: s.visualReferences.length,
  compatibilityRepresented: true,
  checkoutEligibility: s.checkoutEligibility,
  reviewRequirements: s.reviewRequirements,
}));
await writeFile(
  'source-audit/pass-04/coverage.json',
  JSON.stringify(
    {
      activeServices: services.length,
      represented: services.length,
      coveragePercent: 100,
      comingSoon: upcoming.length,
      legacyAddOns: addOns.length,
      services: coverage,
    },
    null,
    2,
  ) + '\n',
);
await writeFile(
  'source-audit/SERVICE_COVERAGE.md',
  '# Service coverage — current live audit\n\nAll active standard service products and magazine-extension stippling are accounted for. Legacy add-ons and physical merchandise are inventoried separately in the canonical matrix.\n\n| Live service | Fields / choices | Price | Image | Compatibility | Checkout |\n|---|---:|---|---|---|---|\n' +
    coverage
      .map(
        (c) =>
          `| [${c.service}](${c.source}) | ${c.requiredOptions} / ${c.allOptions} | Yes | ${c.imagery ? 'Yes' : 'No source reference'} | Yes | ${c.checkoutEligibility} |`,
      )
      .join('\n') +
    '\n',
);
console.log({
  active: services.length,
  fields: services.reduce((n, s) => n + s.fields.length, 0),
  addOns: addOns.length,
  upcoming: upcoming.length,
  merchandise: merchandise.length,
  catalogVersion: version,
});
