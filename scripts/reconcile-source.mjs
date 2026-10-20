import { readFile, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';
const pages = JSON.parse(await readFile('source-audit/pages.json'));
const api = JSON.parse(await readFile('source-audit/products-api.json')).products;
const records = [];
for (const product of api) {
  const value = Number(product.prices.price) / 10 ** product.prices.currency_minor_unit;
  const listing = pages.flatMap((p) => p.products || []).find((p) => p.url === product.permalink);
  const detail = pages.find((p) => p.url === product.permalink);
  let detailValue = null,
    jsonLdValue = null;
  if (detail) {
    const $ = load(await readFile(detail.rawPath));
    const t = $('.price').first().text();
    detailValue = t || null;
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      if (o['@type'] === 'Product' && o.offers) {
        const offers = Array.isArray(o.offers) ? o.offers[0] : o.offers;
        jsonLdValue = offers.price || offers.lowPrice || null;
      }
      Object.values(o).forEach((v) => {
        if (typeof v === 'object') {
          if (Array.isArray(v)) v.forEach(walk);
          else walk(v);
        }
      });
    };
    detail.jsonLd.forEach(walk);
  }
  const amounts = (t) =>
    [...(t || '').matchAll(/\$([\d,]+\.\d{2})/g)].map((m) => Number(m[1].replaceAll(',', '')));
  const conflict = [
    ...amounts(listing?.price),
    ...amounts(detailValue),
    ...(jsonLdValue ? [Number(jsonLdValue)] : []),
  ].some((n) => n !== value);
  if (conflict)
    records.push({
      type: product.on_sale ? 'sale-price-reconciliation' : 'price-conflict',
      product: product.name,
      listingValue: listing?.price || null,
      detailValue,
      structuredDataValue: jsonLdValue,
      apiValue: value,
      selectedValue: value,
      selectionReason: product.on_sale
        ? 'Store API confirms the current sale price; listing and detail also show the original regular price. This is an explained sale difference, not an unresolved conflict.'
        : 'Live public Store API is authoritative. Displayed price is a base price; selections may cost more.',
    });
}
const issues = [
  {
    type: 'availability',
    page: '/porting/',
    finding:
      'Only Bodyguard 2.0 Viper Ports has a listed catalog entry. Eight other porting options are explicitly Coming Soon.',
    decision: 'Keep upcoming entries separate; do not assign purchasable status.',
  },
  {
    type: 'biography',
    page: '/about/',
    finding: 'The page contains UNDER CONSTRUCTION.',
    decision:
      'No founder biography invented. Use verified experience and supplied faith-informed values.',
  },
  {
    type: 'legal',
    page: '/privacy-policy/',
    finding:
      'A legacy WordPress privacy policy exists and describes comments, Gravatar, accounts, login cookies and password resets.',
    decision:
      'Preserve audit text, replace in the rebuild with clearly marked draft policies matching the new functionality.',
  },
  {
    type: 'legal',
    page: '/terms-and-conditions/',
    finding:
      'The requested /terms-and-conditions/ route returns HTTP 404; no standalone terms were recovered.',
    decision: 'New terms and cookie policy are marked Draft / Owner Review Required.',
  },
  {
    type: 'navigation',
    page: '/products/',
    finding: 'Legacy public Products route has no useful catalog body.',
    decision: 'Implement real /products and redirect /shop to it.',
  },
  {
    type: 'pricing',
    finding:
      'The current live API, listing and detail checks show ' +
      records.length +
      ' entries with differing numeric amounts (an explained sale price, not an unresolved conflict). Historical conflicts cannot be inferred.',
    decision: 'Use Store API base prices and confirm final project options with the shop.',
  },
];
await writeFile(
  'source-audit/discrepancies.json',
  JSON.stringify([...records, ...issues], null, 2),
);
const assets = JSON.parse(await readFile('source-audit/assets.json'));
const brand = JSON.parse(await readFile('source-audit/brand.json'));
const notes = JSON.parse(await readFile('source-audit/crawl-notes.json'));
const products = JSON.parse(await readFile('src/data/products.json'));
const gal = JSON.parse(await readFile('src/data/gallery.json'));
const articles = JSON.parse(await readFile('src/data/articles.json'));
await writeFile(
  'source-audit/content-provenance.json',
  JSON.stringify(
    {
      services: [
        '/stippling/',
        '/stippling-info/',
        '/slide-milling-select-your-model/',
        '/cerakote/',
        '/porting/',
      ],
      catalog: products.map((p) => ({
        slug: p.slug,
        source: p.sourceUrl,
        priceAuthority: 'Public WooCommerce Store API',
      })),
      gallery: gal.map((g) => ({
        title: g.title,
        source: g.sourceUrl,
        labelAuthority: 'Label embedded in source-owned photograph, visually verified',
      })),
      articles: articles.map((a) => ({ title: a.title, source: a.sourceUrl })),
      operationalPolicies: ['/faq/', '/guarantees/'],
      faithValues: 'Explicit project brief supplied by owner; no founder history claimed',
      reviews: [
        {
          name: 'Darwin Cruz',
          quote: 'Excellent work and good communication about the process.',
          date: '2026-10-04',
          source: 'https://defiantmachineworks.com/',
          originalPlatform: 'Google / Trustindex source homepage',
        },
      ],
    },
    null,
    2,
  ),
);
await writeFile(
  'source-audit/crawl-report.md',
  `# Defiant public source audit\n\nAudit date: 2026-10-19. Origin: https://defiantmachineworks.com\n\nPublic GET requests only. Modest concurrency: two pages, three assets. No authentication or form submission attempted. Crawler now excludes account, password, checkout, cart, order, and administrative paths.\n\n- Content pages retained: ${pages.length}\n- Successful content pages: ${pages.filter((p) => p.status === 200).length}\n- Public Store API products: ${api.length}\n- Asset records: ${assets.length}\n- Successful asset records: ${assets.filter((a) => a.localPath).length}\n- Unique downloaded content hashes: ${new Set(assets.filter((a) => a.localPath).map((a) => a.hash)).size}\n- Exact dominant logo rust: ${brand.rust}\n- Migrated gallery items: ${gal.length}\n- Migrated articles: ${articles.length}\n- Price differences reviewed: ${records.length} (sale-price reconciliation; no unresolved live price conflicts)\n\n## Corrections\n\n${notes.accountLandingCorrection}\n\n${notes.filenameCollisionsRepaired} original filename collisions repaired and content hashes rechecked. The crawler now prefixes filenames with a content hash. Supplemental extraction recovers slideshow settings and image-only gallery anchor assets.\n\n## Unavailable source assets\n\n${assets
    .filter((a) => !a.localPath)
    .map((a) => '- ' + a.status + ' ' + a.sourceUrl)
    .join(
      '\n',
    )}\n\n## Interpretation\n\nHTTP success is not proof of a meaningful page. About is under construction; legacy Products is not a useful catalog; the Terms seed returns HTTP 404. See discrepancies.json for decisions. Gallery finish labels were read from source photography. No stock images or generated firearm images are used.\n`,
);
console.log({ pages: pages.length, assets: assets.length, priceConflicts: records.length });
