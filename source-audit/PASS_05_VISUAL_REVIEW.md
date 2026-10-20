# Pass 05 — visual review

Review date: October 20, 2026. All 20 requested desktop/mobile captures passed image and overflow checks. The existing eight-width regression run adds 139 fresh captures, and the standard visual suite adds 69 checks including 320px. Screens were inspected in desktop/mobile contact sheets and individual crops.

| Screen | 390px | 1440px |
|---|---|---|
| build-review | [View](../tests/visual/pass-05/build-review-390.png) | [View](../tests/visual/pass-05/build-review-1440.png) |
| stippling-details | [View](../tests/visual/pass-05/stippling-details-390.png) | [View](../tests/visual/pass-05/stippling-details-1440.png) |
| configurator-services | [View](../tests/visual/pass-05/configurator-services-390.png) | [View](../tests/visual/pass-05/configurator-services-1440.png) |
| gallery-stippling | [View](../tests/visual/pass-05/gallery-stippling-390.png) | [View](../tests/visual/pass-05/gallery-stippling-1440.png) |
| milling-details | [View](../tests/visual/pass-05/milling-details-390.png) | [View](../tests/visual/pass-05/milling-details-1440.png) |
| gallery-milling | [View](../tests/visual/pass-05/gallery-milling-390.png) | [View](../tests/visual/pass-05/gallery-milling-1440.png) |
| cerakote-details | [View](../tests/visual/pass-05/cerakote-details-390.png) | [View](../tests/visual/pass-05/cerakote-details-1440.png) |
| gallery-cerakote | [View](../tests/visual/pass-05/gallery-cerakote-390.png) | [View](../tests/visual/pass-05/gallery-cerakote-1440.png) |
| porting-details | [View](../tests/visual/pass-05/porting-details-390.png) | [View](../tests/visual/pass-05/porting-details-1440.png) |
| gallery-porting | [View](../tests/visual/pass-05/gallery-porting-390.png) | [View](../tests/visual/pass-05/gallery-porting-1440.png) |

The Gallery is intentionally sparse for three services: one real example per category. All four category links use existing service labels. [Assets and retained uses](PASS_05_ASSETS.md), [preserved coverage verification](pass-05/service-coverage-verification.json), and [full verification](pass-05-verification.json). Historical Pass 04 reports and captures remain intact; fresh regression captures are under `tests/visual/pass-05/regression/`.
