/* Shared download availability. Run node sync-downloads.cjs after edits
 * to keep static HTML and the progressive enhancement in agreement. */
(function (root, factory) {
  "use strict";
  const downloads = factory();
  if (typeof module === "object" && module.exports) module.exports = downloads;
  else root.CYTREA_DOWNLOADS = downloads;
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";
  const config = Object.freeze({
    ios: Object.freeze({
      status: "public",
      publicUrl: "https://apps.apple.com/app/cytrea/id6767470963"
    }),
    android: Object.freeze({
      // Change this one value to "public" when Android production is available.
      status: "early-access",
      earlyAccessUrl: "https://play.google.com/apps/testing/com.cytrea.mobile",
      publicUrl: "https://play.google.com/store/apps/details?id=com.cytrea.mobile"
    })
  });

  function resolve(settings = config) {
    if (settings.ios.status !== "public" || !["early-access", "public"].includes(settings.android.status)) {
      throw new Error("Unsupported Cytrea download availability state.");
    }
    const androidPublic = settings.android.status === "public";
    return {
      socialImage: androidPublic
        ? "https://cytrea.com/images/social/cytrea-public-og.png"
        : "https://cytrea.com/images/social/cytrea-social-preview.png",
      apple: {
        platform: "iPhone", status: settings.ios.status, url: settings.ios.publicUrl,
        label: "Download on the App Store", detail: "Available on the App Store",
        artwork: "/images/branding/app-store.svg",
        artworkAlt: "Download on the App Store", artworkKind: "badge"
      },
      android: {
        platform: "Android", status: settings.android.status,
        url: androidPublic ? settings.android.publicUrl : settings.android.earlyAccessUrl,
        label: androidPublic ? "Get it on Google Play" : "Android Early Access",
        detail: androidPublic ? "Available on Google Play" : "Join the Google Play early-access test.",
        artwork: androidPublic ? "/images/branding/google-play-badge.png" : "/images/branding/google-play.webp",
        artworkAlt: androidPublic ? "Get it on Google Play" : "Google Play",
        artworkKind: androidPublic ? "badge" : "mark"
      },
      copy: {
        availability: androidPublic ? "Available on iPhone and Android" : "iPhone available · Android Early Access",
        "android-notice": androidPublic
          ? "Cytrea is available on the App Store and Google Play."
          : "Android Early Access is a closed test, not a public Google Play release.",
        "android-question": androidPublic ? "Can I download Cytrea on Android?" : "How do I join Android Early Access?",
        "android-answer": androidPublic
          ? "You can download Cytrea for Android from Google Play. Contact support if you need help getting started."
          : "Use Android Early Access to join the Google Play test. Contact support if you need help with testing access.",
        "download-answer": androidPublic
          ? "You can download Cytrea for iPhone on the App Store and for Android on Google Play."
          : "iPhone users can download Cytrea on the App Store. Android users can join Early Access through the Google Play test.",
        "download-help": androidPublic ? "Download Cytrea for your device" : "Download for iPhone or join Android Early Access",
        "onboarding-help": androidPublic
          ? "Tell us how we can help and the Cytrea team will follow up."
          : "Requesting help does not automatically grant Android testing access.",
        "help-success": androidPublic
          ? "Your request was submitted. If you need help getting started, contact support@cytrea.com."
          : "Your request was submitted. For help with Android testing access, contact support@cytrea.com. This request does not automatically enroll you in the test."
      }
    };
  }
  return Object.freeze({ config, resolve });
});
