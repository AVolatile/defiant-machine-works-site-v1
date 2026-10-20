import source from '@/data/service-matrix.json';
import { serviceMatrixSchema, type CatalogService } from './catalog-schema';
import type { BuildConfiguration } from './schema';
export const serviceMatrix = serviceMatrixSchema.parse(source);
export const catalogVersion = serviceMatrix.catalogVersion;
export const platforms = serviceMatrix.platforms;
export const serviceCatalog = serviceMatrix.services;
export const serviceOptions = serviceMatrix.addOns;
export const merchandise = serviceMatrix.merchandise.filter(
  (p) => p.checkoutEligibility === 'standard' && p.status === 'active',
);
export const serviceById = new Map(serviceCatalog.map((s) => [s.serviceId, s]));
export const familyLabels = {
  stippling: 'Stippling',
  milling: 'Slide milling / Optic cuts',
  cerakote: 'Cerakote',
  porting: 'Porting',
};
export const componentLabels: Record<BuildConfiguration['firearm']['componentType'], string> = {
  'complete-firearm': 'Complete firearm',
  frame: 'Frame',
  slide: 'Slide',
  'slide-and-barrel': 'Slide + barrel',
  extension: 'Magazine extension',
};
export function platformTitle(f: BuildConfiguration['firearm']) {
  const p = platforms.find((p) => p.id === f.manufacturerId);
  return `${p?.label || 'Your platform'} ${p?.models.find((m) => m.id === f.modelId)?.label || ''}`.trim();
}
export function variantLabel(f: BuildConfiguration['firearm']) {
  return (
    platforms.find((p) => p.id === f.manufacturerId)?.variants.find((v) => v.id === f.variantId)
      ?.label || ''
  );
}
export function variantsFor(manufacturerId: string, modelId: string) {
  return (platforms.find((p) => p.id === manufacturerId)?.variants || []).filter(
    (v) => v.id !== 'carry-comp' || modelId === 'sw-bodyguard20',
  );
}
export function componentFits(
  service: CatalogService,
  component: BuildConfiguration['firearm']['componentType'],
) {
  return service.componentScope === 'extension'
    ? true
    : service.componentScope === 'complete-firearm'
      ? component === 'complete-firearm'
      : service.componentScope === 'frame'
        ? ['frame', 'complete-firearm'].includes(component)
        : service.componentScope === 'slide-and-barrel'
          ? ['slide-and-barrel', 'complete-firearm'].includes(component)
          : ['slide', 'slide-and-barrel', 'complete-firearm'].includes(component);
}
export function eligibleService(service: CatalogService, f: BuildConfiguration['firearm']) {
  return (
    service.status === 'active' &&
    service.compatibleManufacturers.includes(f.manufacturerId) &&
    (!service.compatibleModels.length || service.compatibleModels.includes(f.modelId)) &&
    !service.exclusions.includes(f.modelId) &&
    (!service.compatibleVariants.length || service.compatibleVariants.includes(f.variantId)) &&
    componentFits(service, f.componentType) &&
    (service.existingCutPolicy === 'any' ||
      f.variantId !== 'existing-cut' ||
      service.existingCutPolicy === 'slimline-mos')
  );
}
export { isMerchandise } from './eligibility';
