import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { load } from 'cheerio';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
const origin = 'https://defiantmachineworks.com';
const candidates = new Map();
for (const file of await readdir('source-audit/raw')) {
  if (/dmw-account/.test(file)) continue;
  const $ = load(await readFile('source-audit/raw/' + file));
  const page = origin + file.slice(0, -5).replaceAll('_', '/');
  function add(v) {
    try {
      const url = new URL(v);
      if (url.origin === origin && /\.(png|jpg|jpeg|webp|avif|svg|woff2?)$/i.test(url.pathname))
        candidates.set(url.href, page);
    } catch {}
  }
  $('a[href]').each((_, e) => add($(e).attr('href')));
  $('[data-settings]').each((_, e) => {
    try {
      const walk = (v) => {
        if (typeof v === 'string') add(v);
        else if (v && typeof v === 'object') Object.values(v).forEach(walk);
      };
      walk(JSON.parse($(e).attr('data-settings')));
    } catch {}
  });
}
const inventory = JSON.parse(await readFile('source-audit/assets.json'));
const hashes = new Map(inventory.filter((a) => a.localPath).map((a) => [a.hash, a.localPath]));
const missing = [...candidates].filter(
  ([u]) => !inventory.some((a) => a.sourceUrl === u && a.localPath),
);
console.log('Supplemental assets', missing.length);
for (let i = 0; i < missing.length; i += 2)
  await Promise.all(
    missing.slice(i, i + 2).map(async ([sourceUrl, sourcePage]) => {
      try {
        const r = await fetch(sourceUrl, { signal: AbortSignal.timeout(20000) });
        if (!r.ok) return;
        const buf = Buffer.from(await r.arrayBuffer());
        const hash = createHash('sha256').update(buf).digest('hex');
        let localPath = hashes.get(hash);
        if (!localPath) {
          localPath =
            'public/assets/dmw/gallery/' +
            hash.slice(0, 10) +
            '-' +
            path.basename(new URL(sourceUrl).pathname);
          await mkdir(path.dirname(localPath), { recursive: true });
          await writeFile(localPath, buf);
          hashes.set(hash, localPath);
        }
        let m = {};
        try {
          m = await sharp(buf).metadata();
        } catch {}
        inventory.push({
          sourceUrl,
          sourcePage,
          localPath,
          hash,
          type: m.format,
          width: m.width || null,
          height: m.height || null,
          alt: '',
          status: r.status,
        });
      } catch {}
    }),
  );
await writeFile('source-audit/assets.json', JSON.stringify(inventory, null, 2));
console.log('Complete', inventory.length);
