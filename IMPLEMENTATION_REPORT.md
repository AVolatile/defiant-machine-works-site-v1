# Defiant Machine Works — Implementation report

Date: October 19, 2026. Scope: local production build and validation. No production domain, hosting account, checkout, payment system, or external messaging account was changed.

Sections 1–15 retain the original rebuild record, followed by the Pass 02 record. The Pass 03 section describes the current checkout flow and targeted UX refinements; it supersedes the earlier blanket review-only pricing and default checkout dead-end behavior.

## 1. Architecture

Next.js 16.4.2, React 19.3.1, TypeScript strict mode, App Router, semantic HTML, shared CSS variables, ESLint, Prettier, Zod, Playwright, and Axe. Project-owned components separate layout, services, catalog, gallery, forms, informational content, and shared UI. Content is stored as typed local datasets with source URLs.

Informational pages, product details, and blog details are statically generated. Gallery and customization handle query-string preselection through separate request-time routes. `/api/inquiry` provides server validation and configurable HTTPS delivery. Keeping gallery separate prevents its query parameters from forcing the other content routes into request-time rendering.

## 2. Design system

Premium industrial editorial direction: deep carbon surfaces, warm neutral process section, real photography, large condensed type, restrained rules, small technical labels, and chamfered primary buttons. One header, footer, spacing scale, color system, and button hierarchy serve the whole site. Mobile navigation uses an accessible large drawer, not compressed desktop links.

Rust `#a23f00` was extracted as the exact most frequent opaque rust pixel in `DEFIANT-MACHINE-WORKS-ICON.png` (338,423 pixels). Lighter related accent text supports readability on dark surfaces; primary buttons use the original rust. The existing horizontal artwork is trimmed to remove transparent padding, not redrawn. Oswald and Heebo were recovered from source-hosted fonts, with official OFL license files retained. Motion is restrained and disabled under reduced-motion preferences.

## 3. Source crawl results

The audit checks the public WooCommerce Store API before parsing products, seeds all requested routes, follows public same-origin links, and uses two page workers / three asset workers. The inventory retains 99 content routes: 98 successful responses and a 404 for the requested Terms seed. No credentials, authentication, checkout actions, administrative requests, or form submissions were used.

The first discovery pass followed the public `/dmw-account/` and lost-password landing pages because the initial exclusion did not include the custom account path. No account data was accessed. These pages were removed, the crawler exclusion was corrected, and the incident is recorded in `crawl-notes.json` and `crawl-report.md`.

The initial asset download also revealed 42 filename collisions across upload folders. Those files were repaired against original URLs, all inventory hashes were checked, and the crawler now prefixes filenames with content hashes. Supplemental extraction covers image-only Elementor gallery anchors and nested slideshow settings.

## 4. Assets migrated

- 1,857 asset records, including responsive variants and local fonts.
- 1,854 successful unique original content hashes retained locally.
- Three documented source 404s: two legacy brand files and one plugin lens image.
- 221 initial compressed WebP derivatives, plus seven optimized texture photographs.
- Preserved icon, horizontal identity, available legacy artwork, favicon, and apple icon.
- 258 local content image references checked for file availability.

All critical production imagery is local. No generated firearms, firearm stock photos, fake texture assets, or hotlinked critical photographs are used. The source archive is approximately 819 MB; the UI requests compressed responsive imagery rather than loading the archive.

## 5. Pages implemented

Home, Services, Stippling, Slide Milling, Cerakote, Porting, Gallery, Products, Customize, About, Contact, Resources, Stippling Guide, Shipping, Warranty, FAQ, Blog, Privacy, Terms, Cookies, Accessibility, 63 catalog detail routes, and three article routes. A genuine 404 and recoverable page error state are included.

Metadata includes unique titles/descriptions, canonicals, Open Graph, Twitter cards, robots, sitemap, and factual Organization/Service/Product/Article structured data. No fabricated ratings, certifications, addresses, or review counts appear in schema. Useful source URLs redirect to their modern equivalents, including Shop, Connect, Guarantees, Customize Now, Stippling Info, optic-cut category routes, product detail prefixes, and original article paths.

## 6. Products and services migrated

The public Store API supplied 63 records. Products, complete service packages, and service add-ons have separate kinds and customer-facing category filters. Records retain name, price, regular/sale price, images, descriptions, source attributes, stock-derived inquiry availability, service family, and `checkoutEnabled: false`.

The service pages organize stippling packages and texture ratings, four milling manufacturers, three Cerakote scopes, and current versus upcoming porting. Bodyguard 2.0 Viper Ports remains the currently listed porting service; eight future options retain Coming Soon status.

The gallery preserves 29 original Cerakote finish names and adds three classified real-work examples. Embedded finish labels were visually checked against the original photographs; non-sequential WordPress filenames are mapped explicitly rather than inferred numerically. Seven original texture photos support the stippling guide.

Three source-authored articles were migrated as safe text paragraphs and headings with dates and author attribution. One short, verified Google review excerpt is used; no customer names or reviews were invented.

## 7. Source inconsistencies and gaps

Electric Topo Sticker shows a $6 regular price and $1 current sale price in both listing and detail HTML. The Store API confirms $1. This is an explained sale-price reconciliation, not an unresolved current conflict. The UI uses the current API amount and preserves the regular/sale data. No historical conflict is asserted without evidence.

The About page was under construction, so no founder chronology or quotation was invented. The legacy Products route did not provide a useful catalog. A legacy Privacy Policy existed but described WordPress comments, Gravatar, account/login, and reset features that this rebuild does not implement. Terms returned 404, and no dedicated cookie policy was recovered. These findings and decisions are recorded in `discrepancies.json`.

## 8. Decisions made

Use data-driven static pages with distinct editorial compositions, rather than duplicating template systems. Keep high-level service information separate from customer confirmation of compatibility. Use browser drafts and reference URLs without accepting uploads. Preserve source shipping/cancellation/guarantee details without expanding them into independent legal claims. Represent faith-informed values through integrity, stewardship, service, and accountability, based on the owner’s brief; omit unsupported biography.

An audit trail belongs in development data, not throughout customer-facing copy. Original-source URLs remain in datasets and the provenance report. Source article attribution is retained. Styling and production dependencies are project-owned and pinned to tested versions.

## 9. Forms

The contact form includes field-specific validation, honeypot, loading, retained-error, and confirmed-success states. The seven-step wizard includes relevant service/platform options, model suggestions, service options, finish/reference/notes, contact preference, review, acknowledgement, back/next persistence, product/finish preselection, and locally saved unfinished drafts.

Both forms use server-side Zod validation, same-host origin checking, request-size limits, bounded in-memory rate limiting, timeout handling, and an HTTPS forwarding endpoint configured through environment variables. The server does not fetch user reference URLs and accepts no files, serial numbers, payments, or identity documents.

