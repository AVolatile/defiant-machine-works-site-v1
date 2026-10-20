# Pass 06 — Cosmetic coating visual review

October 20, 2026. Six final screens inspected using local Playwright Chromium. This review covers the standalone cosmetic coating branch only; it does not mark the complete Pass 06 brief finished. The large visual matrix was not repeated.

| State | Mobile, 390px | Desktop, 1440px |
| --- | --- | --- |
| Scope | [Scope](pass-06/screens/coating-scope-390.png) | [Scope](pass-06/screens/coating-scope-1440.png) |
| Treatment and finish | [Finish](pass-06/screens/coating-finish-390.png) | [Finish](pass-06/screens/coating-finish-1440.png) |
| Review | [Review](pass-06/screens/coating-review-390.png) | [Review](pass-06/screens/coating-review-1440.png) |

The scope cards reuse the established text-card and picker styles. Finish cards retain visible native selection, clear captions and two mobile columns; desktop retains the sticky summary beside controls. Empty scope state makes no platform claim. There are no service-option images, unrelated platform controls or extra service-selection step. The Gallery reference remains one filtered new-tab link per displayed coating section.

Six new Axe state scans pass; automated checks do not certify accessibility compliance. Final captures restore heading focus and scroll position after Axe so the skip-link focus test and sticky header do not distort full-page review. Initial visual review caught and corrected an unstyled native fieldset border.

See [verification](pass-06-verification.json), [scope/source evidence](PASS_06_SCOPE.md) and the final Pass 06 section of [the implementation report](../IMPLEMENTATION_REPORT.md).
