import { PageIntro, CTA } from '@/components/ui/primitives';
import { GalleryGrid } from '@/components/gallery/gallery-grid';
import { gallery } from '@/data/catalog';
import { metadata as createMetadata } from '@/lib/seo';
export const metadata = createMetadata(
  'The work, up close.',
  'A collection of actual Defiant builds, custom Cerakote finishes, frame work, and machined details.',
  '/gallery',
);
export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ finish?: string; service?: string }>;
}) {
  const query = await searchParams;
  return (
    <>
      <PageIntro
        eyebrow="The gallery"
        title="The work, up close."
        description="A collection of actual Defiant builds, custom Cerakote finishes, frame work, and machined details."
      />
      <section className="wrap section-tight">
        <GalleryGrid
          key={`${query.service || ''}:${query.finish || ''}`}
          items={gallery}
          initialQuery={(query.finish || '').slice(0, 150)}
          initialService={query.service || ''}
        />
      </section>
      <CTA />
    </>
  );
}
