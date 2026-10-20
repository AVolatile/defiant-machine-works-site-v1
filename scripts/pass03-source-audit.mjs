import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';
const products = JSON.parse(await readFile('src/data/products.json', 'utf8'));
const records = [];
for (const product of products.filter((p) => p.service === 'Slide Milling')) {
  const url = product.sourceUrl;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const script = $('script')
    .map((i, e) => $(e).text())
    .get()
    .find((t) => t.includes('var ProductBuilderOptions_'));
  const match = script?.match(/var ProductBuilderOptions_\w+\s*=\s*(\{.*\});/);
  if (!match) throw new Error(`No public builder configuration: ${url}`);
  const builder = JSON.parse(match[1]);
  const fields = builder.Options.Rows.flatMap((row) => row.Columns.map((col) => col.Field));
  const retained = await readFile(`source-audit/raw/_product_${product.slug}_.html`, 'utf8');
  const oldScript = cheerio
    .load(retained)('script')
    .map((i, e) => cheerio.load(retained)(e).text())
    .get()
    .find((t) => t.includes('var ProductBuilderOptions_'));
  const oldMatch = oldScript?.match(/var ProductBuilderOptions_\w+\s*=\s*(\{.*\});/);
  records.push({
    slug: product.slug,
    url,
    fetchedAt: new Date().toISOString(),
    status: response.status,
    htmlSha256: createHash('sha256').update(html).digest('hex'),
    priceText: $('.price').first().text().trim(),
    matchesRetainedBuilder: oldMatch
      ? JSON.stringify(JSON.parse(oldMatch[1]).Options) === JSON.stringify(builder.Options)
      : false,
    fields,
  });
  console.log(product.slug, fields.length, 'fields');
}
await writeFile('source-audit/pass-03-live-options.json', JSON.stringify(records, null, 2) + '\n');
// Keep runtime data small, factual, and independent of the legacy plugin.
const normalized = records.map((r) => ({
  serviceId: r.slug,
  sourceUrl: r.url,
  fields: r.fields.map((f) => ({
    id: String(f.Id),
    label: f.Label,
    required: f.Required,
    type: f.Type,
    priceType: f.PriceType,
    options: (f.Options || []).map((o) => ({
      id: String(o.Id),
      label: o.Label,
      price: o.RegularPrice,
      priceType: o.PriceType,
    })),
    conditions: (f.Conditions || []).map((c) => ({
      showWhenTrue: c.ShowWhenTrue,
      groups: c.ConditionGroups.map((g) =>
        g.ConditionLines.map((l) => ({
          fieldId: String(l.FieldId),
          comparison: l.Comparison,
          values: l.Value.map(String),
        })),
      ),
    })),
  })),
}));
await writeFile('src/data/milling-options.json', JSON.stringify(normalized, null, 2) + '\n');
