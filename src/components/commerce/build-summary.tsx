import Link from 'next/link';
import {
  money,
  buildOrdinal,
  type CartQuote,
  type PricedBuild,
  type PricedService,
} from '@/lib/commerce/schema';
import { componentLabels, platformTitle, variantLabel } from '@/lib/commerce/catalog';
export function ServiceDetails({
  service,
  showBreakdown = false,
}: {
  service: PricedService;
  showBreakdown?: boolean;
}) {
  return (
    <>
      <dl className="configured-details">
        {(
          service.details || service.optionLabels.map((value) => ({ label: 'Selection', value }))
        ).map((detail, index) => (
          <div key={`${index}-${detail.label}`}>
            <dt>{detail.label}</dt>
            <dd>{detail.value}</dd>
          </div>
        ))}
      </dl>
      {showBreakdown && (
        <dl className="service-price-breakdown">
          {(
            service.breakdown || [
              { label: 'Base service', amountCents: service.unitPriceCents, kind: 'base' },
            ]
          ).map((line, index) => (
            <div key={`${index}-${line.label}`}>
              <dt>{line.label}</dt>
              <dd>
                {line.kind === 'included'
                  ? 'Included'
                  : `${line.kind === 'upgrade' && line.amountCents > 0 ? '+' : ''}${money(line.amountCents)}`}
              </dd>
            </div>
          ))}
          <div className="service-price-total">
            <dt>Service total</dt>
            <dd>{money(service.calculatedPriceCents)}</dd>
          </div>
        </dl>
      )}
    </>
  );
}
export function BuildSummary({ build }: { build: PricedBuild }) {
  return (
    <aside className="commerce-summary" aria-label="Build summary">
      <span className="eyebrow">Your build / At a glance</span>
      <h2>{platformTitle(build.firearm)}</h2>
      <p className="summary-component">
        {componentLabels[build.firearm.componentType]}
        {build.firearm.variantId && ` / ${variantLabel(build.firearm)}`}
      </p>
      <div className="summary-lines">
        {build.services.map((service) => (
          <div key={service.serviceId}>
            <div>
              <strong>{service.title}</strong>
              <ServiceDetails service={service} />
            </div>
            <strong>{money(service.calculatedPriceCents)}</strong>
          </div>
        ))}
      </div>
      <div className="summary-total">
        <span>{build.orderability === 'ready' ? 'Service subtotal' : 'Estimated subtotal'}</span>
        <strong>{money(build.estimatedSubtotalCents)}</strong>
      </div>
      <span className="review-label">
        {build.orderability === 'ready' ? 'Ready for checkout' : 'Complete selections / review'}
      </span>
      {build.reviewReasons.map((reason) => (
        <p className="form-note" key={reason}>
          {reason}
        </p>
      ))}
      <p className="form-note">
        Return shipping and tax configuration is pending.{' '}
        <Link href="/shipping">Shipping & lead time</Link>
      </p>
    </aside>
  );
}
export function OrderSummary({
  quote,
  testMode = false,
}: {
  quote: CartQuote;
  testMode?: boolean;
}) {
  return (
    <aside className="commerce-summary">
      <span className="eyebrow">Order summary</span>
      <div className="summary-lines">
        {quote.items.map((item, index) => (
          <div key={item.id}>
            <div>
              <small>
                {item.kind === 'build'
                  ? `BUILD ${String(buildOrdinal(quote.items, index)).padStart(2, '0')}`
                  : `PRODUCT × ${item.quantity}`}
              </small>
              <strong>{item.title}</strong>
              {item.build?.services.map((service) => (
                <div className="summary-service" key={service.serviceId}>
                  <span>
                    {service.title} / {money(service.calculatedPriceCents)}
                  </span>
                  <ServiceDetails service={service} />
                </div>
              ))}
              {item.build?.orderability === 'requires-review' && (
                <small className="review-label">Review required</small>
              )}
            </div>
            <strong>{money(item.subtotalCents)}</strong>
          </div>
        ))}
      </div>
      <dl className="order-costs">
        <div>
          <dt>Builds</dt>
          <dd>
            {money(
              quote.items
                .filter((i) => i.kind === 'build')
                .reduce((n, i) => n + i.subtotalCents, 0),
            )}
          </dd>
        </div>
        <div>
          <dt>Products</dt>
          <dd>
            {money(
              quote.items
                .filter((i) => i.kind === 'product')
                .reduce((n, i) => n + i.subtotalCents, 0),
            )}
          </dd>
        </div>
        <div>
          <dt>Return shipping</dt>
          <dd>Configuration pending</dd>
        </div>
        <div>
          <dt>Tax</dt>
          <dd>Configuration pending</dd>
        </div>
      </dl>
      <div className="summary-total">
        <span>{quote.requiresReview ? 'Estimated subtotal' : 'Order subtotal'}</span>
        <strong>{money(quote.subtotalCents)}</strong>
      </div>
      {quote.requiresReview && (
        <p className="form-note">
          <span className="review-label">Requires review</span> The listed review items need
          confirmation before purchase.
        </p>
      )}
      {testMode && (
        <p className="form-note">
          Test order only. No money is charged, shipping booked or work authorized.
        </p>
      )}
    </aside>
  );
}
