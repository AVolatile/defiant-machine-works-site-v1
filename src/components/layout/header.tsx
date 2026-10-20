'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CartAccess } from '@/components/commerce/cart-access';
import { Icon } from '@/components/ui/icon';
import { site } from '@/data/site';
const groups = [
  {
    label: 'Services',
    href: '/services',
    links: [
      ['Stippling', '/stippling'],
      ['Slide milling', '/slide-milling'],
      ['Cerakote', '/cerakote'],
      ['Porting', '/porting'],
    ],
  },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Products', href: '/products' },
  {
    label: 'Resources',
    href: '/resources',
    links: [
      ['Shipping & lead time', '/shipping'],
      ['Stippling guide', '/resources/stippling-guide'],
      ['Warranty', '/warranty'],
      ['FAQ', '/faq'],
      ['Shop talk', '/blog'],
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];
export function Logo() {
  return (
    <Link href="/" aria-label="Defiant Machine Works home" className="logo">
      <img src={site.logo} width="195" height="54" alt="Defiant Machine Works" />
    </Link>
  );
}
export function Header() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [drawerTop, setDrawerTop] = useState(107);
  const header = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const button = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  function closeMenu() {
    setOpen(false);
    button.current?.focus();
  }
  function openMenu() {
    setDrawerTop(header.current?.getBoundingClientRect().bottom || 107);
    setMounted(true);
    setOpen(true);
  }
  useEffect(() => {
    if (!mounted || open) return;
    const timer = window.setTimeout(
      () => setMounted(false),
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240,
    );
    return () => window.clearTimeout(timer);
  }, [mounted, open]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawer.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeMenu();
      }
      if (e.key === 'Tab') {
        const links = drawer.current?.querySelectorAll<HTMLAnchorElement>('a');
        if (!links?.length) return;
        if (e.shiftKey && document.activeElement === links[0]) {
          e.preventDefault();
          button.current?.focus();
        } else if (!e.shiftKey && document.activeElement === links[links.length - 1]) {
          e.preventDefault();
          button.current?.focus();
        } else if (e.shiftKey && document.activeElement === button.current) {
          e.preventDefault();
          links[links.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === button.current) {
          e.preventDefault();
          links[0].focus();
        }
      }
    }
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  return (
    <>
      <div className="announcement">
        <span className="status-dot" />
        <span>Approximately 2-week lead time</span>
        <span className="announcement-detail">
          Shipping instructions supplied after order confirmation.
        </span>
        <Link href="/shipping">The details</Link>
      </div>
      <header ref={header} className="site-header">
        <div className="header-inner">
          <Logo />
          <nav aria-label="Primary navigation" className="desktop-nav">
            {groups.map((g) => (
              <div className="nav-item" key={g.href}>
                <Link href={g.href} aria-current={pathname === g.href ? 'page' : undefined}>
                  {g.label}
                  {g.links && (
                    <span aria-hidden="true" className="chevron">
                      <Icon name="chevron-down" />
                    </span>
                  )}
                </Link>
                {g.links && (
                  <div className="nav-dropdown">
                    {g.links.map(([label, href]) => (
                      <Link key={href} href={href}>
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <CartAccess />
          <Link className="button header-cta" href="/customize">
            <span className="header-cta-label">Start your build</span>
          </Link>
          <button
            ref={button}
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            onClick={() => {
              if (open) closeMenu();
              else openMenu();
            }}
          >
            {open ? (
              <Icon name="close" />
            ) : (
              <>
                <span />
                <span />
              </>
            )}
          </button>
        </div>
      </header>
      {mounted && (
        <div
          id="mobile-nav"
          ref={drawer}
          className="mobile-nav"
          data-state={open ? 'open' : 'closed'}
          aria-hidden={!open}
          inert={!open}
          style={{ top: drawerTop }}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <CartAccess close={closeMenu} />
          <nav>
            {groups.map((g, i) => (
              <div key={g.href}>
                <Link onClick={closeMenu} href={g.href}>
                  <span className="mono">0{i + 1}</span>
                  {g.label}
                </Link>
                {g.links && (
                  <div className="mobile-sublinks" role="group" aria-label={`${g.label} links`}>
                    {g.links.map(([label, href]) => (
                      <Link key={href} href={href} onClick={closeMenu}>
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={site.phoneHref}>{site.phone}</a>
        </div>
      )}
    </>
  );
}
