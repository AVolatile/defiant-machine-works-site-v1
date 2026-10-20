export type Product = {
  slug: string;
  title: string;
  category: string;
  kind: 'product' | 'service' | 'addon';
  price: number;
  regularPrice: number;
  salePrice: number | null;
  pricePrefix: string;
  description: string[];
  images: string[];
  availability: string;
  attributes: { name: string; values: string[] }[];
  checkoutEnabled: false;
  sourceUrl: string;
  service: string;
};
export type GalleryItem = {
  slug: string;
  title: string;
  finish: string;
  service: string;
  image: string;
  sourceUrl: string;
  sourcePage?: string;
  referenceStatus?: 'coming-soon';
  servicePageExample?: boolean;
};
export type Article = {
  slug: string;
  title: string;
  date: string;
  author: string;
  paragraphs: { tag: string; text: string }[];
  image: string;
  sourceUrl: string;
};
export type Service = {
  startingPrice: number;
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  benefit: string;
  image: string;
  platforms: string[];
  sourceUrl: string;
};
