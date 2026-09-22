# Cytrea — final local website freeze

Review date: September 21, 2026 (America/Los_Angeles).

Repository: `C:\Users\samue\Documents\GitHub\cytrea-landingpage`

Branch: `cytrea-website-v2` (historical branch name; the premium greenfield assets are active).

Final regression status: **PASS — zero blocking errors.** Visual capture validation also passed with zero errors. There are 25 informational warnings for inline prose links using the inline-text touch-target exception (five unchanged informational/legal routes at five widths). All required syntax, synchronizer, generator, and whitespace checks passed. This report is finalized before the authorized local commit; the exact resulting SHA is recorded in `.verification/final-website-freeze/COMMIT_RECEIPT.md` and the final handoff, avoiding a self-referential commit hash.

**CYTREA_WEBSITE_PUBLIC_LAUNCH_READY_LOCAL**

**CYTREA_SOCIAL_URLS_NEEDED**

## Scope and changes

The latest approved website was preserved, not reset or redesigned. This freeze makes three small customer-facing corrections:

- The central iPhone URL is the exact requested US App Store URL. All 15 static HTML fallbacks were synchronized from that config.
- At tablet widths, the Showcase companion phone no longer shows a duplicate caption partly obscured by the foreground phone. The primary caption, companion link, images, and composition remain intact. The Home hero is untouched.
- Wingwi's Website and Email buttons were removed from the local directory because the supplied domain returned NXDOMAIN. Its listing, logo, description, and existing Call button remain unchanged. No replacement contact details were guessed.

QA tooling now supports an explicit future-public Android expectation, repository-contained output paths, a resize-event wait, a tablet-caption regression check, and repeatable visual captures. No runtime framework or dependency was added.

## Requested 29-point report

