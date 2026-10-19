# Defiant Machine Works

A Next.js rebuild of Defiant’s public website, using its existing identity and work photography. Pass 02 preserves the approved design while adding a grouped build configurator/cart, a separate custom inquiry, provider-agnostic development checkout, and private encrypted order snapshots. Live payment processing remains disabled.

## Setup

Use Node.js 22 or a newer supported LTS release.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Development: http://localhost:3000

```sh
npm run lint
npm run typecheck
npm run build
npm run start
```

The lockfile records the tested Next.js 16.4.2 and React 19.3.1 installation. No theme or UI component library is used.

## Form delivery

Both forms POST to `/api/inquiry`. The route checks origin, payload size, field values, honeypot, and a basic process-local rate limit, then forwards validated JSON to a server-configured HTTPS endpoint.

Set `FORM_ENDPOINT` to your chosen delivery service’s HTTPS URL. If that service requires a bearer token, set `FORM_ENDPOINT_TOKEN` on the server. Adapt the forwarding request in `src/app/api/inquiry/route.ts` if your provider uses another contract. No credentials belong in client code.

Until configured, the server returns a specific 503 response and the UI says the inquiry **has not been sent**, retaining entered details and providing email/phone alternatives. Browser tests cover this real failure path and use mocked accepted responses to test the success UI. Actual email delivery has not been verified.

The custom inquiry saves only platform and option choices in browser local storage. Contact details, notes, and reference links stay in memory. Clear Saved Draft, successful submission, or clearing site data removes the saved choices. Cart storage is a separate, validated non-sensitive configuration payload; checkout personal data is never stored there. The application accepts reference URLs as text and does not fetch them or accept file uploads.

For production, add a host-level rate limiter or shared rate-limit store if needed: the built-in counter is per server process and resets on restart. Configure the host’s trusted forwarding headers before relying on client IP rate limits.

## Tests and visual QA

Start a production server before running browser checks:

```sh
npm run build
COMMERCE_MODE=test PAYMENT_PROVIDER=development npm run start -- --hostname 127.0.0.1
# In another terminal:
npm test
npm run verify:assets
npm run qa:visual
```

If Chromium is not already installed:

```sh
npx playwright install chromium
```

Playwright checks core routes at 375×812, 768×1024, 1280×800, and 1440×900, all migrated detail routes, internal links, redirects, mobile navigation, search/filter/sort, gallery keyboard interaction, form validation, back/next persistence, product preselection, draft restoration, and the unconfigured delivery response. Commerce coverage includes grouped builds, merchandise, service-option validation, private test orders, and mobile checkout at 375, 390 and 430px. Axe checks nine pages, service-option controls, populated mobile checkout and the menu/gallery overlays. Automated checks support accessibility review; they do not certify compliance.

`npm run qa:visual` captures major routes at 375px and 1440px, records loaded fonts and images, and checks overflow at 320px. Screenshots and results are written under `tests/visual/`. `scripts/qa-contact-sheet.mjs` produces overview sheets in the temporary directory for human review. In-app browser control was unavailable; Chromium through Playwright was used instead.

## Deployment

Use a hosting platform with a supported Next.js App Router runtime, or run the production Node.js server behind HTTPS. Build with `npm ci && npm run build`; for a Node host, start with `npm run start`. Supply `NEXT_PUBLIC_SITE_URL` at build time for the final canonical origin and configure form endpoint variables on the server.

Most pages and all catalog/article details are statically generated. Gallery, customization/inquiry query parameters, cart, checkout, private confirmation, and API routes use the Next.js runtime. This is **not** a plain static export: deploying only a folder of HTML would remove server form handling. Use the host’s Next.js integration on Netlify/Vercel; no hosting account, production domain, or deployment has been modified in this implementation.

Preview environments should be access-controlled or configured not to be indexed before launch. Confirm canonical metadata and sitemap origin before production. Standard security headers are configured in `next.config.ts`.

## Structure

```text
src/app/                     App Router routes, metadata, API endpoint
src/components/layout/       One header, navigation, footer
src/components/home/         Flagship editorial homepage
src/components/catalog/      Product browser, cards, image gallery
src/components/commerce/     Configurator, cart store, checkout, grouped summaries
src/components/gallery/      Filters and native-dialog lightbox
src/components/forms/        Contact form and build inquiry
src/components/content/      Service, resource, policy, article layouts
src/components/ui/           Shared typography, imagery, links, CTA, FAQ
src/data/                    Curated, typed migration data and provenance URLs
src/lib/                     Validation, catalog formatting, SEO helpers
src/lib/commerce/            Pricing, compatibility, payment and order repositories
src/styles/                  Shared tokens and responsive styles
public/assets/dmw/           Downloaded source assets, fonts, optimized WebP
scripts/                     Audit, migration, reconciliation, QA tools
source-audit/                Raw public HTML, inventories, findings, provenance
tests/e2e/                   Behavioral and route smoke tests
tests/accessibility/         Axe checks
tests/visual/                Visual captures and inspection results
```

