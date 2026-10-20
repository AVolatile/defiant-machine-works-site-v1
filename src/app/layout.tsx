import type { Metadata } from 'next';
import { CommerceProvider } from '@/components/commerce/cart-store';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { site } from '@/data/site';
import { JsonLd } from '@/lib/seo';
import '@/styles/tokens.css';
import '@/styles/globals.css';
import '@/styles/commerce.css';
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Defiant Machine Works | Precision firearm customization',
    template: '%s | Defiant Machine Works',
  },
  description:
    'Precision firearm customization. Explore stippling, optic cuts, slide milling, Cerakote, and porting from Defiant Machine Works.',
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <CommerceProvider>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </CommerceProvider>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: site.name,
            url: site.url,
            logo: site.url + site.icon,
            email: site.email,
            telephone: '+1-931-266-2422',
          }}
        />
      </body>
    </html>
  );
}
