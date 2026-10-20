import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const assets = JSON.parse(await readFile('source-audit/assets.json'));
const invalid = [];
for (const a of assets.filter((a) => a.localPath)) {
  const b = await readFile(a.localPath);
  if (createHash('sha256').update(b).digest('hex') !== a.hash) invalid.push(a);
}
console.log('Repairing filename collisions', invalid.length);
for (let i = 0; i < invalid.length; i += 2)
  await Promise.all(
    invalid.slice(i, i + 2).map(async (a) => {
      const r = await fetch(a.sourceUrl, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw Error(a.sourceUrl);
      const b = Buffer.from(await r.arrayBuffer());
      const hash = createHash('sha256').update(b).digest('hex');
      const localPath = path.join(
        path.dirname(a.localPath),
        hash.slice(0, 10) + '-' + path.basename(a.localPath),
      );
      await mkdir(path.dirname(localPath), { recursive: true });
      await writeFile(localPath, b);
      a.localPath = localPath;
      a.hash = hash;
    }),
  );
await writeFile('source-audit/assets.json', JSON.stringify(assets, null, 2));
let pages = JSON.parse(await readFile('source-audit/pages.json'));
const discarded = pages.filter((p) => /dmw-account/.test(p.url));
pages = pages.filter((p) => !/dmw-account/.test(p.url));
for (const p of discarded) if (p.rawPath) await unlink(p.rawPath).catch(() => {});
await writeFile('source-audit/pages.json', JSON.stringify(pages, null, 2));
await writeFile(
  'source-audit/crawl-notes.json',
  JSON.stringify(
    {
      accountLandingCorrection:
        'The first discovery pass fetched the public /dmw-account/ and lost-password landing pages without authentication. No account data was accessed and no forms were submitted. These pages were removed from the migration inventory and the crawler exclusion now blocks account and password paths.',
      filenameCollisionsRepaired: invalid.length,
    },
    null,
    2,
  ),
);
