# Cytrea — Showcase, Walkthrough, social and motion review

Local website pass, September 14, 2026. No push or deployment.

Repository: `C:\Users\samue\Documents\GitHub\cytrea-landingpage`

Branch: `cytrea-website-v2` (historical branch name; current greenfield site).

Starting HEAD: `f9d1b64edf43acb6ad7ba1585cca634379ab1ffc`; starting working tree clean.

## Result

`CYTREA_SHOWCASE_WALKTHROUGH_PREMIUM_READY`

Automated QA passed with **0 blocking errors**: 15 routes, 70 page/viewport checks at 390/430/768/1024/1440px, 235 existing interaction checks, 155 focus checks, 60 local links/fragments, 22 image URLs, 37 image-integrity/source checks, two preserved form contracts and 28 download-state checks. All 13 desktop walkthrough steps, mobile role sequences, keyboard behavior, no-JS/reduced-motion/no-observer fallbacks and social/banner guards passed. No horizontal overflow was detected. Existing inline support/legal prose links are the only automated warnings.

`CYTREA_SOCIAL_URLS_NEEDED` — the implementation is ready, but no Facebook/Instagram links are rendered until their verified URLs are supplied. The exact local commit SHA and final working-tree status are provided in the handoff.

1. **Social icon system:** `site-config.js` owns `SOCIAL_LINKS`, with Facebook, Instagram, LinkedIn, YouTube and TikTok support. Empty or invalid profiles are omitted. HTTPS, platform hostname, profile path and credentials checks are defensive validation, not proof of account ownership.
2. **Social URLs:** no Cytrea social profiles were found in the local repository. `CYTREA_SOCIAL_URLS_NEEDED`: supply `SOCIAL_LINKS.facebook` and `SOCIAL_LINKS.instagram`. The future `linkedin`, `youtube` and `tiktok` fields are also empty. No profile URLs were invented.
3. **Footer social design:** compact Brand-area row, no fifth column. Facebook blue and Instagram gradient wells use recognizable local SVG glyphs; 46px desktop and 48px mobile targets, external-link labels, new-tab protection and focus outlines. The dark footer and exact “Web design by Sam” attribution remain. With no verified profiles, the row and heading are hidden. Unlinked design samples are in the QA gallery, not presented as live profiles. SVG provenance and license are in `images/social-icons/README.md` and `LICENSE.md`.
4. **Animation system:** one IntersectionObserver; opacity and transforms only, without a runtime library, scroll handler or continuous animation. Existing UI hover behavior remains.
5. **Scroll reveals:** 600ms entrances, 20–22px directional travel, optional 0.985 scale and 0/70/140ms stagger. Feature cards, vendor marks, new product compositions and the Home invitation reveal once. Focused content is immediately visible. The approved Home hero is not given a new entrance.
6. **Reduced motion:** translation, scaling, step transitions and social hover movement are disabled. JavaScript-disabled and IntersectionObserver-unavailable fallbacks keep content visible. With JavaScript disabled, both complete walkthrough journeys are shown.
7. **Showcase:** `/showcase` is a seven-chapter editorial gallery: Provider workspace, caregiver experience, finding jobs, applicant review, credentials, applications and messaging. Large genuine screens, alternating white/light-teal/warm sections and chapter anchors distinguish it from the existing interactive Product page.
8. **Walkthrough:** `/walkthrough` provides seven caregiver and six provider steps. Desktop has a sticky, keyboard-operable step rail and one active screen. Mobile/tablet show a simple vertical sequence for the chosen role. Arrow keys, Home/End, next-step state, role switches and resize focus are tested. A narrowly scoped selector fix in `cytrea.js` prevents outer role tabs from binding nested step tabs.
9. **Banner system:** reusable one-CTA product banners with a subtle C motif and warm/teal gradient. `SITE_BANNER.enabled` remains `false`. A second guard prevents the future App Store + Google Play announcement unless both download states are public. Android remains Early Access.
10. **Mockup system:** thin 3px navy frames, real aspect ratios, subtle shadows and teal depth. Primary/companion screens are about 100%/68–70% with at most 1.5° companion rotation. Mobile hides companions and keeps a large primary screen. Full-resolution originals open in the existing accessible lightbox. No stock phones, fabricated hardware, altered UI or invented statistics.
11. **Home integration:** one compact “See how Cytrea works.” invitation beside the existing product proof, with Showcase/Walkthrough links. It reuses the immediately preceding product visual instead of adding another large duplicate section. Hero markup and the entire existing `cytrea.css` are preserved.
12. **Product integration:** quiet “View full Showcase” and “Take the guided Walkthrough” text links. Main navigation remains Product, Providers, Caregivers, Vendor Partners, Resources and About. Footer Explore includes both new routes.
13. **Typography:** Plus Jakarta Sans remains the single active family, including new pages, tabs, banners and social labels. Existing local font and preload are unchanged.
14. **Card system:** preserve the approved layered card treatment; extend it to the step rail and active step surface. Showcase uses editorial sections instead of a wall of cards.
15. **Warmth:** restrained warm-neutral surfaces, organic teal glow, a quiet C motif and tiny orange details. Human-oriented copy remains concise and tied to the real product.
16. **Mobile:** one device per Showcase chapter; one role at a time in the enhanced Walkthrough; clean footer stacking. Screens remain useful and enlargeable. These dedicated visual/process pages are deliberately long on mobile because their complete screenshots are retained; chapter shortcuts and role selection help navigation.
17. **Accessibility:** semantic headings, named controls, 44px-or-larger action targets, keyboard step navigation, lightbox Escape/focus return, preserved menu behavior, reduced-motion and no-JS fallbacks. Flat-background text contrast is checked automatically; this is not a full WCAG certification or a physical-device/screen-reader audit.
18. **SEO:** exact requested titles/descriptions, canonical URLs, Open Graph metadata, Twitter summary cards and one H1 per new page. New URLs are included in the sitemap.
19. **Routes:** 15 existing/new local routes checked. `/showcase` and `/walkthrough` follow the existing extensionless HTML serving convention. Both are also included in `verify-site.cjs` and the new regression verifier. No hosting configuration changed.
20. **Performance:** no new runtime dependencies. Added shared CSS/config/JS total 23,904 bytes uncompressed; separately gzip-compressed files total about 7,080 bytes (an estimate, not a production transfer measurement). Three new 780×1691 WebP derivatives total 163,138 bytes; these are resized/compressed copies of existing PNGs, not retouched or cropped screens. Most screenshots are lazy-loaded; source PNGs and existing images remain unchanged. Social glyphs are not requested while the row is hidden.
21. **Visual evidence:** `.verification/showcase-walkthrough-premium/`; 390px, 768px and 1440px renders of nine requested pages, with full-page, above-the-fold and focused views. Motion-progress/settled screenshots and clearly labelled unlinked social/future-banner fixtures supplement the site renders. Full-page captures scroll through real content first; no screenshot-only CSS or modified site content is injected.
22. **Local previews:** see links below. The existing loopback-only preview remains on port 4173.
23. **Files changed:** new `site-config.js`, `experiences.css`, `experiences.js`, `experience-content.cjs`, `build-experiences.cjs`, `sync-site.cjs`, `showcase.html`, `walkthrough.html`, two QA scripts, this report, local social assets and three optimized screenshot derivatives. Existing HTML files gain the shared assets/mounts and footer links; Home/Product gain the compact entry points. `sitemap.xml`, `verify-site.cjs` and the single nested-tab selector in `cytrea.js` are updated. Download config, original screenshots, existing CSS and form/backend files are unchanged.
24. **Commit:** only after the final QA passes, with message `design: add Cytrea showcase walkthrough and premium motion`. The resulting exact SHA is recorded in the final handoff; this report belongs to that commit.
25. **Git status:** final status is checked after that local commit. Screenshot evidence remains intentionally ignored under `.verification/`.
26. **Scope:** website-local work only. No push, deployment, DNS/domain, Supabase/backend, Stripe, App Store, Google Play, `cytrea-app`, SNS, Magnolia or other repository changes. No live form submissions or social account changes.

