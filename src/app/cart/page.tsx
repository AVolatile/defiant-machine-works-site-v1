import { Cart } from '@/components/commerce/cart';
import { PageIntro } from '@/components/ui/primitives';
import { developmentCheckoutEnabled } from '@/lib/commerce/payment';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your build cart', robots: { index: false, follow: false } };
export default function CartPage() {
  return (
    <>
      <PageIntro
        eyebrow="Cart / Builds + products"
        title="Your build cart."
        description="Your projects, grouped the way they belong. Review the work, adjust the details, and keep separate builds clearly organized."
      />
      <div className="wrap section-tight">
        <Cart testMode={developmentCheckoutEnabled()} />
      </div>
    </>
  );
}
