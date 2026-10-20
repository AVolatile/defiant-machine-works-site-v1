import type { Product } from '@/data/types';
export function priceLabel(product: Product) {
  if (product.price === 0) return product.kind === 'addon' ? 'Included option' : 'No charge';
  return `${product.pricePrefix}${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(product.price)}`;
}
