import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { sessionCookie } from '@/lib/commerce/http';
import { orderRepository, sessionHash } from '@/lib/commerce/order-repository';
import { money, buildOrdinal } from '@/lib/commerce/schema';
import { componentLabels, variantLabel } from '@/lib/commerce/catalog';
import { developmentCheckoutEnabled } from '@/lib/commerce/payment';
import { ServiceDetails } from '@/components/commerce/build-summary';
import { AddressText } from '@/components/commerce/address-fields';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Test order confirmation',
  robots: { index: false, follow: false },
};
export default async function Confirmation({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  if (!developmentCheckoutEnabled()) notFound();
  const session = (await cookies()).get(sessionCookie)?.value;
  if (!session || !/^[a-f0-9]{64}$/.test(session) || !/^DMW-TEST-[A-Z0-9-]+$/.test(orderNumber))
    notFound();
  const order = orderRepository().getByNumber(orderNumber, sessionHash(session));
  if (!order || order.status !== 'TEST_ORDER_RECEIVED') notFound();
  const hasServiceBuild = order.items.some((item) => item.kind === 'build');
  return (
    <section className="wrap order-confirmation section">
      <div className="test-checkout-notice">
        <span className="eyebrow">Development record / No payment collected</span>
        <p>This is a saved test order. It does not book service work or shipping with Defiant.</p>
      </div>
      <header>
        <span className="eyebrow">Test order received</span>
        <p className="order-number">{order.orderNumber}</p>
        <h1>
          Your test build
          <br />
          is on record.
        </h1>
        <p>
          The selected configuration and base-price snapshot have been saved. No live production or
          tracking status is implied.
        </p>
      </header>
      <div className="commerce-layout">
        <div>
          {order.items.map((item, i) => (
            <section className="confirmation-item" key={item.id}>
              <span className="eyebrow">
                {item.kind === 'build'
                  ? `Build ${String(buildOrdinal(order.items, i)).padStart(2, '0')}`
                  : `Product × ${item.quantity}`}
              </span>
              <h2>{item.title}</h2>
              {item.build && (
                <>
                  <p>
                    {componentLabels[item.build.firearm.componentType]} /{' '}
                    {variantLabel(item.build.firearm)}
                  </p>
                  <dl className="summary-lines">
                    {item.build.services.map((s) => (
                      <div key={s.serviceId}>
                        <dt>
                          {s.title}
                          <ServiceDetails service={s} showBreakdown />
                        </dt>
                        <dd>{money(s.calculatedPriceCents)}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
              <p className="confirmation-subtotal">{money(item.subtotalCents)}</p>
            </section>
          ))}
          <section className="confirmation-next">
            <span className="eyebrow">What happens next</span>
            <h2>
              {hasServiceBuild
                ? 'Order first. Instructions next.'
                : 'Your merchandise. Next steps.'}
            </h2>
            <p>
              A completed service purchase follows this process. This test record does not begin
              fulfillment; do not send your item based on it.
            </p>
            {hasServiceBuild ? (
              <ol className="handoff-steps">
                <li>
                  <strong>Order confirmation.</strong> Defiant confirms the purchased service and
                  selected scope.
                </li>
                <li>
                  <strong>Shipping instructions.</strong> Defiant provides instructions by email
                  after the order is placed.
                </li>
                <li>
                  <strong>Send the required component.</strong> Follow Defiant’s instructions for
                  your service. Inbound shipping is your responsibility.
                </li>
                <li>
                  <strong>Receipt and work queue.</strong> Lead time begins when the item arrives at
                  the shop, according to the published policy and confirmed scope.
                </li>
                <li>
                  <strong>Communication.</strong> Defiant contacts you if issues or delays arise.
                </li>
              </ol>
            ) : (
              <p>
                Your cart contains merchandise. No service component needs to be sent to Defiant.
                Shipping and fulfillment are not booked by this test order.
              </p>
            )}
            <div className="notice communication-status">
              <span className="eyebrow">Shipping instructions pending</span>
              <p>
                {order.shippingInstructions?.status === 'available' &&
                order.shippingInstructions.content
                  ? order.shippingInstructions.content
                  : 'Order-specific shipping instructions are not available in this test build.'}
              </p>
              <p>
                {order.communications?.confirmation.status === 'failed'
                  ? 'Confirmation email delivery failed. Your saved test order is still on record.'
                  : 'Email delivery is not configured. No confirmation or shipping-instructions email has been sent.'}
              </p>
            </div>
            <div className="button-row">
              <Link href="/shipping" className="button">
                View shipping information
              </Link>
              <Link href="/contact" className="text-link">
                Contact Defiant
              </Link>
            </div>
          </section>
        </div>
        <aside className="commerce-summary">
          <span className="eyebrow">Your order record</span>
          <h2>{money(order.subtotalCents)}</h2>
          <p className="form-note">
            Recorded{' '}
            {new Date(order.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York' })}{' '}
            Eastern
          </p>
          <dl className="order-costs">
            <div>
              <dt>Payment</dt>
              <dd>Test approved / no charge</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>Configuration pending</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>Configuration pending</dd>
            </div>
          </dl>
          <h3>Contact</h3>
          <p>
            {order.customer.firstName} {order.customer.lastName}
            <br />
            {order.customer.email}
            <br />
            {order.customer.phone}
          </p>
          <h3>Return address</h3>
          <p>
            {order.address.line1}
            <br />
            {order.address.line2 && (
              <>
                {order.address.line2}
                <br />
              </>
            )}
            {order.address.city}, {order.address.state} {order.address.postalCode}
            <br />
            United States
          </p>
          {order.billingAddress && (
            <>
              <h3>Billing address</h3>
              <AddressText address={order.billingAddress} />
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
