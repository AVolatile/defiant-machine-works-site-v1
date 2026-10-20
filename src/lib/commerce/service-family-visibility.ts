import {
  componentFits,
  eligibleService,
  familyLabels,
  serviceCatalog,
  serviceMatrix,
} from './catalog';
import type { ServiceFamily } from './catalog-schema';
import type { BuildConfiguration } from './schema';

type Component = BuildConfiguration['firearm']['componentType'];

export function componentServiceFamilies(component: Component): ServiceFamily[] {
  return (Object.keys(familyLabels) as ServiceFamily[]).filter((family) =>
    serviceCatalog.some(
      (service) =>
        service.status === 'active' &&
        service.serviceFamily === family &&
        // Separately supplied extensions do not establish a family for the main component.
        (component === 'extension'
          ? service.componentScope === 'extension'
          : service.componentScope !== 'extension') &&
        componentFits(service, component),
    ),
  );
}

// Presentation only: these groups never determine pricing or purchase eligibility.
export function visibleServiceFamilyGroups(firearm: BuildConfiguration['firearm']) {
  const available = serviceCatalog.filter((service) => eligibleService(service, firearm));
  return componentServiceFamilies(firearm.componentType).map((family) => ({
    family,
    entries: available.filter((service) => service.serviceFamily === family),
    upcoming:
      family === 'porting'
        ? serviceMatrix.upcoming.filter((entry) =>
            entry.compatibleManufacturers.includes(firearm.manufacturerId),
          )
        : [],
  }));
}
