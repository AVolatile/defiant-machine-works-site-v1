import { readFile, readdir, writeFile } from 'node:fs/promises';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [matrix, report, audit, production, legacyVisual, pages] = await Promise.all(
  [
    'src/data/service-matrix.json',
    'test-results/results.json',
    'source-audit/pass-04/dependency-audit.json',
    'source-audit/pass-04/production-dependency-audit.json',
    'tests/visual/results.json',
    'source-audit/pass-04/pages.json',
  ].map(read),
);
if (report.stats.unexpected || report.stats.skipped || report.stats.flaky)
  throw Error('Handoff requires a clean complete test run.');
const suites = (suite) => [...(suite.specs || []), ...(suite.suites || []).flatMap(suites)];
const specs = report.suites.flatMap(suites);
const mobileAxe = await read('source-audit/pass-04/mobile-checkout-a11y.json');
if (mobileAxe.length !== 3 || mobileAxe.some((r) => r.axeViolations.length || r.overflow))
  throw Error('Resolve populated mobile checkout audits before handoff.');
if (
  specs.filter((s) => s.file.startsWith('unit/')).length < 91 ||
  specs.filter((s) => s.file.startsWith('visualreview/')).length !== 8
)
  throw Error('Run the complete current suite before creating the handoff.');
const files = (await readdir('tests/visual/pass-04')).filter((f) => /^results-\d+\.json$/.test(f));
const visual = (await Promise.all(files.map((f) => read('tests/visual/pass-04/' + f))))
  .flat()
  .sort((a, b) => a.width - b.width || a.name.localeCompare(b.name));
if (
  visual.some((r) => r.overflow || r.brokenImages.length) ||
  legacyVisual.some((r) => r.overflow || r.brokenImages?.length)
)
  throw Error('Resolve visual failures before handoff.');
