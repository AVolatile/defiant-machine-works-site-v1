import Link from 'next/link';
import { Logo } from './header';
import { site } from '@/data/site';
const groups = {
  Services: [
    ['Stippling', '/stippling'],
    ['Slide milling', '/slide-milling'],
    ['Cerakote', '/cerakote'],
    ['Porting', '/porting'],
  ],
  Support: [
    ['Contact', '/contact'],
    ['Custom inquiry', '/custom-inquiry'],
    ['Your cart', '/cart'],
    ['Shipping & lead time', '/shipping'],
    ['Warranty', '/warranty'],
    ['FAQ', '/faq'],
  ],
  Explore: [
    ['Gallery', '/gallery'],
    ['Products', '/products'],
    ['Shop talk', '/blog'],
    ['Stippling guide', '/resources/stippling-guide'],
    ['About Defiant', '/about'],
  ],
};
export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-main">
        <div className="footer-brand">
          <Logo />
          <p>
            Precision in the work.
            <br />
            Conviction in the way we do it.
          </p>
          <a href={site.phoneHref}>{site.phone}</a>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <div className="social-links">
            <a
              href="https://www.instagram.com/defiantmachineworksllc"
              aria-label="Defiant on Instagram"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61570489323878"
              aria-label="Defiant on Facebook"
            >
              Facebook
            </a>
            <a
              href="https://www.youtube.com/@defiantmachineworks/shorts"
              aria-label="Defiant on YouTube"
            >
              YouTube
            </a>
          </div>
        </div>
        {Object.entries(groups).map(([name, links]) => (
          <div className="footer-column" key={name}>
            <h2 className="eyebrow">{name}</h2>
            {links.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} Defiant Machine Works LLC.</span>
        <div>
          {[
            ['Privacy', '/privacy'],
            ['Terms', '/terms'],
            ['Cookies', '/cookies'],
            ['Accessibility', '/accessibility'],
          ].map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </div>
        <span className="mono">Crafted to be Defiant.</span>
      </div>
    </footer>
  );
}