**Live delivery remains unconfigured.** Without `FORM_ENDPOINT`, a real submission returns 503 and explicitly tells the customer it was not sent. Entered data is retained. Tests verify this path; accepted-response UI is tested using a mocked response. Actual delivery to the business must be configured and verified before launch. The process-local rate limiter is a baseline, not a shared production abuse-control service.

## 10. Accessibility

The target is WCAG 2.2 AA. Automated Axe checks passed for Home, Stippling, Gallery, a Product Detail, Customize, and Contact, plus the mobile menu and gallery dialog. Implemented behaviors include a skip link, visible focus, semantic landmarks, labels/error associations, native disclosure controls, native modal focus containment, gallery arrow/Escape behavior, focus restoration, readable contrast, and reduced motion.

No live Core Web Vitals field measurements or Lighthouse score are claimed.

This is not a compliance certification. A manual screen-reader review remains a recommended launch check.

## 11. Tests and visual review

The browser suite passed all 20 tests in the completed verification run. Coverage includes all requested core routes at four viewport sizes, 63 product details, three articles, internal links, redirects, a true unknown-route 404, no uncaught page errors, overflow checks, mobile navigation, catalog filtering/search/sorting/reset, gallery filters/lightbox/keyboard/focus, contact validation/failure/success, wizard validation/back/next/review, draft restoration, and product preselection.

Visual captures cover 23 representative routes at 375px and 1440px. Additional overflow checks cover those routes at 320px. The QA capture run recorded no broken local images, font errors, or horizontal page overflow. Desktop and mobile contact sheets and full-page Home/Services/Cerakote/Contact/Customize/Porting captures were inspected. Browser control in the app was unavailable, so installed Playwright Chromium performed QA.

The first run caught and corrected mobile header overflow, legitimate form requests rejected by origin checking, and incomplete drafts rejected by final-submission validation. Automated accessibility checks did not report violations on the required pages or tested overlays.

## 12. Build and dependency status

Production compilation, strict typecheck, and ESLint have passed. Final verification records are in the browser reports and `tests/visual/results.json`; rerun the documented commands after any content or code changes. The build generates 92 static outputs, with separate runtime routes for gallery queries, customization queries, and inquiry handling.

`npm audit --omit=dev` reported zero production vulnerabilities. The current Next ESLint toolchain brings five development-only advisory entries through `braces` / `micromatch` / `fast-glob`; the registry offers no compatible patched `braces` version at the audit date. A forced downgrade of Next tooling was not applied. This dependency does not appear in the production dependency graph. Recheck when updating development tools.

## 13. Remaining owner decisions

Confirm current pricing, options, porting status, turnaround, shipping charges/instructions, warranty/cancellation language, About/values wording, and asset permissions. Select and configure a form delivery service and verify actual receipt and replies. Choose the production host and canonical origin. Confirm the source-verified social accounts. No production deployment is included in this local implementation.

## 14. Legal review

Privacy, Terms, and Cookies are newly prepared drafts and visibly marked for owner/legal approval. They describe only implemented features: inquiry data, browser draft storage, potential host logs, and configured processing. There is no analytics/ad-tech integration, unnecessary cookie banner, invented data-sale claim, arbitrary retention promise, firearm eligibility statement, or independent shipping-law advice. Owner approval must account for the chosen host and form processor.

## 15. Future checkout

The UI is independent of a payment provider. Catalog entries distinguish product, service, and add-on, preserve source attributes and pricing, and disable checkout explicitly. A later provider adapter can add stable remote IDs, verified variants, order status, checkout, and customer communications without redesigning the brochure/catalog layer. No fake cart or purchase flow exists in this phase.

# PASS 02 — Visual refinement and commerce architecture

The approved visual foundation is preserved. This pass changes composition, icon hierarchy, About copy and transactional architecture; it does not introduce another theme.

## Audit and visual changes

The audit is retained at `source-audit/PASS_02_AUDIT.md`. Shared link/button helpers previously emitted diagonal arrows by default. They now require an explicit signature choice; the hero primary CTA and final CTA retain that identity. Text links, service/product/gallery cards, Resources dropdown, footer and utility actions shed the repeated diagonal arrow. A small project-owned SVG system supplies the bag, disclosure, precision and guarantee symbols. Proof icons share a 44px centered optical frame and consistent stroke geometry.

The original hero photograph is unchanged. Its desktop frame begins to the right of the text column, with responsive focal settings and a left-weighted tonal overlay. The right-hand firearm remains visible. On small screens, the photo has its own place in the reading flow, preventing the headline from obscuring the subject. Hero QA covers all eight requested widths. About now reads “Experience in the craft. Precision in every detail.” The old About hero wording was removed from active source.

## Build, catalog and compatibility model

`BuildConfiguration` owns a single platform/component and multiple `ServiceSelection` values. Cart items discriminate builds from ordinary merchandise. Build and service details stay grouped through cart, checkout and confirmation. Prices use integer cents and are recalculated on the server from the verified source data; no discounts, tax rates or shipping charges are invented.

The source snapshot does not provide a complete service-option and combined-work price matrix. Every current service build is consequently marked Requires Review / Base Estimate. It is not represented as a guaranteed final quote. Known component requirements, existing-cut restrictions, the Bodyguard Standard/Carry Comp distinction, package overlaps, option exclusivity and unreleased services are validated. Missing or conflicting information stays review-only. In particular, the source P-07 description refers to the 75 Series and is flagged rather than silently treated as confirmed compatibility.

Physical cart support is limited to the five audited ordinary sticker merchandise entries. Firearm components and other unapproved catalog items retain inquiry actions. The source live-checkout flags are not globally flipped on.

## Separate customer flows

`/customize` is the four-stage configurator: platform/component, multiple services, service details, review. Its desktop composition uses configuration controls beside a sticky build summary, with stacked mobile controls/summary. Valid structured builds can be saved to the cart, edited, duplicated or removed. `/custom-inquiry` retains the separate seven-step project request for unsupported work, quotes, custom finishes and compatibility questions. Gallery finish inquiries now go there rather than pretending to select a final priced finish.

`/cart` persists validated non-sensitive choices, groups service lines under each build, supports multiple builds and merchandise, and shows an intentional empty state. `/checkout` keeps personal data in memory through contact/address/back/review steps; none is written to localStorage. Custom inquiry persistence was also narrowed to platform/options; contact details, notes and reference links stay in memory.

## Checkout and payment boundary

The payment layer is provider-agnostic and implements a development adapter only. Both `COMMERCE_MODE=test` and `PAYMENT_PROVIDER=development` must be explicitly configured. Otherwise production checkout remains closed and order submission returns 503. No provider credentials, eligibility, carrier rates, tax rules, card fields or actual charges are assumed. Development screens and confirmations clearly identify test records, uncalculated shipping/tax and the absence of any real service authorization or shipment.

