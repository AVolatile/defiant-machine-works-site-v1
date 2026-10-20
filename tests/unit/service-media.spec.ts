import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { gallery } from '../../src/data/catalog';

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const baseline = read('source-audit/pass-06c/preserved-baseline.json');

test('media enrichment preserves commerce, configurators, focus, Gallery routing, styles and all Cerakote entries', () => {
  for (const [file, hash] of Object.entries(baseline.hashes))
    expect(createHash('sha256').update(readFileSync(file)).digest('hex'), file).toBe(hash);
  expect(gallery.filter((item) => item.service === 'Cerakote')).toEqual(baseline.cerakote);
});

test('service photographs have unique original identities and retained source-page context', () => {
  const coverage = read('source-audit/pass-06c/media-coverage.json').records;
  const pages = read('source-audit/pass-04/pages.json');
  const original = (url: string) => url.replace(/-\d+x\d+(?=\.\w+$)/, '');
  expect(new Set(coverage.map((item: { sourceHash: string }) => item.sourceHash)).size).toBe(
    coverage.length,
  );
  expect(new Set(gallery.map((item) => item.slug)).size).toBe(gallery.length);
  for (const item of coverage) {
    expect(createHash('sha256').update(readFileSync(item.sourceImage)).digest('hex')).toBe(
      item.sourceHash,
    );
    const source = pages.find((page: { url: string }) => page.url === item.sourcePage);
    const $ = load(readFileSync(source.rawPath, 'utf8'));
    const urls = $('img,a')
      .toArray()
      .flatMap((node) => [
        $(node).attr('src'),
        $(node).attr('href'),
        $(node).attr('data-large_image'),
      ])
      .filter(Boolean) as string[];
    expect(
      urls.some((url) => original(url) === original(item.sourceUrl)),
      item.slug,
    ).toBe(true);
    expect(gallery.find((entry) => entry.slug === item.slug)).toMatchObject({
      image: item.image,
      sourceUrl: item.sourceUrl,
      sourcePage: item.sourcePage,
    });
  }
});

test('upcoming porting photographs remain reference metadata without transaction links', () => {
  const references = gallery.filter((item) => item.referenceStatus === 'coming-soon');
  expect(references).toHaveLength(8);
  expect(references.every((item) => item.service === 'Porting' && item.finish === '')).toBe(true);
  expect(
    gallery.some((item) => ['custom-frame-work', 'custom-slide-detail'].includes(item.slug)),
  ).toBe(false);
});
