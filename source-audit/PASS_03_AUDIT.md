# Pass 04 audit — complete service catalog and configurator

This replaces the narrower Pass 03 audit as requested by the superseding brief. The prior record is retained as `PASS_03_REFINEMENT_AUDIT.md`.

Audit date: October 19, 2026. Public GET/read-only requests only. No authentication, cart mutation, account/admin access, payment, order submission or email. The fresh audit retains 79 public pages with no failed responses and all 63 Store API products. Raw pages, hashes, timestamps and fields are under `source-audit/pass-04/`. The crawl follows current product and model-family links; it does not rely on the older snapshot.

## Inventory and coverage

The live inventory contains 32 configurable service products: 16 platform stippling packages, magazine-extension stippling, 11 milling/optic packages, three Cerakote scopes and one available porting package. They expose 180 package-specific fields. There are 23 legacy add-on/reference SKUs and eight physical/complimentary catalog items. Eight additional porting offerings appear only as Coming Soon on the landing page and are not purchasable. The public Store API represents the active services as simple products; customization is implemented through embedded product-builder JSON rather than WooCommerce variation records.

The exact canonical extraction is `pass-03-service-matrix.json`, with the runtime copy at `src/data/service-matrix.json`. `SERVICE_COVERAGE.md` and `pass-04/coverage.json` compare every active service back to its public URL, fields/choices, prices, imagery and eligibility. Coverage is evaluated against all 32 current configurable services, not just previously implemented families. The matrix separately accounts for all legacy add-ons and merchandise.

## Source pages

- [Stippling](https://defiantmachineworks.com/stippling/) and each linked package: Base/Core/Crown Glock tiers; M&P; P365 MOD 1/MOD 2; P-10 C; Staccato; Bodyguard; Beretta PX4; RXM; Prodigy; Echelon; Dagger; Reflex; OA Defense 2311, plus magazine-extension stippling.
- [Stippling reference](https://defiantmachineworks.com/stippling-info/): real texture images, aggression and usage context; undercut/index/border reference material.
- [Milling](https://defiantmachineworks.com/slide-milling-select-your-model/) and current Glock/SIG/CZ/S&W pages, all product forms and their model/optic/BUIS/coating conditions.
- [Cerakote](https://defiantmachineworks.com/cerakote/): complete pistol, frame and slide; each product's coating/finish form.
- [Cerakote references](https://defiantmachineworks.com/cerakote-camos/): real finish photography. Unphotographed choices are labelled without a fabricated image or color swatch.
- [Porting](https://defiantmachineworks.com/porting/): available Bodyguard 2.0 Viper Ports, eight explicitly unavailable upcoming packages.
- [Shipping / lead time / FAQ](https://defiantmachineworks.com/faq/): purchase-first service flow, instructions by email after ordering, customer-paid inbound shipping, separate return shipping and lead time beginning on receipt. No new shipping-law advice or guarantee is introduced.
- The public [Store API](https://defiantmachineworks.com/wp-json/wc/store/v1/products?per_page=100) supplies source IDs, active/stock state, current/regular/sale base prices, categories and source image URLs. Product pages supply the required customization fields and option deltas the API omits.

## Important findings and overlap rules

Milling packages require a coating choice inside the package, with single color adding no surcharge and published battleworn/camo deltas. Standalone slide Cerakote is the same finishing scope and must not be billed again. The source amounts differ by package: for example, full-size Glock milling uses +$60 battleworn/+100 camo, while standalone slide coating uses +$25/+60. The configurator must charge the owning package's published delta, not combine both menus.

Core/Crown Glock packages have their own optional frame-Cerakote menu (+$50 single, +$85 battleworn, +$115 camo). When selected, standalone frame coating duplicates that scope. Base Glock has no embedded coating menu, so separate frame coating remains distinct. Package-specific undercut and index selections differ in price by tier; they must replace equivalent legacy add-on charges rather than accumulate. Core/Crown selections with no explicit surcharge are included options, not evidence that a separate legacy SKU price should be added.

Viper Ports explicitly offers “Cerakote selected with optic cut.” This supports shared finishing when Bodyguard optic work is selected; the porting coating surcharge is not charged twice. The Viper service is limited to Standard Bodyguard 2.0 and requires slide plus barrel. Complete-pistol coating overlaps both standalone frame and slide coating. If another package owns one coating scope, the remaining scope must be represented by its verified standalone service rather than subtracting an invented fraction of the complete-pistol amount. All normalization must be deterministic in both selection directions and visible to the customer.

The porting landing page still displays $225–$305, while the current Viper product form explicitly lists a +$100 camo treatment on the $225 base ($325). The canonical matrix uses the selectable product form amount; the landing-page range discrepancy is retained for owner correction. No alternative price is inferred.

## Genuine uncertainties and boundaries

- P-07 title/model conflicts with a description specifying the CZ 75 Series. It is represented but requires review. CZ 75 and Bodyguard pages specify a fixed RMSC footprint and rear-sight removal; these are included details, not missing implementation controls.
- The M&P optic form repeats RMR under two IDs. The first defined RMR is retained; the ambiguous second option is explicitly flagged for confirmation.
- Beretta's source uses checkbox fields for yes/no index points and texture without a maximum. The normalized UI keeps one coherent answer per dimension, records the source type and does not permit simultaneously contradictory answers.
- Several legacy add-ons require an older frame-size/pattern/border ordering system that the current package forms do not define. Equivalent package options are bound explicitly. Unmapped legacy work remains a clearly explained review request rather than an invented extra charge.
- Some source finish spellings differ from photographed labels. Only explicit established aliases and matching named references are used; no generated textures, firearms or fake finish swatches are permitted. Every visual retains a local optimized path and original source URL.
- Gen-specific scallop treatments require the source-supported generation group; an unknown generation is not guessed. Existing optic cuts are handled by normalized IDs, including the specifically listed slimline MOS rear-stud exception.
- Shipping/tax, real payment eligibility, communications, fulfillment and production storage are not established by this public crawl. Local SQLite remains test-only. No production readiness claim follows from catalog completeness.

## Owner confirmation

Resolve the P-07 conflict, duplicated M&P optic option, unbound legacy add-on prerequisites, any unphotographed finish references and incomplete model/generation specifics. Approve the final price/compatibility matrix, shipping/tax process, provider integration with webhooks/reconciliation, order email delivery, fulfillment, shared durable repository, key custody, backup/restore, retention/deletion and legal policies before production ordering.
