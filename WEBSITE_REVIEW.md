# Cytrea greenfield website

Local rebuild on `cytrea-website-v2`, starting at `8ada3ac9a1601959d6baa4f1f9bbd8a544afa23d`.

## Architecture

Semantic static HTML, a new `cytrea.css` token/layout system, and a new `cytrea.js` progressive-enhancement layer. No framework, bundler, animation library, added dependency installation, external web-font request, or autoplay media.

The shared header/footer are static markup on every public page, so navigation works without JavaScript. The existing `preview-server.js` and extensionless `.html` routing model remain unchanged.

### Routes

Primary: `/`, `/product`, `/providers`, `/caregivers`, `/vendor-partners`, `/resources`, `/about`.

Preserved: `/support`, `/privacy`, `/terms`, `/delete-account`, `/pricing`, `/payment-return/`.

Pricing remains a backwards-compatible page but is not in the primary navigation. Payment Return uses the new visual shell; its deep-link/query handling is unchanged.

## Page structure

- Home: new hero, compact positioning bar, role switcher, four-screen-per-role product proof, two linear process rows, brief human connection section, small vendor teaser, download choices, native FAQ, final CTA, and footer.
- Providers: AFH-specific hero, concise job/applicant/profile/messaging explanation, provider product tour, responsibility statement, and download choices.
- Caregivers: profile-led hero, prominent “Completely free for caregivers,” job/application/credential tools, tour, real messaging capture, and download choices.
- Product: role selection and four real screenshots per role; one focused panel at a time.
- Vendor Partners: new program introduction, six category disclosures, five existing vendor listings with original contact actions, search, and preserved application form.
- Resources: caregiver/provider/app-help/FAQ tabs using existing product and support content. No invented articles. The existing Early Access form lives here as onboarding assistance.
- About: short operator-informed story, Washington AFH roots, mission, and clear marketplace boundaries.
- Legal/support: main content preserved without substantive rewriting; new header/footer/styles.

## Downloads

iPhone: “Download on the App Store”
https://apps.apple.com/app/cytrea/id6767470963

Android: “Android Early Access”
https://play.google.com/apps/testing/com.cytrea.mobile

Android is explicitly described as closed testing for approved testers. The normal Play listing is not used as a download CTA.

## Forms and preserved contracts

Early Access: POST to the existing Apps Script endpoint using `role`, `name`, `email`, `phone`, and `city`; the named hidden response iframe is retained. The original `/#early-access` entry point remains and points users toward onboarding help.

Vendor: original named payload fields, taxonomy/optgroups, primary-category mapping, phone formatting, timestamp, combined notes, logo filename, POST method, and named hidden iframe remain. Submission field preparation and response UI were moved to `vendor-intake.js`. The only motion adjustment respects reduced-motion preference.

Exact endpoints are retained in `cytrea.js` and the corresponding HTML form actions. Neither Apps Script source file was changed. No live submissions were made during QA.

Important existing limitation: vendor logo storage is not active; the form records only the selected filename. The visible form explains this.

## Assets

Ten WebP copies under `images/web/` are resized from genuine `images/current-app/` PNGs without fabricating or altering the UI. Their combined size is 665,302 bytes versus 6,010,120 source bytes (about 89% smaller). All original PNGs remain available through full-size screenshot links.

Provider captures: dashboard, jobs, applicant list, and applicant-review entry point. The Profile review panel is accurately captioned as starting from the applicant list, not as a fabricated profile-detail capture.

Caregiver captures: dashboard, job search, application status, credentials, profile, and messaging.

The real Cytrea wordmark and five existing vendor SVGs are retained. Older mockups and App Store export directories remain because they are shared/source assets referenced by screenshot documentation; they are not used by the new public pages.

## Removed legacy files

- `cytrea-v2.css`
- `cytrea-v2.js`
- `legal.css`

No active HTML depends on them. Old homepage markup, layered CSS, placeholder video demos, obsolete Apple availability text, normal Google Play production CTAs, and the old vendor card layout are no longer active.

Git history is the rollback mechanism; no public V2 archive was created.

## QA performed

- 13 routes: HTTP 200.
- 12 visual pages × 390 / 768 / 1024 / 1440px: 48 checks.
- 39 unique internal URLs/fragments checked.
- No page horizontal overflow, duplicate IDs, broken images, missing alt text, missing descriptions, or invalid H1/heading counts found.
- Menu open/close, Escape/focus restoration, role/product tabs, arrow/Home/End keys, native FAQ keyboard interaction, and vendor search checked.
- 44px UI touch targets checked.
- Rendered-text contrast, visible form labels, reduced-motion behavior, and no-JavaScript navigation/download/form-action checks passed.
- Early Access and vendor POST contracts tested with browser network interception, including vendor phone/category/timestamp/notes mapping. Requests were fulfilled locally, never transmitted to Google.
- `node --check cytrea.js`, `node --check vendor-intake.js`, `node --check verify-site.cjs`, and `git diff --check` passed.
- Four legal/support main-content bodies and the Payment Return script compared with the starting version.
- Mobile homepage measured 6,587px versus V2’s 17,848px in the same 390px test context: about 63% shorter.

This is a local QA pass, not formal accessibility certification. Live App Store/Play eligibility and Google spreadsheet persistence were not exercised.

### Reproduce locally

Run `node preview-server.js`, then open http://127.0.0.1:4173.

Run `node verify-site.cjs` with an existing Playwright installation available through Node resolution (or `NODE_PATH`). Set `CHROME_PATH` if Chrome is installed somewhere other than the default Windows path. No package installation is required when using the bundled workspace runtime.

The runner serves a temporary loopback-only test server and writes screenshots/reports to ignored `.verification/greenfield-qa/`. It intercepts both Google form endpoints. Do not remove interception when using synthetic QA data.

### Manual review

1. Review Home at the four target widths; check hero proportions and CTA hierarchy.
2. Switch both audience roles and each product screen; open a full-size screenshot.
3. Use Tab, Enter, arrow keys, Home, End, and Escape to check navigation and disclosures.
4. Check both device URLs without changing app-console settings.
5. Review vendor categories/search and the form’s Other-category/phone behavior.
6. Review onboarding assistance and all legal/support routes.
7. Approve the visual direction separately before any deployment.

## Scope

No push or deploy. No CNAME, DNS, domain, backend, Supabase, Stripe, Apple/App Store, or Google Play Console changes. No changes to cytrea-app, SNS, Magnolia, or unrelated repositories.