1. **Starting HEAD:** `9490cb790eeedd5c53646001efb3c467f7333e4e`. The starting working tree was clean.
2. **Final HEAD:** the single freeze commit, recorded in the local commit receipt and final handoff. No older website state was restored.
3. **Typography:** the existing self-hosted Plus Jakarta Sans variable font remains the sole primary family across navigation, headings, body, forms, buttons, footer, Showcase, and Walkthrough. One 27,348-byte font preload with `font-display: swap`; responsive scales and paragraph widths preserved.
4. **Warmth:** white and restrained warm ivory surfaces, pale teal, navy text, gentle depth, and small orange accents remain consistent. No beige/residential makeover, stock imagery, or healthcare-green treatment was introduced.
5. **Card system:** distinct product, feature, directory, action, and form panels retain their established spacing, tint, borders, highlights, and shadows. The page layouts were not rebuilt into uniform card walls.
6. **Navigation:** six main links plus Download Cytrea; active/hover accents and the mobile drawer retained. Keyboard opening, Escape, initial focus, and focus return are covered by regression checks. Showcase/Walkthrough remain reachable without crowding the main navigation.
7. **Home:** approved hero markup is byte-identical to the starting commit. Primary provider screen, supporting caregiver view, CTA hierarchy, trust strip, role switcher, product storytelling, download panel, and footer preserved. No sections added. Hero SHA-256: `a5ce05e7452c971b3a4f42b3bcdf62933f2e799fafdd52a88ea72f8fd7e45964`.
8. **Product:** clear Provider/Caregiver selection, large active screenshots, concise explanations, nested step switching, and original-image enlargement retained. One primary product panel on mobile; no new thumbnails or fabricated screens.
9. **Providers:** operational Post → Review → Connect → Hire story, genuine existing provider screenshots, clear primary CTA, and provider-responsibility copy preserved. The page explicitly says Cytrea is not a staffing agency, employer, or background-check service.
10. **Caregivers:** “Completely free for caregivers.” remains prominent. Profile/preferences/credentials/jobs/apply/track/connect story and warm tone preserved; no fees or eligibility promises added.
11. **Vendor Partners:** ecosystem hero, categories, five directory entries, filtering, and partner introduction remain secondary to the hiring marketplace. The two unresolved Wingwi domain-based contact actions are no longer exposed; its original phone action remains. See verification note below.
12. **Vendor form:** desktop introduction/form split, grouped labelled fields, conditional Other category, focus styles, upload panel, and CTA preserved. Both form endpoints, names, methods, targets, required flags, serialized keys, and transport source files are unchanged. Existing logo selection shares a filename only; the UI explicitly explains follow-up rather than pretending the file is uploaded. No test submission was sent.
13. **Showcase:** seven visual chapters, real existing screen assets, single/paired/stacked compositions, lightbox, and minimal copy retained. Tablet duplicate-caption overlap corrected. No app-screen pixels were retouched or generated.
14. **Walkthrough:** seven caregiver and six provider steps. Desktop uses a keyboard-operable stepper; mobile/tablet uses a readable vertical sequence for the chosen role. No-JS exposes both complete journeys. The provider messaging step honestly labels the available image as a caregiver-side conversation; no provider chat screenshot was invented.
15. **Downloads:** official App Store badge links to `https://apps.apple.com/us/app/cytrea/id6767470963`. Android remains `early-access`, with the Google Play triangle and “Android Early Access” / “Join the Google Play test” at `https://play.google.com/apps/testing/com.cytrea.mobile`. No public Play badge or tester count is shown. Runtime and static/no-JS presentations derive from `download-config.js`.
16. **Footer:** dark navy/teal, four desktop groups, clean mobile stacking, balanced store controls, and centered bottom row retained. Exact “Web design by Sam” attribution uses `https://www.afhdesignsbysam.com/`, `_blank`, `noopener noreferrer`, and a visible focus/hover treatment. No primary-footer legal paragraph was added.
17. **Social system:** all five `SOCIAL_LINKS` values remain empty, so no social row is rendered. Facebook/Instagram URLs could not be verified locally: **CYTREA_SOCIAL_URLS_NEEDED**. Future LinkedIn/YouTube/TikTok remain supported but hidden. Existing 46px social targets, labelled links, hover styles, and reduced-motion behavior are exercised with clearly labelled unlinked fixtures, not fake live profiles. URL validation does not prove account ownership; verified URLs must be supplied by the owner.
18. **Future Android switch:** change `android.status` and confirm `android.publicUrl` in `download-config.js`, then regenerate static fallbacks and run QA. The official Play badge and related availability/help copy switch automatically. No manual page-by-page edits or redesign is needed. Procedure below; no production switch performed now.
19. **Mobile/responsive:** checks cover 390, 430, 768, 1024, and 1440px. No horizontal page overflow, overlapping controls, or missing visible images found in the final captures. Mobile navigation/tabs/buttons fit. Long Showcase/Walkthrough pages intentionally preserve the approved full-screen sequence; no new sections or scrolling burden were added.
20. **Accessibility:** keyboard controls, focus visibility, tabs, accordions, lightbox containment/Escape/focus return, form labels, alt attributes, landmarks, H1/heading hierarchy, control dimensions, flat-background text/placeholder contrast, and reduced-motion fallbacks are checked. Gradient/translucent surfaces also received visual review. This is scoped browser QA, not a full WCAG certification or screen-reader audit. Inline prose links on five informational/legal routes retain their inline-text target exception.
21. **Performance:** no new framework, animation library, autoplay video, or network-dependent font. Existing CSS/JS/IntersectionObserver and optimized WebP screenshots remain. The six shared CSS/JS/config assets total 33,040 bytes when independently gzip-compressed, about 32.3 KiB; font is 27,348 bytes. These are local size estimates, not production transfer or Lighthouse scores. Most below-fold images remain lazy-loaded.
22. **SEO:** all seven exact requested titles verified, including the decoded ampersand in Walkthrough. Natural descriptions, canonical URLs, social metadata, and sitemap remain. Resources and About retain customer-facing support segments and concise Washington AFH/principles content.
23. **QA:** passed with zero errors. Final results are recorded in `.verification/final-website-freeze/technical/summary.json` and `report.json`; capture results are in `captures.json`. Validated 15 routes, 70 page/viewport cases, 70 typography/style cases, 235 interaction records, 155 focus checks, 60 local links/fragments, 22 image URLs, 37 image/source contracts, two preserved forms, and 28 runtime/static Android-state cases. Required syntax, synchronizer, generator, and whitespace checks passed. All website-source hashes remained stable during the final run. External availability checks and limits are described separately.
24. **Evidence directory:** `C:\Users\samue\Documents\GitHub\cytrea-landingpage\.verification\final-website-freeze\`. 89 website PNGs: full/top views of nine routes at 390/768/1440px, plus the requested hero/product/provider/caregiver/vendor directory/form/download/footer/Showcase/Walkthrough/mobile-menu focus views. Three technical motion/design samples supplement them. No screenshot-only CSS or retouched UI was used. Evidence remains intentionally Git-ignored.
25. **Local previews:** loopback preview remains running at `http://127.0.0.1:4173/`; all requested clickable links are below.
26. **Files changed:** `download-config.js`; 15 HTML fallbacks (`index`, `product`, `providers`, `caregivers`, `vendor-partners`, `resources`, `about`, `support`, `privacy`, `terms`, `delete-account`, `pricing`, `showcase`, `walkthrough`, and `payment-return/index`); `experiences.css`; `verify-showcase-premium.cjs`; `verify-experiences-extra.cjs`; new `capture-website-freeze.cjs`; this report. Only the App Store href changes in HTML except the two removed vendor contact buttons. Payment-return behavior is unchanged. `cytrea.css`, both runtime scripts, original/optimized app images, font, form code, and backend scripts are unchanged.
27. **Commit:** one local commit only after acceptance passes, message `design: freeze Cytrea website for public launch`. Exact SHA recorded in the commit receipt and final handoff.
28. **Git status:** checked after that local commit; evidence is ignored rather than staged. No other repository is modified.
29. **Scope confirmation:** local website only. No push, deployment, domain/DNS modification, backend/Supabase/Stripe change, App Store or Google Play Console action, `cytrea-app` edit, or external account/write action. Public-link and DNS checks were read-only. No calls, emails, or form submissions were made.

