import records from './products.json';
import galleryRecords from './gallery.json';
import articleRecords from './articles.json';
import type { Product, GalleryItem, Article } from './types';
export const products = records as Product[];
export const gallery = galleryRecords as GalleryItem[];
export const articles = articleRecords as Article[];
