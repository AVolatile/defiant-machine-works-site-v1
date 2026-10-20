# Pass 03 audit — checkout workflow and targeted UX

Scope: local implementation only. No deployment, live cart mutation, payment attempt, order submission or external communication.

## Human-review issues confirmed in the code

- Default `/checkout` returned an editorial quote CTA before rendering any customer/address/review controls. Payment availability incorrectly determined the customer journey.
- All builds were blanket-labelled Requires Review. The retained Store API had base amounts but omitted the custom product-builder configuration embedded in public page scripts.
- Only the full-size Glock Store API attributes exposed optic choices. Genesis, Saber and other optic services lacked those controls.
- Mobile navigation sublinks wrapped horizontally and the drawer unmounted immediately on close.
- Mobile hero CSS moved the photograph into document flow below the heading, contrary to the reviewed direction.
- Select controls used the native browser arrow with inconsistent inset. Cart links and buttons had different alignment defaults.
- Page display headings combined a 108px maximum with generous intro padding; checkout needed a compact transactional introduction.

## Public sources checked

- [Full-size Glock optic cut](https://defiantmachineworks.com/product/glock-optic-cut-full-size/): service purchase, advertised base amount, existing-cut restriction, optic choices and conditional sight-position fields.
- [Genesis OEM Slide Mill](https://defiantmachineworks.com/product/genesis-oem-slide-mill/): customer-supplied slide, post-purchase emailed shipping instructions, optional optic-cut surcharge and model-dependent fields.
- [Saber OEM Slide Mill](https://defiantmachineworks.com/product/saber-slide-mill/): same service-order handoff and conditional optic configuration.
- [Slimline Glock optic cut](https://defiantmachineworks.com/product/glock-optic-cut-slimline/): narrower footprint list and the documented MOS rear-stud exception. Generic existing-cut work remains review-only.
- [Lead time / Shipping / FAQ](https://defiantmachineworks.com/faq/): instructions by email after order; customer pays inbound shipping, checkout shipping charge covers return shipping; lead time starts on receipt; Defiant communicates delays. No shipping-law claims are reproduced as new advice.

The web reader could not access `/checkout/` or `/shipping/`. The public footer identifies `/faq/` as the original shipping source. The service product's Add to cart affordance, customer-supplied-slide description and FAQ establish the purchase-first sequence. No attempt was made to bypass an empty-cart checkout or place a live order.

A focused read-only fetch verifies eleven public milling product-builder scripts against the retained HTML. `pass-03-live-options.json` records fetch timestamps, HTML hashes, advertised price text, retained/live comparison and original fields. `src/data/milling-options.json` contains the normalized source fields, fixed option prices, IDs and visibility conditions. Scripts are parsed as JSON, never executed. Blank legacy option amounts represent no explicit surcharge in that builder; unsupported price types or rules remain unresolved rather than guessed.

## Implementation boundary

Configuration readiness, price completeness and payment availability are independent. Audited, complete single-service configurations can be order-ready. Unverified finishes, incomplete optic definitions, uncertain models, existing modifications and unaudited combinations retain specific review reasons. Live payment remains disabled even for order-ready builds. Default checkout must render the customer, billing/return-address and final review flow before explaining that payment is unavailable.

Local encrypted SQLite remains test-only. Production requires a shared durable order repository, approved payment integration with verified webhooks/reconciliation, shipping/tax calculation, configured communications, reviewed pricing/compatibility and owner/legal approval. No email is reported as sent without a successful configured provider result.

## Final audit outcome

All eleven fetched milling builders matched the retained source configuration. The live advertised base amounts also match the migrated milling catalog. Six audited single-service definitions can be order-ready with complete allowed options; the remaining definitions and ambiguous cases retain review reasons. The complete observed test and visual results, dependency audit and production boundaries are in `pass-03-verification.json`.