The server validates cart and checkout schemas, same-host origin/cross-site boundaries and payload size, recalculates prices, rejects changed totals and structural/compatibility errors, applies a process-local attempt limit, reserves an idempotent order, invokes the provider abstraction and then confirms the saved snapshot. Failed test payments retain the cart and pending order identity for retry. Success clears only purchased IDs and routes to `/order/[orderNumber]/confirmation`.

## Orders and persistence

An `OrderRepository` interface isolates persistence. The included local Node implementation uses private SQLite tables for orders and events, transactions and prepared statements. Session/idempotency uniqueness prevents duplicated successful attempts. The immutable order snapshot copies customer/address, build configurations, service options and prices; confirmation does not re-read live catalog amounts.

Personal snapshots are encrypted using AES-256-GCM and protected by a 32-byte key. A private random development key is created only for explicitly enabled test checkout. The database/key are Git-ignored and excluded from Next output tracing. Confirmation requires the order's matching HttpOnly same-site session cookie. A guessed order number from another browser receives 404. No public order lookup or fake production tracking is exposed.

## Known production dependencies and remaining decisions

Live ordering still requires an approved provider implementation and verified webhook/reconciliation flow, complete service-option pricing, reviewed compatibility, shipping and tax calculation, fulfillment procedures and owner/legal policy approval. A serverless or multi-instance host needs a shared durable repository and shared abuse controls rather than a local SQLite file and process-local limiter. Backup, encryption-key custody, data retention/deletion and customer notification policies remain owner decisions. Node's built-in SQLite API is experimental in the tested Node 22 runtime; no additional database package was installed.

The existing configurable inquiry endpoint remains independent and still requires real delivery configuration/verification. Draft Privacy/Terms/Cookies copy was updated for non-sensitive cart/draft storage, private test-order records and the necessary order-session cookie. No non-essential tracking or consent banner was added.

## Validation

Final verification is recorded in `source-audit/pass-02-verification.json`. ESLint passed without warnings, strict typecheck passed, and the production build completed with 95 static outputs plus the runtime routes. All 33 Playwright Chromium tests passed with no skipped, flaky or unexpected results. The retained asset check verified 1,854 original hashes and 258 content image references; the three known source 404s remain documented.

Browser coverage includes the original presentation routes, custom inquiry, source service preselection, single/multiple-service builds, multiple builds plus merchandise, edit/duplicate/remove, persistence, incomplete and unsupported selections, coming-soon restrictions, checkout validation/back navigation, adapter decline/retry, successful test orders, duplicate submission protection, price tampering, cross-site rejection and private confirmation access. Axe checks passed on nine pages, service-option controls, populated mobile checkout and the mobile-menu/gallery overlays. Automated accessibility results are not a compliance certification.

The refreshed visual run completed 22 checks without horizontal overflow. Home hero captures cover 1728, 1440, 1280, 1024, 768, 430, 390 and 375px; About, Resources, configurator, custom inquiry, cart, checkout and merchandise captures cover 375 and 1440px. Populated cart, checkout review and saved confirmation were additionally inspected at 375 and 1440px. Proof icons were visually checked in their shared frame. With test flags absent, the closed checkout screen and order endpoint's 503 response were verified.

Validation caught and fixed an overly broad existing-optic-cut match that also matched “no existing optic cut.” Both the configurator and server pricing now share an explicit variant check, with regression coverage for valid uncut slides and existing-cut rejection. Source attribute controls use valid stable IDs, and build numbering stays sequential when merchandise precedes the first build. No actual payment or business order delivery is claimed. Live checkout remains disabled pending the production dependencies above.

# PASS 03 — Earlier checkout workflow and UX refinement (superseded below)

## Human review and product-flow correction

The default checkout previously returned a quote-oriented editorial page before rendering customer information. Payment availability incorrectly determined the customer journey. Pass 03 renders the actual checkout sequence in both environments: build → cart → customer/address → payment/review → confirmation → shipping steps. Default mode allows customer/address review and stops at a disabled Place order action with a clear live-payment configuration message. It does not present a quote as the normal next step for a confirmed configuration.

Configuration readiness is separate from payment availability. `PricedBuild` carries orderability, price and compatibility status plus specific review reasons. Complete audited standard configurations can be ready. Work with uncertain options, model scope, combined-service pricing or existing modifications remains review-only, receives a configuration-review link and cannot create even a simulated successful order. `/custom-inquiry` remains independent. No source price, shipping charge, tax or provider eligibility was fabricated.

## Verified source workflow and optic configuration

`source-audit/PASS_03_REFINEMENT_AUDIT.md` identifies the public service and FAQ sources, unavailable public checkout reader, uncertainties and implementation boundaries. Public service pages describe work on a customer-supplied component followed by emailed shipping instructions after ordering. The FAQ distinguishes customer-paid inbound shipping from return shipping and starts lead time on receipt. The site uses that business sequence without repeating shipping-law claims or adding turnaround guarantees. No live checkout action or external order was performed.

A focused read-only audit recovered the embedded product-builder configuration that the earlier Store API migration missed. Eleven live builders matched the retained HTML. Their fields, original IDs, conditions and option amounts are recorded in `source-audit/pass-03-live-options.json`; normalized runtime definitions live in `src/data/milling-options.json`. The JSON is parsed without executing source scripts.

Milling/optic services now expose their source-defined footprint and conditional sight-position/finish choices. Genesis and Saber explicitly ask whether an optic cut is required, then show the appropriate full-size/slimline footprint list. Model groups are derived from the chosen platform where supported. Source-defined conditional fields prevent cross-model footprint substitution; hidden or forged options are rejected. The earlier substring bug remains fixed through normalized uncut/existing-cut identity. Cut choices survive review, local cart persistence, checkout and the frozen snapshot.

Audited single-service definitions for full-size/slimline Glock optic cuts, Genesis, Saber, CZ P-10 C and SIG P365 can be order-ready with complete compatible selections. Other services and uncertain variants remain review-only until their own rules are verified. The source lists optional optic cuts at +$75 for Genesis/Saber and the specified front-dovetail option at +$10. Blank fixed amounts in the source builder mean no added surcharge. Named source finishes remain selectable within that service package; custom finish requests and separate combined-work quotes are not silently priced.

## Checkout, persistence and communications

Checkout uses the existing two-column design with a sticky desktop summary and stacked mobile layout. Contact, billing address and optional distinct return address are validated with field messages and an error summary. Billing/return sameness and back navigation preserve in-memory progress. The final review shows grouped services, optic options, service-level amounts, addresses, configuration status and truthful pending shipping/tax. No checkout personal data enters localStorage. Merchandise-only carts do not ask the customer to send a service component.

The provider abstraction remains independent of any live processor. Both test flags are still required for test orders. No card fields or real payment provider were added. Default order submission returns 503. Review-only requests return 422; stale or tampered totals return 409 with the updated server quote. The client retains checkout details, refreshes the quote and requires review again. Declines and storage failures retain the cart. An immediate client in-flight lock and atomic repository payment claim guard double clicks and concurrent submissions, alongside existing session/idempotency uniqueness.

