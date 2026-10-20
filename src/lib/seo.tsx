import type { Metadata } from 'next';
import { site } from '@/data/site';
export function metadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | Defiant Machine Works`,
      description,
      url: path,
      siteName: site.name,
      type: 'website',
      images: [
        {
          url: site.hero,
          width: 1200,
          height: 800,
          alt: 'Custom firearm work by Defiant Machine Works',
        },
      ],
    },
    twitter: { card: 'summary_large_image', title, description, images: [site.hero] },
  };
}
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
