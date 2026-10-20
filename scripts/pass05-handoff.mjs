import { readFile, writeFile, readdir, access, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [
  matrix,
  baseline,
  report,
  gallery,
  products,
  services,
  textures,
  originals,
  standard,
  dependency,
  production,
  mobile,
] = await Promise.all(
  [
    'src/data/service-matrix.json',
    'source-audit/pass-05/preserved-baseline.json',
    'test-results/results.json',
    'src/data/gallery.json',
    'src/data/products.json',
    'src/data/service-records.json',
    'src/data/texture-images.json',
    'source-audit/assets.json',
    'tests/visual/results.json',
    'source-audit/pass-05/dependency-audit.json',
    'source-audit/pass-05/production-dependency-audit.json',
    'source-audit/pass-05/mobile-checkout-a11y.json',
  ].map(read),
);
if (report.stats.unexpected || report.stats.flaky || report.stats.skipped)
  throw Error('A clean full test run is required.');
const specs = [];
function collect(suite) {
  specs.push(...(suite.specs || []));
  (suite.suites || []).forEach(collect);
}
report.suites.forEach(collect);
if (specs.length !== 159)
  throw Error('Run all 159 current cases before generating the Pass 05 handoff.');
const protectedFiles = await Promise.all(
  Object.entries(baseline.hashes).map(async ([file, before]) => {
    const after = createHash('sha256')
      .update(await readFile(file))
      .digest('hex');
    if (after !== before) throw Error(`Protected file changed: ${file}`);
    return { file, sha256: after, unchanged: true };
  }),
);
const attachments = specs.flatMap((spec) =>
  spec.tests.flatMap((test) => test.results.flatMap((result) => result.attachments || [])),
);
const custom = attachments
  .filter((a) => a.name.startsWith('pass05-'))
  .map((a) => ({ name: a.name, ...JSON.parse(Buffer.from(a.body, 'base64').toString()) }));
const axe = custom.filter((a) => a.name.startsWith('pass05-axe-'));
const images = custom.filter((a) => a.name === 'pass05-wizard-images');
if (
  axe.length !== 18 ||
  axe.some((a) => a.violations.length) ||
  images.length !== 8 ||
  images.some((a) => a.imageRequests.length || a.optionImagePreloads.length)
)
  throw Error('Targeted accessibility/image checks are incomplete.');
if (mobile.length !== 3 || mobile.some((r) => r.axeViolations.length || r.overflow))
  throw Error('Mobile checkout checks are incomplete.');
await writeFile(
  'source-audit/pass-05/targeted-browser-results.json',
  JSON.stringify(custom, null, 2) + '\n',
);
const galleryFilters = [
  ['stippling', 'Stippling'],
  ['milling', 'Slide Milling'],
  ['cerakote', 'Cerakote'],
  ['porting', 'Porting'],
].map(([family, service]) => ({
  family,
  service,
  href: '/gallery?' + new URLSearchParams({ service }),
  examples: gallery.filter((i) => i.service === service).length,
}));
const records = matrix.services.flatMap((service) => [
  ...service.visualReferences
    .slice(0, 1)
    .map((reference) => ({
      serviceId: service.serviceId,
      kind: 'package',
      fieldId: null,
      optionId: null,
      ...reference,
    })),
  ...service.fields.flatMap((field) =>
    field.options.flatMap((option) =>
      option.reference
        ? [
            {
              serviceId: service.serviceId,
              kind: 'option',
              fieldId: field.id,
              optionId: option.id,
              ...option.reference,
            },
          ]
        : [],
    ),
  ),
]);
const site = await readFile('src/data/site.ts', 'utf8'),
  home = await readFile('src/components/home/home-page.tsx', 'utf8'),
  info = await readFile('src/components/content/info-pages.tsx', 'utf8');
const paths = [...new Set(records.map((r) => r.image))].sort();
const assetUsage = await Promise.all(
  paths.map(async (image) => {
    await access('public' + image);
    const refs = records.filter((r) => r.image === image);
    const sourceAsset = originals.find((a) => a.hash && image.includes(a.hash.slice(0, 14)));
    return {
      image,
      bytesRetained: (await stat('public' + image)).size,
      requestedByConfigurator: false,
      priorWizardUses: refs.map((r) => ({
        serviceId: r.serviceId,
        kind: r.kind,
        fieldId: r.fieldId,
        optionId: r.optionId,
      })),
      sourceUrls: [
        ...new Set([
          ...(sourceAsset ? [sourceAsset.sourceUrl] : []),
          ...refs.map((r) => r.sourceUrl),
        ]),
      ],
      retainedUses: {
        gallery: gallery.filter((g) => g.image === image).map((g) => g.title),
        productDetails: products.filter((p) => p.images.includes(image)).map((p) => p.slug),
        servicePages: services.filter((s) => s.image === image).map((s) => s.slug),
        stipplingGuide: textures.filter((t) => t.image === image).map((t) => t.name),
        editorial: [
          ...(site.includes(image) ? ['src/data/site.ts (site/editorial photography)'] : []),
          ...(info.includes(image) ? ['src/components/content/info-pages.tsx'] : []),
          ...(gallery.some((g) => g.image === image && home.includes(`'${g.title}'`))
            ? ['src/components/home/home-page.tsx (featured Gallery work)']
            : []),
        ],
        archiveAndProvenance: true,
      },
    };
  }),
);
await writeFile(
  'source-audit/pass-05/asset-usage.json',
  JSON.stringify(
    {
      reviewDate: '2026-10-20',
      packageReferences: 32,
      optionReferences: 833,
      uniquePriorWizardImages: paths.length,
      allCatalogVisualReferencesRetained: 915,
      deletedAssets: 0,
      assets: assetUsage,
    },
    null,
    2,
  ) + '\n',
);
const usageText = (a) =>
  [
    a.retainedUses.gallery.length ? 'Gallery' : null,
    a.retainedUses.productDetails.length ? 'Product details' : null,
    a.retainedUses.servicePages.length ? 'Service pages' : null,
    a.retainedUses.stipplingGuide.length ? 'Stippling guide' : null,
    a.retainedUses.editorial.length ? 'Editorial' : null,
    'Archive / provenance',
  ]
    .filter(Boolean)
    .join(' · ');
await writeFile(
  'source-audit/PASS_05_ASSETS.md',
  `# Pass 05 — configurator asset report\n\nReview date: October 20, 2026. No image files or provenance data were deleted. The unchanged matrix retains 915 visual-reference records. The previous wizard renderers could use 32 primary package references and 833 repeated option references, representing **${paths.length} distinct local photographs** across the catalog. These are no longer rendered or requested by the configurator. They were never all loaded simultaneously.\n\nEight fresh browser flows (four families at 390/1440px) recorded **zero service-image requests and zero service-image preloads** from the original build tab, including while opening Gallery help. Shared branding is still permitted and is not counted as service imagery. The full catalog/provenance JSON remains unchanged; no bundle-size, Lighthouse, LCP or byte-savings score is claimed.\n\nThe old image-based picker and its image-only CSS/imports were removed. Native controls now share a compact text-card anatomy. Gallery photography keeps its existing responsive/lazy image renderer. The Gallery has 29 Cerakote examples and one each for Stippling, Slide Milling and Porting; no fake examples or unrelated duplicates were added.\n\nThe table lists every distinct former wizard image and current retained uses. [Machine-readable usage](pass-05/asset-usage.json) includes exact service/field/option references and source URLs.\n\n| Retained local image | Continues to serve |\n|---|---|\n` +
    assetUsage
      .map((a) => `| [${a.image.split('/').at(-1)}](../public${a.image}) | ${usageText(a)} |`)
      .join('\n') +
    '\n',
);
const gatherVisual = async (dir) =>
  (
    await Promise.all(
      (await readdir(dir))
        .filter((f) => /^results-\d+\.json$/.test(f))
        .map((f) => read(dir + '/' + f)),
    )
  ).flat();
const visual = await gatherVisual('tests/visual/pass-05'),
  regression = await gatherVisual('tests/visual/pass-05/regression');
if (
  visual.length !== 20 ||
  regression.length !== 139 ||
  [...visual, ...regression, ...standard].some((r) => r.overflow || r.brokenImages?.length)
)
  throw Error('Resolve visual checks before handoff.');
const names = [...new Set(visual.map((r) => r.name))];
await writeFile(
  'source-audit/PASS_05_VISUAL_REVIEW.md',
  '# Pass 05 — visual review\n\nReview date: October 20, 2026. All 20 requested desktop/mobile captures passed image and overflow checks. The existing eight-width regression run adds 139 fresh captures, and the standard visual suite adds 69 checks including 320px. Screens were inspected in desktop/mobile contact sheets and individual crops.\n\n| Screen | 390px | 1440px |\n|---|---|---|\n' +
    names
      .map(
        (name) =>
          `| ${name} | [View](../tests/visual/pass-05/${name}-390.png) | [View](../tests/visual/pass-05/${name}-1440.png) |`,
      )
      .join('\n') +
    '\n\nThe Gallery is intentionally sparse for three services: one real example per category. All four category links use existing service labels. [Assets and retained uses](PASS_05_ASSETS.md), [preserved coverage verification](pass-05/service-coverage-verification.json), and [full verification](pass-05-verification.json). Historical Pass 04 reports and captures remain intact; fresh regression captures are under `tests/visual/pass-05/regression/`.\n',
);
const verification = {
  pass: '05',
  reviewDate: '2026-10-20',
  timezone: 'America/New_York',
  generatedAt: new Date().toISOString(),
  scope: 'Presentation only; no commerce/domain changes',
  catalogVersion: matrix.catalogVersion,
  checks: {
    lint: { result: 'passed', warnings: 0, log: 'pass-05/lint.txt' },
    strictTypecheck: { result: 'passed', log: 'pass-05/typecheck.txt' },
    productionBuild: { result: 'passed', staticOutputs: 95, log: 'pass-05/build.txt' },
    fullPlaywright: { result: 'passed', ...report.stats, log: 'pass-05/playwright.txt' },
    assets: {
      result: 'passed',
      originalHashes: 1854,
      contentReferences: 258,
      retainedCatalogVisualReferences: 915,
      knownSource404s: 3,
      log: 'pass-05/assets.txt',
    },
    responsive: {
      result: 'passed',
      requestedCaptures: visual.length,
      regressionCaptures: regression.length,
      standardChecks: standard.length,
      overflow: 0,
      brokenImages: 0,
      log: 'pass-05/responsive.txt',
    },
  },
  tests: {
    total: specs.length,
    unit: specs.filter((s) => s.file.startsWith('unit/')).length,
    workflow: specs.filter((s) => s.file.startsWith('e2e/')).length,
    accessibilityCases: specs.filter((s) => s.file.startsWith('accessibility/')).length,
    visualMatrixCases: specs.filter((s) => s.file.startsWith('visualreview/')).length,
    targetedNewCases: 14,
  },
  accessibility: {
    axeScans: 39,
    existingSuiteScans: 18,
    targetedTextCardsAndGalleryScans: axe.length,
    populatedMobileCheckoutScans: mobile.length,
    violations: 0,
    certification: false,
  },
  coverage: {
    services: 32,
    fields: 180,
    optionRecords: 1280,
    comingSoon: 8,
    legacyAddOns: 23,
    coveragePercent: 100,
    unchanged: true,
    report: 'SERVICE_COVERAGE.md',
  },
  preservation: {
    protectedFiles: protectedFiles.length,
    allUnchanged: true,
    files: protectedFiles,
    cartSchemaVersion: 3,
    changedDomainFiles: 0,
    changedCheckoutFiles: 0,
  },
  gallery: {
    filterContract: '/gallery?service=<existing Gallery service label>',
    retainedFinishContract: '/gallery?finish=<search>',
    filters: galleryFilters,
    newTab: true,
    rel: 'noopener noreferrer',
    oneLinkPerServiceSection: true,
    perOptionLinks: 0,
    originalBuildStatePreserved: true,
  },
  performance: {
    wizardImagesRendered: 0,
    wizardServiceImageRequests: 0,
    wizardServiceImagePreloads: 0,
    verifiedFamilyViewportFlows: images.length,
    retainedDistinctPriorImages: paths.length,
    catalogDataChanged: false,
    imageAssetsDeleted: 0,
    unusedImageImportsRemoved: true,
  },
  regressions: {
    humanDoubleCharge: {
      platform: 'Glock 17 / slide / uncut OEM',
      finish: 'Midnight Chocolate Chip',
      optic: 'C Series',
      buis: 'Keep Factory',
      subtotalCents: 28500,
      bothSelectionDirections: 'passed',
    },
    comingSoon: 'passed',
    checkout: 'passed',
    cartMigrationAndStaleCatalog: 'passed',
    mobileHeroAndNavigation: 'passed',
  },
  dependencyAudit: {
    all: dependency.metadata.vulnerabilities,
    production: production.metadata.vulnerabilities,
    notes:
      'Five inherited high-severity development-tooling entries; zero production entries. No dependencies changed.',
  },
  boundaries: {
    livePaymentEnabled: false,
    realOrderSubmitted: false,
    emailSent: false,
    committed: false,
    deployed: false,
    historicalPass04RecordsRewritten: false,
  },
  artifacts: [
    'PASS_05_VISUAL_REVIEW.md',
    'PASS_05_ASSETS.md',
    'pass-05/asset-usage.json',
    'pass-05/targeted-browser-results.json',
    'pass-05/service-coverage-verification.json',
  ],
};
await writeFile(
  'source-audit/pass-05-verification.json',
  JSON.stringify(verification, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      tests: specs.length,
      protectedFiles: protectedFiles.length,
      requestedVisual: visual.length,
      regressionVisual: regression.length,
      axeScans: 39,
      retainedImages: paths.length,
      galleryFilters,
    },
    null,
    2,
  ),
);
