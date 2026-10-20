import { buildSchema, cartItemSchema } from './schema';
import { emptyCart, type CartEnvelope } from './cart-envelope';
import { platforms, serviceById } from './catalog';
const variants: Record<string, string> = {
  'OEM / no existing optic cut': 'uncut',
  'No existing optic cut': 'uncut',
  'Standard / no existing optic cut': 'uncut',
  'Existing optic cut / MOS': 'existing-cut',
  'Existing optic cut': 'existing-cut',
  'Performance Center Carry Comp': 'carry-comp',
  Standard: 'standard',
};
const oldValueAliases: Record<string, string> = {
  FACTORY: 'Keep Factory',
  FRONT: 'Recut Dovetail in Front of Optic',
  DELETE: 'Delete',
};
export function migrateLegacyCart(raw: unknown): { envelope: CartEnvelope; message: string } {
  const envelope = emptyCart();
  let retired = 0;
  if (!Array.isArray(raw))
    return { envelope, message: 'An outdated cart could not be read. Configure your items again.' };
  for (const candidate of raw.slice(0, 20)) {
    if (!candidate || typeof candidate !== 'object') {
      retired++;
      continue;
    }
    if (candidate.kind === 'product') {
      const parsed = cartItemSchema.safeParse(candidate);
      if (parsed.success) envelope.items.push(parsed.data);
      else retired++;
      continue;
    }
    const old = candidate.build,
      f = old?.firearm;
    if (!f || typeof f !== 'object') {
      retired++;
      continue;
    }
    const platform = platforms.find((p) => p.label === f.manufacturer),
      model = platform?.models.find((m) => m.label === f.model),
      variantId = variants[f.variant];
    if (!platform || !model || !variantId || !Array.isArray(old.services)) {
      retired++;
      continue;
    }
    const services = [];
    let invalid = false;
    for (const choice of old.services) {
      const service = serviceById.get(choice.serviceId);
      if (!service) {
        invalid = true;
        break;
      }
      const attributes: Record<string, string> = {};
      for (const [key, value] of Object.entries(choice.attributes || {})) {
        if (typeof value !== 'string') continue;
        const field = service.fields.find((f) => f.id === key);
        if (field?.options.some((o) => o.id === value)) {
          attributes[key] = value;
          continue;
        }
        const optionLabel = oldValueAliases[value] || value;
        const matches = service.fields.flatMap((field) =>
          field.options
            .filter((o) => o.displayName === optionLabel)
            .map((option) => ({ field, option })),
        );
        const match =
          key === 'Optic Cut'
            ? matches.find((m) => m.field.role === 'optic')
            : key === 'BUIS Location'
              ? matches.find((m) => m.field.role === 'buis')
              : key === 'Finish'
                ? matches.find((m) => ['finish', 'camo'].includes(m.field.role))
                : undefined;
        if (match) {
          attributes[match.field.id] = match.option.id;
          if (key === 'Finish') {
            const coating = service.fields.find((f) => f.role === 'coating'),
              type = match.field.role === 'camo' ? 'camo' : 'single';
            const option = coating?.options.find((o) => o.coatingId === type);
            if (coating && option) attributes[coating.id] = option.id;
          }
        }
      }
      services.push({
        serviceId: service.serviceId,
        optionIds: Array.isArray(choice.optionIds)
          ? choice.optionIds.filter((id: unknown) => typeof id === 'string')
          : [],
        attributes,
      });
    }
    if (invalid) {
      retired++;
      continue;
    }
    const parsed = buildSchema.safeParse({
      schemaVersion: 3,
      id: old.id,
      firearm: {
        manufacturerId: platform.id,
        modelId: model.id,
        variantId,
        generationId: 'unspecified',
        componentType: f.componentType,
      },
      services,
      createdAt: old.createdAt,
    });
    if (parsed.success && candidate.id === parsed.data.id)
      envelope.items.push({ kind: 'build', id: parsed.data.id, build: parsed.data });
    else retired++;
  }
  envelope.needsReview = envelope.items.length > 0;
  return {
    envelope,
    message: `Your saved cart was upgraded. Some build details changed. Review your build and current pricing before checkout.${retired ? ` ${retired} unsupported or damaged item${retired === 1 ? ' was' : 's were'} retired.` : ''}`,
  };
}
