// Explicitly audited ordinary merchandise. Firearm components are inquiry-only.
export const merchandiseIds = [
  'dmw-sticker-pack',
  'sdrt-sticker',
  'longboi-sticker',
  'electric-topo-sticker',
  'defiant-machine-works-sticker',
] as const;
export function isMerchandise(id: string) {
  return merchandiseIds.some((value) => value === id);
}