Snapshot version 2 adds billing address, transaction reference, shipping-instruction status/channel/content and per-message communication results. Personal snapshots remain AES-256-GCM encrypted, confirmation requires the matching HttpOnly session and another browser receives 404. The local SQLite repository now explicitly requires enabled test mode. It is not offered as a production storage solution.

`OrderCommunicationProvider` defines confirmation, shipping-instructions and status-message boundaries without connecting a delivery service. Missing configuration reports not-configured; delivery failure reports failed. Saved payment/order success is not rolled back by communication failure. Confirmation never claims an email was sent. The shipping-instruction record can later support email, confirmation-page content or both; it currently contains no fabricated instructions. The test confirmation displays order number, date, customer, grouped work, amount and the post-purchase sequence while making clear that no work, payment or shipment was booked.

## Targeted visual refinements

Desktop homepage hero geometry and source imagery are preserved. At mobile widths, the original image now stays behind the heading, supporting copy and both CTAs in one continuous composition, using controlled crop and local gradients. The hero remains within a reasonable first-screen scroll.

Mobile Services and Resources sublinks form labelled vertical groups with clear numbering and 44px targets. The drawer enters and closes with a 220ms opacity/position transition, retains keyboard focus handling and respects reduced motion. The obsolete arrow-alignment rule that pushed the remaining number span to the right was removed.

Select controls share one SVG chevron background with a 15px right inset, vertical centering, 46px text padding and native-arrow suppression. Cart Edit/Duplicate/Remove actions use the same flex alignment, font metrics, 44px height and underline baseline. General display maxima move modestly from 108/110px to 96px; page-intro spacing is reduced where large type and padding compounded the zoomed-in effect. The desktop homepage hero heading keeps its own approved scale. Checkout receives a smaller transactional introduction; mobile product/configuration/confirmation headings are reduced without changing Oswald, Heebo, the palette or component language.

## Validation and remaining decisions

Final results are recorded in `source-audit/pass-03-refinement-verification.json`. ESLint passed without warnings, strict typecheck passed, and the production build completed with 95 static outputs plus the runtime routes. All **44 Playwright Chromium tests passed**, with no skipped, flaky or unexpected results. The source-asset verifier checked 1,854 original hashes and 258 image references; the three previously documented source 404s remain unchanged.

The **35 responsive visual checks** reported no horizontal overflow or broken images. Captures include all eight requested home widths; mobile menu open, lower-menu and closing endpoints at 375/390/430; configurator platform/details, cart, all three checkout stages, confirmation, service detail and About at 1440/390. Human inspection covered the hero widths, menu hierarchy, commerce/content overview and desktop checkout. The final 375px hero retains the intended three-line heading with both CTAs over the original photo. Summary model labels show the selected model rather than the legacy builder's full model-group list.

Behavioral coverage includes conditional optic choices and source surcharges; optic persistence through checkout and saved confirmation; valid orders continuing to checkout; unresolved orders linking to review and being rejected by the order endpoint; contact/billing/separate-return validation; back navigation; decline/retry; saved private confirmation; simultaneous requests and double clicks; price tampering; server failure with retained details; disabled default payment; shipping next-step copy; missing/failed communication delivery; menu animation/reduced motion; select inset; cart action alignment; and all prior presentation-route/navigation/gallery/inquiry regressions. Axe checks passed for nine routes, mobile menu/gallery overlays, service options, populated mobile checkout and the default final review. Automated checks do not certify accessibility compliance.

`npm audit --omit=dev` reported **zero production vulnerabilities**. The full audit retains **five high-severity development-tooling entries** through braces, micromatch, fast-glob and Next's ESLint tooling, matching the earlier audit. The registry-proposed fix downgrades the Next ESLint stack to a different major; it was not applied. The advisory chain and exact audit counts are retained in the verification JSON. No new package dependency was added.

No deployment, real payment-provider connection, live order or email delivery occurred.

Production still requires approved payment-provider eligibility and integration, provider transaction verification, webhooks/reconciliation, complete service-option/optic pricing and compatibility, shipping charges/policy, tax calculation, order notifications, fulfillment workflow, shared durable order storage and shared abuse controls. Encryption-key custody, backup/restore, retention/deletion and Terms/Privacy approval remain owner decisions. Inquiry delivery is also still unconfigured. These prerequisites are not bypassed by the successful local test adapter.

# PASS 03 — Complete service catalog, configurator and checkout

This section implements the **superseding Pass 04 brief**, dated October 19, 2026. The requested Pass 03 artifact names are retained. It replaces the earlier narrow checkout plan and supersedes historical blanket-review limitations and prior validation counts.

## Executive summary and human-review findings

The configurator now accounts for every current configurable service discovered in a fresh public audit. It exposes actual package-specific options, uses real visual references, enforces compatibility and prices each work scope once. Standard complete builds have a purchase-oriented checkout; genuine source conflicts and custom work remain inquiry/review paths. The approved visual system and desktop homepage composition are preserved. No live provider, business order, email, commit or deployment was performed.

The reported Glock 17 slide / uncut OEM / Slide Only Cerakote / Midnight Chocolate Chip / full-size optic cut / C Series / Keep Factory case now has one billable milling service at **$285** ($185 base + $100 milling camo upgrade). Standalone slide coating is removed with an explanation, its compatible finish transfers into milling, and the reverse selection sequence produces the same canonical total. The server recalculates this result independently.

## Live-site audit, canonical matrix and coverage

`source-audit/PASS_03_AUDIT.md` records the fresh crawl and operational findings. `source-audit/pass-04/` retains 79 successful public pages, raw HTML, hashes, extracted builder fields and all 63 Store API products. Requests were public GET/read-only, with account/cart/checkout/admin mutation paths excluded. No credentials or live order submission were used.

`pass-03-service-matrix.json` and the runtime `src/data/service-matrix.json` contain all **32 / 32 configurable services (100% accounted for)**: 16 platform stippling packages, magazine-extension stippling, 11 milling packages, three Cerakote scopes and one available porting package. All **180 source fields and their option IDs** are retained and checked against the fresh extraction. Eight Coming Soon offerings remain non-purchasable. Twenty-three legacy add-on/reference records and eight physical/complimentary records are separately accounted for. Five sticker products have the ordinary merchandise purchase path; firearm accessories and complimentary items retain direct-business handling.

`SERVICE_COVERAGE.md` compares each active service's fields, choices, base price, imagery, compatibility and eligibility to its source URL. Coverage means represented and validated, not that every possible source option is approved for live payment. P-07 and genuinely ambiguous choices retain explicit review requirements. No active service is silently omitted.

The Zod catalog schema includes normalized IDs, service family/package/status, component/model/variant compatibility, required and optional fields, conditions, included features, legacy add-on bindings, exclusions, dependencies, overlaps, provenance, review requirements and eligibility. Business logic uses typed roles and IDs; source display labels are presentation. The one-time extractor classifies source labels, and the migration adapter explicitly translates old cart labels at that boundary.

