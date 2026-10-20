import Link from 'next/link';
import Image from 'next/image';
import { site } from '@/data/site';
import { reviews } from '@/data/reviews';
import { services } from '@/data/services';
import { gallery } from '@/data/catalog';
import { ButtonLink, CTA, Photo, SectionHeading } from '@/components/ui/primitives';
import { ProofIcon } from '@/components/ui/icon';
import { GalleryGrid } from '@/components/gallery/gallery-grid';
export function HomePage() {
  const review = reviews[0];
  const featureNames = ['Flectarn', 'Midnight Bronze H-294', 'Woodland Tigerstripe'];
  const featured = featureNames.map((n) => gallery.find((g) => g.title === n)!).filter(Boolean);
  const finishes = ['M90 Swedish', 'Rose Gold H-327', 'Black Multicam']
    .map((n) => gallery.find((g) => g.title === n)!)
    .filter(Boolean);
  return (
    <>
      <section className="hero">
        <div className="wrap hero-content">
          <div className="hero-media">
            <Image
              className="hero-image"
              src={site.hero}
              alt="A custom Defiant pistol with machined slide and textured frame on a workshop surface"
              fill
              priority
              sizes="(max-width: 650px) 100vw, 70vw"
            />
          </div>
          <div className="hero-shade" />

          <div className="hero-topline">
            <span className="eyebrow">Performance + aesthetics</span>
            <span className="mono">Precision work / Individual character</span>
          </div>
          <h1>
            Precision built.
            <br />
            Personally
            <br />
            <span>Defiant.</span>
          </h1>
          <p>
            Expert firearm customization. Purposeful detail.
            <br className="desktop-only" /> Built around the way you carry, shoot, and live.
          </p>
          <div className="button-row">
            <ButtonLink href="/customize" signature>
              Start your build
            </ButtonLink>
            <ButtonLink href="/gallery" secondary>
              Explore our work
            </ButtonLink>
          </div>
          <div className="hero-bottom">
            <span className="mono">Stippling / Milling / Cerakote / Porting</span>
            <a href="#the-work" className="scroll-link">
              Explore the craft <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>
      <div className="proof-bar wrap">
        <div>
          <strong>10+</strong>
          <span className="proof-copy">
            Years of machining &<br />
            firearms experience
          </span>
        </div>
        <div>
          <strong>2 WK</strong>
          <span className="proof-copy">
            Published lead time
            <br />
            Once your order arrives
          </span>
        </div>
        <div>
          <ProofIcon name="target" />
          <span className="proof-copy">
            Precision work.
            <br />
            Personally tailored.
          </span>
        </div>
        <Link href="/warranty">
          <ProofIcon name="shield" />
          <span className="proof-copy">
            We stand behind
            <br />
            the finished work.
          </span>
        </Link>
      </div>
      <section className="section wrap" id="the-work">
        <SectionHeading
          eyebrow="01 / The work"
          title="Built with purpose."
          href="/services"
          linkText="All services"
        >
          From the first detail to the final finish. Make it unmistakably yours.
        </SectionHeading>
        <div className="home-services">
          {services.map((s, i) => (
            <Link className={`home-service home-service-${i + 1}`} href={`/${s.slug}`} key={s.slug}>
              <Photo
                src={s.image}
                alt={`Defiant Machine Works ${s.title.toLowerCase()} example`}
                sizes="(max-width: 650px) 100vw, 50vw"
              />
              <div className="service-overlay">
                <span className="mono">
                  0{i + 1} / {i === 3 ? 'Platform-specific' : 'Custom service'}
                </span>
                <div>
                  <h3>{s.title}</h3>
                </div>
                <p>
                  {s.benefit}
                  <span className="service-start">From ${s.startingPrice}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="process-section">
        <div className="wrap">
          <SectionHeading
            eyebrow="02 / From your idea to your hands"
            title="A clear path to custom."
            href="/shipping"
            linkText="Shipping & turnaround"
          />
          <div className="process-grid">
            {[
              [
                'Choose your work',
                'Tell us about your platform, your preferences, and the details that matter.',
              ],
              [
                'Confirm & send',
                'We confirm your project and provide current shipping or local drop-off instructions.',
              ],
              [
                'Craft & finish',
                'Your project receives the machining, texture, or finish you selected.',
              ],
              [
                'Back in your hands',
                'Completed work is checked and returned, ready for the next chapter.',
              ],
            ].map(([title, description], i) => (
              <div className="process-step" key={title}>
                <span className="step-number">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section wrap">
        <SectionHeading
          eyebrow="03 / Work speaks"
          title="The details make the difference."
          href="/gallery"
          linkText="View the gallery"
        >
          Real builds. Real finishes. No two quite alike.
        </SectionHeading>
        <GalleryGrid items={featured} filters={false} />
      </section>
      <section className="conviction-section wrap">
        <div className="conviction-image">
          <Photo src={site.outdoor} alt="Custom stippled Defiant pistol photographed outdoors" />
          <span className="image-annotation mono">Character in every detail.</span>
        </div>
        <div className="conviction-copy">
          <span className="eyebrow">The Defiant standard</span>
          <h2>
            Good work.
            <br />
            No shortcuts.
          </h2>
          <p>
            A decade of machining and firearms experience informs the work. Attention to the details
            makes it personal.
          </p>
          <div className="principle">
            <span>01</span>
            <div>
              <h3>Precision with purpose</h3>
              <p>Thoughtful customization, from your chosen texture to the final finish.</p>
            </div>
          </div>
          <div className="principle">
            <span>02</span>
            <div>
              <h3>Accountability in the craft</h3>
              <p>If there’s an issue with our work, we want to hear about it and make it right.</p>
            </div>
          </div>
          <Link className="text-link" href="/warranty">
            Our guarantee
          </Link>
        </div>
      </section>
      <section className="cerakote-feature">
        <div className="wrap">
          <SectionHeading
            eyebrow="04 / Beyond the surface"
            title="A finish with character."
            href="/cerakote"
            linkText="Explore Cerakote finishes"
          >
            Protect the work. Give it your signature. Discover solid colors, custom mixes, and
            camouflage.
          </SectionHeading>
          <div className="finish-strip">
            {finishes.map((f) => (
              <Link href={`/gallery?finish=${encodeURIComponent(f.title)}`} key={f.slug}>
                <Photo
                  src={f.image}
                  alt={`${f.title} Cerakote finish`}
                  sizes="(max-width:650px) 85vw, 33vw"
                />
                <span>{f.title}</span>
              </Link>
            ))}
          </div>
          <span className="mono finish-note">
            Actual Defiant finishes / Every color has a story.
          </span>
        </div>
      </section>
      <section className="section wrap review-section">
        <div>
          <span className="eyebrow">From the people we build for</span>
          <h2>
            Craft that
            <br />
            earns trust.
          </h2>
          <p>Good communication. Careful work. Personal service.</p>
        </div>
        <figure>
          <span className="review-stars" aria-label="5 out of 5 stars">
            ★★★★★
          </span>
          <blockquote>“{review.quote}”</blockquote>
          <figcaption>
            <strong>{review.name}</strong>
            <span>
              {review.platform} review ·{' '}
              {new Date(review.date + 'T12:00:00Z').toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </span>
          </figcaption>
        </figure>
      </section>
      <section className="values-section">
        <div className="wrap values-inner">
          <img src={site.icon} alt="" width="100" height="100" />
          <div>
            <span className="eyebrow">Integrity. Stewardship. Service.</span>
            <h2>Built with conviction.</h2>
            <p>
              Our faith-informed values shape a straightforward commitment: honest craftsmanship,
              care for what you entrust to us, and accountability for the finished work.
            </p>
            <Link className="text-link" href="/about">
              What we stand for
            </Link>
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
