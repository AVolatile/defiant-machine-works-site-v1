import { galleryReferenceHref, type GalleryFamily } from '@/lib/gallery';
const names = {
  stippling: 'stippling',
  milling: 'milling',
  cerakote: 'Cerakote',
  porting: 'porting',
};
export function GalleryReference({ family }: { family: GalleryFamily }) {
  return (
    <a
      className="text-link gallery-reference"
      href={galleryReferenceHref(family)}
      target="_blank"
      rel="noopener noreferrer"
    >
      See {names[family]} examples in the Gallery <span aria-hidden="true">↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