## External links and open information

- The exact US App Store product page was read successfully. The Android testing URL and attribution homepage returned HTTP 200 to read-only HEAD requests. This does not verify tester eligibility or Android production approval.
- `http://www.wingwimedicaltransportation.com/` failed hostname resolution; separate A lookups for the `www` and bare host and an MX lookup returned “DNS name does not exist.” The original `info@wingwimedicaltransportation.com` and website are recorded here but are no longer actionable buttons on the directory. Obtain verified replacements before restoring them. The existing phone number was preserved, not called or independently reverified.
- Remaining phone/email actions were inspected, not contacted; actual delivery/answering is not claimed. Form delivery and production-host behavior were deliberately not tested through writes.
- Facebook/Instagram are an optional follow-up, not a blocker for the rest of the freeze. Do not invent profile URLs or enable the public-launch banner to compensate for missing social links.
- The public-launch banner remains disabled. Its guard requires both platforms to be public; early-access/public simulations verify that behavior.
- At 390px, the Home responsibility FAQ and Providers responsibility paragraph are approximately five and six lines respectively. Their truthful responsibility language was retained. Longer policy copy was not rewritten during this freeze.

## Reproduce local acceptance

Use the existing Playwright dependency installation; no package install is required in this repository. In this machine's PowerShell:

```powershell
$env:NODE_PATH='C:\Users\samue\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$env:CYTREA_QA_BASELINE='9490cb790eeedd5c53646001efb3c467f7333e4e'
$env:CYTREA_QA_OUTPUT='.verification/final-website-freeze/technical'
$env:CYTREA_QA_ANDROID_STATUS='early-access'
node --check cytrea.js
node --check experiences.js
node --check download-config.js
node --check site-config.js
node --check verify-showcase-premium.cjs
node --check verify-experiences-extra.cjs
node --check capture-website-freeze.cjs
node sync-downloads.cjs --check
node sync-site.cjs --check
node sync-forms.cjs --check
node build-experiences.cjs --check
node verify-showcase-premium.cjs
node capture-website-freeze.cjs
git diff --check
```

The regression verifier serves a temporary loopback port; the capture script uses the running preview on 4173. Both block off-origin browser traffic and all non-GET/HEAD requests. Neither submits forms. The payment-return route is HTTP-checked without executing an app deep link.

Before committing any future work, wait for QA to finish. The verifier detects website-source changes during its run. Browser resize checks wait for the asynchronous matchMedia change event rather than sampling before the responsive update has run.

## Android public-launch switch — later, after actual approval

Do not perform these steps merely because this local website is ready.

1. Independently confirm Google Play production approval and the public product URL.
2. Edit only the download configuration source:

   ```js
   android: {
     status: "public",
     earlyAccessUrl: "https://play.google.com/apps/testing/com.cytrea.mobile",
     publicUrl: "https://play.google.com/store/apps/details?id=com.cytrea.mobile"
   }
   ```

   Keep the existing two-URL schema. The inactive testing URL may stay in config; `resolve()` chooses only `publicUrl` in public mode. Confirm that URL before switching.
3. Run `node sync-downloads.cjs` and `node sync-site.cjs` to regenerate HTML/no-JS fallbacks. Run `node build-experiences.cjs --check` to confirm the existing page generator agrees. These generated updates are expected; do not edit each page manually.
4. Run the acceptance commands above with `$env:CYTREA_QA_ANDROID_STATUS='public'` and a fresh `.verification/` output directory. The default stays `early-access` to prevent accidentally accepting public availability now. Both availability states are also exercised in isolated runtime/static simulations without changing the actual configuration.
5. Inspect the official Google Play badge, the public link, related FAQ/help copy, social preview, footer, mobile layout, and no-JS output. Keep `SITE_BANNER.enabled` false unless a separate banner change is approved.
6. Deploy only with separate explicit authorization. This task performs no deployment or platform-console changes.

## Local review links and manual checks

- [Home](http://127.0.0.1:4173/)
- [Product](http://127.0.0.1:4173/product)
- [Providers](http://127.0.0.1:4173/providers)
- [Caregivers](http://127.0.0.1:4173/caregivers)
- [Vendor Partners](http://127.0.0.1:4173/vendor-partners)
- [Resources](http://127.0.0.1:4173/resources)
- [About](http://127.0.0.1:4173/about)
- [Showcase](http://127.0.0.1:4173/showcase)
- [Walkthrough](http://127.0.0.1:4173/walkthrough)
- [QA gallery](http://127.0.0.1:4173/.verification/final-website-freeze/)

At mobile width, open/close the menu with keyboard, switch Product roles, and enlarge a screenshot then press Escape. In Resources, visit all four help segments and toggle FAQ rows. Search the vendor directory, inspect the Call-only Wingwi entry, and test the form's Other category without submitting. On desktop, use Walkthrough's arrow keys/Home/End and Next step, then resize to mobile. Repeat with reduced motion. Confirm every Android control still says Early Access and that no social profiles are shown.