`src/app/[slug]/page.tsx` statically generates shared content routes and selects modular page components. Products and articles have their own typed dynamic detail routes. Gallery has a separate route so query handling does not force informational pages into request-time rendering.

## Updating content

- **Products:** edit `src/data/products.json`. Preserve the `Product` type, `sourceUrl`, category, kind (`product`, `service`, `addon`), current price, regular/sale prices, attributes, local image paths, and `checkoutEnabled: false`. The source API is authoritative for current base prices; do not assume a complete configured service costs only its base price.
- **Services:** edit `src/data/service-records.json`; package entries live in products. Texture ratings and upcoming porting options live in `src/data/services.ts`. Wizard platform/model suggestions must be updated with confirmed compatible options.
- **Gallery:** edit `src/data/gallery.json`, adding optimized local photography and its original source URL. Preserve finish labels exactly. The 29 Cerakote labels were visually checked against the labels embedded in the original photographs. Other entries classify real stippling, milling, and porting work.
- **Texture photography:** `src/data/texture-images.json` maps the seven source textures to local optimized examples.
- **Articles:** edit `src/data/articles.json`. Paragraphs are rendered as text, not unsanitized source HTML. Preserve title/date/author provenance.
- **Reviews:** `src/data/reviews.ts` contains one verified source review excerpt. Add reviews only when verified and approved for use; no invented ratings or counts.
- **Contact/social:** `src/data/site.ts` and `src/components/layout/footer.tsx`. Social URLs were verified in the source homepage navigation.
- **Legal/operational copy:** `src/components/content/info-pages.tsx` and `src/data/faq.ts`. New Privacy, Terms, and Cookies pages are clearly labeled drafts requiring review.
- **Brand:** `src/styles/tokens.css`. The rust token `#a23f00` is the exact most frequent opaque rust pixel from the original icon, not a guessed accent. Lighter accent text is used where needed for contrast. Recovered Oswald and Heebo font files are self-hosted; their official OFL licenses are retained beside them.

## Source crawler and migration

Run these only when intentionally refreshing the migration snapshot; they overwrite generated inventories/content:

```sh
npm run audit:source
node scripts/supplement-assets.mjs
node scripts/brand-details.mjs
npm run content:migrate
npm run audit:reconcile
npm run verify:assets
```

The crawler seeds all requested source paths, checks the unauthenticated public WooCommerce Store API first, discovers public same-origin pages, and uses modest concurrency. It excludes admin, login, account/password, cart/checkout/order routes and query permutations. No authentication, checkout actions, or form submissions are attempted. The safety cap is 240 pages; the completed audit retains 99 content pages.

Images, responsive variants, icons, metadata images, inline/CSS backgrounds, local font URLs, Elementor slideshow settings, and image-only gallery anchors are inventoried. Content hashes deduplicate assets, with hash-prefixed filenames preventing collisions between WordPress upload folders. Original source assets remain local; active imagery has compressed WebP derivatives and responsive Next.js image delivery. The full retained source inventory is approximately 819 MB; only requested assets load in the browser.

The initial discovery pass fetched public account landing pages before the account-path exclusion was broadened. No account data was accessed, no credentials were used, and those pages were removed. See `source-audit/crawl-notes.json` for the correction. Two missing legacy brand files and one plugin lens image return 404 and are documented rather than fabricated.

The current price review found an explained regular/sale-price difference for Electric Topo Sticker ($6 / $1), not an unresolved live price conflict. Historical source discrepancies are not assumed. `source-audit/discrepancies.json` records pricing, availability, legal, About, and navigation findings. `content-provenance.json` records origin for important content. A legacy WordPress privacy page existed but did not describe the new site’s functionality; it was not blindly carried forward.

Migration scripts regenerate curated data. Preserve editorial changes before rerunning them. Source texture derivative generation is retained in `src/data/texture-images.json`; verify these paths after changing the audit snapshot.

## Pass 02 commerce architecture

`/customize` configures one platform/component with multiple services, while `/custom-inquiry` retains the separate quote workflow. `/cart` groups services under builds and supports editing, duplication, removal, quantities for merchandise, and browser persistence. The header exposes cart access without a diagonal-arrow badge.

`BuildConfiguration`, `ServiceSelection`, discriminated build/product cart items, customer/address schemas, `OrderSnapshot`, payment status, and operational status types live in `src/lib/commerce/schema.ts`. Integer cents are used throughout calculation. The server ignores client pricing, recalculates from the source catalog, validates compatibility, and rejects changed totals. Current service base prices are estimates: missing option charges and combined-work rules require review. Known restrictions, component requirements, incompatible package overlaps, duplicate options, and unreleased services are blocked. The P-07 entry has a source-description conflict and remains flagged for review.

Physical cart support is explicitly limited to five audited sticker merchandise entries in `eligibility.ts`. Firearm components and other unapproved items remain inquiry-only. Source `checkoutEnabled: false` is retained as the live-commerce boundary; development eligibility is separate and does not activate live purchases.

### Run the test checkout

Both server flags are required; these are intentionally not the defaults:

```sh
npm run build
COMMERCE_MODE=test PAYMENT_PROVIDER=development npm run start -- --hostname 127.0.0.1
```

