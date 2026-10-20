import type { MetadataRoute } from 'next';
import { products, articles } from '@/data/catalog';
import { site } from '@/data/site';
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    '',
    'services',
    'stippling',
    'slide-milling',
    'cerakote',
    'porting',
    'gallery',
    'products',
    'customize',
    'custom-inquiry',
    'resources',
    'resources/stippling-guide',
    'about',
    'contact',
    'shipping',
    'warranty',
    'faq',
    'blog',
    'privacy',
    'terms',
    'cookies',
    'accessibility',
    ...products.map((p) => `products/${p.slug}`),
    ...articles.map((a) => `blog/${a.slug}`),
  ].map((path) => ({
    url: `${site.url}/${path}`,
    changeFrequency: 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));
}
