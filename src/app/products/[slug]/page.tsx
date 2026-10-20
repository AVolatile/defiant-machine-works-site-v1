import Link from 'next/link';
import { AddProduct } from '@/components/commerce/cart';
import { isMerchandise } from '@/lib/commerce/catalog';
import { notFound } from 'next/navigation';
import { products } from '@/data/catalog';
import { ProductImages } from '@/components/catalog/product-images';
import { ProductCard } from '@/components/catalog/product-card';
import { ButtonLink, SectionHeading, CTA } from '@/components/ui/primitives';
import { priceLabel } from '@/lib/catalog';
import { metadata, JsonLd } from '@/lib/seo';
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = products.find((p) => p.slug === slug);
  return p ? metadata(p.title, p.description.join(' ').slice(0, 170), `/products/${slug}`) : {};
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = products.find((p) => p.slug === slug);
  if (!p) notFound();
  const related = products.filter((v) => v.slug !== slug && v.category === p.category).slice(0, 3);
  return (
    <>
      <div className="wrap breadcrumb product-breadcrumb">
        <Link href="/products">Catalog</Link>
        <span>/</span>
        <span>{p.category}</span>
      </div>
      <section className="wrap product-detail">
        <ProductImages images={p.images} title={p.title} />
        <div className="product-detail-copy">
          <span className="eyebrow">{p.kind === 'addon' ? 'Service option' : p.category}</span>
          <h1>{p.title}</h1>
          <p className="detail-price">
            {p.salePrice !== null && (
              <del aria-label="Regular price">${p.regularPrice.toFixed(2)}</del>
            )}
            {priceLabel(p)}
          </p>
          <span className="availability">{p.availability}</span>
          <p>{p.description[0]}</p>
          <p className="form-note">
            {p.kind === 'addon'
              ? 'This is a service option, not a standalone physical item.'
              : 'Final pricing, options, and compatibility are confirmed with Defiant.'}
          </p>
          {isMerchandise(p.slug) ? (
            <AddProduct id={p.slug} />
          ) : (
            <ButtonLink
              href={`${p.kind === 'service' ? '/customize' : '/custom-inquiry'}?product=${encodeURIComponent(p.title)}&service=${encodeURIComponent(p.service)}`}
            >
              {p.kind === 'service' ? 'Configure this service' : 'Ask about this item'}
            </ButtonLink>
          )}
          <div className="detail-support">
            <Link href="/shipping">Shipping & lead time</Link>
            <Link href="/warranty">Our guarantee</Link>
          </div>
        </div>
      </section>
      <section className="wrap section product-description">
        <div>
          <span className="eyebrow">The details</span>
          <h2>Know the work.</h2>
        </div>
        <div className="prose">
          {p.description.slice(1).map((text, i) => (
            <p key={i}>{text}</p>
          ))}
          {p.attributes.length > 0 && (
            <dl className="review-summary">
              {p.attributes.map((a) => (
                <div key={a.name}>
                  <dt>{a.name}</dt>
                  <dd>{a.values.join(', ')}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="source-note">
            Ask Defiant to confirm fitment and options before proceeding.{' '}
            <Link href="/contact">Talk with the shop</Link>
          </p>
        </div>
      </section>
      {related.length > 0 && (
        <section className="wrap section section-top-rule">
          <SectionHeading eyebrow="Continue exploring" title="More from the catalog." />
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
      <CTA />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': p.kind === 'product' ? 'Product' : 'Service',
          name: p.title,
          description: p.description[0],
          image: p.images[0],
          ...(p.kind === 'product'
            ? { brand: { '@type': 'Brand', name: 'Defiant Machine Works' } }
            : { provider: { '@type': 'Organization', name: 'Defiant Machine Works' } }),
        }}
      />
    </>
  );
}
