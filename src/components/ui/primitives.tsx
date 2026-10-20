import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Icon } from './icon';
export function ButtonLink({
  href,
  children,
  secondary = false,
  className = '',
  signature = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
  signature?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={`button ${secondary ? 'button-secondary' : ''} ${className}`}>
      {children}
      {signature && <Icon name="diagonal" />}
    </Link>
  );
}
export function Photo({
  src,
  alt,
  priority = false,
  className = '',
  sizes = '(max-width: 700px) 100vw, 50vw',
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <div className={`photo ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} />
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  children,
  href,
  linkText = 'Explore',
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {linkText}
        </Link>
      )}
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="page-intro wrap">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>{eyebrow.split(' / ')[0]}</span>
      </nav>
      <h1>{title}</h1>
      <p className="intro-copy">{description}</p>
      {children}
    </section>
  );
}
export function CTA() {
  return (
    <section className="cta-band wrap">
      <div>
        <span className="eyebrow">Your vision. Our craft.</span>
        <h2>Ready to build yours?</h2>
      </div>
      <div className="button-row">
        <ButtonLink href="/customize" signature>
          Start your build
        </ButtonLink>
        <Link className="text-link" href="/custom-inquiry">
          Custom project? Request a quote
        </Link>
      </div>
    </section>
  );
}
export function FAQ({ items }: { items: { question: string; answer: string; id?: string }[] }) {
  return (
    <div className="faq-list">
      {items.map((item, i) => (
        <details key={item.question} id={item.id || `question-${i + 1}`}>
          <summary>
            {item.question}
            <Icon name="chevron-down" />
          </summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