## Stippling, milling, Cerakote and porting

Every current stippling package has its own form, including OA Defense 2311 and the separate magazine-extension service. Texture cards use seven real Defiant photographs with the verified aggression/use context where supported. Texture selection leads the details; undercuts, index points, glove bevel, finger grooves, logo, borders, backstrap and other package-specific treatments remain compact source-specific controls. Core/Crown frame coating uses the actual +$50 / +$85 / +$115 menu. Equivalent undercut/texture legacy SKUs configure the package rather than add a second charge. Unbound legacy work remains an explained review request excluded from payable pricing.

All 11 milling forms include their actual conditional optic, BUIS, coating and optional work. Model groups bind to the selected stable model and summaries show that model alone. Genesis/Saber optional optic work and conditional front-dovetail charges retain source amounts. Fixed RMSC/rear-sight-removal specifications on Bodyguard/CZ 75 appear as included details. Existing-cut restrictions and the specifically published slimline MOS rear-stud exception are explicit IDs; no substring compatibility logic is used.

Cerakote exposes complete pistol, frame and slide scopes with actual single-color/battleworn/camo treatment prices and conditional finish choices. Real finish photographs are matched through explicit verified aliases. A listed choice without an exact photograph uses an honest text card, not a fabricated swatch or substitute image.

Available porting is Bodyguard 2.0 Viper Ports, restricted to the Standard variant and slide-plus-barrel/complete project scope. The service card uses real work photography. Eight upcoming packages have no cartable service record, and forged IDs fail server validation. Upcoming references are filtered to the manufacturer. The Viper product form's $225 base +$100 camo differs from the landing page's old $225–$305 range; the explicit current form amount is retained and the discrepancy requires owner correction.

## Visual options, compatibility and dependencies

Four stages remain: Platform, Services, Service details, Review. Only relevant platform/component packages appear. Families reveal their package cards, and only the selected service's detail panel is shown at a time. Real radio/checkbox controls support keyboard selection, visible focus and selected states; required-field errors are associated with the affected controls. Images are local optimized derivatives with source URLs and lazy loading below the fold. The desktop controls/sticky-summary composition remains intact; mobile uses deliberate one/two-column cards.

`service-configuration.ts` owns conditional/required option validation, allowed IDs, generation and existing-cut requirements, prices and readable details. `build-rules.ts` owns deterministic typed relationships. `pricing.ts` normalizes and validates the result on both server and client using integer cents. Optional magazine-extension work can accompany a supplied component; the form explains the separately supplied extension.

## Overlap normalization and double-charge prevention

Milling owns its included slide-refinishing scope and its published upgrade delta. Porting owns its refinishing scope; the source Bodyguard optic/porting combination uses the explicit shared-coating option, with the finish preserved in the owning optic package. Standalone frame coating transfers into Core/Crown's verified upgrade menu. Complete-pistol Cerakote absorbs component duplicates or becomes only the remaining verified frame/slide service when another selected package owns a scope. No invented proportional discount is used.

Mutually exclusive package tiers replace the old package interactively with a notice; forged simultaneous tiers are rejected. Equivalent legacy add-ons map to included/paid package options. Conflicting non-neutral selections require correction. Source-unbound add-ons cannot silently increase a billable total. Normalization is deterministic in either selection order and emits concise customer notices. Base, included options, paid deltas and service totals remain distinct through review/cart/checkout/snapshot.

## Cart, checkout and shipping-instruction workflow

Cart schema version 3 uses stable manufacturer/model/variant/generation IDs and a catalog revision. Valid old version-2 selections migrate with a review notice and explicit acceptance of current details/pricing. Unsupported or corrupt data is retired with a readable message. Catalog revision mismatches return 409 from the server; checkout never silently accepts changed totals. Builds remain grouped, editable, duplicable and removable beside ordinary merchandise.

Source-complete builds progress through customer information, billing, same/separate return address, grouped order review, acknowledgement and the provider boundary. Default Place order is disabled until production dependencies are met; test mode permits only the development adapter. Review-only work has an explicit custom-inquiry link and cannot become a successful order. Contact/address data stays in memory while navigating back and forward. Phone is optional until the business confirms a requirement; a supplied number is validated.

Private test confirmation shows order/date/customer, frozen grouped service choices, base/upgrade amounts, total and next steps. The snapshot also records the catalog revision. The source-supported business sequence remains order first, then emailed shipping instructions; test confirmation explicitly says no business order, payment, shipment or email was created. No firearm-shipping law or invented instructions are supplied. Provider-neutral confirmation/shipping/status-message boundaries report not-configured/failed accurately.

## Targeted presentation refinements

The earlier continuous mobile hero, controlled crop and overlay remain behind the headline, supporting copy and both CTAs at 375/390/430px. Desktop hero geometry is unchanged. Vertical mobile menu hierarchy, 220ms entry/exit, focus restoration, Escape/link handling and reduced-motion behavior are retained. Shared select chevrons keep their consistent inset and text padding. Cart actions retain aligned 44px boxes and underline baselines.

Generic page introductions keep breadcrumb navigation and remove a redundant eyebrow. Meaningful editorial eyebrows remain, including “The work / All services,” service positioning, and the configurator's stage label. Modest display scale/intro-spacing refinements from the earlier targeted pass remain; no new theme, typography system, palette, logo or photography was introduced.

## Security, accessibility and performance

Same-origin/cross-site checks, bounded JSON bodies, canonical server pricing, idempotency and concurrent-payment claims remain. Session-bound confirmation returns 404 to another browser. Personal snapshots use AES-256-GCM, a private test key and HttpOnly same-site session cookie. No personal/address/card data is put in localStorage. No reference URLs are fetched and no uploads are accepted. SQLite refuses operation outside explicit test mode; it is not a deployment architecture.

The global cart store imports a lightweight revision/merchandise list; the full catalog is used by commerce routes and loaded for legacy migration only when needed. Configuration images use optimized local derivatives and responsive sizes, not archive originals. Automated accessibility, keyboard and responsive checks are complemented by visual inspection; they are not a compliance certification or live Core Web Vitals measurement.

## Known uncertainties, owner decisions and production dependencies

Resolve P-07/75 Series copy, the duplicate M&P RMR option, unbound legacy prerequisites, unphotographed finishes, the porting range discrepancy and any remaining model/generation specifics. Approve the resulting current price/compatibility matrix and asset permissions.

Production requires payment-provider approval and implementation, server-side transaction confirmation, verified webhooks/reconciliation and idempotency; shipping charges/process and tax treatment; actual order email delivery, fulfillment procedures and inquiry delivery verification; shared durable order storage and shared abuse controls; key custody, backup/restore, retention/deletion; Privacy/Terms/Cookies approval, manual accessibility review and production-host verification. None of these is implied by successful development checkout.

