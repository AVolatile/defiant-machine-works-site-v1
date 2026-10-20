# Defiant public source audit

Audit date: 2026-10-19. Origin: https://defiantmachineworks.com

Public GET requests only. Modest concurrency: two pages, three assets. No authentication or form submission attempted. Crawler now excludes account, password, checkout, cart, order, and administrative paths.

- Content pages retained: 99
- Successful content pages: 98
- Public Store API products: 63
- Asset records: 1857
- Successful asset records: 1854
- Unique downloaded content hashes: 1854
- Exact dominant logo rust: #a23f00
- Migrated gallery items: 32
- Migrated articles: 3
- Price differences reviewed: 1 (sale-price reconciliation; no unresolved live price conflicts)

## Corrections

The first discovery pass fetched the public /dmw-account/ and lost-password landing pages without authentication. No account data was accessed and no forms were submitted. These pages were removed from the migration inventory and the crawler exclusion now blocks account and password paths.

42 original filename collisions repaired and content hashes rechecked. The crawler now prefixes filenames with a content hash. Supplemental extraction recovers slideshow settings and image-only gallery anchor assets.

## Unavailable source assets

- 404 https://defiantmachineworks.com/wp-content/uploads/2024/02/DEFIANT-MACHINE-WORKS-BADGE-HORIZONTAL-03.png
- 404 https://defiantmachineworks.com/wp-content/uploads/2022/10/DEFIANT-MACHINE-WORKS-BADGE-01.png
- 404 https://defiantmachineworks.com/wp-content/plugins/iconic-woothumbs/assets/frontend/css/lens.png

## Interpretation

HTTP success is not proof of a meaningful page. About is under construction; legacy Products is not a useful catalog; the Terms seed returns HTTP 404. See discrepancies.json for decisions. Gallery finish labels were read from source photography. No stock images or generated firearm images are used.
