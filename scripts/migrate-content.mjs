import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { load } from 'cheerio';
import sharp from 'sharp';
const assets = JSON.parse(await readFile('source-audit/assets.json'));
const api = JSON.parse(await readFile('source-audit/products-api.json')).products;
const pages = JSON.parse(await readFile('source-audit/pages.json'));
const origin = 'https://defiantmachineworks.com';
await mkdir('public/assets/dmw/optimized', { recursive: true });
const optimized = new Map();
async function image(url) {
  const a = assets.find((x) => x.sourceUrl === url && x.localPath);
  if (!a) throw Error('Missing source image ' + url);
  if (optimized.has(a.hash)) return optimized.get(a.hash);
  const output = `public/assets/dmw/optimized/${a.hash.slice(0, 14)}.webp`;
  let exists = false;
  try {
    await access(output);
    exists = true;
  } catch {}
  if (!exists)
    await sharp(a.localPath)
      .rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(output);
  const result = output.replace('public', '');
  optimized.set(a.hash, result);
  return result;
}
async function byName(name) {
  const a = assets.find((x) => x.sourceUrl.endsWith('/' + name) && x.localPath);
  if (!a) throw Error(name);
  return image(a.sourceUrl);
}
const clean = (html) =>
  load(html || '')
    .text()
    .replace(/\s+/g, ' ')
    .trim();
