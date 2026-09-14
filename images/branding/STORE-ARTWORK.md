# Official store artwork

Retrieved unmodified on 2026-09-14 for the local Cytrea website design.

- `app-store.svg`: https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg
  - Guidelines: https://developer.apple.com/app-store/marketing/guidelines/
  - Black official badge, displayed at approximately 52px high with clear space. No logo redrawing, recoloring, tilting, or animation.
- `google-play.webp`: https://www.gstatic.com/marketing-cms/assets/images/ab/98/2ac2743c4d8bb2076a7ad7517bd0/play.webp=s160-fcrop64=1,00000000ffffffff-rw
  - Exact 160px artwork URL listed on Google's official Brand Resource Center: https://about.google/brand-resource-center/products-and-services/
  - Used beside the custom **Android Early Access** control. This is not a public-availability badge.
- `google-play-badge.png`: https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png
  - Official Google-hosted badge, retained for the future approved public state; not displayed in the current early-access state.
  - Brand guidance: https://developer.android.com/distribute/marketing-tools/brand-guidelines

Brand ownership stays with Apple and Google. Footer trademark credit is included. This local implementation does not assert marketing approval from either company or publish any creative. Confirm any applicable brand approvals before a later deployment.

## Download state

`download-config.js` is authoritative: iPhone is public; Android is early access. After a future authorized change of `android.status` to `public`, run `node sync-downloads.cjs` to regenerate static/no-JavaScript labels, artwork, and links. Run `node sync-downloads.cjs --check` to detect stale fallbacks. The current public-state URL and badge are inactive until that status is changed.
