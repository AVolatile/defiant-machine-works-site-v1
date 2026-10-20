import { readFile, writeFile, access } from 'node:fs/promises';
import sharp from 'sharp';

// An explicit editorial selection, separate from the commerce catalog and its availability.
const selection = JSON.parse(await readFile('source-audit/pass-06c/media-selection.json'));
const assets = JSON.parse(await readFile('source-audit/assets.json'));
const textures = JSON.parse(await readFile('src/data/texture-images.json'));
const current = JSON.parse(await readFile('src/data/gallery.json'));
let previousCoverage = [];
try {
  previousCoverage = JSON.parse(
    await readFile('source-audit/pass-06c/media-coverage.json'),
  ).records;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const records = [];
const coverage = [];
for (const item of selection) {
  const asset = assets.find((asset) => asset.sourceUrl === item.sourceUrl && asset.localPath);
  if (!asset) throw Error(`Missing retained source: ${item.sourceUrl}`);
  const texture = textures.find((texture) => texture.sourceUrl === item.sourceUrl);
  const image = texture?.image || `/assets/dmw/optimized/${asset.hash.slice(0, 14)}.webp`;
  let generated = false;
  try {
    await access('public' + image);
  } catch {
    await sharp(asset.localPath)
      .rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile('public' + image);
    generated = true;
  }
  records.push({ ...item, finish: '', image });
  coverage.push({
    ...item,
    sourceImage: asset.localPath,
    sourceHash: asset.hash,
    image,
    derivative: generated
      ? 'generated from retained original'
      : previousCoverage.find((previous) => previous.sourceUrl === item.sourceUrl)?.derivative ||
        'reused existing derivative',
  });
}
if (new Set(coverage.map((item) => item.sourceHash)).size !== records.length)
  throw Error('Duplicate original content in the editorial selection');
await writeFile(
  'src/data/gallery.json',
  JSON.stringify([...current.filter((item) => item.service === 'Cerakote'), ...records], null, 2) +
    '\n',
);
const services = JSON.parse(await readFile('src/data/service-records.json'));
for (const [slug, example] of [
  ['stippling', 'kevlar-stippling-detail'],
  ['slide-milling', 'genesis-slide-milling'],
])
  services.find((service) => service.slug === slug).image = records.find(
    (record) => record.slug === example,
  ).image;
await writeFile('src/data/service-records.json', JSON.stringify(services, null, 2) + '\n');
await writeFile(
  'source-audit/pass-06c/media-coverage.json',
  JSON.stringify(
    { source: 'Retained public source audit; no new downloads', records: coverage },
    null,
    2,
  ) + '\n',
);
console.log(`${records.length} verified service references; Cerakote records preserved.`);
