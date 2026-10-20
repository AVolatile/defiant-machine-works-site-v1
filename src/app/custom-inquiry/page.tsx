import { BuildWizard } from '@/components/forms/build-wizard';
import { PageIntro } from '@/components/ui/primitives';
import { metadata as createMetadata } from '@/lib/seo';
export const metadata = createMetadata(
  'Custom project inquiry',
  'Request a quote for custom work, unusual platforms, finish ideas, and combinations that need a personal conversation.',
  '/custom-inquiry',
);
export default async function CustomInquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; service?: string; finish?: string }>;
}) {
  const p = await searchParams;
  return (
    <>
      <PageIntro
        eyebrow="Custom project / Request a quote"
        title="A different kind of build?"
        description="Unusual platform, custom finish, or a project that needs a conversation first. Tell us what you have in mind and request a quote."
      />
      <div className="wrap section-tight">
        <BuildWizard
          product={(p.product || '').slice(0, 200)}
          service={(p.service || '').slice(0, 100)}
          finish={(p.finish || '').slice(0, 150)}
        />
      </div>
    </>
  );
}
