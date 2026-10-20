# Pass 06 — Cosmetic Cerakote scope

October 20, 2026. This is a **limited implementation of the cosmetic Cerakote portion**, not completion of the full service-driven firearm-modification brief. Performance-modification configuration, combined-work expansion and purchase-flow development were excluded. Existing workflows remain in place.

The retained audit is sufficient for this change: `pass-04/pages.json` records `/cerakote/` offering Complete Pistol, Pistol Frame and Pistol Slide as independent services. Its three linked product builders and the unchanged canonical matrix define coating type, primary/secondary color and conditional listed finishes. These forms contain no manufacturer, model, existing-cut or sight-position fields. No additional live crawl, account, cart mutation or external submission was performed.

The defect has two layers: the shared browser journey requires a platform before exposing coating choices, and schema/pricing validation requires platform identity even for these scope-only forms. A separate cosmetic branch now selects scope directly, then renders the existing source-driven treatment/finish controls. It does not add coating into an unrelated selected package as a shortcut.

`coating-context.ts` limits scope-only identity to exactly one of the three audited standalone coating IDs, with empty manufacturer/model/variant strings, unspecified generation and no legacy add-ons. Schema validation still requires identity otherwise. The server additionally checks current active status, generic coating compatibility, component scope and every active source field/value. Unknown and hidden fields remain errors. Price calculation still uses the source base plus source option deltas.

Storage remains version 3 with the same fields and catalog revision. No migration runs. Existing platform-specific coating records keep their original identity and selections when edited; new scope-only records explicitly contain no platform claim. New coating scopes replace the previous scope and reset its choices, with that behavior explained beside the scope controls.

The main configurator offers a cosmetic-coating entry link; existing Cerakote service/product links enter this branch directly. A single-coating cart edit restores it. Other workflows are not converted to service-first entry, and the requested Add Compatible Work expansion is not implemented in this limited scope.

Historical Pass 05 artifacts are preserved. Its preservation regression now documents four necessary exceptions: schema, pricing context, catalog summary title and build-summary presentation. The other 25 baseline files remain protected. Canonical matrix/prices/IDs, overlap rules, checkout, endpoints, cart storage/migration, payment, repository, Gallery dataset, hero and navigation are unchanged.

No new coating-source uncertainty was found. Existing source-data and production dependencies remain in the implementation report. Live payment stays disabled by default; local test records are not business orders or email delivery.
