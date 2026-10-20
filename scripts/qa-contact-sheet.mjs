import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
for (const viewport of [1440, 375]) {
  const files = (await readdir('tests/visual/screenshots')).filter((f) =>
    f.startsWith(viewport + '-'),
  );
  const width = viewport === 1440 ? 360 : 180;
  const height = viewport === 1440 ? 225 : 390;
  const columns = viewport === 1440 ? 3 : 5;
  const comps = [];
  for (let i = 0; i < files.length; i++) {
    const file = 'tests/visual/screenshots/' + files[i];
    const m = await sharp(file).metadata();
    comps.push({
      input: await sharp(file)
        .extract({
          left: 0,
          top: 0,
          width: Math.min(viewport, m.width),
          height: Math.min(viewport === 1440 ? 900 : 812, m.height),
        })
        .resize(width, height, { fit: 'cover', position: 'top' })
        .png()
        .toBuffer(),
      left: (i % columns) * width,
      top: Math.floor(i / columns) * (height + 24),
    });
    comps.push({
      input: Buffer.from(
        `<svg width="${width}" height="24"><rect width="100%" height="100%" fill="white"/><text x="5" y="16" font-size="11">${files[i].replace('.png', '')}</text></svg>`,
      ),
      left: (i % columns) * width,
      top: Math.floor(i / columns) * (height + 24) + height,
    });
  }
  await sharp({
    create: {
      width: width * columns,
      height: Math.ceil(files.length / columns) * (height + 24),
      channels: 3,
      background: '#333',
    },
  })
    .composite(comps)
    .png()
    .toFile(`/tmp/dmw-pages-${viewport}.png`);
}
