import { serviceById, serviceOptions } from './catalog';
import { activeSourceFields, sourceSelections } from './service-configuration';
import type { CatalogService } from './catalog-schema';
import type { BuildConfiguration, ServiceSelection } from './schema';
export type Relationship =
  | 'INCLUDED'
  | 'REQUIRED'
  | 'OPTIONAL'
  | 'UPGRADE'
  | 'MUTUALLY_EXCLUSIVE'
  | 'PRICE_DELTA'
  | 'REVIEW_REQUIRED'
  | 'COMPATIBLE';
export type RuleAdjustment = { relationship: Relationship; message: string };
const copy = <T>(value: T): T => structuredClone(value);
function selectedCoating(choice: ServiceSelection) {
  const s = serviceById.get(choice.serviceId),
    f = s?.fields.find((f) => f.role === 'coating');
  return f?.options.find((o) => o.id === choice.attributes[f.id]);
}
function ownsFrame(choice: ServiceSelection) {
  return (
    serviceById.get(choice.serviceId)?.serviceFamily === 'stippling' &&
    !!selectedCoating(choice) &&
    !['none', 'shared'].includes(selectedCoating(choice)!.coatingId || 'none')
  );
}
function transferFinish(from: ServiceSelection, to: ServiceSelection, build: BuildConfiguration) {
  const src = serviceById.get(from.serviceId),
    dst = serviceById.get(to.serviceId);
  if (!src || !dst) return to;
  const result = copy(to),
    sourceFields = activeSourceFields(src.serviceId, sourceSelections(from, build));
  const fromCoat = src.fields.find((f) => f.role === 'coating'),
    toCoat = dst.fields.find((f) => f.role === 'coating');
  const type = fromCoat?.options.find((o) => o.id === from.attributes[fromCoat.id])?.coatingId;
  if (toCoat && (!result.attributes[toCoat.id] || selectedCoating(result)?.coatingId === 'none')) {
    const option = toCoat.options.find((o) => o.coatingId === type);
    if (option) result.attributes[toCoat.id] = option.id;
  }
  for (const sf of sourceFields.filter((f) =>
    ['finish', 'finish-secondary', 'camo'].includes(f.role),
  )) {
    const option = sf.options.find((o) => o.id === from.attributes[sf.id]);
    if (!option) continue;
    const tf = activeSourceFields(dst.serviceId, sourceSelections(result, build)).find(
      (f) => f.role === sf.role,
    );
    const target = tf?.options.find((o) => o.finishId === option.finishId);
    if (tf && target && !result.attributes[tf.id]) result.attributes[tf.id] = target.id;
  }
  return result;
}
export function normalizeBuild(input: BuildConfiguration) {
  const build = copy(input),
    adjustments: RuleAdjustment[] = [],
    errors: string[] = [],
    reviewReasons: string[] = [];
  build.services.sort((a, b) => a.serviceId.localeCompare(b.serviceId));
  // Equivalent legacy SKUs become package selections, never another billable line.
  for (const choice of build.services) {
    const remaining: string[] = [];
    for (const id of choice.optionIds) {
      const addon = serviceOptions.find((a) => a.id === id);
      if (!addon) {
        errors.push('An unverified add-on was selected.');
        continue;
      }
      const binding = addon.bindings.find((b) => b.serviceId === choice.serviceId);
      if (binding) {
        const field = serviceById
          .get(choice.serviceId)
          ?.fields.find((f) => f.id === binding.fieldId);
        const current = field?.options.find((o) => o.id === choice.attributes[binding.fieldId]);
        if (!current || current.neutral) choice.attributes[binding.fieldId] = binding.optionId;
        else if (current.id !== binding.optionId)
          errors.push(
            `${addon.displayName} conflicts with the selected package option. Choose this work once inside the package.`,
          );
        adjustments.push({
          relationship: binding.relationship,
          message: `${addon.displayName} is configured inside this package; no separate add-on charge is applied.`,
        });
      } else {
        remaining.push(id);
        reviewReasons.push(
          ...(addon.reviewRequirements.length
            ? addon.reviewRequirements
            : [
                `${addon.displayName} is not an option for this package. Request a compatibility review.`,
              ]),
        );
      }
    }
    choice.optionIds = remaining;
  }
  const milling = build.services.find(
    (c) => serviceById.get(c.serviceId)?.serviceFamily === 'milling',
  );
  const porting = build.services.find(
    (c) => serviceById.get(c.serviceId)?.serviceFamily === 'porting',
  );
  const slideOwner = milling || porting;
  const frameOwner = build.services.find(ownsFrame);
  const complete = build.services.find((c) => c.serviceId === 'pistol-cerakote');
  // A complete coating package is retained when it alone owns both coating scopes.
  if (complete && (slideOwner || frameOwner)) {
    build.services = build.services.filter((c) => c !== complete);
    const remainingId =
      slideOwner && frameOwner ? null : slideOwner ? 'frame-only-cerakote' : 'slide-only-cerakote';
    if (remainingId && !build.services.some((c) => c.serviceId === remainingId))
      build.services.push(
        transferFinish(complete, { serviceId: remainingId, attributes: {}, optionIds: [] }, build),
      );
    if (slideOwner) {
      const updated = transferFinish(complete, slideOwner, build);
      Object.assign(slideOwner, updated);
    }
    adjustments.push({
      relationship: 'INCLUDED',
      message:
        'Complete-pistol coating was replaced by only the remaining coating scope. Finishing already owned by a selected package is not charged twice.',
    });
  }
  const whole = build.services.find((c) => c.serviceId === 'pistol-cerakote');
  for (const [scope, standaloneId] of [
    ['slide', 'slide-only-cerakote'],
    ['frame', 'frame-only-cerakote'],
  ] as const) {
    const separate = build.services.find((c) => c.serviceId === standaloneId);
    if (!separate) continue;
    let owner: ServiceSelection | undefined =
      whole || (scope === 'slide' ? milling || porting : frameOwner);
    // Core/Crown can own requested frame coating through their verified upgrade menu.
    if (!owner && scope === 'frame')
      owner = build.services.find(
        (c) =>
          serviceById.get(c.serviceId)?.serviceFamily === 'stippling' &&
          serviceById.get(c.serviceId)?.fields.some((f) => f.role === 'coating'),
      );
    if (owner) {
      Object.assign(owner, transferFinish(separate, owner, build));
      build.services = build.services.filter((c) => c !== separate);
      adjustments.push({
        relationship: 'INCLUDED',
        message: `${serviceById.get(owner.serviceId)?.displayName} already covers ${scope} finishing. The separate ${scope} Cerakote service was removed; review the finish inside the owning package.`,
      });
    }
  }
  if (
    milling &&
    porting &&
    porting.serviceId === 'bodyguard-2-0-viper-ports' &&
    milling.serviceId === 'smith-wesson-bodyguard-2-0-optic-cut'
  ) {
    const port = serviceById.get(porting.serviceId)!,
      coat = port.fields.find((f) => f.role === 'coating')!,
      shared = coat.options.find((o) => o.coatingId === 'shared')!;
    Object.assign(milling, transferFinish(porting, milling, build));
    porting.attributes = { [coat.id]: shared.id };
    adjustments.push({
      relationship: 'INCLUDED',
      message:
        'Viper Ports uses the coating selected with the optic cut. The shared slide is refinished once; no second coating upgrade is charged.',
    });
  }
  if (porting && selectedCoating(porting)?.coatingId === 'shared' && !milling)
    errors.push('Shared porting coating requires the Bodyguard optic-cut service in this build.');
  const slots = new Map<string, string>();
  for (const choice of build.services) {
    const s = serviceById.get(choice.serviceId);
    if (!s) continue;
    const slot =
      s.componentScope === 'extension'
        ? 'extension'
        : s.serviceFamily === 'cerakote'
          ? s.serviceId
          : s.serviceFamily;
    if (slots.has(slot)) errors.push(`Choose one ${s.serviceFamily} package for this component.`);
    slots.set(slot, choice.serviceId);
  }
  build.services.sort((a, b) => a.serviceId.localeCompare(b.serviceId));
  return {
    build,
    adjustments,
    errors: [...new Set(errors)],
    reviewReasons: [...new Set(reviewReasons)],
  };
}
export function toggleBuildService(build: BuildConfiguration, service: CatalogService) {
  const next = copy(build),
    existing = next.services.some((s) => s.serviceId === service.serviceId);
  if (existing) next.services = next.services.filter((s) => s.serviceId !== service.serviceId);
  else {
    if (service.serviceFamily !== 'cerakote' && service.componentScope !== 'extension')
      next.services = next.services.filter((c) => {
        const other = serviceById.get(c.serviceId);
        return (
          other?.serviceFamily !== service.serviceFamily || other.componentScope === 'extension'
        );
      });
    next.services.push({ serviceId: service.serviceId, optionIds: [], attributes: {} });
  }
  return normalizeBuild(next);
}
