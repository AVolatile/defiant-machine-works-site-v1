import Link from 'next/link';
import type { Article } from '@/data/types';
import { Photo } from '@/components/ui/primitives';
export function BlogList({ articles }: { articles: Article[] }) {
  return (
    <div className="blog-list">
      {articles.map((article) => (
        <article key={article.slug}>
          <Link href={`/blog/${article.slug}`} tabIndex={-1} aria-hidden="true">
            <Photo src={article.image} alt="Custom work by Defiant Machine Works" />
          </Link>
          <div>
            <span className="eyebrow">
              <time dateTime={article.date}>
                {new Date(article.date + 'T12:00:00Z').toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
              </time>{' '}
              / {article.author}
            </span>
            <h2>
              <Link href={`/blog/${article.slug}`}>{article.title}</Link>
            </h2>
            <p>{article.paragraphs.find((p) => p.tag === 'p')?.text.slice(0, 220)}…</p>
            <Link className="text-link" href={`/blog/${article.slug}`}>
              Read the article
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
