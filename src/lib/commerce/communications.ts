import type { CommunicationResult, OrderSnapshot } from './schema';
export type OrderMessage = 'confirmation' | 'shippingInstructions' | 'statusUpdate';
export interface OrderCommunicationProvider {
  send(input: {
    kind: OrderMessage;
    order: Readonly<OrderSnapshot>;
    idempotencyKey: string;
  }): Promise<{ reference: string }>;
}
// No provider is configured by default. This boundary does not send email.
export async function communicateOrder(
  order: OrderSnapshot,
  kind: OrderMessage,
  provider: OrderCommunicationProvider | null = null,
): Promise<CommunicationResult> {
  if (!provider) return { status: 'not-configured' };
  if (kind === 'shippingInstructions' && order.shippingInstructions.status !== 'available')
    return { status: 'not-requested' };
  const attemptedAt = new Date().toISOString();
  try {
    const result = await provider.send({
      kind,
      order,
      idempotencyKey: `${order.orderNumber}:${kind}`,
    });
    return { status: 'sent', attemptedAt, providerReference: result.reference };
  } catch {
    return { status: 'failed', attemptedAt };
  }
}
