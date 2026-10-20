// Existing audited IDs: scope-only records are limited to standalone cosmetic coating.
export const standaloneCoatingIds = [
  'pistol-cerakote',
  'frame-only-cerakote',
  'slide-only-cerakote',
] as const;

export function isStandaloneCoatingId(id: string) {
  return standaloneCoatingIds.some((entry) => entry === id);
}

export function hasScopeOnlyCoatingContext(build: {
  firearm: {
    manufacturerId: string;
    modelId: string;
    variantId: string;
    generationId: string;
  };
  services: { serviceId: string; optionIds: string[] }[];
}) {
  const f = build.firearm;
  return (
    f.manufacturerId === '' &&
    f.modelId === '' &&
    f.variantId === '' &&
    f.generationId === 'unspecified' &&
    build.services.length === 1 &&
    isStandaloneCoatingId(build.services[0].serviceId) &&
    build.services[0].optionIds.length === 0
  );
}
