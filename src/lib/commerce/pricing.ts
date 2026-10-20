import {
  catalogVersion,
  componentLabels,
  componentFits,
  eligibleService,
  merchandise,
  platforms,
  serviceById,
  variantsFor,
  buildTitle,
} from './catalog';
import { normalizeBuild } from './build-rules';
import { sourceConfiguration } from './service-configuration';
import { hasScopeOnlyCoatingContext } from './coating-context';
import type { BuildConfiguration, CartItem, CartQuote, PricedBuild, PricedService } from './schema';
export function priceBuild(input: BuildConfiguration): PricedBuild {
  const scopeOnlyCoating = hasScopeOnlyCoatingContext(input);
  const normalized = normalizeBuild(input),
    build = normalized.build,
    f = build.firearm;
  const errors = [...normalized.errors],
    reviewReasons = [...normalized.reviewReasons],
    selections: PricedService[] = [];
  const platform = platforms.find((p) => p.id === f.manufacturerId);
  if (
    !scopeOnlyCoating &&
    (!platform?.models.some((m) => m.id === f.modelId) ||
      !variantsFor(f.manufacturerId, f.modelId).some((v) => v.id === f.variantId))
  )
    errors.push(
      'This platform or variant is not supported by the verified catalog. Request a custom inquiry.',
    );
  if (!build.services.length) errors.push('Choose at least one service.');
  for (const choice of build.services) {
    const service = serviceById.get(choice.serviceId);
    if (!service || service.status !== 'active') {
      errors.push('An unavailable or coming-soon service was selected.');
      continue;
    }
    const compatible = scopeOnlyCoating
      ? service.serviceFamily === 'cerakote' &&
        !service.compatibleModels.length &&
        !service.compatibleVariants.length &&
        service.existingCutPolicy === 'any' &&
        !service.fields.some((field) => field.role === 'model') &&
        componentFits(service, f.componentType)
      : eligibleService(service, f);
    if (!compatible)
      errors.push(`${service.displayName} is not listed for this platform, variant or component.`);
    const config = sourceConfiguration(choice, build)!;
    errors.push(...config.errors.map((e) => `${service.displayName}: ${e}`));
    reviewReasons.push(...service.reviewRequirements, ...config.notes);
    const total = service.basePriceCents + config.surchargeCents;
    if (total < 0) errors.push('A service price is invalid. Review the configuration.');
    selections.push({
      ...choice,
      attributes: config.values,
      title: service.displayName,
      category: service.serviceFamily,
      unitPriceCents: service.basePriceCents,
      calculatedPriceCents: total,
      optionLabels: config.labels,
      details: config.details,
      breakdown: [
        { label: 'Base service', amountCents: service.basePriceCents, kind: 'base' },
        ...config.breakdown,
      ],
    });
  }
  const ready = !errors.length && !reviewReasons.length;
  return {
    ...build,
    services: selections,
    orderability: ready ? 'ready' : 'requires-review',
    reviewReasons: [...new Set(reviewReasons)],
    compatibilityStatus: ready ? 'confirmed' : 'requires-review',
    pricingStatus: ready ? 'confirmed' : 'base-estimate',
    estimatedSubtotalCents: selections.reduce((n, s) => n + s.calculatedPriceCents, 0),
    notes: [...new Set(reviewReasons)],
    errors: [...new Set(errors)],
    adjustments: normalized.adjustments.map((a) => a.message),
  };
}
export function quoteCart(items: CartItem[]): CartQuote {
  const errors: string[] = [],
    seen = new Set<string>(),
    quoted: CartQuote['items'] = [];
  for (const item of items) {
    if (seen.has(item.id)) {
      errors.push('Duplicate cart identifiers. Review your cart.');
      continue;
    }
    seen.add(item.id);
    if (item.kind === 'build') {
      if (item.id !== item.build.id) errors.push('A build identifier is invalid.');
      const build = priceBuild(item.build);
      errors.push(...build.errors);
      quoted.push({
        id: item.id,
        kind: 'build',
        title: buildTitle(build),
        subtotalCents: build.estimatedSubtotalCents,
        quantity: 1,
        build,
      });
    } else {
      const product = merchandise.find((p) => p.id === item.productId);
      if (!product) {
        errors.push(
          'This item is inquiry-only or unavailable and cannot be purchased through this cart.',
        );
        continue;
      }
      quoted.push({
        id: item.id,
        kind: 'product',
        productId: product.id,
        title: product.displayName,
        subtotalCents: product.priceCents * item.quantity,
        quantity: item.quantity,
        image: product.image || undefined,
      });
    }
  }
  const requiresReview = quoted.some((i) => i.build?.orderability === 'requires-review');
  return {
    catalogVersion,
    items: quoted,
    subtotalCents: quoted.reduce((n, i) => n + i.subtotalCents, 0),
    errors: [...new Set(errors)],
    requiresReview,
    orderability: errors.length ? 'invalid' : requiresReview ? 'requires-review' : 'ready',
    shippingCents: null,
    taxCents: null,
    currency: 'USD',
  };
}
export { componentLabels };
