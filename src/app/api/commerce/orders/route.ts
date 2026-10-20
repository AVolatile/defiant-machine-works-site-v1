import { NextRequest } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { checkoutSchema, type OrderSnapshot } from '@/lib/commerce/schema';
import { quoteCart } from '@/lib/commerce/pricing';
import {
  developmentCheckoutEnabled,
  paymentProvider,
  PaymentDeclinedError,
} from '@/lib/commerce/payment';
import { orderRepository, sessionHash } from '@/lib/commerce/order-repository';
import { communicateOrder } from '@/lib/commerce/communications';
import {
  allowAttempt,
  attachSession,
  getSession,
  limitedJson,
  privateResponse,
  trustedOrigin,
} from '@/lib/commerce/http';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!trustedOrigin(request))
    return privateResponse({ error: 'Please use the checkout on this website.' }, 403);
  if (!developmentCheckoutEnabled())
    return privateResponse(
      { error: 'Live payment is not configured in this build. Your order has not been placed.' },
      503,
    );
  const session = getSession(request);
  const attemptKey =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-development';
  if (!allowAttempt(attemptKey))
    return privateResponse({ error: 'Please wait one minute before trying again.' }, 429);
  let input;
  try {
    const result = checkoutSchema.safeParse(await limitedJson(request));
    if (!result.success)
      return privateResponse(
        {
          error: 'Please check your checkout details.',
          fields: result.error.flatten().fieldErrors,
        },
        422,
      );
    input = result.data;
  } catch {
    return privateResponse({ error: 'Your checkout request could not be read.' }, 400);
  }
  const quote = quoteCart(input.items);
  if (input.catalogVersion !== quote.catalogVersion)
    return privateResponse(
      {
        error: 'Some build details changed. Review your build before checkout.',
        quote,
        catalogVersion: quote.catalogVersion,
      },
      409,
    );
  if (quote.errors.length) return privateResponse({ error: quote.errors.join(' ') }, 422);
  if (quote.orderability !== 'ready')
    return privateResponse(
      {
        error:
          'This configuration requires review before purchase. Request a configuration review.',
        quote,
      },
      422,
    );
  if (quote.subtotalCents !== input.expectedSubtotalCents)
    return privateResponse(
      {
        error: 'Your cart price has changed. Review the updated subtotal before placing an order.',
        quote,
      },
      409,
    );
  const hash = sessionHash(session);
  const { testPayment: scenario, idempotencyKey, ...payload } = input;
  const requestHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  let repo;
  try {
    repo = orderRepository();
  } catch {
    return privateResponse(
      { error: 'Order storage is unavailable. Your cart is unchanged; please try again later.' },
      503,
    );
  }
  let previous;
  try {
    previous = repo.findRequest(hash, idempotencyKey);
  } catch {
    return privateResponse(
      { error: 'Order storage is unavailable. Your cart is unchanged; please try again later.' },
      503,
    );
  }
  if (previous && previous.requestHash !== requestHash)
    return privateResponse(
      { error: 'This checkout request changed. Review your details before trying again.' },
      409,
    );
  let order: OrderSnapshot = previous?.snapshot || {
    version: 2,
    catalogVersion: quote.catalogVersion,
    orderNumber: `DMW-TEST-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(5).toString('hex').toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: 'PENDING_PAYMENT',
    mode: 'test',
    customer: input.customer,
    billingAddress: input.billingAddress,
    address: input.address,
    items: structuredClone(quote.items),
    subtotalCents: quote.subtotalCents,
    shippingCents: null,
    taxCents: null,
    payment: { provider: 'development', status: 'pending' },
    shippingInstructions: { status: 'pending', channels: ['email'], content: null },
    communications: {
      confirmation: { status: 'not-requested' },
      shippingInstructions: { status: 'not-configured' },
      statusUpdate: { status: 'not-requested' },
    },
    acknowledgements: input.acknowledgements,
  };
  try {
    order = repo.reserve(order, hash, idempotencyKey, requestHash);
    if (order.status !== 'TEST_ORDER_RECEIVED') {
      if (!repo.claimPayment(order.orderNumber))
        return attachSession(
          privateResponse(
            { error: 'This order is already being processed. Please wait before retrying.' },
            409,
          ),
          request,
          session,
        );
      const provider = paymentProvider();
      const payment = await provider.createPaymentSession({
        orderNumber: order.orderNumber,
        amountCents: order.subtotalCents,
        currency: 'USD',
        idempotencyKey,
      });
      order.payment.sessionId = payment.id;
      const confirmedPayment = await provider.confirmPayment(payment.id, scenario);
      order.payment.transactionId = confirmedPayment.reference;
      order.payment.status = 'test-approved';
      order.status = 'TEST_ORDER_RECEIVED';
      repo.save(order, 'TEST_PAYMENT_APPROVED');
      // Communication failure must never roll back a successfully saved payment/order.
      order.communications.confirmation = await communicateOrder(order, 'confirmation');
      try {
        repo.save(order, 'CONFIRMATION_DELIVERY_NOT_CONFIGURED');
      } catch {
        /* The paid snapshot remains durable; delivery can be reconciled separately. */
      }
    }
    return attachSession(
      privateResponse({
        orderNumber: order.orderNumber,
        confirmationUrl: `/order/${order.orderNumber}/confirmation`,
        purchasedIds: order.items.map((i) => i.id),
      }),
      request,
      session,
    );
  } catch (e) {
    order.status = 'PAYMENT_FAILED';
    order.payment.status = 'failed';
    try {
      repo.save(order, 'TEST_PAYMENT_FAILED');
    } catch {}
    return attachSession(
      privateResponse(
        {
          error:
            e instanceof PaymentDeclinedError
              ? e.message
              : 'The test order could not be saved. Your cart is unchanged.',
        },
        502,
      ),
      request,
      session,
    );
  }
}
