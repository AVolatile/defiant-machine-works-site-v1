import { readFile, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';
const $ = load(await readFile('source-audit/raw/_.html'));
const urls = [
  ...new Set(
    $('link[rel="stylesheet"]')
      .map((_, e) => $(e).attr('href'))
      .get()
      .filter((u) => u.startsWith('https://defiantmachineworks.com/')),
  ),
];
const headings = [],
  borders = [];
for (let i = 0; i < urls.length; i += 2)
  await Promise.all(
    urls.slice(i, i + 2).map(async (sourceUrl) => {
      try {
        const r = await fetch(sourceUrl, { signal: AbortSignal.timeout(15000) });
        if (!r.ok) return;
        const css = await r.text();
        for (const m of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
          const selector = m[1].trim();
          const declarations = m[2];
          if (
            /heading-title|(?:^|,)\s*h[1-6]\b/.test(selector) &&
            /font-|text-transform|letter-spacing/.test(declarations)
          )
            headings.push({ sourceUrl, selector, declarations });
          if (
            /border(?:-radius|-width|-color|-style)?\s*:/.test(declarations) &&
            /elementor-element|heading|button|body/.test(selector)
          )
            borders.push({
              sourceUrl,
              selector,
              declarations: declarations
                .split(';')
                .filter((d) => /border/.test(d))
                .join(';'),
            });
        }
      } catch {}
    }),
  );
const brand = JSON.parse(await readFile('source-audit/brand.json'));
brand.sourceHeadingStyling = headings.slice(0, 40);
brand.sourceBorderTreatments = borders.slice(0, 40);
brand.rebuildFonts = {
  display: 'Oswald',
  body: 'Heebo',
  reason: 'Two recovered source families retained; competing source font systems removed.',
};
await writeFile('source-audit/brand.json', JSON.stringify(brand, null, 2));
console.log({ headingRules: headings.length, borderRules: borders.length });
