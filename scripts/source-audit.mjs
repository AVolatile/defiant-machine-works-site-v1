import { load } from 'cheerio';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const origin = 'https://defiantmachineworks.com';
const audit = 'source-audit';
const seeds = [
  '/',
  '/stippling/',
  '/stippling-info/',
  '/slide-milling-select-your-model/',
  '/glock-optic-cuts/',
  '/sig-optic-cuts/',
  '/smith-wesson-optic-cuts/',
  '/cz-optic-cuts/',
  '/cerakote/',
  '/cerakote-camos/',
  '/porting/',
  '/shop/',
  ...[2, 3, 4, 5, 6].map((n) => `/shop/page/${n}/`),
  '/gallery/',
  '/customize-now/',
  '/guarantees/',
  '/faq/',
  '/connect/',
  '/about/',
  '/blog/',
  '/shop-talk/',
  '/privacy-policy/',
  '/terms-and-conditions/',
];
const blocked =
  /wp-admin|wp-login|my-account|dmw-account|account|lost-password|checkout|cart|order-pay|order-received|logout|add-to-cart|remove_item|wc-ajax|\/feed\/|\/author\/|\/tag\/|\/attachment\//i;
const pages = [];
const assets = new Map();
const styles = new Set();
const seen = new Set();
const queue = [...seeds];
await mkdir(`${audit}/raw`, { recursive: true });
async function get(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'DefiantMigrationAudit/1.0 (public read-only migration)' },
      signal: AbortSignal.timeout(25000),
    });
    return r;
  } catch (e) {
    return { ok: false, status: 0, error: String(e) };
  }
}
function absolute(value, base = origin) {
  try {
    return new URL(value, base).href;
  } catch {
    return null;
  }
}
function addAsset(value, sourcePage, alt = '', role = 'image') {
  const url = absolute(value, sourcePage);
  if (
    !url ||
    new URL(url).origin !== origin ||
    !/\.(png|jpe?g|webp|avif|svg|ico|woff2?|ttf)(\?|$)/i.test(url)
  )
    return;
  const clean = url.split('?')[0];
  if (!assets.has(clean)) assets.set(clean, { sourceUrl: clean, sourcePage, alt, role });
}
function backgrounds(css, page) {
  for (const m of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) addAsset(m[1], page);
}
async function crawl(route) {
  const url = absolute(route);
  const r = await get(url);
  if (!r.ok) {
    pages.push({ url, status: r.status, error: r.error });
    return;
  }
  const html = await r.text();
  const $ = load(html);
  const main = $('main').length ? $('main') : $('body');
  const filename = (new URL(url).pathname.replaceAll('/', '_') || '_') + '.html';
  await writeFile(`${audit}/raw/${filename}`, html);
  const jsonLd = [];
  $('script[type="application/ld+json"]').each((_, e) => {
    try {
      jsonLd.push(JSON.parse($(e).text()));
    } catch {}
  });
  $('img').each((_, e) => {
    const el = $(e);
    addAsset(el.attr('src'), url, el.attr('alt') || '');
    const set = el.attr('srcset') || el.attr('data-srcset');
    if (set)
      for (const entry of set.split(','))
        addAsset(entry.trim().split(/\s+/)[0], url, el.attr('alt') || '');
    addAsset(el.attr('data-src'), url, el.attr('alt') || '');
  });
  $('a[href], [data-thumbnail]').each((_, e) => {
    addAsset($(e).attr('href'), url);
    addAsset($(e).attr('data-thumbnail'), url);
  });
  $('[data-settings]').each((_, e) => {
    try {
      const settings = JSON.parse($(e).attr('data-settings'));
      const walk = (v) => {
        if (typeof v === 'string') addAsset(v, url);
        else if (v && typeof v === 'object') Object.values(v).forEach(walk);
      };
      walk(settings);
    } catch {}
  });
  $('source[srcset]').each((_, e) => {
    for (const entry of $(e).attr('srcset').split(',')) addAsset(entry.trim().split(/\s+/)[0], url);
  });
  $('link[rel*="icon"]').each((_, e) =>
    addAsset($(e).attr('href'), url, 'Defiant Machine Works icon', 'brand'),
  );
  $('meta[property="og:image"],meta[name="twitter:image"]').each((_, e) =>
    addAsset($(e).attr('content'), url),
  );
  $('[style]').each((_, e) => backgrounds($(e).attr('style'), url));
  $('style').each((_, e) => backgrounds($(e).text(), url));
  $('link[rel="stylesheet"]').each((_, e) => {
    const u = absolute($(e).attr('href'), url);
    if (u && new URL(u).origin === origin) styles.add(u);
  });
  const links = [];
  $('a[href]').each((_, e) => {
    const u = absolute($(e).attr('href'), url);
    if (!u) return;
    const parsed = new URL(u);
    if (
      parsed.origin !== origin ||
      parsed.search ||
      blocked.test(u) ||
      /\.(png|jpe?g|webp|pdf|zip|svg|xml)$/i.test(parsed.pathname)
    )
      return;
    const p = parsed.pathname;
    links.push(p);
    if (!seen.has(p) && !queue.includes(p)) queue.push(p);
  });
  const products = [];
  $('.product').each((_, e) => {
    const el = $(e);
    const name = el.find('.woocommerce-loop-product__title,.product_title').first().text().trim();
    if (name)
      products.push({
        name,
        price: el.find('.price').first().text().trim(),
        url: el.find('a.woocommerce-LoopProduct-link').attr('href') || url,
      });
  });
  main.find('script,style,nav,header,footer,.ti-widget,.woocommerce-tabs #tab-reviews').remove();
  pages.push({
    url,
    status: r.status,
    title: $('title').text(),
    heading: $('h1').first().text().trim(),
    description: $('meta[name="description"]').attr('content') || '',
    text: main.text().replace(/\s+/g, ' ').trim(),
    headings: main
      .find('h1,h2,h3,h4')
      .map((_, e) => $(e).text().trim())
      .get(),
    links: [...new Set(links)],
    products,
    jsonLd,
    rawPath: `${audit}/raw/${filename}`,
  });
  console.log(`${r.status} ${new URL(url).pathname}`);
}
let api = [];
let apiStatus;
for (let n = 1; n <= 5; n++) {
  const r = await get(`${origin}/wp-json/wc/store/v1/products?per_page=100&page=${n}`);
  apiStatus = r.status;
  if (!r.ok) break;
  const batch = await r.json();
  if (!Array.isArray(batch)) break;
  api.push(...batch);
  if (batch.length < 100) break;
}
await writeFile(
  `${audit}/products-api.json`,
  JSON.stringify({ status: apiStatus, products: api }, null, 2),
);
for (const p of api) {
  for (const i of p.images || []) addAsset(i.src, p.permalink, i.alt);
  if (p.permalink) {
    const u = new URL(p.permalink);
    if (u.origin === origin && !queue.includes(u.pathname)) queue.push(u.pathname);
  }
}
while (queue.length && seen.size < 240) {
  const batch = [];
  while (batch.length < 2 && queue.length) {
    const route = queue.shift();
    if (seen.has(route)) continue;
    seen.add(route);
    batch.push(crawl(route));
  }
  await Promise.all(batch);
  await new Promise((r) => setTimeout(r, 180));
}
const fontFamilies = new Set();
const fontWeights = new Set();
const sourceColors = new Map();
for (const url of styles) {
  const r = await get(url);
  if (!r.ok) continue;
  const css = await r.text();
  backgrounds(css, url);
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/g)) fontFamilies.add(m[1].trim());
  for (const m of css.matchAll(/font-weight\s*:\s*([^;}]+)/g)) fontWeights.add(m[1].trim());
  for (const m of css.matchAll(/#[0-9a-f]{6}\b/gi))
    sourceColors.set(m[0].toLowerCase(), (sourceColors.get(m[0].toLowerCase()) || 0) + 1);
}
await writeFile(`${audit}/pages.json`, JSON.stringify(pages, null, 2));
const hashes = new Map();
const inventory = [];
function group(a) {
  const u = a.sourceUrl.toLowerCase();
  if (/logo|defiant-machine-works-icon|favicon/.test(u) || a.role === 'brand') return 'brand';
  if (/woff|ttf/.test(u)) return 'fonts';
  const p = a.sourcePage.toLowerCase();
  if (p.includes('/product/')) return 'products';
  if (p.includes('stippl')) return 'services/stippling';
  if (/milling|optic/.test(p)) return 'services/milling';
  if (p.includes('cerakote')) return 'services/cerakote';
  if (p.includes('porting')) return 'services/porting';
  if (p.includes('gallery')) return 'gallery';
  if (p === origin + '/') return 'hero';
  return 'legacy';
}
const entries = [...assets.values()];
console.log(`Downloading ${entries.length} owned assets`);
for (let i = 0; i < entries.length; i += 3) {
  await Promise.all(
    entries.slice(i, i + 3).map(async (a) => {
      const r = await get(a.sourceUrl);
      if (!r.ok) {
        inventory.push({ ...a, status: r.status, localPath: null });
        return;
      }
      const buffer = Buffer.from(await r.arrayBuffer());
      const hash = createHash('sha256').update(buffer).digest('hex');
      let localPath = hashes.get(hash);
      if (!localPath) {
        const name = decodeURIComponent(path.basename(new URL(a.sourceUrl).pathname)).replace(
          /[^a-zA-Z0-9._-]/g,
          '-',
        );
        localPath = `public/assets/dmw/${group(a)}/${hash.slice(0, 10)}-${name}`;
        await mkdir(path.dirname(localPath), { recursive: true });
        await writeFile(localPath, buffer);
        hashes.set(hash, localPath);
      }
      let metadata = {};
      try {
        metadata = await sharp(buffer).metadata();
      } catch {}
      inventory.push({
        ...a,
        localPath,
        type: metadata.format || path.extname(localPath).slice(1),
        width: metadata.width || null,
        height: metadata.height || null,
        hash,
        status: r.status,
      });
    }),
  );
  if (i % 60 === 0) console.log(`Assets ${i}/${entries.length}`);
}
const logo = inventory.find(
  (a) => a.sourceUrl.includes('DEFIANT-MACHINE-WORKS-ICON.png') && a.localPath,
);
let palette = [];
if (logo) {
  const { data, info } = await sharp(await readFile(logo.localPath))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const counts = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b, a] = data.subarray(i, i + 4);
    if (a > 240 && r > 100 && r > g * 1.3 && g > b * 1.1) {
      const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
      counts.set(hex, (counts.get(hex) || 0) + 1);
    }
  }
  palette = [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([hex, pixels]) => ({ hex, pixels }));
}
const brand = {
  logo: logo?.localPath || null,
  rust: palette[0]?.hex || null,
  extraction: 'Exact unquantized opaque orange pixel frequency from original PNG',
  palette,
  logos: inventory.filter((a) => group(a) === 'brand'),
  black: '#0a0a0a',
  white: '#ffffff',
  fontFamilies: [...fontFamilies],
  fontWeights: [...fontWeights],
};
const discrepancies = [];
const products = api.map((p) => {
  const detail = pages.find((x) => x.url === p.permalink);
  const listing = pages.flatMap((x) => x.products || []).find((x) => x.url === p.permalink);
  const price = Number(p.prices?.price) / 10 ** (p.prices?.currency_minor_unit ?? 2);
  if (listing?.price && !listing.price.includes(price.toFixed(2)))
    discrepancies.push({
      product: p.name,
      listingValue: listing.price,
      detailValue: detail?.text.match(/\$[\d,.]+/g)?.slice(0, 8) || null,
      apiValue: price,
      selectedValue: price,
      selectionReason:
        'Public WooCommerce Store API is authoritative; options and ranges require business confirmation.',
    });
  return { ...p, checkoutEnabled: false };
});
for (const [file, value] of Object.entries({
  'assets.json': inventory,
  'brand.json': brand,
  'fonts.json': {
    families: [...fontFamilies],
    weights: [...fontWeights],
    assets: inventory.filter((a) => /woff|ttf/.test(a.sourceUrl)),
  },
  'colors.json': {
    sourceCss: [...sourceColors].sort((a, b) => b[1] - a[1]).slice(0, 30),
    logoPalette: palette,
  },
  'products.json': products,
  'policies.json': pages.filter((x) => /faq|guarantees|privacy|terms|shipping/.test(x.url)),
  'discrepancies.json': discrepancies,
}))
  await writeFile(`${audit}/${file}`, JSON.stringify(value, null, 2));
await writeFile(
  `${audit}/crawl-report.md`,
  `# Defiant public source audit\n\nRun: ${new Date().toISOString()}\n\nPublic GET requests only; same-origin navigation; two page workers / three asset workers. No login, account, checkout, cart, order or administrative routes requested.\n\n- Pages: ${pages.length}\n- Successful pages: ${pages.filter((p) => p.status === 200).length}\n- API status: ${apiStatus}\n- API products: ${api.length}\n- Assets discovered: ${inventory.length}\n- Unique downloaded assets: ${hashes.size}\n- Exact logo rust: ${brand.rust}\n- Pricing discrepancies: ${discrepancies.length}\n- Queue remaining at safety cap: ${queue.length}\n\n## Unavailable routes/assets\n${pages
    .filter((p) => p.status !== 200)
    .map((p) => `- ${p.status} ${p.url}`)
    .join('\n')}\n${inventory
    .filter((p) => !p.localPath)
    .map((p) => `- ${p.status} ${p.sourceUrl}`)
    .join('\n')}\n`,
);
console.log(
  JSON.stringify({
    pages: pages.length,
    assets: inventory.length,
    products: api.length,
    rust: brand.rust,
  }),
);
