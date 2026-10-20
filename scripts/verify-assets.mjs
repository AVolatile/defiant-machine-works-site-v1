import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const inventory = JSON.parse(await readFile('source-audit/assets.json'));
const checked = new Set();
let verified = 0;
for (const asset of inventory.filter((a) => a.localPath)) {
  if (checked.has(asset.localPath)) continue;
  const buffer = await readFile(asset.localPath);
  if (createHash('sha256').update(buffer).digest('hex') !== asset.hash)
    throw Error(`Asset hash mismatch: ${asset.localPath}`);
  checked.add(asset.localPath);
  verified++;
}
const paths = [];
for (const file of ['products', 'gallery', 'service-records', 'texture-images']) {
  const records = JSON.parse(await readFile(`src/data/${file}.json`));
  for (const r of records) {
    for (const image of r.images || [r.image]) if (image) paths.push(image);
  }
}
for (const image of paths) {
  if (!image.startsWith('/assets/dmw/')) throw Error(`Nonlocal image: ${image}`);
  await access('public' + image);
}
const gallery = JSON.parse(await readFile('src/data/gallery.json'));
const expected = {
  '3.png': 'Wood Chip',
  '4.png': 'Black Multicam',
  '5.png': 'DCU Chocolate Chip',
  '6.png': 'Arctic Multicam',
  '7.png': 'Blueberry Chocolate Chip',
  '8.png': 'Rocky Road',
};
for (const [name, title] of Object.entries(expected))
  if (!gallery.some((g) => g.sourceUrl.endsWith('/2025/09/' + name) && g.title === title))
    throw Error('Gallery label mismatch: ' + title);
console.log(
  `Verified ${verified} original asset hashes and ${paths.length} content image references. Known source 404s: ${inventory.filter((a) => !a.localPath).length}.`,
);
const matrix = JSON.parse(await readFile('src/data/service-matrix.json'));
const references = matrix.services.flatMap((service) => [
  ...service.visualReferences,
  ...service.fields.flatMap((field) =>
    field.options.flatMap((option) => (option.reference ? [option.reference] : [])),
  ),
]);
for (const reference of references) {
  if (!reference.image.startsWith('/assets/dmw/optimized/'))
    throw Error(`Unoptimized configurator image: ${reference.image}`);
  if (!reference.sourceUrl.startsWith('https://defiantmachineworks.com/'))
    throw Error(`Missing Defiant provenance: ${reference.sourceUrl}`);
  await access('public' + reference.image);
}
console.log(
  `Verified ${references.length} optimized configurator image references with Defiant provenance.`,
);
