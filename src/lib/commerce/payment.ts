import type { OrderSnapshot } from './schema';
export interface PaymentProvider {
  readonly name: string;
  createPaymentSession(input: {
    orderNumber: string;
    amountCents: number;
    currency: 'USD';
    idempotencyKey: string;
  }): Promise<{ id: string }>;
  confirmPayment(
    sessionId: string,
    scenario: 'approved' | 'declined',
  ): Promise<{ status: 'test-approved'; reference: string }>;
  getPaymentStatus(sessionId: string): Promise<'test-only'>;
}
export function developmentCheckoutEnabled() {
  return process.env.COMMERCE_MODE === 'test' && process.env.PAYMENT_PROVIDER === 'development';
}
export class PaymentDeclinedError extends Error {}
class DevelopmentPaymentProvider implements PaymentProvider {
  readonly name = 'development';
  async createPaymentSession(input: {
    orderNumber: string;
    amountCents: number;
    currency: 'USD';
    idempotencyKey: string;
  }) {
    if (!developmentCheckoutEnabled()) throw Error('Development checkout is disabled.');
    return { id: `test_${input.orderNumber}` };
  }
  async confirmPayment(sessionId: string, scenario: 'approved' | 'declined') {
    if (scenario === 'declined')
      throw new PaymentDeclinedError(
        'The development payment adapter declined this test. No payment was taken. Your cart is unchanged; try the approved test scenario.',
      );
    return { status: 'test-approved' as const, reference: sessionId };
  }
  async getPaymentStatus() {
    return 'test-only' as const;
  }
}
export function paymentProvider(): PaymentProvider {
  if (!developmentCheckoutEnabled())
    throw Error('Live payment is not configured in this build. Your order has not been placed.');
  return new DevelopmentPaymentProvider();
}
export function developmentOrder(snapshot: OrderSnapshot) {
  return snapshot.mode === 'test';
}
