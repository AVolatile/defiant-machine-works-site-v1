# Homepage hero — approved Wood Chip photograph

October 20, 2026. The homepage now renders /assets/dmw/optimized/66ddfa9991d0be.webp through its existing priority Next Image. No optimizer URL is hardcoded, no derivative was created, and the original file hash is unchanged. The shared site metadata image remains unchanged.

Desktop keeps the left headline and existing height. Its image plane starts at 32% of the content frame, with a 50% / 40% focal position and a feathered left edge. At 951–1280px the frame rises 40px; at 651–950px it uses square framing raised 70px and 48% / 55% positioning. A bottom fade keeps the embedded finish label away from the service strip.

At mobile widths the full-width square photograph begins 140px into the continuous hero. The 50% / 50% framing keeps the complete subject visible between the headline and supporting copy. Copy spacing scales with the photograph; the CTA and service-strip gaps tighten to 24px. The mobile headline's size, three-line wrapping and copy are unchanged. Only the tablet headline uses a smaller fluid 54–72px range to retain its three-line composition. The existing palette, font families, CTA labels/links and header remain.

A scoped CSS module contains every composition override. All 81 other pre-existing source files match their initial hashes, including shared styles, typography, navigation, service media, Gallery, configurators and commerce. Existing preservation checks now validate the unchanged source before the hero, hero text/CTAs, and all following homepage sections separately from the approved image/style change.

## Reviewed production captures

| Width | With header | Hero only |
| --- | --- | --- |
| 375px | [Viewport](screens/hero-375.jpg) | [Hero composition](screens/composition-375.jpg) |
| 390px | [Viewport](screens/hero-390.jpg) | [Hero composition](screens/composition-390.jpg) |
| 430px | [Viewport](screens/hero-430.jpg) | [Hero composition](screens/composition-430.jpg) |
| 768px | [Viewport](screens/hero-768.jpg) | [Hero composition](screens/composition-768.jpg) |
| 1024px | [Viewport](screens/hero-1024.jpg) | [Hero composition](screens/composition-1024.jpg) |
| 1440px | [Viewport](screens/hero-1440.jpg) | [Hero composition](screens/composition-1440.jpg) |

All six widths render the approved asset without horizontal overflow, CTA collisions, broken hero images or uncaught page errors. The subject, crop and text readability were visually inspected. Sticky header and existing menu/Escape/focus behavior pass; desktop navigation remains visible at 1440px. Both mobile CTAs remain within the 844px capture height. Two Axe scans at 390/1440px report no violations; automated checks are not an accessibility certification.

Lint, strict TypeScript and production build pass. Both focused preservation checks pass. The full historical visual matrix was not run. See [machine-readable geometry/verification](verification.json) and the accompanying command logs. Local Playwright Chromium performed the checks because the in-app browser runtime was unavailable.

No commit, push or deployment occurred. The QA production server was stopped; the user's development server remains running.
