# Pass 02 implementation audit

- Shared ButtonLink and SectionHeading added a diagonal arrow unconditionally. Text, gallery, card, dropdown, utility and footer arrows duplicated that signal. Replace with opt-in signature CTAs; small consistent SVGs for disclosure/proof/cart.
- Hero fills the entire section; object-position cannot reliably shift an already width-constrained photo. Give the photograph a responsive right-hand frame and independent left-weighted tonal overlay. Preserve original artwork and typography.
- Proof cells use unrelated text glyphs with differing metrics. Replace both with 44px optical frames and consistent 24px SVG geometry.
- Existing /customize is an inquiry wizard, with no cart/order schema or persistence. Move that flow to /custom-inquiry and give /customize the order configuration responsibility.
- Public source data provides 31 service base prices and 24 add-on records; many detailed option prices are absent. These must remain estimates requiring review, not silently guaranteed totals. Source restrictions and conflicts must block unsupported selections.
- Physical items include five ordinary sticker merchandise entries, plus firearm components and a Free Bible entry. Only ordinary merchandise is eligible for the physical-product cart in this pass. Other entries remain inquiries.
- No approved payment provider, shipping rates, tax engine, or durable hosted order database exists. Implement a disabled-by-default production boundary and explicitly enabled test adapter, with private local SQLite order snapshots behind a repository interface.
- Checkout personal information must stay in memory and server storage, never in the cart's localStorage payload. Confirmation requires a private session cookie, not knowledge of an order number.

## Confirmed source limitations

- Service records carry base amounts; missing option/finish charges are not invented. Current service builds remain Requires Review / Base Estimate.
- The CZ P-07 entry's canonical description discusses the CZ 75 Series. Its detailed fitment cannot be treated as confirmed.
- Source Saber/Genesis notes list Glock 17/19X/19/45/47/34 and 43/43X/48; Crown excludes 42/43/43X/48. These inform high-level model suggestions, without inventing generation compatibility.
- The Viper Ports source explicitly excludes the Performance Center Carry Comp variant. That option is not exposed for unrelated S&W models, and incompatible porting choices are removed from the configurator.
- No upcoming porting service is eligible for selection or cart submission. Forged/unreleased service identifiers are rejected by server validation.