The UI prominently labels development checkout. Use test contact and return-address details. Choose Approved or Declined to exercise the adapter. No card/bank fields, charge, carrier label, shipment, business order, or production status is created. Missing shipping/tax calculations stay explicitly uncalculated; the amount is a subtotal, not a final payable total. With the flags absent, checkout explains that ordering must be arranged with Defiant, and the order endpoint returns 503.

`npm test` expects the explicitly enabled test server above. The regression suite covers the presentation routes, custom inquiry, service preselection, single/multiple-service builds, two builds, merchandise, edit/duplicate/remove, persistence, compatibility and coming-soon restrictions, checkout validation/back navigation, payment failure/retry, idempotency, private confirmations, and mobile/Axe checks.

### Payment boundary

`PaymentProvider` has session creation, confirmation, and status methods. Only `DevelopmentPaymentProvider` exists. Production is closed regardless of source base prices. An owner-approved provider must implement the interface, secure server/webhook verification, idempotent payment operations and reconciliation, plus confirmed service, tax, shipping, and fulfillment rules before live ordering is enabled. Do not collect payment details directly in these components. No provider account or credentials were assumed or connected.

### Order persistence and privacy

`OrderRepository` separates storage from checkout. The local implementation uses the Node 22 built-in SQLite module on a private persistent filesystem, with transactions, prepared statements, order events, and unique session/idempotency keys. Its immutable priced configuration snapshot survives future catalog changes. Pending and failed payment records are retained; retrying an identical checkout attempt reuses its order number.

Snapshots containing contact/address information are encrypted with AES-256-GCM. For the test adapter only, a private random key is generated at `.data/development-order.key`; `.data/orders.sqlite` is the default database. Both are ignored by Git and excluded from server output tracing. Set `ORDER_DATABASE_PATH` to the private persistent host path. A configured `ORDER_ENCRYPTION_KEY` must contain 64 hex characters. Preserve the key with the database: losing it makes snapshots unreadable. Protect backups and define an owner-approved retention/deletion policy before handling real customer data.

Confirmations require the matching HttpOnly same-site session cookie. Knowing an order number does not reveal its contents. Checkout fields remain in React memory and are not saved to localStorage. Cart clearing removes only the purchased item IDs after successful persistence/payment simulation.

[Node 22 SQLite documentation](https://nodejs.org/docs/latest-v22.x/api/sqlite.html) describes the built-in module, which is experimental on the tested Node 22 runtime. The repository requires a writable persistent Node host. For serverless/multi-instance deployment, replace the repository with a shared database and provision shared rate limits; do not rely on an ephemeral SQLite file. Payment success/failure UI is not a substitute for production provider/webhook certification.

## Pass 02 visual refinements

The hero keeps the original photo, with a right-side desktop frame and local focal positioning. Mobile gives the photograph its own reading position so text does not conceal the subject. The existing typography, colors, spacing philosophy, service photography, and section compositions remain intact.

Large diagonal SVG arrows are opt-in signature CTAs, not default decoration on every link. Dropdowns, cards, text links, utility actions and footer links no longer repeat them. Disclosure, cart, and proof symbols use one small SVG system; proof icons share 44px optical frames. The About hero now reads “Experience in the craft. Precision in every detail.”

`node scripts/pass02-visual.mjs` captures the hero at 1728, 1440, 1280, 1024, 768, 430, 390 and 375, plus desktop/mobile page captures under `tests/visual/pass-02/`. These screenshots are local QA artifacts.

## Pre-launch checklist

- [ ] Confirm all product/service pricing and final option charges.
- [ ] Review the source sale-price reconciliation and any new discrepancies.
- [ ] Confirm porting availability; retain Coming Soon labels until approved.
- [ ] Confirm current turnaround and rush policy.
- [ ] Confirm shipping instructions and return-shipping costs.
- [ ] Confirm warranty wording and cancellation/change policies.
- [ ] Approve About and faith-informed values copy.
- [ ] Owner/legal review Privacy Policy.
- [ ] Owner/legal review Terms.
- [ ] Owner/legal review Cookie Policy and actual hosting storage behavior.
- [ ] Configure the HTTPS form delivery endpoint and verify actual receipt/replies.
- [ ] Confirm the selected provider’s data handling and update Privacy accordingly.
- [ ] Verify social links and image/font use permissions.
- [ ] Set production site URL and inspect canonical metadata/sitemap.
- [ ] Configure host-level abuse protection and logging as appropriate.
- [ ] Configure production analytics only if wanted, then review consent requirements.
- [ ] Schedule a manual assistive-technology review beyond automated Axe checks.
- [ ] Review inherited development-only dependency advisories before tooling upgrades.
- [ ] Approve a payment provider for the business and implement/verify its production adapter.
- [ ] Verify full service-option prices, combined-work compatibility, tax, shipping, fulfillment, backups and retention.
- [ ] Provision a shared database/rate limiter for a serverless or multi-instance host.
- [ ] Keep development checkout disabled on the public production site.
# defiant-machine-works-site-v1