## Screenshot integrity and workflow honesty

`experience-content.cjs` is the screen/copy map. Every app image links back to an existing `images/current-app/` PNG. New optimized derivatives are only caregiver account creation, caregiver application confirmation and provider onboarding.

There is no provider-side chat screenshot in the available assets. The provider messaging step explicitly labels the genuine conversation image as the **caregiver-side view**. The provider profile-information step shows the actual caregiver cards and describes their View Profile action; it does not invent a profile-detail screen. Hiring and credential-verification responsibilities remain with providers.

## QA and limitations

Reproduce the automated checks with an existing Playwright installation on `NODE_PATH`:

```text
node verify-showcase-premium.cjs
node build-experiences.cjs --check
node sync-site.cjs --check
node sync-downloads.cjs --check
node sync-forms.cjs --check
git diff --check
```

The regression run checks routes, links/fragments, images, typography, layout, controls, forms, download states, preserved source hashes and interactive behavior. Off-origin traffic and non-GET/HEAD browser requests are blocked. The payment-return route is HTTP-checked without executing its app deep link.

Final visual evidence includes **111 site renders plus three motion/design samples**. The desktop Walkthrough full-page capture uses a real taller viewport and waits for the step animation to settle: Chromium's temporary full-page screenshot resize was observed restarting an already-finished CSS animation. No site styles or animation were disabled for the capture.

Unchanged inline prose links on Support, Privacy, Terms, Delete Account and Pricing use the inline-text touch-target exception and are reported as warnings. Gradient/translucent surfaces need visual review rather than the flat-color contrast calculation. Social destinations cannot be click-verified until the actual URLs are supplied. No production availability, real form receipt, physical iOS/Android browser behavior or full assistive-technology compliance is claimed.

## Adding verified social profiles later

Populate these exact fields in `site-config.js` only after confirming ownership:

```js
SOCIAL_LINKS.facebook
SOCIAL_LINKS.instagram
```

Then run `node sync-site.cjs` and `node build-experiences.cjs` to update both static/no-JS fallbacks and generated pages. Run the checks again; the current missing-profile assertion in the QA script must be updated to match the newly approved configuration. Do not enable `SITE_BANNER` just to show social links; banner and download availability are separate.

## Local review links

- [Home](http://127.0.0.1:4173/)
- [Showcase](http://127.0.0.1:4173/showcase)
- [Walkthrough](http://127.0.0.1:4173/walkthrough)
- [Product](http://127.0.0.1:4173/product)
- [Providers](http://127.0.0.1:4173/providers)
- [Caregivers](http://127.0.0.1:4173/caregivers)
- [Vendor Partners](http://127.0.0.1:4173/vendor-partners)
- [Resources](http://127.0.0.1:4173/resources)
- [About](http://127.0.0.1:4173/about)
- [QA gallery](http://127.0.0.1:4173/.verification/showcase-walkthrough-premium/)

Manual spot-check: open Walkthrough, select each role, use the desktop step rail with arrow keys and Home/End, enlarge a screen, then press Escape. At 390px verify the vertical sequence and mobile menu. Scroll Showcase, follow a chapter link, and repeat with reduced motion enabled. Confirm Android still reads “Android Early Access.”
