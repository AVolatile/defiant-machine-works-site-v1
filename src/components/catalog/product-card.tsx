import Link from 'next/link';
import type { Product } from '@/data/types';
import { Photo } from '@/components/ui/primitives';
import { priceLabel } from '@/lib/catalog';
export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden="true">
        <Photo
          src={product.images[0]}
          alt={product.title}
          sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw"
        />
      </Link>
      <div className="product-card-body">
        <span className="eyebrow">{product.category}</span>
        <h3>
          <Link href={`/products/${product.slug}`}>{product.title}</Link>
        </h3>
        <p className="product-price">
          {product.salePrice !== null && (
            <del aria-label="Regular price">${product.regularPrice.toFixed(2)}</del>
          )}
          {priceLabel(product)}
        </p>
        <Link className="text-link" href={`/products/${product.slug}`}>
          {product.kind === 'product' ? 'View product' : 'View service'}
        </Link>
      </div>
    </article>
  );
}
