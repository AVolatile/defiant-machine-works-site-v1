import { z } from 'zod';
import { hasScopeOnlyCoatingContext } from './coating-context';
export const componentTypes = [
  'complete-firearm',
  'frame',
  'slide',
  'slide-and-barrel',
  'extension',
] as const;
export const usStates = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'DC',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
] as const;
export const selectionSchema = z.object({
  serviceId: z.string().max(100),
  optionIds: z.array(z.string().max(100)).max(20),
  attributes: z.record(z.string().max(100), z.string().max(150)).default({}),
});
export const buildSchema = z
  .object({
    schemaVersion: z.literal(3),
    id: z.uuid(),
    firearm: z.object({
      manufacturerId: z.string().max(80),
      modelId: z.string().max(80),
      variantId: z.string().max(80),
      generationId: z
        .enum(['unspecified', 'gen-3-or-earlier', 'gen-4-or-later'])
        .default('unspecified'),
      componentType: z.enum(componentTypes),
    }),
    services: z.array(selectionSchema).min(1).max(15),
    createdAt: z.iso.datetime(),
  })
  .superRefine((build, context) => {
    if (hasScopeOnlyCoatingContext(build)) return;
    for (const key of ['manufacturerId', 'modelId', 'variantId'] as const)
      if (!build.firearm[key])
        context.addIssue({
          code: 'custom',
          path: ['firearm', key],
          message: 'Complete the platform information for this service.',
        });
  });
export const cartItemSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('build'), id: z.uuid(), build: buildSchema }),
  z.object({
    kind: z.literal('product'),
    id: z.uuid(),
    productId: z.string().max(100),
    quantity: z.number().int().min(1).max(20),
  }),
]);
export const cartSchema = z.array(cartItemSchema).max(20);
const required = (name: string, max = 100) =>
  z.string().trim().min(1, `Enter your ${name}.`).max(max);
export const customerSchema = z.object({
  firstName: required('first name'),
  lastName: required('last name'),
  email: z.email('Enter a valid email address.').max(200),
  phone: z
    .string()
    .trim()
    .refine(
      (v) =>
        v === '' ||
        (/^\+?[\d() .-]+$/.test(v) &&
          v.replace(/\D/g, '').length >= 7 &&
          v.replace(/\D/g, '').length <= 15),
      'Enter a valid phone number.',
    ),
});
export const addressSchema = z.object({
  line1: required('street address', 150),
  line2: z.string().trim().max(150),
  city: required('city'),
  state: z.enum(usStates, { error: 'Choose your state.' }),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP code.'),
  country: z.literal('US'),
});
export const checkoutSchema = z.object({
  catalogVersion: z.string().max(100),
  items: cartSchema.min(1, 'Your cart is empty.'),
  customer: customerSchema,
  billingAddress: addressSchema,
  address: addressSchema,
  shippingMethod: z.literal('test-return'),
  acknowledgements: z.object({
    inspection: z.literal(true, { error: 'Acknowledge the final inspection requirement.' }),
    shipping: z.literal(true, { error: 'Review the shipping instructions.' }),
    leadTime: z.literal(true, { error: 'Acknowledge the lead-time policy.' }),
    testOrder: z.literal(true, { error: 'Acknowledge that this is a development order only.' }),
  }),
  expectedSubtotalCents: z.number().int().nonnegative(),
  idempotencyKey: z.uuid(),
  testPayment: z.enum(['approved', 'declined']).default('approved'),
});
export type ServiceSelection = z.infer<typeof selectionSchema>;
export type BuildConfiguration = z.infer<typeof buildSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_FAILED'
  | 'TEST_ORDER_RECEIVED'
  | 'PAID'
  | 'AWAITING_ITEM'
  | 'ITEM_RECEIVED'
  | 'IN_PRODUCTION'
  | 'COMPLETED'
  | 'CANCELLED';
export type PricedService = ServiceSelection & {
  title: string;
  category: string;
  unitPriceCents: number;
  calculatedPriceCents: number;
  optionLabels: string[];
  details: { label: string; value: string }[];
  breakdown: { label: string; amountCents: number; kind: 'base' | 'included' | 'upgrade' }[];
};
export type PricedBuild = Omit<BuildConfiguration, 'services'> & {
  orderability: 'ready' | 'requires-review';
  reviewReasons: string[];
  compatibilityStatus: 'confirmed' | 'requires-review';
  pricingStatus: 'base-estimate' | 'confirmed';
  services: PricedService[];
  estimatedSubtotalCents: number;
  notes: string[];
  errors: string[];
  adjustments: string[];
};
export type QuotedItem = {
  id: string;
  kind: 'build' | 'product';
  title: string;
  subtotalCents: number;
  quantity: number;
  build?: PricedBuild;
  productId?: string;
  image?: string;
};
export type CartQuote = {
  catalogVersion: string;
  items: QuotedItem[];
  subtotalCents: number;
  errors: string[];
  requiresReview: boolean;
  orderability: 'ready' | 'requires-review' | 'invalid';
  shippingCents: null;
  taxCents: null;
  currency: 'USD';
};
export type OrderSnapshot = {
  version: 2;
  catalogVersion?: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  mode: 'test';
  customer: CheckoutInput['customer'];
  billingAddress: CheckoutInput['billingAddress'];
  address: CheckoutInput['address'];
  items: QuotedItem[];
  subtotalCents: number;
  shippingCents: null;
  taxCents: null;
  payment: {
    provider: 'development';
    status: 'pending' | 'test-approved' | 'failed';
    sessionId?: string;
    transactionId?: string;
  };
  shippingInstructions: {
    status: 'pending' | 'available';
    channels: ('email' | 'confirmation')[];
    content: string | null;
  };
  communications: Record<
    'confirmation' | 'shippingInstructions' | 'statusUpdate',
    CommunicationResult
  >;
  acknowledgements: CheckoutInput['acknowledgements'];
};
export type CommunicationResult = {
  status: 'not-requested' | 'not-configured' | 'sent' | 'failed';
  attemptedAt?: string;
  providerReference?: string;
};
export function money(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function buildOrdinal(items: readonly Pick<QuotedItem, 'kind'>[], index: number) {
  return items.slice(0, index + 1).filter((item) => item.kind === 'build').length;
}
