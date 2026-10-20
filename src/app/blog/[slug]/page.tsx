import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articles } from '@/data/catalog';
import { Photo, CTA } from '@/components/ui/primitives';
import { metadata, JsonLd } from '@/lib/seo';
import { site } from '@/data/site';
export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = articles.find((a) => a.slug === slug);
  return a
    ? metadata(
        a.title,
        a.paragraphs.find((p) => p.tag === 'p')?.text.slice(0, 170) || a.title,
        `/blog/${slug}`,
      )
    : {};
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = articles.find((a) => a.slug === slug);
  if (!a) notFound();
  return (
    <>
      <article className="article-page">
        <header className="wrap article-header">
          <div className="breadcrumb">
            <Link href="/blog">Shop talk</Link>
            <span>/</span>The archive
          </div>
          <span className="eyebrow">Defiant / Shop talk</span>
          <h1>{a.title}</h1>
          <p className="article-byline">
            By {a.author} <span> / </span>
            <time dateTime={a.date}>
              {new Date(a.date + 'T12:00:00Z').toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </time>
          </p>
        </header>
        <div className="wrap">
          <Photo
            className="article-hero"
            src={a.image}
            alt="Custom work from the Defiant workshop"
            priority
          />
        </div>
        <div className="article-body prose">
          {a.paragraphs.map((p, i) =>
            p.tag === 'h2' ? (
              <h2 key={i}>{p.text}</h2>
            ) : p.tag === 'h3' ? (
              <h3 key={i}>{p.text}</h3>
            ) : (
              <p key={i}>{p.text}</p>
            ),
          )}
          <p className="source-note">
            Preserved from <a href={a.sourceUrl}>the original Defiant article</a>. Catalog details
            and availability may have changed; confirm your project with the shop.
          </p>
          <Link className="text-link" href="/services">
            Explore services
          </Link>
        </div>
      </article>
      <CTA />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: a.title,
          datePublished: a.date,
          author: { '@type': 'Organization', name: a.author },
          publisher: { '@type': 'Organization', name: site.name },
          image: a.image,
          mainEntityOfPage: `${site.url}/blog/${a.slug}`,
        }}
      />
    </>
  );
}
