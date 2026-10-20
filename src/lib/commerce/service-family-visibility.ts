import {
  componentFits,
  eligibleService,
  familyLabels,
  serviceById,
  serviceCatalog,
  serviceMatrix,
} from './catalog';
import type { ServiceFamily } from './catalog-schema';
import type { BuildConfiguration, ServiceSelection } from './schema';

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

function packageConfiguresCoating(
  firearm: BuildConfiguration['firearm'],
  choice: ServiceSelection,
) {
  const service = serviceById.get(choice.serviceId);
  if (!service || service.serviceFamily === 'cerakote' || !eligibleService(service, firearm))
    return false;
  return service.dependencies.some((dependency) => {
    if (!['slide-coating', 'frame-coating'].includes(dependency.scope)) return false;
    if (dependency.kind === 'INCLUDED') return true;
    const field = service.fields.find(
      (field) => field.id === dependency.fieldId && field.role === 'coating',
    );
    const option = field?.options.find((option) => option.id === choice.attributes[field.id]);
    return !!option?.coatingId && !['none', 'shared'].includes(option.coatingId);
  });
}

// Presentation only: these groups never determine pricing or purchase eligibility.
export function visibleServiceFamilyGroups(
  firearm: BuildConfiguration['firearm'],
  selected: ServiceSelection[] = [],
) {
  const available = serviceCatalog.filter((service) => eligibleService(service, firearm));
  const coatingInsidePackage =
    ['slide', 'slide-and-barrel'].includes(firearm.componentType) ||
    selected.some((choice) => packageConfiguresCoating(firearm, choice));
  return componentServiceFamilies(firearm.componentType)
    .filter((family) => family !== 'cerakote' || !coatingInsidePackage)
    .map((family) => ({
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
