# Defiant Machine Works

A Next.js rebuild of Defiant’s public website, using its existing identity and work photography. Pass 04 preserves the approved industrial design, accounts for all 32 current configurable services and corrects the service-purchase journey: grouped builds, cart, customer and billing/return-address review, provider-neutral payment, private test confirmation and post-purchase shipping steps. Custom inquiry stays separate. Live payment remains disabled.

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
COMMERCE_MODE=test PAYMENT_PROVIDER=development npm run start -- --hostname 127.0.0.1 --port 3002
# In a second terminal, also run the default payment-disabled environment:
COMMERCE_MODE=disabled PAYMENT_PROVIDER=disabled npm run start -- --hostname 127.0.0.1 --port 3003
# In a third terminal:
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 npm test
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
- **Commerce services:** regenerate and review `src/data/service-matrix.json` through the Pass 04 audit/normalization workflow below. `service-records.json` and `services.ts` supply editorial landing-page content; they do not define checkout prices or compatibility.
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

## Pass 02 commerce architecture (historical implementation)

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

`npm test` now expects both servers listed in the Tests section above; the current suite verifies the payment-disabled environment separately. The regression suite covers the presentation routes, custom inquiry, service preselection, single/multiple-service builds, two builds, merchandise, edit/duplicate/remove, persistence, compatibility and coming-soon restrictions, checkout validation/back navigation, payment failure/retry, idempotency, private confirmations, and mobile/Axe checks.

### Payment boundary

`PaymentProvider` has session creation, confirmation, and status methods. Only `DevelopmentPaymentProvider` exists. Production is closed regardless of source base prices. An owner-approved provider must implement the interface, secure server/webhook verification, idempotent payment operations and reconciliation, plus confirmed service, tax, shipping, and fulfillment rules before live ordering is enabled. Do not collect payment details directly in these components. No provider account or credentials were assumed or connected.

### Order persistence and privacy

`OrderRepository` separates storage from checkout. The local implementation uses the Node 22 built-in SQLite module on a private persistent filesystem, with transactions, prepared statements, order events, and unique session/idempotency keys. Its immutable priced configuration snapshot survives future catalog changes. Pending and failed payment records are retained; retrying an identical checkout attempt reuses its order number.

Snapshots containing contact/address information are encrypted with AES-256-GCM. For the test adapter only, a private random key is generated at `.data/development-order.key`; `.data/orders.sqlite` is the default database. Both are ignored by Git and excluded from server output tracing. Set `ORDER_DATABASE_PATH` to the private persistent host path. A configured `ORDER_ENCRYPTION_KEY` must contain 64 hex characters. Preserve the key with the database: losing it makes snapshots unreadable. Protect backups and define an owner-approved retention/deletion policy before handling real customer data.

The following paragraphs describe the original Pass 02 implementation; the current implementation tightens the local repository to test mode only. Confirmations require the matching HttpOnly same-site session cookie. Knowing an order number does not reveal its contents. Checkout fields remain in React memory and are not saved to localStorage. Cart clearing removes only the purchased item IDs after successful persistence/payment simulation.