## Exact final validation and review handoff

Fresh Pass 04 results are recorded in `source-audit/pass-03-verification.json` and the command logs under `source-audit/pass-04/`. No earlier pass's results are reused as current validation.

- ESLint passed with **zero warnings**; strict TypeScript checking passed. The production build completed with **95 static outputs** plus the runtime routes. Node 22's SQLite experimental warning remains documented; no database dependency was added.
- The complete Playwright Chromium run passed **145 / 145 cases**, with **zero skipped, flaky or unexpected results**: 91 domain/schema/coverage/migration tests, 36 workflow/API/boundary tests, 10 accessibility tests and eight visual-matrix tests. All 32 service fixtures validate; required/forged choices are rejected. The exact human double-charge case passes in both selection directions with the canonical $285 amount.
- **21 Axe scans** passed: nine core pages, menu/gallery overlays, three populated commerce states, four visual-option states and three additional populated mobile-checkout reviews at 375/390/430. Keyboard radios, menu focus/Escape/reduced motion, form associations, billing/return validation and optional-phone behavior were verified. These results are not an accessibility certification.
- **139 responsive visual captures** passed across 375, 390, 430, 768, 1024, 1280, 1440 and 1728px. The separate standard visual suite passed **69 checks**, including 23 routes at 320px. The four-width route smoke tests add 100 route/overflow checks. No horizontal overflow or broken local images was found.
- The asset check verified **1,854 original hashes**, **258 retained content references**, and **915 optimized configurator references** with Defiant provenance. Three historical source 404s remain documented. No generated firearm/texture imagery or critical hotlinks were introduced.
- Fresh dependency audits report **zero production vulnerabilities** and **five inherited high-severity development-tooling entries** through braces/micromatch/fast-glob/Next ESLint tooling. The proposed incompatible toolchain downgrade was not forced. Exact JSON audit results are retained; the production graph does not contain that advisory chain.

`source-audit/PASS_04_VISUAL_REVIEW.md` links every generated screen and width, including platform/services, textures, porting package/reference, milling, Cerakote, review, cart, checkout, confirmation, inquiry, About, service page, Home and mobile menu. Contact sheets, all eight hero widths, individual visual controls, grouped summaries and mobile/desktop checkout/confirmation were inspected. `SERVICE_COVERAGE.md` accounts for all 63 public Store API records and the eight upcoming references, including each intentional review/inquiry boundary.

The local environment remains runnable with the README commands. QA-only servers are stopped after verification; the user's existing development server is left alone. No automatic commit or deployment was performed. Live payment remains disabled, and no real business order, payment or email delivery is claimed.

# PASS 05 — Configurator consistency and Gallery reference flow

Handoff date: October 20, 2026. This is a presentation-only pass. The preceding Pass 04 record and its verification artifacts remain historical and unchanged.

## Human-review motivation and presentation changes

Mixed photo and text-only choices gave otherwise equivalent options inconsistent visual weight. Service/package photographs, texture photographs and finish photographs are now removed from the Start Your Build wizard. No swatch or image-availability fallback remains. A shared `OptionCard` supplies compact text, optional source-supported context, price, status and native checkbox/radio state. Existing binary and administrative choices retain compact native selects.

Package and finish/texture cards use the same border, padding, input placement, typography and metadata anatomy. The selected native checkmark/radio dot accompanies the rust border and background shift, so selection does not rely only on color. Keyboard focus has a visible outline. Required choices retain their associated errors, and texture aggression/use context stays visible where supported. Coming Soon entries use the same text-card anatomy with disabled controls and an explicit status. Review-required packages remain labelled. No price, option or service was removed.

The old image-based picker was replaced by `option-picker.tsx`; unused image imports, photo wrappers, image-height rules and image/text variant CSS were removed. Image availability no longer influences option ordering or styling. Cards shrink around their text instead of retaining image-sized empty space. The controls-left/sticky-summary-right layout remains, with compact one/two-column mobile choices at 375/390/430px. There was no site, Gallery, hero, navigation or global typography redesign.

## One Gallery reference per service section

Each service-family section in Services, and the currently displayed service section in Service details, has one supporting Gallery link near its heading. Individual option cards contain no links. Each reference opens a new tab with `target="_blank"` and `rel="noopener noreferrer"`, with descriptive text and a screen-reader new-tab notice. The original wizard tab does not navigate or change selections.

The Gallery already contained all four relevant categories: 29 Cerakote examples and one each for Stippling, Slide Milling and Porting. No new image, category classification, stock photo or duplicate example was needed. URL preselection was added to the existing service-label filter, alongside the existing finish search:

| Configurator family | Existing Gallery label | Reference destination |
|---|---|---|
| Stippling | Stippling | `/gallery?service=Stippling` |
| Milling | Slide Milling | `/gallery?service=Slide+Milling` |
| Cerakote | Cerakote | `/gallery?service=Cerakote` |
| Porting | Porting | `/gallery?service=Porting` |

`service` preselects the existing filter; it is not a second category system. `finish` still supports the existing text search, and both parameters work together. An unknown service value falls back to All. Gallery photography, lazy/responsive rendering, lightbox, keyboard navigation and inquiry links remain intact. Sparse categories are shown honestly with their single real example.

## Approved domain and service coverage preserved

A before/after SHA-256 comparison verifies **29 protected files unchanged**: all commerce-domain TypeScript modules, the canonical matrix and revision, Gallery dataset, cart store/UI, checkout, grouped summaries, address controls, order/quote endpoints, private confirmation, homepage, header/navigation, domain tests and the historical coverage/verification records. `source-audit/pass-05/service-coverage-verification.json` retains the exact comparisons.

`SERVICE_COVERAGE.md` remains unchanged and was reverified against the matrix: **32 / 32 configurable services**, **180 fields**, **1,280 option records**, **23 legacy add-on/reference records** and **eight Coming Soon references**. OA Defense 2311, magazine-extension stippling, all 11 milling packages, all Cerakote scopes and Viper porting remain represented. Cart schema remains version 3, catalog revision remains `dmw-dd3ca0aec896`, and no migration was introduced for a presentation change.

Pricing, compatibility, required/optional conditions, overlap normalization, checkout eligibility, server validation, frozen order snapshots, encryption, idempotency and the payment boundary were not edited. Both directions of the reported Glock 17 / uncut slide / Midnight Chocolate Chip / full-size C Series cut / Keep Factory case still produce the canonical **$285** total with one billable slide-finishing scope. Standard checkout and test confirmation still work; real payment remains disabled.

## Asset retention and performance effect

No source, optimized image or provenance data was deleted. The unchanged matrix retains all **915 visual-reference records**. The former renderers used 32 primary package references and 833 repeated option references, covering **66 distinct local photographs** across the catalog. Those photographs are no longer rendered by the wizard; their continued uses in Gallery, product details, service pages, the stippling guide, editorial sections and the archive are listed individually in `source-audit/PASS_05_ASSETS.md` and `pass-05/asset-usage.json`.

