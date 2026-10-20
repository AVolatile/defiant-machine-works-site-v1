import { notFound } from 'next/navigation';
import { services } from '@/data/services';
import { products, articles } from '@/data/catalog';
import { ServicesHub, ServicePage } from '@/components/content/service-pages';
import {
  ResourcesPage,
  AboutPage,
  ContactPage,
  ShippingPage,
  WarrantyPage,
  FAQPage,
  LegalPage,
} from '@/components/content/info-pages';
import { ProductBrowser } from '@/components/catalog/product-browser';
import { BlogList } from '@/components/content/blog-list';
import { PageIntro, CTA } from '@/components/ui/primitives';
import { metadata, JsonLd } from '@/lib/seo';
const pages: Record<string, { title: string; description: string }> = {
  services: {
    title: 'Your vision. Our craft.',
    description:
      'Explore custom stippling, optic cuts, slide milling, Cerakote, and platform-specific porting.',
  },
  gallery: {
    title: 'The work, up close.',
    description:
      'A collection of actual Defiant builds, custom Cerakote finishes, frame work, and machined details.',
  },
  products: {
    title: 'The Defiant catalog.',
    description:
      'Browse products, services, and options. Find the right starting point, then confirm the details with Defiant.',
  },
  resources: {
    title: 'Know before you build.',
    description:
      'Shipping, lead times, stippling guides, warranty, and answers about working with Defiant.',
  },
  about: {
    title: 'About Defiant',
    description:
      'Precision craftsmanship, more than ten years of experience, and faith-informed integrity.',
  },
  contact: {
    title: 'Contact Defiant',
    description:
      'Talk with Defiant Machine Works about your project. Call 931-266-2422 or email sales@defiantmachineworks.com.',
  },
  shipping: {
    title: 'Shipping & lead time',
    description:
      'Understand Defiant’s published turnaround, rush service, shipping arrangements, and order policies.',
  },
  warranty: {
    title: 'Warranty & guarantees',
    description: 'Defiant stands behind the products it develops and the upgrades it performs.',
  },
  faq: {
    title: 'Frequently asked questions',
    description:
      'Source-grounded answers about orders, shipping, stippling, slide milling, Cerakote, and custom work.',
  },
  blog: {
    title: 'Shop talk.',
    description:
      'From the original Defiant archive: ideas and information about Cerakote, optic cuts, and stippling.',
  },
  privacy: {
    title: 'Privacy policy',
    description:
      'Draft privacy policy describing the contact form, build inquiries, and local draft storage.',
  },
  terms: {
    title: 'Terms of use',
    description:
      'Draft terms for browsing Defiant services and products and sending project inquiries.',
  },
  cookies: {
    title: 'Cookies & browser storage',
    description:
      'How this build uses local storage for unfinished inquiries, without analytics or advertising cookies.',
  },
  accessibility: {
    title: 'Accessibility',
    description:
      'Accessibility approach, keyboard interactions, and assistance for the Defiant website.',
  },
  ...Object.fromEntries(
    services.map((s) => [s.slug, { title: s.title, description: s.description }]),
  ),
};
export function generateStaticParams() {
  return Object.keys(pages)
    .filter((slug) => slug !== 'gallery')
    .map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  return page ? metadata(page.title, page.description, `/${slug}`) : {};
}
export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!pages[slug]) notFound();
  if (services.some((s) => s.slug === slug))
    return (
      <>
        <ServicePage slug={slug} />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: pages[slug].title,
            description: pages[slug].description,
            provider: { '@type': 'Organization', name: 'Defiant Machine Works' },
          }}
        />
      </>
    );
  switch (slug) {
    case 'services':
      return <ServicesHub />;
    case 'products':
      return (
        <>
          <PageIntro
            eyebrow="Products / Services / Options"
            title={pages[slug].title}
            description={pages[slug].description}
          />
          <section className="wrap section-tight">
            <p className="catalog-note">
              <span className="status-dot" />
              Browse, explore, inquire. Final options and prices are confirmed with the shop.
            </p>
            <ProductBrowser products={products} />
          </section>
          <CTA />
        </>
      );
    case 'about':
      return <AboutPage />;
    case 'contact':
      return <ContactPage />;
    case 'shipping':
      return <ShippingPage />;
    case 'warranty':
      return <WarrantyPage />;
    case 'faq':
      return <FAQPage />;
    case 'resources':
      return <ResourcesPage />;
    case 'blog':
      return (
        <>
          <PageIntro
            eyebrow="Shop talk / The archive"
            title={pages[slug].title}
            description={pages[slug].description}
          />
          <section className="wrap section-tight">
            <BlogList articles={articles} />
          </section>
          <CTA />
        </>
      );
    default:
      return <LegalPage slug={slug} />;
  }
}
