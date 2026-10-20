'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartActions, useCart } from './cart-store';
import { OrderSummary, ServiceDetails } from './build-summary';
import { AddressFields, AddressText, emptyAddress } from './address-fields';
import { variantLabel } from '@/lib/commerce/catalog';
import { quoteCart } from '@/lib/commerce/pricing';
import {
  addressSchema,
  customerSchema,
  checkoutSchema,
  money,
  type CartQuote,
} from '@/lib/commerce/schema';
export function Checkout({ testMode }: { testMode: boolean }) {
  const cart = useCart(),
    router = useRouter();
  const [step, setStep] = useState(0);
  const [customer, setCustomer] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [billingAddress, setBillingAddress] = useState(emptyAddress);
  const [returnAddress, setReturnAddress] = useState(emptyAddress);
  const [sameAddress, setSameAddress] = useState(true);
  const [acks, setAcks] = useState({
    inspection: false,
    shipping: false,
    leadTime: false,
    testOrder: false,
  });
  const [scenario, setScenario] = useState<'approved' | 'declined'>('approved');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState(''),
    [sending, setSending] = useState(false);
  const [serverQuote, setServerQuote] = useState<{ items: string; quote: CartQuote } | null>(null);
  const [quoteError, setQuoteError] = useState(''),
    [refresh, setRefresh] = useState(0);
  const attempt = useRef({ fingerprint: '', key: '' }),
    inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null),
    errorSummary = useRef<HTMLDivElement>(null);
  const itemPayload = JSON.stringify(cart.items);
  const quote = serverQuote?.items === itemPayload ? serverQuote.quote : null;
  const localQuote = quoteCart(cart.items),
    currentQuote = quote || localQuote;
  const address = sameAddress ? billingAddress : returnAddress;
  const hasServiceBuild = cart.items.some((item) => item.kind === 'build');
  useEffect(() => {
    if (!cart.ready || !cart.items.length) return;
    const controller = new AbortController();
    fetch('/api/commerce/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: JSON.parse(itemPayload), catalogVersion: cart.catalogVersion }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw Error(body.error || 'Could not refresh the order summary.');
        setServerQuote({ items: itemPayload, quote: body.quote });
        setQuoteError('');
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setQuoteError(
            error instanceof Error ? error.message : 'Could not refresh the order summary.',
          );
      });
    return () => controller.abort();
  }, [itemPayload, cart.ready, cart.items.length, cart.catalogVersion, refresh]);
  function validation() {
    const fields: Record<string, string> = {};
    if (step === 0) {
      const result = customerSchema.safeParse(customer);
      if (!result.success)
        for (const issue of result.error.issues) fields[String(issue.path[0])] = issue.message;
    } else if (step === 1) {
      for (const [prefix, value] of [
        ['billing', billingAddress],
        ...(!sameAddress ? [['return', returnAddress] as const] : []),
      ] as const) {
        const result = addressSchema.safeParse(value);
        if (!result.success)
          for (const issue of result.error.issues)
            fields[`${prefix}-${String(issue.path[0])}`] = issue.message;
      }
    }
    setErrors(fields);
    if (Object.keys(fields).length) {
      requestAnimationFrame(() => errorSummary.current?.focus());
      return false;
    }
    return true;
  }
  function move(next: number) {
    if (next > step && !validation()) return;
    setErrors({});
    setStep(next);
    setMessage('');
    requestAnimationFrame(() => heading.current?.focus());
  }
  async function place() {
    if (inFlight.current || !testMode || !quote || quote.orderability !== 'ready') return;
    const payload = {
      items: cart.items,
      catalogVersion: cart.catalogVersion,
      customer,
      billingAddress,
      address,
      shippingMethod: 'test-return',
      acknowledgements: acks,
      expectedSubtotalCents: quote.subtotalCents,
      testPayment: scenario,
    };
    const fingerprint = JSON.stringify({ ...payload, testPayment: undefined });
    if (attempt.current.fingerprint !== fingerprint)
      attempt.current = { fingerprint, key: crypto.randomUUID() };
    const parsed = checkoutSchema.safeParse({ ...payload, idempotencyKey: attempt.current.key });
    if (!parsed.success) {
      setMessage(parsed.error.issues.map((i) => i.message).join(' '));
      requestAnimationFrame(() => errorSummary.current?.focus());
      return;
    }
    inFlight.current = true;
    setSending(true);
    setMessage('');
    try {
      const response = await fetch('/api/commerce/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(20000),
      });
      const body = await response.json();
      if (!response.ok) {
        if (body.quote) {
          setServerQuote({ items: itemPayload, quote: body.quote });
          setAcks((a) => ({ ...a, inspection: false }));
        }
        throw Error(
          body.error || 'Your test order could not be saved. Your details and cart are unchanged.',
        );
      }
      cartActions.purchased(body.purchasedIds);
      router.push(body.confirmationUrl);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Your test order could not be completed. Your details and cart are unchanged.',
      );
      requestAnimationFrame(() => errorSummary.current?.focus());
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }
  if (!cart.ready) return <p role="status">Loading your cart…</p>;
  if (cart.needsReview)
    return (
      <section className="notice">
        <h2>Review the updated build.</h2>
        <p>Some build details changed. Review your build and current prices before checkout.</p>
        <Link className="button" href="/cart">
          Review cart
        </Link>
      </section>
    );
  if (!cart.items.length)
    return (
      <div className="empty-cart">
        <h2>Your cart is empty.</h2>
        <p>Add a build or merchandise before starting checkout.</p>
        <Link className="button" href="/customize">
          Start your build
        </Link>
      </div>
    );
  if (localQuote.errors.length)
    return (
      <div className="form-error" role="alert">
        <h2>Review your cart first.</h2>
        <p>{localQuote.errors.join(' ')}</p>
        <Link className="text-link" href="/cart">
          Return to cart
        </Link>
      </div>
    );
  return (
    <>
      <div className="checkout-environment notice">
        <span className="eyebrow">
          {testMode
            ? 'Test checkout / No real payment'
            : 'Live payment is not configured in this build'}
        </span>
        <p>
          {testMode
            ? 'Use test customer details. This exercises checkout and saves a test record without charging you or booking service work.'
            : 'You can review your service order and enter checkout details. Order submission is disabled until live payment, shipping and tax are configured.'}
        </p>
      </div>
      <ol className="commerce-progress" aria-label="Checkout progress">
        {['Contact', 'Billing & return address', 'Payment & review'].map((label, index) => (
          <li key={label} aria-current={step === index ? 'step' : undefined}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="commerce-layout checkout-layout">
        <section className="checkout-fields">
          <h2 tabIndex={-1} ref={heading}>
            {
              [
                'Your contact information.',
                'Billing & return address.',
                'Review your service order.',
              ][step]
            }
          </h2>
          {(Object.keys(errors).length > 0 || message) && (
            <div className="form-error" role="alert" tabIndex={-1} ref={errorSummary}>
              <strong>Check your order details.</strong>
              {message && <p>{message}</p>}
              {Object.keys(errors).length > 0 && (
                <ul>
                  {Object.entries(errors).map(([key, value]) => (
                    <li key={key}>
                      <a href={`#${step === 0 ? 'checkout-' : ''}${key}`}>{value}</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {quoteError && (
            <div className="form-error" role="alert">
              <p>{quoteError}</p>
              <button className="text-link" onClick={() => setRefresh((n) => n + 1)}>
                Refresh order summary
              </button>
            </div>
          )}
          {step === 0 && (
            <div className="form-grid">
              {(['firstName', 'lastName', 'email', 'phone'] as const).map((name) => (
                <div key={name}>
                  <label htmlFor={`checkout-${name}`}>
                    {
                      {
                        firstName: 'First name',
                        lastName: 'Last name',
                        email: 'Email',
                        phone: 'Phone',
                      }[name]
                    }
                    {name === 'phone' && <span aria-hidden="true"> (optional)</span>}
                  </label>
                  <input
                    id={`checkout-${name}`}
                    type={name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text'}
                    autoComplete={
                      {
                        firstName: 'given-name',
                        lastName: 'family-name',
                        email: 'email',
                        phone: 'tel',
                      }[name]
                    }
                    value={customer[name]}
                    onChange={(e) => setCustomer((c) => ({ ...c, [name]: e.target.value }))}
                    maxLength={name === 'email' ? 200 : 100}
                    aria-invalid={!!errors[name]}
                    aria-describedby={errors[name] ? `error-${name}` : undefined}
                  />
                  {errors[name] && (
                    <span className="field-error" id={`error-${name}`}>
                      {errors[name]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {step === 1 && (
            <>
              <fieldset className="address-group">
                <legend>Billing address</legend>
                <AddressFields
                  prefix="billing"
                  value={billingAddress}
                  onChange={setBillingAddress}
                  errors={errors}
                />
              </fieldset>
              <label className="same-address">
                <input
                  type="checkbox"
                  checked={sameAddress}
                  onChange={(e) => setSameAddress(e.target.checked)}
                />
                <span>Use my billing address as my return address</span>
              </label>
              {!sameAddress && (
                <fieldset className="address-group">
                  <legend>Return shipping address</legend>
                  <AddressFields
                    prefix="return"
                    value={returnAddress}
                    onChange={setReturnAddress}
                    errors={errors}
                  />
                </fieldset>
              )}
              <p className="form-note">
                Return shipping and tax configuration is pending. No carrier, charge or shipping
                label is selected in this build.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <section className="checkout-review-section">
                <span className="eyebrow">01 / Customer & addresses</span>
                <p>
                  {customer.firstName} {customer.lastName}
                  <br />
                  {customer.email}
                  <br />
                  {customer.phone}
                </p>
                <h3>Billing address</h3>
                <AddressText address={billingAddress} />
                <h3>Return address</h3>
                <AddressText address={address} />
                <button className="text-link" onClick={() => move(0)}>
                  Edit contact details
                </button>
                <button className="text-link" onClick={() => move(1)}>
                  Edit addresses
                </button>
              </section>
              <section className="checkout-review-section">
                <span className="eyebrow">02 / Your service order</span>
                {currentQuote.items.map((item) => (
                  <div className="checkout-build" key={item.id}>
                    <h3>{item.title}</h3>
                    <p>
                      {item.kind === 'product'
                        ? `Quantity ${item.quantity}`
                        : item.build
                          ? variantLabel(item.build.firearm)
                          : ''}
                    </p>
                    {item.build && (
                      <div>
                        {item.build.services.map((service) => (
                          <section className="checkout-service" key={service.serviceId}>
                            <h4>{service.title}</h4>
                            <ServiceDetails service={service} showBreakdown />
                          </section>
                        ))}
                      </div>
                    )}
                    <p>{money(item.subtotalCents)}</p>
                  </div>
                ))}
              </section>
              <section className="checkout-review-section service-handoff">
                <span className="eyebrow">03 / Service handoff</span>
                <h3>
                  {hasServiceBuild ? 'Your service. Your component.' : 'Your merchandise order.'}
                </h3>
                {hasServiceBuild ? (
                  <>
                    <p>
                      You are purchasing customization work on your item. After a completed service
                      order, Defiant provides shipping instructions by email. Follow those
                      instructions to send the component required for your service.
                    </p>
                    <p>
                      Inbound shipping is your responsibility; return shipping is a separate order
                      charge. Lead time begins when the item reaches the shop, according to the{' '}
                      <Link href="/shipping">published policy</Link>. Defiant communicates issues or
                      delays.
                    </p>
                  </>
                ) : (
                  <p>
                    This cart contains merchandise. No service component needs to be sent to
                    Defiant. Shipping and fulfillment details must be configured before live
                    ordering.
                  </p>
                )}
                <p>
                  Shipping/tax configuration pending. This build does not calculate charges or issue
                  shipping instructions.
                </p>
              </section>
              {currentQuote.requiresReview && (
                <section className="configuration-review notice">
                  <span className="eyebrow">Configuration review required</span>
                  <p>This work needs confirmation before purchase:</p>
                  <ul>
                    {currentQuote.items
                      .flatMap((item) => item.build?.reviewReasons || [])
                      .map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                  </ul>
                  <Link className="text-link" href="/custom-inquiry">
                    Request a configuration review
                  </Link>
                </section>
              )}
              <section className="checkout-review-section payment-boundary">
                <span className="eyebrow">04 / Payment</span>
                {testMode ? (
                  <>
                    <h3>Test payment.</h3>
                    <p>No card or bank details are collected. Choose a test result.</p>
                    <label htmlFor="test-payment">Test payment result</label>
                    <select
                      id="test-payment"
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value as 'approved' | 'declined')}
                    >
                      <option value="approved">Approved test — no charge</option>
                      <option value="declined">Declined test — no charge</option>
                    </select>
                  </>
                ) : (
                  <>
                    <h3>Payment is not available yet.</h3>
                    <p>
                      Live payment is not configured in this build. Your order has not been placed
                      and no payment has been taken. This is an environment limitation; a confirmed
                      service order continues to payment when the approved provider is connected.
                    </p>
                  </>
                )}
              </section>
              <fieldset className="order-acknowledgements">
                <legend>05 / Final review & next steps</legend>
                {(
                  [
                    [
                      'inspection',
                      hasServiceBuild
                        ? 'I have reviewed my platform, service options and configuration status.'
                        : 'I have reviewed the products and quantities in my order.',
                    ],
                    [
                      'shipping',
                      hasServiceBuild
                        ? 'I understand shipping instructions follow order completion and will wait for Defiant’s instructions before sending my item.'
                        : 'I have reviewed my delivery address and the pending shipping configuration.',
                    ],
                    [
                      'leadTime',
                      hasServiceBuild
                        ? 'I understand lead time begins when the item reaches the shop, according to the published policy.'
                        : 'I understand fulfillment details must be confirmed before a live purchase.',
                    ],
                    ...(testMode
                      ? [
                          [
                            'testOrder',
                            'I understand this is a test order, no payment is taken, and no work or shipment is booked.',
                          ],
                        ]
                      : []),
                  ] as [keyof typeof acks, string][]
                ).map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={acks[key]}
                      onChange={(e) => setAcks((a) => ({ ...a, [key]: e.target.checked }))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              <p className="form-note">
                Checkout details stay in memory and are not saved in browser local storage.{' '}
                <Link href="/privacy">Privacy policy</Link>.
              </p>
            </>
          )}
          <div className="configuration-actions">
            <button
              className="button button-secondary"
              disabled={step === 0 || sending}
              onClick={() => move(step - 1)}
            >
              Back
            </button>
            {step < 2 ? (
              <button className="button" onClick={() => move(step + 1)}>
                Continue
              </button>
            ) : (
              <button
                className="button"
                disabled={
                  sending ||
                  !testMode ||
                  !quote ||
                  !!quoteError ||
                  currentQuote.orderability !== 'ready'
                }
                onClick={place}
              >
                {sending ? 'Placing test order…' : testMode ? 'Place test order' : 'Place order'}
              </button>
            )}
          </div>
        </section>
        <OrderSummary quote={currentQuote} testMode={testMode} />
      </div>
    </>
  );
}