Eight fresh browser flows across all four service families at 390/1440px recorded **zero wizard service-image requests and zero service-image preloads**. The wizard contains no service-option image elements. Shared branding remains. The full catalog/provenance JSON is intentionally retained; no bundle-size, Lighthouse, LCP or total byte-savings score is claimed. Removing media requests and image-card heights is the verified effect.

## Fresh validation and visual review

Current results are recorded in `source-audit/pass-05-verification.json` with fresh command logs under `source-audit/pass-05/`. Pass 04 counts are not reused as Pass 05 results.

- ESLint passed with **zero warnings**, strict TypeScript checking passed, and the production build completed with **95 static outputs** plus the runtime routes.
- The full Playwright Chromium suite passed **159 / 159 cases**, with **zero skipped, flaky or unexpected results**: 91 domain/schema/coverage tests, 48 workflow/API/boundary tests, 10 accessibility cases and 10 visual-matrix cases. The 14 new cases cover text choices, keyboard/focus/error associations, all four filtered new-tab links, unchanged original-tab state, zero service-image requests/preloads, URL filter behavior and protected-file preservation.
- **39 Axe scans** passed: 18 existing suite scans, 18 additional text-card/filtered-Gallery scans and three fresh populated mobile-checkout scans at 375/390/430. Automated results are not an accessibility certification.
- All **20 requested Pass 05 captures** passed at 390/1440: Services, four service-detail panels, build review and four filtered Gallery destinations. The existing eight-width visual matrix adds **139 fresh regression captures**, and the standard visual suite passed **69 checks**, including 23 routes at 320px. No horizontal overflow or broken local images was found. Desktop/mobile contact sheets and individual screen crops were inspected.
- Asset validation again verified **1,854 original hashes**, **258 content references** and all **915 retained catalog visual references**. The three known source 404s remain documented.
- Fresh dependency audits reported **zero production vulnerabilities** and **five inherited high-severity development-tooling entries**. No dependency was added, upgraded, downgraded or force-fixed.

`source-audit/PASS_05_VISUAL_REVIEW.md` links the complete requested review matrix. Historical Pass 04 screenshots are preserved; fresh regression screenshots live under `tests/visual/pass-05/regression/`. The in-app browser runtime was unavailable, so installed Playwright Chromium performed local QA.

No commit, deployment, real order, payment or email delivery occurred. QA-only servers are stopped after verification; the existing development server is left alone. All previously documented production dependencies remain unchanged.

# PASS 06 — Standalone cosmetic Cerakote (limited implementation)

October 20, 2026. This implements the cosmetic Cerakote portion only. The full four-family service-first brief and Add Compatible Work expansion are **not complete**; performance-modification configuration/purchase development was excluded from this work.

Cosmetic coating now proceeds directly through **scope → treatment/finish → review → existing cart/checkout**. The three scopes come from the unchanged audited catalog. Cerakote service/product links, a new coating-only entry link and single-coating cart edits enter this branch. Manufacturer, model, existing-cut and sight-position controls are absent. Text-only OptionCards, native field validation, the single filtered new-tab Gallery reference and sticky summary are reused. Changing scope explicitly resets its treatment/finish choices.

The root correction covers browser selection and server validation: only a single audited standalone coating record, without legacy add-ons or a claimed platform/generation, may omit platform identity. Current status, generic coating eligibility, component scope, required/conditional fields and canonical prices are still checked independently. No fake manufacturer or model is stored. Existing platform-specific coating records retain their data when edited. **The stored structure, schema version 3 and catalog revision remain unchanged; no migration is required.**

Files: new `coating-configurator.tsx` and `coating-context.ts`; routing/entry changes in `configurator.tsx` and the Customize introduction; narrow context/title changes in `schema.ts`, `pricing.ts`, `catalog.ts` and `build-summary.tsx`; focused coating unit/browser tests and updated product-entry/preservation assertions. Matrix data, pricing amounts, compatibility/overlap rules, cart storage/migration, checkout/endpoints, snapshots, payment/repository, Gallery, hero and navigation are unchanged. The preservation regression retains checks for 25 historical baseline files and names the four necessary context/presentation exceptions.

Fresh verification: ESLint and strict TypeScript pass; production build passes. The relevant unit/workflow/accessibility suite passed **167 / 167**, with no skipped, flaky or unexpected cases. After final presentation refinements, the **18 coating-specific unit/browser cases** were rechecked, including the three scopes, conditional options, field errors/keyboard, new-tab state, old/new cart editing, server rejection, test confirmation/privacy and default-disabled payment. The existing exact $285 overlap regressions pass unchanged. Six focused scope/finish/review screens at **390 and 1440px** were inspected; six new Axe state scans pass. The large visual matrix was not rerun. See `source-audit/pass-06-verification.json`, command logs and `PASS_06_VISUAL_REVIEW.md`.

The retained source audit already establishes the independent coating forms; no fresh crawl or new coating-source uncertainty was needed. Existing source uncertainties and production dependencies remain. Live payment is disabled by default. No real payment, business order, email, commit, push or deployment occurred.

# Configurator step scroll correction

October 20, 2026. Both configurators now share `use-configurator-step-focus.ts`. After a successful step change renders, the hook focuses the active heading with `preventScroll: true`, then aligns the controls panel using `scrollIntoView`. The panel uses the existing responsive root scroll padding, avoiding the heading's additional scroll margin. CSS controls smooth versus reduced-motion behavior. Initial entry and validation-error focus are preserved; routing, service selection, data, domain rules, cart, checkout and global styling are unchanged.

Changed files: the shared hook, `configurator.tsx`, `coating-configurator.tsx`, `tests/e2e/configurator-scroll.spec.ts` and this record. Eight new Chromium cases passed across both flows at 390/1440px with normal/reduced motion, checking 40 Next/Back transitions, keyboard focus/Tab navigation, header clearance and no sampled document-top jump. Ten existing coating UI regressions also passed, including six Axe state scans. ESLint, strict TypeScript and the QA production build passed. The isolated QA server was stopped; the existing server on port 3000 was left untouched. No commit, push or deployment occurred.

# Component-to-family visibility — presentation only

October 20, 2026. `service-family-visibility.ts` derives family headings from the canonical main-component scopes using `componentFits`; ancillary magazine extensions establish Stippling only when the extension itself is the selected component, rather than causing Stippling to appear for slide projects. Every package row still uses the original `eligibleService` predicate. Families relevant to the component but without a matching package show an honest inquiry state and any existing disabled Coming Soon references. They do not gain selectable substitute packages or purchase eligibility.

Frame shows Stippling/Cerakote; Slide shows Milling/Cerakote; Slide + Barrel shows Milling/Cerakote/Porting; Complete Firearm shows all four. Existing extension-only presentation is retained. Slide + Barrel lists only source-supported slide coating; it does not imply barrel coating. Selected services continue to own their existing detail fields. The universal platform-entry stage is unchanged. No barrel-only scope, schema migration, price, checkout, server-rule, orderability or catalog-revision change was introduced.

