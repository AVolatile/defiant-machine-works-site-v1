import { Configurator } from '@/components/commerce/configurator';
import { PageIntro } from '@/components/ui/primitives';
import { metadata as createMetadata } from '@/lib/seo';
export const metadata = createMetadata(
  'Start your build',
  'Configure services around one platform, review the selected options and pricing, and save your project to a grouped build cart.',
  '/customize',
);
export default async function CustomizePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; service?: string; edit?: string }>;
}) {
  const p = await searchParams;
  return (
    <>
      <PageIntro
        eyebrow="Configure / Review / Build"
        title="Make it personally yours."
        description="Configure the details, review the work, and keep every part of your project together."
      />
      <div className="wrap section-tight">
        <Configurator
          product={(p.product || '').slice(0, 200)}
          service={(p.service || '').slice(0, 100)}
          editId={(p.edit || '').slice(0, 40)}
        />
      </div>
    </>
  );
}
