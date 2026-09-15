/* Website-only social / announcement configuration.
 * Add verified profile URLs, then run node sync-site.cjs for no-JS fallbacks.
 * Download availability remains owned by download-config.js. */
(function (root, factory) {
  "use strict";
  const site = factory();
  if (typeof module === "object" && module.exports) module.exports = site;
  else root.CYTREA_SITE = site;
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";
  const SOCIAL_LINKS = Object.freeze({ facebook: "", instagram: "", linkedin: "", youtube: "", tiktok: "" });
  const SITE_BANNER = Object.freeze({ enabled: false, kind: "public-launch" });
  const platforms = Object.freeze({
    facebook: { name: "Facebook", hosts: ["facebook.com", "www.facebook.com"], icon: "facebook" },
    instagram: { name: "Instagram", hosts: ["instagram.com", "www.instagram.com"], icon: "instagram" },
    linkedin: { name: "LinkedIn", hosts: ["linkedin.com", "www.linkedin.com"], monogram: "in" },
    youtube: { name: "YouTube", hosts: ["youtube.com", "www.youtube.com"], icon: "youtube" },
    tiktok: { name: "TikTok", hosts: ["tiktok.com", "www.tiktok.com"], icon: "tiktok" }
  });
  function resolveSocial(links = SOCIAL_LINKS) {
    return Object.entries(platforms).flatMap(([key, platform]) => {
      const value = links[key];
      if (typeof value !== "string" || !value.trim()) return [];
      try {
        const url = new URL(value);
        if (url.protocol !== "https:" || !platform.hosts.includes(url.hostname) || url.username || url.password || url.port || url.pathname === "/") return [];
        return [{ key, name: platform.name, url: url.href, icon: platform.icon ? `/images/social-icons/${platform.icon}.svg` : "", monogram: platform.monogram || "" }];
      } catch { return []; }
    });
  }
  function resolveBanner(downloads, banner = SITE_BANNER) {
    if (!banner.enabled || banner.kind !== "public-launch" || downloads?.apple.status !== "public" || downloads?.android.status !== "public") return null;
    return { text: "Cytrea is now available on the App Store and Google Play.", label: "Get Cytrea", href: "/#download" };
  }
  return Object.freeze({ SOCIAL_LINKS, SITE_BANNER, resolveSocial, resolveBanner });
});