Changed files: `src/lib/commerce/service-family-visibility.ts`, `src/components/commerce/configurator.tsx`, the new unit/browser `service-family-visibility.spec.ts` files and this record. Fresh checks passed: **106 unit cases** and **57 focused Chromium cases**, including visibility, inquiry-only states, selected-service questions, cart restoration, standalone coating, unchanged checkout/payment/privacy, Coming Soon, overlap normalization and both exact $285 directions. The eight component/width captures were inspected at 390/1440px without overflow. ESLint, strict TypeScript and the QA production build passed. All 22 protected domain, standalone-coating, scroll/focus, Gallery and stylesheet files matched their pre-change hashes. No new source ambiguity was found; existing source/production dependencies remain. QA servers were stopped; the existing development server was left alone. No commit, push, deployment, real order, charge or email occurred.

# Standalone versus package-owned coating — visibility correction

October 20, 2026. This supersedes the preceding family-visibility description for coating entry points. The shared `visibleServiceFamilyGroups` helper now hides separate Cerakote choices for Slide and Slide + Barrel. Complete Firearm keeps its other families and hides separate Cerakote when a selected eligible package owns coating. Existing canonical dependency metadata identifies included coating and selected optional coating; None or an incompatible saved package does not establish ownership. Physical compatibility and package eligibility remain independent of this presentation filter.

The dedicated standalone coating flow and milling's Coating Type/Slide Cerakote controls are unchanged. No service data, price, overlap normalization, schema/revision, cart storage, checkout, scroll/focus, Gallery or style change was made. All **84 protected files** matched their pre-change hashes. Test fixtures now use the dedicated entry for standalone coating, while legacy duplicate-scope carts still verify both selection orders against the server's **$285** total before and after editing.

Fresh checks passed: **112 unit tests** and **94 Chromium workflow/accessibility tests**, with no skipped, flaky or unexpected results. Standalone scope/finish/review/cart, cart editing/restoration, existing checkout, selected-service questions, both $285 directions and scroll/focus regressions passed. ESLint, strict TypeScript and the production build passed. Six focused screens were inspected at **390/1440px**: Slide selection, Slide + Barrel selection and milling coating details. The two milling capture tests were repeated after correcting screenshot-only sticky-header/focus distortion; both passed. The full visual matrix was not run. No new source ambiguity was encountered. No commit, push, deployment, real payment, business order or email occurred.

# PASS 06C — Service media coverage

October 20, 2026. This content/media pass replaces the two generic Stippling/Milling Gallery entries with source-classified photographs. Gallery coverage is now **12 Stippling, 10 Slide Milling, 10 Porting and the unchanged 29 Cerakote entries**. Added: 12 / 10 / 9 respectively; the existing Viper photograph/slug remains. Stippling includes texture, grip/backstrap details and finished packages across platforms. Milling includes real full-size/slimline optic cuts, Genesis/Saber and other verified examples. Eight source-labelled upcoming Porting photographs carry visible **Coming soon / Reference only** captions and explanatory lightbox text. Their inquiry links do not confer purchase eligibility.

The retained public source audit and original asset archive supplied every image. All 32 selected service references have distinct original-content hashes and source-page/image provenance. Twenty-four optimized derivatives were reused and eight were generated from retained originals with the existing bounded WebP workflow; no download or generated firearm image was needed. The coverage report accounts for 122 omitted/retired candidates, including 63 render diagrams, a logo, alternate photographs and the existing P-07/75 Series source conflict. No archive image was deleted. Source spellings for Platypus Raptor/Hornet are normalized to the project's existing display names; no new classification ambiguity was introduced.

Stippling's hero now shows a verified Kevlar texture close-up; Milling uses a real Genesis photograph. Three/four/three supporting examples on Stippling/Milling/Porting reuse the existing GalleryGrid, filtered links and styling. Source data, pricing, compatibility, family visibility, coating ownership/standalone flow, cart/schema/revision, checkout, payment, persistence, Gallery query behavior and scroll/focus are unchanged. All **77 protected source files** match their pre-pass hashes, and Cerakote records retain exact data equality.

Fresh verification: **115 unit cases and 48 focused Chromium workflow/accessibility cases passed**, with zero skipped, flaky or unexpected results. The run includes **33 successful Axe scans**, including twelve media-page/filter scans; this is not a compliance certification. Gallery category/finish queries, keyboard lightbox/focus, new-tab references, existing configurator image-free behavior, source provenance and preservation checks pass. Lint has zero warnings; strict TypeScript and the production build pass. Asset verification checked **1,854 original hashes, 287 content references and 915 retained catalog references**; three historical source 404s remain. Twelve final captures at **390/1440px** were inspected without broken images or horizontal overflow. The full historical visual matrix was not run.

See `source-audit/PASS_06C_MEDIA_COVERAGE.md`, `PASS_06C_VISUAL_REVIEW.md` and `pass-06c-verification.json`; command logs, source decisions and review screens are under `source-audit/pass-06c/`. The isolated QA server is stopped after verification, with the user's development server left running. No commit, push, deployment, real payment, business order or email occurred. Production dependencies remain unchanged.

# Homepage hero — approved image and responsive composition

October 20, 2026. The existing homepage hero now uses `/assets/dmw/optimized/66ddfa9991d0be.webp` through its priority Next Image, with descriptive outdoor/Wood Chip alt text. The original image is unchanged; no derivative or hardcoded optimizer URL was introduced. A scoped `home-hero.module.css` preserves the desktop left headline and hero height, positions the subject toward the right, and uses breakpoint-specific framing. Mobile keeps the photograph in the same continuous hero, with its complete subject between the unchanged three-line headline and supporting copy. Copy spacing follows the square photograph; CTA/service-strip gaps tighten slightly. The tablet headline receives a local fluid size adjustment. Edge fades keep the embedded finish label away from copy and the service strip, while a restrained scrim supports text readability.

All **81 other pre-existing source files** match their initial hashes. Shared typography/styles, header/navigation, service media/Gallery, configurators, commerce and shared social-preview metadata remain unchanged. Two existing preservation checks were updated to verify the hero copy and all other homepage sections independently of the approved image/composition change; both pass. Lint, strict TypeScript and the production build pass. Production captures were inspected at **375, 390, 430, 768, 1024 and 1440px**, with no broken hero image, uncaught error, CTA collision or horizontal overflow. Sticky header, menu/Escape/focus and desktop navigation checks pass. Both mobile CTAs fit the 844px capture height; two Axe scans at 390/1440px have no violations. No full historical visual matrix or accessibility certification is claimed.

See `source-audit/home-hero/REVIEW.md`, screenshots, verification JSON and fresh command logs. The isolated QA server was stopped, leaving the user's development server running. No commit, push or deployment occurred.
