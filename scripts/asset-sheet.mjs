import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const a = JSON.parse(readFileSync('source-audit/assets.json'));
const paths = [
  ...new Set(
    a
      .filter(
        (x) =>
          x.localPath &&
          ((x.sourcePage.includes('cerakote-camos') && !/-\d+x\d+/.test(x.sourceUrl)) ||
            /MPSTOWER|DSC02091-1|this-one|DSC01562|DSC01161\.jpg|DSC05246\.jpg|DSC03140\.jpg|LOGO.svg|LOGO-HORIZONTAL-2-/.test(
              x.sourceUrl,
            )),
      )
      .map((x) => x.localPath),
  ),
];
let composites = [];
for (let i = 0; i < paths.length; i++) {
  try {
    composites.push({
      input: await sharp(paths[i])
        .resize(240, 200, { fit: 'contain', background: '#272727' })
        .png()
        .toBuffer(),
      left: (i % 5) * 240,
      top: Math.floor(i / 5) * 230,
    });
    composites.push({
      input: Buffer.from(
        `<svg width="240" height="30"><rect width="240" height="30" fill="white"/><text x="5" y="20" font-size="11">${paths[i].split('/').pop().slice(0, 34)}</text></svg>`,
      ),
      left: (i % 5) * 240,
      top: Math.floor(i / 5) * 230 + 200,
    });
  } catch {}
}
await sharp({
  create: {
    width: 1200,
    height: Math.ceil(paths.length / 5) * 230,
    channels: 3,
    background: '#333',
  },
})
  .composite(composites)
  .png()
  .toFile('/tmp/dmw-gallery-sheet.png');