[Node 22 SQLite documentation](https://nodejs.org/docs/latest-v22.x/api/sqlite.html) describes the built-in module, which is experimental on the tested Node 22 runtime. The repository requires a writable persistent Node host. For serverless/multi-instance deployment, replace the repository with a shared database and provision shared rate limits; do not rely on an ephemeral SQLite file. Payment success/failure UI is not a substitute for production provider/webhook certification.

## Pass 02 visual refinements (historical implementation)

The hero keeps the original photo, with a right-side desktop frame and local focal positioning. Mobile gives the photograph its own reading position so text does not conceal the subject. The existing typography, colors, spacing philosophy, service photography, and section compositions remain intact.

Large diagonal SVG arrows are opt-in signature CTAs, not default decoration on every link. Dropdowns, cards, text links, utility actions and footer links no longer repeat them. Disclosure, cart, and proof symbols use one small SVG system; proof icons share 44px optical frames. The About hero now reads “Experience in the craft. Precision in every detail.”

`node scripts/pass02-visual.mjs` captures the hero at 1728, 1440, 1280, 1024, 768, 430, 390 and 375, plus desktop/mobile page captures under `tests/visual/pass-02/`. These screenshots are local QA artifacts.

## Pass 04 — complete catalog and configuration

The superseding Pass 04 brief is implemented in the existing site. The fresh public GET audit retained 63 Store API records and 79 public pages. The canonical typed matrix accounts for all 32 configurable services, 180 package-specific fields, 23 legacy add-on/reference records, eight Coming Soon porting entries and five cartable sticker products. See [the audit](source-audit/PASS_03_AUDIT.md) and [service coverage](source-audit/SERVICE_COVERAGE.md). Requested artifact filenames retain `pass-03`; the earlier targeted refinement record is archived separately.

`src/data/service-matrix.json` is the runtime catalog. Its Zod schema, stable manufacturer/model/variant/option IDs, conditional fields and verified integer-cent deltas drive both the browser and server. `service-configuration.ts` validates package choices; `build-rules.ts` normalizes dependencies and overlapping scopes; `pricing.ts` independently quotes the canonical result. All 32 services have deterministic complete fixtures and source-field/option parity checks. Source ambiguity stays review-only: P-07/75 Series copy, the duplicate M&P RMR option and unbound legacy add-on prerequisites. A missing implementation is not used to mark an entire service family review-only.

Texture, finish and package selectors use optimized local Defiant photographs with source provenance. Unphotographed source options remain selectable text cards explicitly identified as lacking a published photograph. Only the selected service exposes its details. Native radios/selects provide keyboard operation, visible selection and associated required-field errors. Texture selection leads stippling details; smaller binary treatments remain compact.

Milling owns its published slide-refinishing menu. Core/Crown frame-coating upgrades replace the equivalent standalone frame service. Complete-pistol coating absorbs component duplicates or becomes only the remaining standalone scope when a selected package owns another scope. Viper/Bodyguard optic work uses the explicit shared-coating source option. Equivalent legacy add-ons map into package choices; uncertain legacy work is excluded from the payable subtotal and needs review. Changes are announced and the price breakdown distinguishes base, included choices and paid deltas. The reported Glock 17 / C Series / Keep Factory / Midnight Chocolate Chip combination totals $285 once, regardless of service selection order.

Cart payloads use schema version 3 and a catalog revision under `dmw-cart-v3`. Supported `dmw-cart-v2` builds migrate with explicit current-price review; incompatible or damaged records are retired with a message. A stale catalog revision blocks checkout until accepted or corrected. The server rejects stale revisions and tampered totals. Contact/address data remains in memory and encrypted private test-order snapshots, never browser storage.

Standard source-complete configurations proceed through customer details, billing, return address, final review, provider boundary and private confirmation. Custom work uses `/custom-inquiry`. Default payment remains disabled; both `COMMERCE_MODE=test` and `PAYMENT_PROVIDER=development` are required for local test orders. The test adapter never charges, books service work or sends shipping email. Confirmation records the post-order shipping-instruction sequence honestly, and `OrderCommunicationProvider` supplies unconfigured confirmation/shipping/status boundaries.

Rebuild and run both local servers using the commands above, then:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 npm test
npm run verify:assets
npm audit --omit=dev
npm audit
```

The full suite includes domain tests, browser workflows, Axe checks and the responsive visual matrix. Run `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 node scripts/pass04-mobile-a11y.mjs` for the additional populated mobile-checkout audits, then `node scripts/pass04-handoff.mjs` to regenerate the handoff from passing results. Captures are written to `tests/visual/pass-04/`; [the visual review index](source-audit/PASS_04_VISUAL_REVIEW.md) links the generated images. Use `PLAYWRIGHT_DISABLED_URL` to change the default disabled server on port 3003. Port 3002 keeps QA separate from an existing development server on port 3000.

To refresh source data, run `node scripts/audit-service-matrix.mjs` (public read-only network access), inspect the findings, then `node scripts/normalize-service-matrix.mjs`. Normalization updates both matrix copies and the lightweight catalog-version module. Review source compatibility mappings and documented aliases before accepting a changed extraction. Tests use retained data and never depend on live site availability.

Production requires an approved payment adapter with server confirmation, provider transaction IDs, verified webhooks, idempotency and reconciliation; reviewed pricing/compatibility, shipping and tax; actual order email delivery and fulfillment procedures; shared durable storage and abuse controls; key custody, backup/restore and retention/deletion; legal approval and production-host/manual accessibility verification. Local SQLite is test-only on every host. No deployment or live provider connection is included.

## Pass 05 — current configurator presentation

Service/package, texture and finish choices now use consistent text-first controls. Each service section has one supporting Gallery link opening a new tab, with the original build state preserved. Gallery URL filtering uses the existing category labels through `service=Stippling`, `service=Slide+Milling`, `service=Cerakote` or `service=Porting`; the existing `finish` search still works. Domain data, catalog revision, prices, overlap rules, cart schema and checkout are unchanged. The image-based presentation described in the historical Pass 04 section above is superseded by this pass.

[Pass 05 verification](source-audit/pass-05-verification.json), [visual review](source-audit/PASS_05_VISUAL_REVIEW.md) and [retained asset report](source-audit/PASS_05_ASSETS.md) record the current checks. The existing service coverage report remains unchanged at 32/32 services.

To preserve historical Pass 04 captures while running fresh regression QA:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 VISUAL_OUTPUT_DIR=tests/visual/pass-05/regression npm test
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 VISUAL_OUTPUT_DIR=tests/visual/pass-05/regression AUDIT_OUTPUT_DIR=source-audit/pass-05 node scripts/pass04-mobile-a11y.mjs
node scripts/pass05-handoff.mjs
```

The full suite still expects the local test and payment-disabled servers described above. Screenshots under `tests/visual/pass-05/` cover the requested text-configurator and filtered-Gallery views. No image assets or provenance data were deleted, and no live payment or deployment was configured.

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

## Pass 06 — standalone cosmetic coating (limited scope)

The cosmetic Cerakote branch at `/customize?service=cerakote` asks for scope, treatment and finish directly. Existing Cerakote product/service links and single-coating cart edits use it. New scope-only coating records keep version 3 and use empty platform identity fields; existing platform-specific coating records retain their original data. No migration or catalog price change was introduced.

This completes the cosmetic coating portion only. Other service-first branches and Add Compatible Work are outside this implementation. See [scope and source evidence](source-audit/PASS_06_SCOPE.md), [verification](source-audit/pass-06-verification.json) and the Pass 06 implementation report. Run `npx playwright test tests/unit tests/e2e tests/accessibility` against the documented test/default servers for relevant checks without repeating the large visual matrix.
