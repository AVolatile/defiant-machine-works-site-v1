import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  outputFileTracingExcludes: { '/*': ['./.data/**/*', './source-audit/**/*', './tests/**/*'] },
  async redirects() {
    return [
      ['/shop', '/products'],
      ['/shop/page/:page', '/products'],
      ['/product/full-size-glock-optic-cut', '/products/glock-optic-cut-full-size'],
      ['/product/slim-line-glock-optic-cut', '/products/glock-optic-cut-slimline'],
      ['/product/:slug', '/products/:slug'],
      ['/2025/:month/:day/:slug', '/blog/:slug'],
      ['/customize-now', '/customize'],
      ['/connect', '/contact'],
      ['/guarantees', '/warranty'],
      ['/stippling-info', '/resources/stippling-guide'],
      ['/slide-milling-select-your-model', '/slide-milling'],
      ['/glock-optic-cuts', '/slide-milling'],
      ['/sig-optic-cuts', '/slide-milling'],
      ['/smith-wesson-optic-cuts', '/slide-milling'],
      ['/cz-optic-cuts', '/slide-milling'],
      ['/cerakote-camos', '/cerakote'],
      ['/shop-talk', '/blog'],
      ['/privacy-policy', '/privacy'],
      ['/terms-and-conditions', '/terms'],
    ].map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default config;
