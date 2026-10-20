import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';
const origin = 'https://defiantmachineworks.com',
  dir = 'source-audit/pass-04';
await mkdir(`${dir}/raw`, { recursive: true });
const blocked =
  /wp-admin|wp-login|account|checkout|cart|order-pay|order-received|logout|add-to-cart|remove_item|wc-ajax|lost-password/i;
async function get(url) {
  if (blocked.test(url)) throw Error(`Excluded URL: ${url}`);
  const r = await fetch(url, {
    headers: { 'User-Agent': 'DefiantReadOnlyCatalogAudit/4.0' },
    signal: AbortSignal.timeout(30000),
  });
  return r;
}
const products = [];
for (let page = 1; page <= 10; page++) {
  const r = await get(`${origin}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
  if (!r.ok) throw Error(`Store API ${r.status}`);
  products.push(...(await r.json()));
  if (page >= Number(r.headers.get('x-wp-totalpages') || 1)) break;
}
await writeFile(`${dir}/products-api.json`, JSON.stringify(products, null, 2) + '\n');
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
  '/faq/',
  '/shop/',
];
const queue = [...seeds.map((p) => origin + p), ...products.map((p) => p.permalink)],
  seen = new Set(),
  pages = [];
async function worker() {
  while (queue.length) {
    const url = queue.shift();
    if (seen.has(url) || blocked.test(url)) continue;
    seen.add(url);
    if (seen.size > 150) throw Error('Audit cap reached');
    try {
      const r = await get(url);
      if (!r.ok) {
        pages.push({ url, status: r.status });
        continue;
      }
      const html = await r.text(),
        $ = cheerio.load(html);
      const rawPath = `${dir}/raw/${new URL(url).pathname.replaceAll('/', '_') || '_'}.html`;
      await writeFile(rawPath, html);
      const scripts = $('script')
        .map((i, e) => $(e).text())
        .get();
      const match = scripts
        .find((t) => t.includes('var ProductBuilderOptions_'))
        ?.match(/var ProductBuilderOptions_\w+\s*=\s*(\{.*\});/);
      const builder = match ? JSON.parse(match[1]) : null;
      const fields =
        builder?.Options?.Rows?.flatMap((row) => row.Columns.map((col) => col.Field)) || [];
      const main = $('main').length ? $('main') : $('body');
      const clean = cheerio.load(main.html() || '');
      clean('script,style,header,footer,nav').remove();
      const links = main
        .find('a[href]')
        .map((i, e) => {
          try {
            return new URL($(e).attr('href'), url).href;
          } catch {
            return null;
          }
        })
        .get()
        .filter(
          (u) => u?.startsWith(origin) && !blocked.test(u) && !u.includes('?') && !u.includes('#'),
        );
      for (const link of links)
        if (/\/product\/|optic-cuts|slide-milling|stippling-info/.test(link) && !seen.has(link))
          queue.push(link);
      pages.push({
        url,
        status: r.status,
        fetchedAt: new Date().toISOString(),
        rawPath,
        sha256: createHash('sha256').update(html).digest('hex'),
        title: $('title').text(),
        text: clean.text().replace(/\s+/g, ' ').trim(),
        links: [...new Set(links)],
        fields,
        variations: $('[data-product_variations]')
          .map((i, e) => $(e).attr('data-product_variations'))
          .get(),
        images: main
          .find('img')
          .map((i, e) => ({ src: $(e).attr('src'), alt: $(e).attr('alt') }))
          .get(),
      });
      console.log(new URL(url).pathname, fields.length ? 'fields:' + fields.length : '');
    } catch (e) {
      pages.push({ url, status: 0, error: String(e) });
    }
  }
}
await Promise.all([worker(), worker()]);
await writeFile(`${dir}/pages.json`, JSON.stringify(pages, null, 2) + '\n');
console.log({
  products: products.length,
  pages: pages.length,
  errors: pages.filter((p) => p.status !== 200).map((p) => ({ url: p.url, status: p.status })),
});