const products = [];
for (const p of api) {
  const cats = p.categories.map((c) => c.name.toUpperCase());
  let kind = 'service',
    category = 'Slide / Machining',
    service = 'Slide Milling';
  if (
    cats.some((c) => ['PATTERN', 'MOD', 'BORDER', 'THUMB SUPPORT', 'STIPPLING ADD-ONS'].includes(c))
  ) {
    kind = 'addon';
    category = 'Stippling add-ons';
    service = 'Stippling';
  } else if (cats.includes('STIPPLING')) {
    category = 'Stippling';
    service = 'Stippling';
  } else if (cats.includes('CERAKOTE')) {
    category = 'Cerakote';
    service = 'Cerakote';
  } else if (cats.includes('PORTING')) {
    category = 'Porting';
    service = 'Porting';
  } else if (cats.includes('STICKER')) {
    kind = 'product';
    category = 'Merch';
    service = 'Product Question';
  } else if (cats.some((c) => ['ACCESSORY', 'IRON SIGHTS', 'PRODUCTS'].includes(c))) {
    kind = 'product';
    category = 'Accessories';
    service = 'Product Question';
  } else if (!cats.length) {
    kind = 'product';
    category = 'Other';
    service = 'Product Question';
  }
  const $ = load(p.description || p.short_description || '');
  const paragraphs = $('p,li,h2,h3')
    .map((_, e) => $(e).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter(Boolean);
  const imgs = [];
  for (const i of p.images || []) {
    try {
      imgs.push(await image(i.src));
    } catch {}
  }
  if (!imgs.length) imgs.push(await byName('DSC01562.jpg'));
  products.push({
    slug: p.slug,
    title: clean(p.name),
    category,
    kind,
    service,
    price: Number(p.prices.price) / 10 ** p.prices.currency_minor_unit,
    regularPrice: Number(p.prices.regular_price) / 10 ** p.prices.currency_minor_unit,
    salePrice: p.on_sale ? Number(p.prices.sale_price) / 10 ** p.prices.currency_minor_unit : null,
    pricePrefix: kind === 'product' ? '' : 'From ',
    description: paragraphs.length
      ? paragraphs
      : [`Ask Defiant about ${clean(p.name)} and the options available for your project.`],
    images: imgs,
    availability: p.is_in_stock ? 'Available for inquiry' : 'Ask about availability',
    attributes: (p.attributes || []).map((a) => ({
      name: clean(a.name),
      values: a.terms.map((t) => clean(t.name)),
    })),
    checkoutEnabled: false,
    sourceUrl: p.permalink,
  });
}
const services = [
  {
    slug: 'stippling',
    title: 'Stippling',
    eyebrow: 'A grip that feels like yours.',
    description:
      'Purposeful texture. Clean borders. A frame tailored to the way you carry and shoot.',
    benefit: 'Texture, control, and a personal finish.',
    image: products.find((p) => p.slug === 'glock-crown-lvl-3-stippling-package').images[0],
    platforms: [
      'Glock',
      'SIG Sauer',
      'Smith & Wesson',
      'CZ',
      'Springfield Armory',
      'FN',
      'Ruger',
      'Staccato',
      'OA Defense',
      'Beretta',
      'PSA',
    ],
    sourceUrl: origin + '/stippling/',
  },
  {
    slug: 'slide-milling',
    title: 'Slide milling',
    eyebrow: 'Precision, down to the cut.',
    description:
      'Optic cuts and custom slide work for source-listed Glock, SIG Sauer, Smith & Wesson, and CZ platforms.',
    benefit: 'Machined detail. A build that works together.',
    image: await byName('DSC01161.jpg'),
    platforms: ['Glock', 'SIG Sauer', 'Smith & Wesson', 'CZ'],
    sourceUrl: origin + '/slide-milling-select-your-model/',
  },
  {
    slug: 'cerakote',
    title: 'Cerakote',
    eyebrow: 'Protection with personality.',
    description:
      'Solid colors, custom mixes, and camouflage. Real finishes with the care and character your build deserves.',
    benefit: 'Surface protection. An unmistakable finish.',
    image: await byName('DSC05246.jpg'),
    platforms: ['Complete pistol', 'Frame', 'Slide', 'Custom project'],
    sourceUrl: origin + '/cerakote/',
  },
  {
    slug: 'porting',
    title: 'Porting',
    eyebrow: 'Considered, platform-specific work.',
    description:
      'Explore Bodyguard 2.0 Viper Ports, and speak with Defiant about upcoming porting options.',
    benefit: 'A dedicated service for your specific platform.',
    image: products.find((p) => p.slug === 'bodyguard-2-0-viper-ports').images[0],
    platforms: ['Smith & Wesson Bodyguard 2.0'],
    sourceUrl: origin + '/porting/',
  },
];
for (const service of services)
  service.startingPrice = Math.min(
    ...products
      .filter(
        (p) => p.kind === 'service' && p.service.toLowerCase() === service.title.toLowerCase(),
      )
      .map((p) => p.price),
  );
const solids = {
  '14.png': 'Jesse James Eastern Front H-400',
  '13.png': 'Sniper Grey H-234',
  '12.png': 'Rose Gold H-327',
  '11.png': 'Sniper Green H-229',
  '10.png': 'Tungsten H-237',
  '9.png': 'Blue Titanium H-185',
  '3.png': 'OD Green F-105',
  '4.png': 'Sig Dark Grey H-210',
  '5.png': 'Midnight Bronze H-294',
  '6.png': 'Burnt Bronze H-148',
  '7.png': 'Phantom Teal DMW Custom',
  '8.png': 'Black Cherry H-319',
  '2-1.png': 'Woodland Tigerstripe',
  '1-1.png': 'Woodland',
};
const gallery = [];
const raw = load(await readFile('source-audit/raw/_cerakote-camos_.html'));
const urls = raw('a.e-gallery-item')
  .map((_, e) => raw(e).attr('href'))
  .get();
for (const url of urls) {
  const filename = new URL(url).pathname.split('/').pop();
  let title;
  if (url.includes('/2026/01/'))
    title =
      filename === '15.png'
        ? 'USMC Red H-167'
        : filename === '2.png'
          ? 'Flat Dark Earth F-106'
          : filename === '1.png'
            ? 'Carbon Black F-102'
            : solids[filename];
  else if (filename === '2-1.png') title = 'Woodland Tigerstripe';
  else if (filename === '1-1.png') title = 'Woodland';
  else {
    const num = Number(filename.replace('.png', ''));
    title =
      num === 15
        ? 'USMC Red H-167'
        : num === 2
          ? 'Flat Dark Earth F-106'
          : num === 1
            ? 'Carbon Black F-102'
            : {
                '14.png': 'Flectarn',
                '13.png': 'M90 Swedish',
                '12.png': 'Midnight Chocolate Chip',
                '11.png': 'Tropic Chip',
                '10.png': 'Pumpkin Spice',
                '9.png': 'Nautical Camo',
                '3.png': 'Wood Chip',
                '4.png': 'Black Multicam',
                '5.png': 'DCU Chocolate Chip',
                '6.png': 'Arctic Multicam',
                '7.png': 'Blueberry Chocolate Chip',
                '8.png': 'Rocky Road',
              }[filename];
  }
  if (!title) continue;
  try {
    gallery.push({
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title,
      finish: title,
      service: 'Cerakote',
      image: await image(url),
      sourceUrl: url,
    });
  } catch {}
}
for (const [title, service, name] of [
  ['Custom frame work', 'Stippling', 'MPSTOWER-1.jpg'],
  ['Custom slide detail', 'Slide Milling', 'DSC01161.jpg'],
  ['Bodyguard 2.0 Viper Ports', 'Porting', null],
])
  gallery.push({
    slug: title.toLowerCase().replaceAll(' ', '-'),
    title,
    finish: '',
    service,
    image: name
      ? await byName(name)
      : products.find((p) => p.slug === 'bodyguard-2-0-viper-ports').images[0],
    sourceUrl:
      services.find((s) => s.title.toLowerCase() === service.toLowerCase())?.sourceUrl ||
      origin + '/porting/',
  });
const articles = [];
for (const p of pages.filter((p) => /\/2025\/\d+\/\d+\/.+/.test(p.url))) {
  const $ = load(await readFile(p.rawPath));
  let content = $('.entry-content').first();
  if (!content.length) content = $('.elementor-widget-theme-post-content').first();
  const paragraphs = content
    .find('h2,h3,p,li')
    .map((_, e) => ({ tag: e.tagName, text: $(e).text().replace(/\s+/g, ' ').trim() }))
    .get()
    .filter((p) => p.text && !/Share this|Read More/.test(p.text));
  if (!paragraphs.length) continue;
  const title = $('h1').first().text().trim() || p.heading;
  articles.push({
    slug: new URL(p.url).pathname.split('/').filter(Boolean).pop(),
    title,
    date: p.url
      .match(/\/(2025)\/(\d+)\/(\d+)\//)
      .slice(1)
      .join('-'),
    author: 'Defiant',
    paragraphs,
    image:
      services.find((s) => title.toLowerCase().includes(s.slug.split('-')[0]))?.image ||
      services[1].image,
    sourceUrl: p.url,
  });
}
const logo = assets.find(
  (a) => a.sourceUrl.includes('DEFIANT-MACHINE-WORKS-LOGO-HORIZONTAL-2-') && a.localPath,
);
await sharp(logo.localPath).trim().png().toFile('public/assets/dmw/optimized/defiant-wordmark.png');
const icon = assets.find(
  (a) => a.sourceUrl.endsWith('/DEFIANT-MACHINE-WORKS-ICON.png') && a.localPath,
);
await sharp(icon.localPath).resize(64, 64).png().toFile('public/icon.png');
await sharp(icon.localPath).resize(180, 180).png().toFile('public/apple-icon.png');
for (const [file, data] of Object.entries({
  'products.json': products,
  'gallery.json': gallery,
  'articles.json': articles,
  'service-records.json': services,
}))
  await writeFile('src/data/' + file, JSON.stringify(data, null, 2));
await writeFile(
  'src/data/site.ts',
  `export const site={name:'Defiant Machine Works',email:'sales@defiantmachineworks.com',phone:'931-266-2422',phoneHref:'tel:+19312662422',logo:'/assets/dmw/optimized/defiant-wordmark.png',icon:'${icon.localPath.replace('public', '')}',hero:'${await byName('DSC01562.jpg')}',workshop:'${await byName('DSC05246.jpg')}',outdoor:'${await byName('MPSTOWER-1.jpg')}',url:process.env.NEXT_PUBLIC_SITE_URL||'https://defiantmachineworks.com'};\n`,
);
await writeFile(
  'src/data/catalog.ts',
  `import records from './products.json';\nimport galleryRecords from './gallery.json';\nimport articleRecords from './articles.json';\nimport type {Product,GalleryItem,Article} from './types';\nexport const products=records as Product[];\nexport const gallery=galleryRecords as GalleryItem[];\nexport const articles=articleRecords as Article[];\n`,
);
console.log({
  products: products.length,
  gallery: gallery.length,
  articles: articles.length,
  optimized: optimized.size,
});
