# Cytrea — final warm premium review

Local website art-direction pass, 14 September 2026. No architecture rewrite or deployment.

**CYTREA_WARM_PREMIUM_UI_READY** — implementation and final technical QA passed. Subjective score targets are reported honestly in section 21.

## Verified baseline

- Repository: `C:\Users\samue\Documents\GitHub\cytrea-landingpage`
- Branch: `cytrea-website-v2` (historical branch name; the website uses the greenfield implementation).
- Starting HEAD: `751601e6227ecd5c815d42bec630df5409420fea`; working tree was clean.
- Active assets: `cytrea.css`, `download-config.js`, `cytrea.js`; form pages retain their existing form configuration and handlers. No active V2 dependencies.
- Starting font: self-hosted Inter. Approved Home hero markup and copy were preserved exactly.
- Availability remains public iPhone and closed Android Early Access. No app-store configuration was changed.

## 1. Font decision

Compared Inter, Manrope, and Plus Jakarta Sans in the same isolated specimen. Chose **Plus Jakarta Sans**: rounded geometry adds warmth without losing the clear product hierarchy. Manrope appeared lighter at the tested settings; Inter was the least distinctive. The [three-font comparison](http://127.0.0.1:4173/.verification/final-warm-premium/font-comparison.html) is explicitly a specimen, not a final-site screenshot. The selected font is served locally under its included SIL Open Font License.

## 2. Typography upgrade

One family across navigation, headings, body, buttons, forms, captions, and footer. H1 uses 750, H2/H3 700, navigation 600–650, buttons 650, and body 400. Tracking, body leading, and compact labels were refined. Existing responsive heading sizes and approved hero structure remain.

## 3. Warmth strategy

Added one warm-neutral token, `--surface-warm: #fbf8f2`. It appears in selected feature cards, human-connection content, and the partner introduction. White, cool teal, and navy remain dominant. Orange is limited to small icon details, number accents, and short underlines. No lifestyle-photo sections, decorative animation, healthcare-green identity, or blanket beige treatment.

## 4. Card-system changes

Five distinct treatments: cool substantial product-proof frames; softly tinted informational feature cards; curated vendor rows; compact download action cards; and an elevated application form. Low-contrast edges, inner highlights, gentle shadows, and predominantly 18–24px corners replace outline-dominant treatment. Noninteractive feature cards no longer lift on hover.

## 5. Home card changes

The role-switching panel has a warmer layered surface; product proof retains a cooler frame. The human-connection section uses the warm neutral with corrected dark text/link colors. No new section or hero rewrite. Home became shorter at every captured width.

## 6. Provider / Caregiver changes

Refined feature-card hierarchy, icon wells, numbering, surface depth, and compact spacing. Two narrow copy edits make caregiver review and follow-up more human. Existing workflows, genuine product screens, and provider-responsibility language remain. Both pages became shorter at every captured width.

## 7. Vendor hero

Preserved “Support for the work around the care.” Updated only the supporting invitation and visual treatment. The existing AFH ecosystem graphic now has restrained depth, teal center, warmer nodes, and small orange accents. Tablet labels were checked and corrected to fit their nodes.

## 8. Vendor benefit cards

Preserved the professional-profile, direct-contact, and reviewed-introduction content. Applied the refined feature-card system without adding benefits or unsupported claims.

## 9. Vendor directory

Warmer section rhythm, softer listing surfaces, framed logos, calmer category pills, and clearer contact controls. Search width was increased so its full placeholder is readable. Existing businesses, contact details, links, and filtering hooks were preserved; missing contact information was not invented.

## 10. Vendor application introduction

Added the requested partner invitation, three concise numbered benefits, review process, and support link in a warm introduction panel. It sits beside the form on desktop and above it on smaller screens. Tablet benefit titles now align. At 390px the introduction is approximately 764px tall: useful supplied content, but a real mobile-length tradeoff.

## 11. Vendor form

Refined headings, number badges, icon/divider treatment, input borders, focus rings, upload area, and full-width arrow submit. Removed duplicated support/review lines beneath submission while preserving consent. Inputs, field names, IDs, endpoint configuration, hidden values, form serialization, and handler scripts are unchanged. The file picker still shares the filename rather than uploading the file; its existing explanation remains truthful.

## 12. Download section

Two balanced, shorter device choices. Official Apple artwork and the public App Store URL remain. Removed the redundant closed-test paragraph. No implication that Android is publicly released.

## 13. Android Early Access control

Custom Cytrea dark-teal control with the existing Google Play mark; exact visible wording: **Android Early Access** / **Join the Google Play test**. Main and footer controls are 220×60px, with 14px/11.5px labels; the Apple artwork is 180×60px. The full control is linked to `https://play.google.com/apps/testing/com.cytrea.mobile`. The shared configuration still replaces it with the unmodified official Google Play badge in future public mode. That mode was tested without changing the current configuration. This custom control is not represented as an official Google badge or independently brand-approved artwork.

## 14. Footer

Retained open four-column navy/teal layout, Cytrea logo, exact positioning, and all Explore / Support / Policy links. Warm-white positioning, refined uppercase headings, and short orange underlines give a stronger close. No giant cards or nested download panel.

## 15. Centered bottom row

Copyright, exact “Web design by Sam” attribution, and “Washington roots. People first.” are centered below one full divider. Desktop uses subtle dot separators; mobile stacks cleanly. Attribution retains `https://www.afhdesignsbysam.com/`, `_blank`, `noopener noreferrer`, visible focus, and orange hover/focus underline.

## 16. Removed footer clutter

Moved trademark credits to the existing Terms page rather than deleting them. Apple permits credit lines once per website in its legal area, including via interactive links; see [Apple’s marketing guidelines, Legal Requirements](https://developer.apple.com/app-store/marketing/guidelines/). Google credits were retained alongside them; see [Google’s brand guidance](https://developer.android.com/distribute/marketing-tools/brand-guidelines). This is implementation against the published guidance, not legal or brand-approval certification.

## 17. Mobile and page length

No horizontal overflow in the captured 390, 768, and 1440px pages. Cards, tabs, menu, form, and footer retain readable single-column behavior where appropriate. Main page heights, measured at a 1000px viewport:

| Page | 390px before → after | 768px before → after | 1440px before → after |
|---|---:|---:|---:|
| Home | 7125 → 6954 | 6719 → 6553 | 6456 → 6345 |
| Providers | 5568 → 5342 | 4314 → 4130 | 4197 → 4072 |
| Caregivers | 6287 → 6088 | 5102 → 4887 | 4776 → 4649 |
| Vendor Partners | 7344 → 7679 | 6327 → 6421 | 5495 → 5327 |

Vendor grows on smaller screens because the requested introduction stacks above the preserved form. Footer height changed from 872→858px mobile, 669→615px tablet, and 539→487px desktop. Portrait product proof remains naturally tall; no source screenshots were altered to reduce height.

## 18. Accessibility and technical QA

Final frozen-source QA **passed with 0 errors**; see [the technical summary](http://127.0.0.1:4173/.verification/final-warm-premium/technical/summary.json). Verified 13 routes returning 200, 60 rendered page/width cases plus 60 warm-system checks, 235 interaction records, 155 focus checks, 42 local links, 17 image URLs, 27 unchanged source-image hashes, and 21 stable source/font hashes. Both form contracts and five behavior/config/backend files are unchanged. All 24 route/download-state cases pass, including actual decoded public-badge artwork. The approved Home hero hash is unchanged. Checks also cover unique IDs, one H1, landmarks, labels, chosen font, targets, reduced motion, menu, tabs, lightbox, and badge text fitting its control. All 112 gallery links return 200. Form submissions and external HTTP navigation were blocked by the harness; no off-origin or submission attempt occurred. The only 25 notices concern normal inline-prose target exceptions. `node --check cytrea.js`, the new verifier/config/sync syntax checks, `node sync-downloads.cjs --check`, and `git diff --check` passed.

Supplemental contrast calculations: footer secondary 8.55:1; warm positioning 9.51:1; Android secondary 8.61:1; warm body copy 5.72:1; vendor placeholder 4.80:1; input boundary 3.22:1. The placeholder was slightly darkened after a near-threshold finding. Inline prose links retain their normal inline-target exception; this is not a complete WCAG certification or physical-device/screen-reader audit.

## 19. Performance

One local Latin variable-font file: **27,348 bytes**, replacing the active 48,256-byte Inter font request. `font-display: swap` and one font preload are consistent across pages. No additional production JavaScript, framework, animation library, or video. `cytrea.js` remains byte-unchanged at 14,957 bytes; final CSS is 110,210 bytes. Legacy Inter assets remain unreferenced, not destructively removed.

## 20. Before / after evidence

Directory: `.verification/final-warm-premium/`. Includes baseline renders, 90 final full/above-fold/focused screenshots, the font study, and 18 side-by-side comparisons across 390/768/1440px. The six comparison subjects are feature cards, vendor application, footer, download controls, typography/hero, and directory. The [comparison gallery](http://127.0.0.1:4173/.verification/final-warm-premium/) links each original PNG. No site styles were injected or hidden to manufacture final screenshots.

## 21. Final expert scores

The site is materially warmer and more intentional. Scores are subjective; the conservative independent visual review is below. The requested 9.7–9.8 targets are **not claimed as met**.

| Category | Score / 10 | Requested target |
|---|---:|---:|
| Visual polish | 9.4 | 9.8 |
| Typography | 9.4 | 9.8 |
| Warmth / human feel | 9.3 | 9.6 |
| Card system | 9.3 | 9.7 |
| Vendor experience | 9.3 | 9.7 |
| Footer | 9.4 | 9.8 |
| Download experience | 9.4 | 9.7 |
| Brand fidelity | 9.5 | 9.8 |
| UX | 9.3 | 9.5 |
| Accessibility presentation | 9.3 | 9.3 |

The independent product/UX reviewer was more positive: vendor, warmth, and card presentation 9.6; UX 9.5. Engineering/accessibility review: frontend 9.5, accessibility 9.3, mobile 9.4. Review roles covered senior product, brand, typography, UX/conversion, frontend, accessibility, and mobile, with overlapping roles across three specialist agents plus the implementation lead. Remaining tradeoffs are mobile partner-introduction length, long portrait proof, and compact store-control secondary text (enlarged in the final refinement). No further broad rewrite was recommended.

## 22. Local preview links

[Home](http://127.0.0.1:4173/) · [Product](http://127.0.0.1:4173/product) · [Providers](http://127.0.0.1:4173/providers) · [Caregivers](http://127.0.0.1:4173/caregivers) · [Vendor Partners](http://127.0.0.1:4173/vendor-partners) · [Resources](http://127.0.0.1:4173/resources) · [About](http://127.0.0.1:4173/about) · [Comparison gallery](http://127.0.0.1:4173/.verification/final-warm-premium/).

## 23. Files changed

- Shared styling/config/tooling: `cytrea.css`, `download-config.js`, `sync-downloads.cjs`.
- Shared font/download/footer fallbacks: `index.html`, `product.html`, `providers.html`, `caregivers.html`, `vendor-partners.html`, `resources.html`, `about.html`, `support.html`, `privacy.html`, `terms.html`, `delete-account.html`, `pricing.html`, `payment-return/index.html`.
- Font/license/documentation: `fonts/plus-jakarta-sans-latin-variable.woff2`, `fonts/PlusJakartaSans-OFL.txt`, `fonts/README.md`.
- New verification/report: `verify-warm-premium.cjs`, `WARM_PREMIUM_REVIEW.md`.
- Generated visual evidence stays in the ignored `.verification/final-warm-premium/` directory.

## 24. Local commit

Commit message: `design: add warmth and premium depth to Cytrea website`. Exact resulting SHA is supplied in the final handoff; the report cannot embed the hash of the commit containing itself. Commit only after final QA passes.

## 25. Git status

Starting tree clean. Final post-commit status is verified in the handoff; ignored local screenshots and verification output remain available.

## 26. Scope confirmation and limitations

Local website only. No push, deploy, DNS/domain change, backend/Supabase/Stripe change, app-store action, cytrea-app change, or SNS/Magnolia change. Demo auto-reply work was not resumed or activated.

External destinations were inspected as URLs, not live-tested for availability. No real form submission, backend receipt, mail delivery, store enrollment, or public-release action was performed. Local payment-return route was checked for HTTP delivery without executing its app deep-link behavior. Automated checks and desktop Chromium emulation do not replace Safari/device testing or a complete accessibility audit.

### Manual spot-check

Open Home at phone width; open/close the menu with keyboard, switch Provider/Caregiver tabs, and enlarge/close a real product screen. On Vendor Partners, search a vendor, select Other category, and focus the form fields without submitting. Confirm the two store URLs and centered attribution. Review the gallery before deciding on any later deployment.
