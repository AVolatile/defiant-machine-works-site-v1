import Link from 'next/link';
import { PageIntro, Photo, ButtonLink, CTA, FAQ } from '@/components/ui/primitives';
import { site } from '@/data/site';
import { faqGroups } from '@/data/faq';
import { ContactForm } from '@/components/forms/contact-form';
const resourceLinks = [
  [
    'Shipping & lead time',
    'Plan your project, arrange shipping, and understand the published turnaround.',
    '/shipping',
  ],
  [
    'Stippling guide',
    'Compare real source texture ratings and everyday-carry recommendations.',
    '/resources/stippling-guide',
  ],
  [
    'Warranty & guarantees',
    'The service and product commitments behind the finished work.',
    '/warranty',
  ],
  [
    'Frequently asked questions',
    'Straight answers about orders, services, and working with Defiant.',
    '/faq',
  ],
  ['Shop talk', 'Source articles about Cerakote, optic cuts, and stippling.', '/blog'],
];
export function ResourcesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Resources"
        title="Know before you build."
        description="Clear answers and useful details, from selecting your texture to getting the finished work back in your hands."
      />
      <section className="wrap resource-list">
        {resourceLinks.map(([title, copy, href], i) => (
          <Link href={href} key={href}>
            <span className="mono">0{i + 1}</span>
            <div>
              <h2>{title}</h2>
              <p>{copy}</p>
            </div>
          </Link>
        ))}
      </section>
      <CTA />
    </>
  );
}
export function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About Defiant"
        title={
          <>
            Experience in the craft.
            <br />
            Precision in every detail.
          </>
        }
        description="Defiant Machine Works brings more than ten years of machining and firearms experience to personalized firearm customization."
      />
      <section className="wrap about-feature">
        <Photo
          src={site.workshop}
          alt="A custom Defiant pistol resting on machined metal stock"
          priority
        />
        <div className="about-feature-label">
          <span className="eyebrow">Performance + aesthetics</span>
          <span className="mono">One project. Your details.</span>
        </div>
      </section>
      <section className="section wrap two-column-copy">
        <div>
          <span className="eyebrow">What we do</span>
          <h2>
            Craftsmanship
            <br />
            gets personal.
          </h2>
        </div>
        <div className="prose">
          <p>
            Stippling, optic cuts, slide milling, Cerakote, and platform-specific porting. Our work
            brings individual preferences and precise detail into the same project.
          </p>
          <p>
            Whether you arrive with a complete vision or a few questions, the process starts with
            choosing the work and confirming the details. We stand behind our upgrades and the
            products we develop.
          </p>
          <Link className="text-link" href="/services">
            Explore the work
          </Link>
        </div>
      </section>
      <section className="values-section">
        <div className="wrap values-inner">
          <img src={site.icon} alt="" width="110" height="110" />
          <div>
            <span className="eyebrow">Faith-informed values</span>
            <h2>Built with conviction.</h2>
            <p>
              Integrity means honest work and clear communication. Stewardship means caring for what
              you entrust to us. Service means taking responsibility for the finished result. Those
              principles guide the way we approach the craft.
            </p>
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
export function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Good work starts with a conversation."
        description="Questions about a project, an order, or a finish? Get in touch with Defiant directly, or send an inquiry below."
      />
      <section className="wrap section-tight contact-layout">
        <aside>
          <span className="eyebrow">Direct to the shop</span>
          <h2>Let’s talk details.</h2>
          <div className="contact-detail">
            <span>Email</span>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </div>
          <div className="contact-detail">
            <span>Call / text</span>
            <a href={site.phoneHref}>{site.phone}</a>
          </div>
          <p>
            Local drop-off and pickup are available by appointment. Contact us to arrange a time.
          </p>
          <div className="contact-build-note">
            <span className="eyebrow">Have a build in mind?</span>
            <p>Walk through your platform, service, and finish in one place.</p>
            <Link href="/customize" className="text-link">
              Start your build
            </Link>
          </div>
        </aside>
        <ContactForm />
      </section>
      <CTA />
    </>
  );
}
export function ShippingPage() {
  const sections = [
    [
      'Lead time',
      'Defiant’s published turnaround is two weeks or less once the order is in the shop’s hands. You will be contacted if the work encounters an issue or slowdown. Confirm the current schedule when discussing your project.',
    ],
    [
      'Expedited service',
      'Rush service requires email confirmation so the shop can verify your deadline. Published rush rates: one week — $125; three days — $225; 24 hours — $350. These are rush-service charges, not complete project quotes.',
    ],
    [
      'Local drop-off & pickup',
      'Local appointments are available. The shop schedules a time by text or email after an order is placed. Contact Defiant before visiting. Local-drop shipping discounts are not configured in this build; arrange the details directly with the shop.',
    ],
    [
      'Serialized firearms & frames',
      'Defiant’s source guidance prefers customers to arrange shipment through a local FFL. Contact Defiant for current shipping instructions before sending serialized items. Confirm the applicable carrier requirements for your shipment.',
    ],
    [
      'Non-serialized slides & parts',
      'The published FAQ lists USPS or UPS for slides and non-serialized parts, including SIG grip modules with the FCU removed and 2011 grips removed from the frame. Confirm current instructions with Defiant before sending anything.',
    ],
    [
      'Return shipping costs',
      'You are responsible for the cost of shipping your project to Defiant. The return-shipping charge on an order covers sending the completed work back to you. Confirm the current cost with the shop.',
    ],
    [
      'Order changes',
      'Changes cannot be guaranteed once work has begun. The published change windows are 24 hours for local drop-off orders and 72 hours for shipped orders. Contact the shop promptly with any requested change.',
    ],
    [
      'Cancellation',
      'The published policy offers a refund of 75% of the order total if canceled before the firearm is shipped to Defiant. Once it has been shipped to the shop, the order is non-refundable. Confirm the terms for your order directly; this website does not collect payments.',
    ],
  ];
  return (
    <>
      <PageIntro
        eyebrow="Shipping & lead time"
        title="From your hands to ours. And back."
        description="Plan your project with clear expectations. Shipping instructions are supplied by email after your order or arrangements are confirmed."
      />
      <section className="wrap policy-layout">
        <aside className="policy-nav">
          <span className="eyebrow">Project logistics</span>
          {sections.map(([title], i) => (
            <a key={title} href={`#shipping-${i}`}>
              {String(i + 1).padStart(2, '0')} / {title}
            </a>
          ))}
        </aside>
        <div>
          <div className="notice">
            Before sending anything, confirm current shipping instructions with Defiant. Carrier
            rules and other requirements can change; this page is informational.
          </div>
          {sections.map(([title, copy], i) => (
            <section className="policy-section" id={`shipping-${i}`} key={title}>
              <span className="eyebrow">0{i + 1}</span>
              <h2>{title}</h2>
              <p>{copy}</p>
            </section>
          ))}
          <p className="source-note">
            Reorganized from Defiant’s published FAQ.{' '}
            <a href="https://defiantmachineworks.com/faq/">View published policy</a>
          </p>
        </div>
      </section>
      <CTA />
    </>
  );
}
export function WarrantyPage() {
  return (
    <>
      <PageIntro
        eyebrow="Warranty & guarantees"
        title="In short, you’re covered."
        description="We fully stand by every product we develop and every upgrade we perform. The commitments below preserve Defiant’s published guarantee."
      />
      <section className="wrap warranty-grid">
        <div>
          <span className="eyebrow">01 / Service work</span>
          <h2>
            Pride in the work.
            <br />
            Responsibility for it.
          </h2>
          <blockquote>
            “We take pride in customizing your firearm. If you have any issues with our work, please
            let us know so we can fix them.”
          </blockquote>
        </div>
        <div>
          <span className="eyebrow">02 / Products</span>
          <h2>
            Built to be used.
            <br />
            Backed by Defiant.
          </h2>
          <blockquote>
            “We believe in our products and want you to use them in any condition. If one breaks,
            cracks, or is destroyed, we will replace it. Just tell us if it is a good story.”
          </blockquote>
        </div>
      </section>
      <section className="wrap warranty-contact">
        <span className="eyebrow">Need us to take a look?</span>
        <h2>Let’s make it right.</h2>
        <p>
          Contact the shop with the product or service details and a description of the issue.
          Defiant will confirm the next steps and any return arrangements.
        </p>
        <div className="button-row">
          <ButtonLink href="/contact">Contact Defiant</ButtonLink>
          <a href={`mailto:${site.email}`} className="text-link">
            {site.email}
          </a>
        </div>
      </section>
      <CTA />
    </>
  );
}
export function FAQPage() {
  return (
    <>
      <PageIntro
        eyebrow="Frequently asked questions"
        title="Straight answers. Better decisions."
        description="A practical guide to working with Defiant. For a question specific to your firearm or project, talk with the shop before sending anything."
      />
      <section className="wrap faq-layout">
        <aside className="policy-nav">
          <span className="eyebrow">Find your answer</span>
          {faqGroups.map((g, i) => (
            <a href={`#faq-group-${i}`} key={g.title}>
              {g.title}
            </a>
          ))}
        </aside>
        <div>
          {faqGroups.map((g, i) => (
            <section id={`faq-group-${i}`} className="faq-group" key={g.title}>
              <h2>{g.title}</h2>
              <FAQ items={g.items} />
            </section>
          ))}
        </div>
      </section>
      <CTA />
    </>
  );
}
const legal: Record<string, { title: string; description: string; sections: [string, string][] }> =
  {
    privacy: {
      title: 'Privacy policy',
      description:
        'How information is handled by this website’s contact and build-inquiry features.',
      sections: [
        [
          'Information you choose to provide',
          'Contact inquiries ask for your name, email, optional phone, subject, and message. Build inquiries also include your selected service, platform, model, options, finish, reference URL, notes, and preferred contact method. Do not provide firearm serial numbers, payment details, or unnecessary identification.',
        ],
        [
          'Why we use it',
          'Inquiry information is used to respond to your questions and discuss your project. Checkout keeps your name, email, phone, billing address and return address in memory while you review an order. Live payment is not configured. Only explicitly enabled test checkout saves an encrypted order snapshot on the server; use test details. Test records are not business orders. Order email delivery is not configured and no order email is claimed as sent. If a form delivery endpoint is configured, the server forwards validated inquiry data to that processing service. A successful inquiry is confirmed only after that endpoint accepts the request.',
        ],
        [
          'Drafts on your device',
          'The cart saves only non-sensitive platform, component, service, and merchandise selections in local storage. Custom inquiry drafts save platform and option choices; contact details, notes, and reference links stay in memory. Checkout contact and return-address fields are never saved to local storage. Clear the saved draft, remove cart items, or clear site data to remove those selections.',
        ],
        [
          'Technical information',
          'The hosting provider may process technical request information for operation and security. The application uses an in-memory request counter for basic form rate limiting. Hosting log settings and the selected form processing provider must be confirmed before launch.',
        ],
        [
          'Tracking and sharing',
          'This website contains no advertising tracker, analytics integration, or customer account system. There is no live payment processor. Development checkout simulates payment without collecting card or bank details. Inquiry information is sent to the configured delivery endpoint only when you submit. Reference URLs are recorded as text; this website does not automatically fetch their contents.',
        ],
        [
          'Contact and requests',
          'For questions about information provided to Defiant, email sales@defiantmachineworks.com. The owner must confirm its handling procedures and the final form processing provider before approving this policy.',
        ],
      ],
    },
    terms: {
      title: 'Terms of use',
      description:
        'Terms for browsing the catalog and discussing a project through this inquiry-only website.',
      sections: [
        [
          'Website scope',
          'This website presents Defiant’s services, products, service options, and work examples. The configurator and cart help organize a project. Production checkout is not open. An explicitly enabled development checkout creates test records without collecting payment, reserving availability, or authorizing work. Sending a custom inquiry requests a conversation or quote; it does not place an order.',
        ],
        [
          'Catalog information',
          'Names, descriptions, and base prices are migrated from the public source catalog. Final pricing depends on confirmed options and project details. Compatibility, availability, and scheduling must be confirmed directly with Defiant.',
        ],
        [
          'Shipping and work',
          'Wait for current shipping instructions from Defiant before sending any firearm, frame, slide, or part. See Shipping & Lead Time for the company’s published operational policies and the Warranty page for its service and product guarantee.',
        ],
        [
          'Acceptable use',
          'Submit accurate contact details and relevant inquiries. Do not submit malicious content, sensitive identification, firearm serial numbers, or payment details. This website does not accept file uploads.',
        ],
        [
          'Photography and identity',
          'Defiant branding and work photography are used to present Defiant Machine Works. Their inclusion does not grant permission to reuse those materials.',
        ],
        [
          'Owner review',
          'The owner must review these terms, its policies, and the applicable requirements before publication. Contact sales@defiantmachineworks.com with questions.',
        ],
      ],
    },
    cookies: {
      title: 'Cookies & browser storage',
      description: 'A clear account of the storage used by this website.',
      sections: [
        [
          'No non-essential tracking cookies',
          'This website does not implement analytics cookies, advertising cookies, or third-party review widgets. No non-essential tracking cookies are intentionally set by the application. A cookie consent banner is therefore not included.',
        ],
        [
          'Saved build inquiries',
          'The cart uses local storage for non-sensitive configuration and merchandise selections. The custom inquiry retains only platform and option draft choices. Contact details, notes, reference links, and checkout addresses are not saved there. Clear Saved Draft, remove cart items, or clear your browser’s site data to remove those selections.',
        ],
        [
          'Hosting and future changes',
          'A necessary, HttpOnly, same-site order-session cookie protects access to private test confirmations. It contains a random identifier and expires after 30 days; it does not contain contact or address data. The owner must confirm any additional cookies used by the selected host before launch. Adding analytics, marketing tools, login, or checkout in a later phase requires reviewing this policy and implementing any appropriate consent controls.',
        ],
      ],
    },
    accessibility: {
      title: 'Accessibility',
      description: 'Designed so more people can explore the work and start a conversation.',
      sections: [
        [
          'Our approach',
          'This site targets WCAG 2.2 AA through semantic page structure, readable contrast, visible keyboard focus, labeled forms, text-based validation, responsive layouts, and reduced-motion support.',
        ],
        [
          'Keyboard interactions',
          'Use the skip link to reach page content. Navigation, filters, forms, and FAQ disclosures work with a keyboard. In the gallery, use the arrow keys to move between projects and Escape to close the image viewer.',
        ],
        [
          'Need assistance?',
          'If any part of the site prevents you from completing an inquiry, email sales@defiantmachineworks.com or call 931-266-2422. Include the page and a brief description so the issue can be investigated.',
        ],
      ],
    },
  };
export function LegalPage({ slug }: { slug: string }) {
  const page = legal[slug];
  return (
    <>
      <PageIntro eyebrow="Website information" title={page.title} description={page.description} />
      <section className="wrap legal-layout">
        {slug !== 'accessibility' && (
          <div className="draft-notice">
            <span className="eyebrow">Draft / Owner review required</span>
            <p>
              This newly prepared policy describes the current website. It requires owner and legal
              review before production use.
            </p>
          </div>
        )}
        <div className="legal-copy">
          {page.sections.map(([title, copy]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{copy}</p>
            </section>
          ))}
          <Link className="text-link" href="/contact">
            Contact Defiant
          </Link>
        </div>
      </section>
    </>
  );
}
