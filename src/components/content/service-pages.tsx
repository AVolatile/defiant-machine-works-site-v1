import Link from 'next/link';
import textureImages from '@/data/texture-images.json';
import { services, portingUpcoming, textures, stipplingOptions } from '@/data/services';
import { products, gallery } from '@/data/catalog';
import { faqGroups } from '@/data/faq';
import { Photo, SectionHeading, ButtonLink, CTA, FAQ } from '@/components/ui/primitives';
import { ProductCard } from '@/components/catalog/product-card';
import { GalleryGrid } from '@/components/gallery/gallery-grid';
import { priceLabel } from '@/lib/catalog';
import { galleryReferenceHref } from '@/lib/gallery';
export function ServicesHub() {
  return (
    <>
      <section className="wrap page-intro">
        <span className="eyebrow">The work / All services</span>
        <h1>
          Your vision.
          <br />
          Our craft.
        </h1>
        <p className="intro-copy">
          Four disciplines. One considered approach. Explore the work, choose your details, and
          build something that feels like you.
        </p>
      </section>
      <div className="wrap service-chapters">
        {services.map((s, i) => (
          <section className="service-chapter" key={s.slug}>
            <Photo src={s.image} alt={`${s.title} by Defiant Machine Works`} />
            <div>
              <span className="eyebrow">
                0{i + 1} / {s.eyebrow}
              </span>
              <h2>{s.title}</h2>
              <p>{s.description}</p>
              <p>{s.benefit}</p>
              <p className="service-base-price">
                From ${s.startingPrice} <span>/ Final options confirmed with you.</span>
              </p>
              <div className="platform-list">
                {s.platforms.map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </div>
              <p className="form-note">
                Published turnaround: approximately two weeks after arrival. Final options and
                pricing confirmed with Defiant.
              </p>
              <ButtonLink href={`/${s.slug}`}>Explore {s.title}</ButtonLink>
            </div>
          </section>
        ))}
      </div>
      <CTA />
    </>
  );
}
export function ServicePage({ slug }: { slug: string }) {
  const service = services.find((s) => s.slug === slug)!;
  const catalog = products
    .filter(
      (p) =>
        p.service === service.title || (slug === 'slide-milling' && p.service === 'Slide Milling'),
    )
    .filter((p) => p.kind === 'service');
  return (
    <>
      <section className={`service-hero service-hero-${slug}`}>
        <Photo
          src={service.image}
          alt={service.title + ' customization by Defiant Machine Works'}
          priority
          sizes="100vw"
        />
        <div className="service-hero-shade" />
        <div className="wrap service-hero-copy">
          <div className="breadcrumb">
            <Link href="/services">Services</Link>
            <span>/</span>
            <span>{service.title}</span>
          </div>
          <span className="eyebrow">{service.eyebrow}</span>
          <h1>{service.title === 'Slide milling' ? 'Slide milling.' : service.title + '.'}</h1>
          <p>{service.description}</p>
          <ButtonLink
            href={`/customize?service=${encodeURIComponent(service.title === 'Slide milling' ? 'Slide Milling' : service.title)}`}
          >
            Start your {slug === 'cerakote' ? 'finish' : 'build'}
          </ButtonLink>
        </div>
      </section>
      {slug === 'stippling' && (
        <>
          <section className="section wrap">
            <SectionHeading
              eyebrow="01 / The right feel"
              title="Built around your grip."
              href="/resources/stippling-guide"
              linkText="The stippling guide"
            >
              Choose a listed package, then discuss your texture, borders, and frame details with
              Defiant.
            </SectionHeading>
            <div className="product-grid">
              {catalog.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
          <section className="process-section">
            <div className="wrap">
              <SectionHeading eyebrow="02 / Texture is personal" title="Find your level of grip." />
              <TextureRatings />
              <p className="form-note">
                Aggressiveness ratings and recommendations are from Defiant’s stippling guide.
              </p>
            </div>
          </section>
          <section className="section wrap two-column-copy">
            <div>
              <span className="eyebrow">03 / Frame details</span>
              <h2>
                Every detail
                <br />
                has a place.
              </h2>
              <p>
                Discuss the listed options with Defiant. Availability depends on your platform and
                the work already on the frame.
              </p>
            </div>
            <div className="option-list">
              {stipplingOptions.map((o) => (
                <span key={o}>{o}</span>
              ))}
            </div>
          </section>
        </>
      )}
      {slug === 'slide-milling' && (
        <>
          <section className="section wrap">
            <SectionHeading
              eyebrow="01 / Choose your platform"
              title="A cut above. A fit confirmed."
            >
              Optic cuts and custom slide work organized by manufacturer. Choose a listed service to
              review its source description and options.
            </SectionHeading>
            <div className="notice">
              Already have an optic cut? Defiant’s published policy does not offer re-milling for a
              different optic. Contact the shop to confirm any factory-cut exceptions before
              starting a project.
            </div>
            {['Glock', 'SIG Sauer', 'Smith & Wesson', 'CZ'].map((brand) => {
              const matches = catalog.filter((p) =>
                brand === 'Glock'
                  ? /glock|genesis|saber/i.test(p.title)
                  : brand === 'SIG Sauer'
                    ? /sig|tiger shark/i.test(p.title)
                    : brand === 'Smith & Wesson'
                      ? /smith|bodyguard/i.test(p.title)
                      : /^cz/i.test(p.title),
              );
              return (
                <section
                  className="manufacturer-section"
                  key={brand}
                  id={brand.toLowerCase().replaceAll(' ', '-')}
                >
                  <div className="manufacturer-heading">
                    <h3>{brand}</h3>
                    <span className="mono">{matches.length} services</span>
                  </div>
                  <div className="product-grid">
                    {matches.map((p) => (
                      <ProductCard product={p} key={p.slug} />
                    ))}
                  </div>
                </section>
              );
            })}
          </section>
        </>
      )}
      {slug === 'cerakote' && (
        <>
          <section className="section wrap">
            <SectionHeading
              eyebrow="01 / Choose your canvas"
              title="Protection. Personality. Precision."
            >
              Complete pistol, frame, or slide. Explore the listed coating services and discuss
              custom colors or camouflage.
            </SectionHeading>
            <div className="product-grid">
              {catalog.map((p) => (
                <ProductCard product={p} key={p.slug} />
              ))}
            </div>
          </section>
          <section className="cerakote-feature">
            <div className="wrap">
              <SectionHeading
                eyebrow="02 / The finish collection"
                title="Make your mark."
                href="/gallery"
                linkText="All finishes"
              >
                Real work, photographed by Defiant. Finish names are preserved from the original
                imagery.
              </SectionHeading>
              <GalleryGrid
                items={gallery.filter((g) =>
                  [
                    'Flectarn',
                    'M90 Swedish',
                    'Woodland Tigerstripe',
                    'Midnight Bronze H-294',
                    'Rose Gold H-327',
                    'Black Multicam',
                  ].includes(g.title),
                )}
                filters={false}
              />
            </div>
          </section>
          <section className="section wrap">
            <SectionHeading eyebrow="03 / Something different?" title="Your color. Your character.">
              Looking for a finish you haven’t seen here? Talk with the shop about a custom color,
              pattern, or combination.
            </SectionHeading>
            <FAQ items={faqGroups[2].items.filter((i) => i.id === 'cerakote')} />
          </section>
        </>
      )}
      {slug === 'porting' && (
        <section className="section wrap">
          <SectionHeading
            eyebrow="01 / Current availability"
            title="Platform first. Details confirmed."
          >
            The available catalog and upcoming options are shown separately. Contact Defiant to
            confirm your project before sending parts.
          </SectionHeading>
          {catalog.map((p) => (
            <div className="available-porting" key={p.slug}>
              <Photo src={p.images[0]} alt={p.title} />
              <div>
                <span className="availability">Listed service</span>
                <h2>{p.title}</h2>
                <p>{priceLabel(p)} · Final options confirmed by Defiant.</p>
                <ButtonLink href={`/products/${p.slug}`}>View service</ButtonLink>
              </div>
            </div>
          ))}
          <div className="section-heading upcoming-heading">
            <div>
              <span className="eyebrow">In development</span>
              <h2>On the horizon.</h2>
            </div>
            <span className="mono">Availability has not been announced.</span>
          </div>
          <div className="upcoming-list">
            {portingUpcoming.map((p) => (
              <div key={p}>
                <h3>{p}</h3>
                <span className="badge">Coming soon</span>
              </div>
            ))}
          </div>
          <p className="form-note">
            Upcoming services are preserved from the porting page. Contact Defiant for current
            status.
          </p>
        </section>
      )}
      {slug !== 'cerakote' && (
        <section className="section wrap" aria-label={`${service.title} work examples`}>
          <SectionHeading
            eyebrow="The work / Photographed by Defiant"
            title={slug === 'stippling' ? 'Texture. Borders. Detail.' : 'See the work.'}
            href={galleryReferenceHref(
              slug === 'slide-milling' ? 'milling' : slug === 'porting' ? 'porting' : 'stippling',
            )}
            linkText="More work in the Gallery"
          >
            {slug === 'porting'
              ? 'Viper work and upcoming references. Coming Soon examples are not available to order.'
              : 'Real package and detail photographs. Explore more examples in the Gallery.'}
          </SectionHeading>
          <GalleryGrid
            items={gallery.filter(
              (item) =>
                item.servicePageExample &&
                item.service.toLowerCase() === service.title.toLowerCase(),
            )}
            filters={false}
          />
        </section>
      )}
      <CTA />
    </>
  );
}
export function TextureRatings() {
  return (
    <div className="texture-ratings">
      {textures.map((t) => (
        <div className="texture-rating" key={t.name}>
          <div>
            <h3>{t.name}</h3>
            <span>{t.recommendation}</span>
          </div>
          <meter
            min={0}
            max={10}
            value={t.rating}
            aria-label={`${t.name} aggressiveness ${t.rating} out of 10`}
          >
            {t.rating}/10
          </meter>
          <strong>
            {t.rating}
            <span>/10</span>
          </strong>
        </div>
      ))}
    </div>
  );
}
export function StipplingGuide() {
  return (
    <>
      <section className="wrap page-intro">
        <div className="breadcrumb">
          <Link href="/resources">Resources</Link>
          <span>/</span>Stippling guide
        </div>
        <span className="eyebrow">Grip / Texture / Detail</span>
        <h1>Find your feel.</h1>
        <p className="intro-copy">
          A more confident choice starts with knowing the options. Compare Defiant’s published
          textures and aggressiveness ratings.
        </p>
      </section>
      <section className="wrap section section-tight">
        <TextureRatings />
        <div className="texture-photo-grid">
          {textures.map((t) => (
            <article key={t.name}>
              <Photo
                src={textureImages.find((i) => i.name === t.name)!.image}
                alt={`${t.name} stippling texture, photographed on a Defiant frame`}
              />
              <div>
                <h3>{t.name}</h3>
                <span className="mono">{t.rating} / 10 aggressiveness</span>
              </div>
            </article>
          ))}
        </div>
        <div className="guide-recommendations">
          {[
            ['Everyday carry', 'Cobblestone, Gravel, Kevlar, Coffin'],
            ['EDC / Range', 'Kevlar, Coffin, Chainmail'],
            ['OWB / Range', 'Chainmail, Rip-N-Dots, Tread'],
          ].map(([title, copy]) => (
            <div key={title}>
              <h2>{title}</h2>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="process-section">
        <div className="wrap">
          <SectionHeading eyebrow="Finish the frame" title="Details to discuss." />
          <div className="option-list">
            {stipplingOptions.map((o) => (
              <span key={o}>{o}</span>
            ))}
          </div>
          <p className="form-note">
            The stippling guide also distinguishes scallops by generation, mag release options, tang
            height, and borders. Defiant will help confirm the choices appropriate for your frame.
          </p>
          <Link className="text-link" href="/stippling">
            Explore stippling packages
          </Link>
        </div>
      </section>
      <CTA />
    </>
  );
}
