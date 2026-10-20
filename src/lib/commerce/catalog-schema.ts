import { z } from 'zod';
export const visualReferenceSchema = z.object({
  image: z.string().startsWith('/assets/'),
  sourceUrl: z.url(),
  caption: z.string(),
  aggression: z.number().nullable(),
  context: z.string(),
});
export const catalogOptionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  sourceLabel: z.string(),
  deltaCents: z.number().int(),
  priceKnown: z.boolean(),
  featureId: z.string().nullable(),
  coatingId: z.enum(['single', 'battleworn', 'camo', 'none', 'shared']).nullable(),
  finishId: z.string().nullable(),
  reference: visualReferenceSchema.nullable(),
  modelIds: z.array(z.string()),
  variantIds: z.array(z.string()),
  requirements: z.array(z.object({ kind: z.literal('generation'), allowed: z.array(z.string()) })),
  reviewRequirements: z.array(z.string()),
  existingCut: z.literal('mos-only').nullable(),
  neutral: z.boolean(),
});
export const catalogFieldSchema = z.object({
  id: z.string(),
  sourceFieldId: z.string(),
  sourceLabel: z.string(),
  displayName: z.string(),
  role: z.enum([
    'model',
    'texture',
    'coating',
    'camo',
    'finish',
    'finish-secondary',
    'optic',
    'optic-toggle',
    'buis',
    'undercut',
    'index',
    'logo',
    'finger-grooves',
    'glove-bevel',
    'border',
    'barrel-port',
    'detail',
  ]),
  required: z.boolean(),
  type: z.enum(['select', 'single-choice']),
  sourceType: z.string(),
  options: z.array(catalogOptionSchema),
  conditions: z.array(
    z.object({
      showWhenTrue: z.boolean(),
      groups: z.array(
        z.array(
          z.object({
            fieldId: z.string(),
            operator: z.enum(['contains', 'unsupported']),
            values: z.array(z.string()),
          }),
        ),
      ),
    }),
  ),
});
export const serviceRecordSchema = z.object({
  serviceFamily: z.enum(['stippling', 'milling', 'cerakote', 'porting']),
  servicePackage: z.string(),
  serviceId: z.string(),
  sourceProductId: z.number(),
  displayName: z.string(),
  status: z.enum(['active', 'unavailable']),
  basePriceCents: z.number().int().nonnegative(),
  regularPriceCents: z.number().int().nonnegative(),
  priceType: z.literal('base-plus-options'),
  compatibleManufacturers: z.array(z.string()),
  compatibleModels: z.array(z.string()),
  compatibleVariants: z.array(z.string()),
  componentScope: z.enum(['frame', 'slide', 'slide-and-barrel', 'complete-firearm', 'extension']),
  fields: z.array(catalogFieldSchema),
  requiredOptions: z.array(z.string()),
  optionalOptions: z.array(z.string()),
  includedFeatures: z.array(z.object({ id: z.string(), label: z.string() })),
  addOns: z.array(z.string()),
  exclusions: z.array(z.string()),
  overlaps: z.array(z.string()),
  dependencies: z.array(
    z.object({ kind: z.enum(['INCLUDED', 'OPTIONAL']), scope: z.string(), fieldId: z.string() }),
  ),
  visualReferences: z.array(visualReferenceSchema),
  sourceUrls: z.array(z.url()),
  reviewRequirements: z.array(z.string()),
  checkoutEligibility: z.enum(['standard', 'review-required']),
  existingCutPolicy: z.enum(['uncut-only', 'slimline-mos', 'any']),
  description: z.string(),
  fixedOpticId: z.string().nullable(),
});
export const serviceMatrixSchema = z.object({
  schemaVersion: z.literal(1),
  catalogVersion: z.string(),
  crawledAt: z.iso.datetime(),
  platforms: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      models: z.array(z.object({ id: z.string(), label: z.string() })),
      variants: z.array(z.object({ id: z.string(), label: z.string() })),
    }),
  ),
  services: z.array(serviceRecordSchema),
  addOns: z.array(
    z.object({
      id: z.string(),
      displayName: z.string(),
      basePriceCents: z.number().int(),
      status: z.literal('active'),
      sourceUrls: z.array(z.url()),
      description: z.string(),
      bindings: z.array(
        z.object({
          serviceId: z.string(),
          fieldId: z.string(),
          optionId: z.string(),
          relationship: z.enum(['INCLUDED', 'PRICE_DELTA']),
        }),
      ),
      reviewRequirements: z.array(z.string()),
      visualReferences: z.array(z.string()),
    }),
  ),
  upcoming: z.array(
    z.object({
      serviceId: z.string(),
      displayName: z.string(),
      serviceFamily: z.literal('porting'),
      compatibleManufacturers: z.array(z.string()),
      status: z.literal('coming-soon'),
      checkoutEligibility: z.literal('unavailable'),
      sourceUrls: z.array(z.url()),
    }),
  ),
  merchandise: z.array(
    z.object({
      id: z.string(),
      displayName: z.string(),
      priceCents: z.number().int(),
      regularPriceCents: z.number().int(),
      status: z.enum(['active', 'unavailable']),
      checkoutEligibility: z.enum(['standard', 'inquiry-only']),
      reason: z.string(),
      image: z.string().nullable(),
      sourceUrls: z.array(z.url()),
    }),
  ),
});
export type CatalogService = z.infer<typeof serviceRecordSchema>;
export type CatalogField = z.infer<typeof catalogFieldSchema>;
export type CatalogOption = z.infer<typeof catalogOptionSchema>;
export type VisualReference = z.infer<typeof visualReferenceSchema>;
export type ServiceFamily = CatalogService['serviceFamily'];
