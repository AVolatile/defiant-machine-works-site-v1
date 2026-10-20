import { Checkout } from '@/components/commerce/checkout';
import { PageIntro } from '@/components/ui/primitives';
import { developmentCheckoutEnabled } from '@/lib/commerce/payment';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Checkout', robots: { index: false, follow: false } };
export default function CheckoutPage() {
  return (
    <>
      <div className="transactional-intro">
        <PageIntro
          eyebrow="Checkout"
          title="Complete your service order."
          description="Your build, your details, then payment. Shipping instructions follow order completion."
        />
      </div>
      <div className="wrap section-tight">
        <Checkout testMode={developmentCheckoutEnabled()} />
      </div>
    </>
  );
}
