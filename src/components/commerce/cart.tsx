'use client';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { cartActions, useCart } from './cart-store';
import { quoteCart } from '@/lib/commerce/pricing';
import { componentLabels, variantLabel } from '@/lib/commerce/catalog';
import { money, buildOrdinal } from '@/lib/commerce/schema';
import { OrderSummary, ServiceDetails } from './build-summary';
export function AddProduct({ id }: { id: string }) {
  const [message, setMessage] = useState('');
  return (
    <div className="add-product">
      <button
        className="button"
        onClick={() => {
          try {
            cartActions.addProduct(id);
            setMessage('Added to your cart.');
          } catch (e) {
            setMessage(e instanceof Error ? e.message : 'This product could not be added.');
          }
        }}
      >
        Add to cart
      </button>
      <p aria-live="polite" className="form-note">
        {message} {message === 'Added to your cart.' && <Link href="/cart">Review cart</Link>}
      </p>
    </div>
  );
}
export function Cart({ testMode }: { testMode: boolean }) {
  const { items, ready, message, needsReview, acceptedSubtotalCents } = useCart();
  const [error, setError] = useState('');
  const quote = quoteCart(items);
  function duplicate(id: string) {
    try {
      cartActions.duplicate(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The build could not be duplicated.');
    }
  }
  if (!ready)
    return (
      <p className="form-note" role="status">
        Loading your saved cart…
      </p>
    );
  if (!items.length)
    return (
      <section className="empty-cart">
        <Icon name="bag" />
        <span className="eyebrow">Your next project starts here</span>
        <h2>No builds yet.</h2>
        <p>Configure your first service package or browse the available merchandise.</p>
        <div className="button-row">
          <Link className="button" href="/customize">
            Start your build
          </Link>
          <Link className="text-link" href="/services">
            View services
          </Link>
        </div>
        {message && (
          <p className="form-note" role="status">
            {message}
          </p>
        )}
      </section>
    );
  return (
    <>
      <p className="cart-feedback" role="status" aria-live="polite">
        {message}
      </p>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {quote.errors.length > 0 && (
        <div className="form-error" role="alert">
          {quote.errors.join(' ')}
        </div>
      )}
      {(needsReview || quote.items.some((item) => item.build?.adjustments.length)) && (
        <section className="notice cart-review-notice">
          <span className="eyebrow">Review updated build details</span>
          <p>
            Some build details changed. Review your build before checkout.{' '}
            {acceptedSubtotalCents !== null &&
              `Previously reviewed subtotal: ${money(acceptedSubtotalCents)}. `}
            Current subtotal: {money(quote.subtotalCents)}.
          </p>
          {quote.items
            .flatMap((item) => item.build?.adjustments || [])
            .map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          <button
            className="text-link"
            disabled={!!quote.errors.length}
            onClick={() => cartActions.reviewPrices(quote.subtotalCents)}
          >
            Accept current details and subtotal
          </button>
        </section>
      )}
      <div className="commerce-layout">
        <section className="cart-items" aria-label="Your cart items">
          {quote.items.map((item, index) => (
            <article className="cart-item" key={item.id}>
              <div className="cart-item-heading">
                <span className="eyebrow">
                  {item.kind === 'build'
                    ? `BUILD ${String(buildOrdinal(quote.items, index)).padStart(2, '0')}`
                    : 'PRODUCT'}
                </span>
                <strong>{money(item.subtotalCents)}</strong>
              </div>
              <h2>{item.title}</h2>
              {item.build ? (
                <>
                  <p className="summary-component">
                    {componentLabels[item.build.firearm.componentType]} /{' '}
                    {variantLabel(item.build.firearm)}
                  </p>
                  <span className="review-label">
                    {item.build.orderability === 'ready'
                      ? 'Confirmed service price / ready for checkout'
                      : 'Estimate / requires review'}
                  </span>
                  {item.build.reviewReasons.length > 0 && (
                    <p className="form-note">{item.build.reviewReasons.join(' ')}</p>
                  )}
                  <div className="cart-services">
                    {item.build.services.map((s) => (
                      <details key={s.serviceId}>
                        <summary>
                          <span>{s.title}</span>
                          <span>{money(s.calculatedPriceCents)}</span>
                          <Icon name="chevron-down" />
                        </summary>
                        <div>
                          <ServiceDetails service={s} showBreakdown />
                        </div>
                      </details>
                    ))}
                  </div>
                  <div className="cart-item-actions">
                    <Link href={`/customize?edit=${item.id}`}>Edit build</Link>
                    <button onClick={() => duplicate(item.id)}>Duplicate build</button>
                    <button onClick={() => cartActions.remove(item.id)}>Remove build</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="cart-product">
                    <img src={item.image} alt={item.title} width="100" height="100" />
                    <div>
                      <label htmlFor={`quantity-${item.id}`}>Quantity</label>
                      <select
                        id={`quantity-${item.id}`}
                        value={item.quantity}
                        onChange={(e) => cartActions.quantity(item.id, Number(e.target.value))}
                      >
                        {Array.from({ length: 20 }, (_, i) => (
                          <option key={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <Link href={`/products/${item.productId}`}>View product</Link>
                    <button onClick={() => cartActions.remove(item.id)}>Remove product</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </section>
        <div className="order-sidebar">
          <OrderSummary quote={quote} testMode={testMode} />
          {quote.errors.length === 0 && !needsReview && (
            <Link
              className="button checkout-link"
              href="/checkout"
              onClick={() => cartActions.reviewPrices(quote.subtotalCents)}
            >
              {quote.requiresReview ? 'Review checkout requirements' : 'Checkout'}
            </Link>
          )}
          <Link className="text-link" href="/customize">
            Continue building
          </Link>
          {quote.requiresReview && (
            <Link className="text-link" href="/custom-inquiry">
              Request a configuration review
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
