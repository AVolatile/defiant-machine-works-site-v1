// Use the Gallery's existing service labels for both filters and reference URLs.
export const galleryServiceLabels = {
  stippling: 'Stippling',
  milling: 'Slide Milling',
  cerakote: 'Cerakote',
  porting: 'Porting',
} as const;
export type GalleryFamily = keyof typeof galleryServiceLabels;
export function galleryServiceFilter(value: string) {
  return Object.values(galleryServiceLabels).some((label) => label === value) ? value : 'All';
}
export function galleryReferenceHref(family: GalleryFamily) {
  return `/gallery?${new URLSearchParams({ service: galleryServiceLabels[family] })}`;
}