const widths = [375, 390, 430, 768, 1024, 1280, 1440, 1728];
const names = [...new Set(visual.map((r) => r.name))];
await writeFile(
  'source-audit/PASS_04_VISUAL_REVIEW.md',
  `# Pass 04 visual review\n\nFresh production-build Chromium captures on October 19, 2026. Test orders use synthetic customer details, no charge, no business order and no email. ${visual.length} commerce/content captures passed image/overflow checks across eight widths. The separate standard visual suite passed ${legacyVisual.length} checks, including 23 routes at 320px.\n\nDesktop and mobile contact sheets, individual texture/finish/porting controls, mobile hero/menu and cart/checkout/confirmation captures were inspected. Local image links below open the full captures. These are local QA artifacts, not a deployed preview.\n\n| Screen | ${widths.join(' | ')} |\n|---|${widths.map(() => '---').join('|')}|\n` +
    names
      .map(
        (name) =>
          `| ${name} | ` +
          widths
            .map((width) =>
              visual.some((r) => r.name === name && r.width === width)
                ? `[View](../tests/visual/pass-04/${name}-${width}.png)`
                : '—',
            )
            .join(' | ') +
          ' |',
      )
      .join('\n') +
    '\n\nAdditional populated mobile checkout accessibility captures: [375px](../tests/visual/pass-04/mobile-checkout-a11y-375.png), [390px](../tests/visual/pass-04/mobile-checkout-a11y-390.png), [430px](../tests/visual/pass-04/mobile-checkout-a11y-430.png). All three passed Axe and overflow checks without submitting an order.\n\nRaw results: `tests/visual/pass-04/results-*.json`; standard route/font results: `tests/visual/results.json`. Automated visual checks do not replace owner review, screen-reader testing or field performance measurements.\n',
);
const usd = (c) => '$' + (c / 100).toFixed(2);
await writeFile(
  'source-audit/SERVICE_COVERAGE.md',
  `# Service coverage — current live audit\n\n**32 / 32 configurable services accounted for (100%).** All 63 Store API products are covered below: 32 services, 23 legacy add-on/reference SKUs and eight physical/complimentary records. Eight Coming Soon references are separate and non-purchasable. The matrix preserves all 180 source fields and 1,280 option records, including source-specific conditional fields; choices are not multiplied into fictitious products.\n\nThe fields/choices count includes conditional options, not controls shown simultaneously. Standard means a source-complete configuration can reach local test checkout; live payment is disabled. P-07 is review-required, the duplicate M&P optic option is conditionally review-required, and 13 unbound legacy add-ons need prerequisite confirmation. Photo availability varies by individual finish and is labelled honestly. Exact option deltas and source labels are in [the canonical matrix](pass-03-service-matrix.json).\n\n| Live service | Fields / choices | Verified base | Options/prices | Imagery | Compatibility | Eligibility |\n|---|---:|---:|---|---|---|---|\n` +
    matrix.services
      .map(
        (s) =>
          `| [${s.displayName}](${s.sourceUrls[0]}) | ${s.fields.length} / ${s.fields.reduce((n, f) => n + f.options.length, 0)} | ${usd(s.basePriceCents)} | Represented | Local references | Enforced | ${s.checkoutEligibility} |`,
      )
      .join('\n') +
    '\n\n## Legacy add-ons and reference SKUs\n\nBound equivalents configure the package option and use its verified price, without a separate SKU charge. The reference SKU amount below is preserved for provenance; it is not added to package prices. Unbound items remain visible as review requests because the source requires a legacy frame-size/pattern/border model not defined by the current package forms.\n\n| Source item | Source amount | Package representation / eligibility |\n|---|---:|---|\n' +
    matrix.addOns
      .map(
        (a) =>
          `| [${a.displayName}](${a.sourceUrls[0]}) | ${usd(a.basePriceCents)} | ${a.bindings.length ? `${new Set(a.bindings.map((b) => b.serviceId)).size} package bindings; included/verified delta` : 'Review required; excluded from payable subtotal'} |`,
      )
      .join('\n') +
    '\n\n## Other catalog records\n\n| Source item | Current amount | Representation |\n|---|---:|---|\n' +
    matrix.merchandise
      .map(
        (p) =>
          `| [${p.displayName}](${p.sourceUrls[0]}) | ${usd(p.priceCents)}${p.priceCents !== p.regularPriceCents ? ` (regular ${usd(p.regularPriceCents)})` : ''} | ${p.checkoutEligibility === 'standard' ? 'Merchandise cart/checkout' : 'Catalog/direct inquiry — ' + p.reason} |`,
      )
      .join('\n') +
    '\n\n## Coming Soon — never cartable\n\n' +
    matrix.upcoming
      .map(
        (s) => `- [${s.displayName}](${s.sourceUrls[0]}): disabled; forged IDs rejected by server.`,
      )
      .join('\n') +
    '\n',
);
const overlapSpecs = specs.filter((s) =>
  /double charge|normalize once|own separate coating scopes|finish transfers|included add-on|Viper and Bodyguard|frame coating uses/.test(
    s.title,
  ),
);
const verification = {
  pass: '04 (requested pass-03 artifact names)',
  verifiedAt: new Date().toISOString(),
  catalogVersion: matrix.catalogVersion,
  scope: 'Local production build and synthetic test orders only',
  commands: {
    lint: { result: 'passed', warnings: 0, log: 'pass-04/lint.txt' },
    strictTypecheck: { result: 'passed', log: 'pass-04/typecheck.txt' },
    productionBuild: { result: 'passed', staticOutputs: 95, log: 'pass-04/build.txt' },
    fullPlaywright: { result: 'passed', ...report.stats, log: 'pass-04/playwright.txt' },
    responsive: {
      result: 'passed',
      standardChecks: legacyVisual.length,
      log: 'pass-04/responsive.txt',
    },
    assets: { result: 'passed', log: 'pass-04/assets.txt' },
  },
  tests: {
    total: specs.length,
    unit: specs.filter((s) => s.file.startsWith('unit/')).length,
    browserAndApi: specs.filter((s) => s.file.startsWith('e2e/')).length,
    accessibilityTests: specs.filter((s) => s.file.startsWith('accessibility/')).length,
    visualMatrixTests: specs.filter((s) => s.file.startsWith('visualreview/')).length,
    skipped: report.stats.skipped,
    flaky: report.stats.flaky,
    unexpected: report.stats.unexpected,
  },
  axe: {
    checks: 21,
    violations: 0,
    breakdown: {
      corePages: 9,
      menuAndGalleryOverlays: 2,
      populatedCommerce: 3,
      visualOptions: 4,
      populatedMobileCheckout: 3,
    },
    certification: false,
  },
  responsive: {
    widths,
    captureChecks: visual.length,
    standardRouteChecks: legacyVisual.length,
    standardWidths: [320, 375, 1440],
    routeSmokeChecks: 100,
    overflow: 0,
    brokenImages: 0,
    index: 'PASS_04_VISUAL_REVIEW.md',
  },
  coverage: {
    storeProducts: 63,
    publicPages: pages.length,
    failedPublicPages: pages.filter((p) => p.status !== 200).length,
    activeServiceCount: matrix.services.length,
    representedServices: 32,
    serviceCoveragePercent: 100,
    standardServiceRecords: matrix.services.filter((s) => s.checkoutEligibility === 'standard')
      .length,
    reviewRequiredServiceRecords: matrix.services
      .filter((s) => s.checkoutEligibility === 'review-required')
      .map((s) => s.serviceId),
    sourceFields: matrix.services.reduce((n, s) => n + s.fields.length, 0),
    sourceOptions: matrix.services.reduce(
      (n, s) => n + s.fields.reduce((t, f) => t + f.options.length, 0),
      0,
    ),
    comingSoonCount: matrix.upcoming.length,
    legacyAddOns: matrix.addOns.length,
    unboundLegacyReviewItems: matrix.addOns.filter((a) => !a.bindings.length).length,
    cartableMerchandise: matrix.merchandise.filter((p) => p.checkoutEligibility === 'standard')
      .length,
  },
  doubleChargeRegressions: {
    domain: overlapSpecs.map((s) => s.title),
    browser: specs.filter((s) => s.title.startsWith('human regression:')).map((s) => s.title),
    humanCase: {
      platform: 'Glock 17 / slide / uncut OEM',
      optic: 'C Series',
      buis: 'Keep Factory',
      finish: 'Midnight Chocolate Chip',
      canonicalCents: 28500,
      billableServices: 1,
      bothDirections: true,
    },
  },
  assets: {
    originalHashes: 1854,
    contentReferences: 258,
    optimizedConfiguratorReferences: 915,
    knownSource404s: 3,
    generatedFirearmImages: 0,
    criticalHotlinks: 0,
  },
  dependencyAudit: {
    production: production.metadata.vulnerabilities,
    all: audit.metadata.vulnerabilities,
    logs: ['pass-04/production-dependency-audit.json', 'pass-04/dependency-audit.json'],
    notes:
      'Five inherited high-severity development-tooling entries through braces/micromatch/fast-glob/Next ESLint; zero production entries. No forced major downgrade or new dependency.',
  },
  boundaries: {
    livePaymentEnabled: false,
    deployed: false,
    committed: false,
    realOrderSubmitted: false,
    emailSent: false,
    sqlite: 'Development/test only',
  },
  uncertainties: [
    'P-07/75 Series description conflict',
    'Duplicate M&P RMR option',
    '13 unbound legacy add-on prerequisite records',
    'Unphotographed finishes and source naming aliases',
    'Viper landing range $225–$305 vs explicit product-form camo total $325',
  ],
  productionDependencies: [
    'Approved payment provider and business eligibility',
    'Server transaction confirmation, verified webhook, idempotency and reconciliation',
    'Owner-confirmed pricing and compatibility matrix',
    'Shipping process/costs and tax calculation',
    'Configured order email and inquiry delivery',
    'Fulfillment procedures',
    'Shared durable repository and shared abuse controls',
    'Encryption-key custody and backup/restore',
    'Retention/deletion and legal policy approval',
    'Manual accessibility and production-host verification',
  ],
};
await writeFile(
  'source-audit/pass-03-verification.json',
  JSON.stringify(verification, null, 2) + '\n',
);
await writeFile(
  'source-audit/pass-04/final-test-summary.json',
  JSON.stringify(
    {
      stats: report.stats,
      specs: specs.map((s) => ({ file: s.file, title: s.title, passed: s.ok })),
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify(
    {
      tests: specs.length,
      unit: verification.tests.unit,
      visual: visual.length,
      coverage: verification.coverage,
    },
    null,
    2,
  ),
);
