/* Authoritative existing form endpoints. Run node sync-forms.cjs after edits.
 * These public form action URLs are not credentials. No backend changes here. */
(function (root, factory) {
  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  else root.CYTREA_FORM_CONFIG = config;
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";
  return Object.freeze({
    endpoints: Object.freeze({
      onboarding: "https://script.google.com/macros/s/AKfycbxyvPokvsdvnuiPA_aXt-WrLD9W_etfs0WozEDqMutnvtR21dUC56iBu-S9S_dSCx1z/exec",
      vendor: "https://script.google.com/macros/s/AKfycbzWxhbI9gJkns-ZJytlmEXMA5vlcmTUzFgEraQWoK3e556-Lt3XeNzkT5BqUE4PDdgI/exec"
    }),
    responseTimeoutMs: 20000
  });
});
