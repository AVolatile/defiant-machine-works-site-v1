import { serviceById, platforms } from './catalog';
import type { CatalogField, CatalogOption } from './catalog-schema';
import type { BuildConfiguration, ServiceSelection } from './schema';
export type SourceField = CatalogField;
export const configurationFor = (serviceId: string) => serviceById.get(serviceId);
export const fieldKey = (field: Pick<CatalogField, 'id'>) => field.id;
export function sourceSelections(choice: ServiceSelection, build: BuildConfiguration) {
  const values = { ...choice.attributes };
  for (const field of configurationFor(choice.serviceId)?.fields || [])
    if (field.role === 'model') {
      const match = field.options.find(
        (o) =>
          o.modelIds.includes(build.firearm.modelId) &&
          (!o.variantIds.length || o.variantIds.includes(build.firearm.variantId)),
      );
      if (match) values[field.id] = match.id;
    }
  return values;
}
export function activeSourceFields(serviceId: string, values: Record<string, string>) {
  const fields = configurationFor(serviceId)?.fields || [];
  function visible(field: CatalogField, visited = new Set<string>()): boolean {
    if (visited.has(field.id)) return false;
    const next = new Set(visited).add(field.id);
    return field.conditions.every((c) => {
      const matches = c.groups.some((group) =>
        group.every((line) => {
          const parent = fields.find((f) => f.id === line.fieldId);
          return (
            line.operator === 'contains' &&
            !!parent &&
            visible(parent, next) &&
            line.values.includes(values[parent.id])
          );
        }),
      );
      return c.showWhenTrue ? matches : !matches;
    });
  }
  return fields.filter((f) => visible(f));
}
export function optionProblem(option: CatalogOption, build: BuildConfiguration) {
  if (option.existingCut === 'mos-only' && build.firearm.variantId !== 'existing-cut')
    return 'This option requires an existing MOS slide.';
  for (const requirement of option.requirements)
    if (!requirement.allowed.includes(build.firearm.generationId))
      return 'Choose the source-supported generation group for this treatment.';
  return '';
}
export function updateSourceSelection(
  choice: ServiceSelection,
  build: BuildConfiguration,
  field: CatalogField,
  value: string,
): ServiceSelection {
  const values = sourceSelections(
    { ...choice, attributes: { ...choice.attributes, [field.id]: value } },
    build,
  );
  const active = new Set(activeSourceFields(choice.serviceId, values).map((f) => f.id));
  return {
    ...choice,
    attributes: Object.fromEntries(Object.entries(values).filter(([key]) => active.has(key))),
  };
}
export function sourceConfiguration(choice: ServiceSelection, build: BuildConfiguration) {
  const service = configurationFor(choice.serviceId);
  if (!service) return null;
  const values = sourceSelections(choice, build),
    active = activeSourceFields(choice.serviceId, values);
  const errors: string[] = [],
    notes: string[] = [],
    details: { label: string; value: string }[] = [],
    breakdown: { label: string; amountCents: number; kind: 'base' | 'included' | 'upgrade' }[] = [];
  let surchargeCents = 0;
  for (const key of Object.keys(choice.attributes)) {
    if (!service.fields.some((f) => f.id === key))
      errors.push(
        'Saved service options changed. Edit this build and reselect the current choices.',
      );
    else if (!active.some((f) => f.id === key))
      errors.push(
        'An option is not available with the selected service details. Reselect the options.',
      );
  }
  for (const field of active) {
    const option = field.options.find((o) => o.id === values[field.id]);
    if (!option) {
      if (field.required) errors.push(`Choose ${field.displayName}.`);
      if (values[field.id]) errors.push(`Unverified ${field.displayName} selection.`);
      continue;
    }
    const problem = optionProblem(option, build);
    if (problem) errors.push(problem);
    if (
      service.existingCutPolicy === 'slimline-mos' &&
      build.firearm.variantId === 'existing-cut' &&
      field.role === 'optic' &&
      option.existingCut !== 'mos-only'
    )
      errors.push(
        'An existing slimline MOS slide supports only the listed rear-stud-delete option; other cuts require a custom inquiry.',
      );
    if (
      field.role === 'barrel-port' &&
      !option.neutral &&
      !['slide-and-barrel', 'complete-firearm'].includes(build.firearm.componentType)
    )
      errors.push('The selected barrel-port option requires the slide and barrel together.');
    if (!option.priceKnown) notes.push(`${field.displayName} pricing requires confirmation.`);
    notes.push(...option.reviewRequirements);
    surchargeCents += option.deltaCents;
    if (field.role === 'model') {
      const label = platforms
        .find((p) => p.id === build.firearm.manufacturerId)
        ?.models.find((m) => m.id === build.firearm.modelId)?.label;
      details.push({ label: 'Model', value: label || 'Unlisted model' });
    } else details.push({ label: field.displayName, value: option.displayName });
    if (
      field.role !== 'model' &&
      (option.deltaCents !== 0 || ['texture', 'coating'].includes(field.role))
    )
      breakdown.push({
        label: `${field.displayName}: ${option.displayName}`,
        amountCents: option.deltaCents,
        kind: option.deltaCents === 0 ? 'included' : 'upgrade',
      });
  }
  for (const item of service.includedFeatures)
    if (item.id !== 'slide-coating') details.push({ label: 'Included', value: item.label });
  return {
    values,
    errors: [...new Set(errors)],
    notes: [...new Set(notes)],
    labels: details.map((d) => `${d.label}: ${d.value}`),
    details,
    breakdown,
    surchargeCents,
  };
}
