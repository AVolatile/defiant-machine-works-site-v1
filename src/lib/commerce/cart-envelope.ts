import { z } from 'zod';
import { cartSchema } from './schema';
import { currentCatalogVersion } from '@/data/catalog-version';
export const cartStorageKey = 'dmw-cart-v3';
export const legacyCartStorageKey = 'dmw-cart-v2';
export const cartEnvelopeSchema = z.object({
  schemaVersion: z.literal(3),
  catalogVersion: z.string().max(100),
  items: cartSchema,
  needsReview: z.boolean(),
  acceptedSubtotalCents: z.number().int().nonnegative().nullable(),
});
export type CartEnvelope = z.infer<typeof cartEnvelopeSchema>;
export const emptyCart = (): CartEnvelope => ({
  schemaVersion: 3,
  catalogVersion: currentCatalogVersion,
  items: [],
  needsReview: false,
  acceptedSubtotalCents: null,
});
