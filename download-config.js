/* Download availability has one source of truth. After a status change, run
 * `node sync-downloads.cjs` to refresh the no-JavaScript HTML fallbacks too. */
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
      // Change only this value to "public" when Google Play public release is approved.
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
      apple: {
        platform: "iPhone",
        status: settings.ios.status,
        url: settings.ios.publicUrl,
        label: "Download on the App Store",
        detail: "Available on the App Store",
        artwork: "/images/branding/app-store.svg",
        artworkAlt: "Download on the App Store",
        artworkKind: "badge"
      },
      android: {
        platform: "Android",
        status: settings.android.status,
        url: androidPublic ? settings.android.publicUrl : settings.android.earlyAccessUrl,
        label: androidPublic ? "Get it on Google Play" : "Android Early Access",
        detail: androidPublic ? "Available on Google Play" : "Join the Google Play early-access test.",
        artwork: androidPublic ? "/images/branding/google-play-badge.png" : "/images/branding/google-play.webp",
        artworkAlt: androidPublic ? "Get it on Google Play" : "Google Play",
        artworkKind: androidPublic ? "badge" : "mark"
      },
      copy: {
        availability: androidPublic ? "iPhone and Android available" : "iPhone available · Android early access",
        "android-notice": androidPublic
          ? "Cytrea is available on the App Store and Google Play."
          : "Android is in closed testing. Access is limited to approved testers.",
        "android-question": androidPublic ? "Can I download Cytrea on Android?" : "Who can join the Android test?",
        "android-answer": androidPublic
          ? "You can download Cytrea for Android from Google Play. Contact support if you need help getting started."
          : "Android access is limited to approved testers. Use the Android Early Access link with your approved Google account. Contact support if you cannot join.",
        "download-answer": androidPublic
          ? "You can download Cytrea for iPhone on the App Store and for Android on Google Play."
          : "iPhone users can download Cytrea on the App Store. Android is in closed early access for approved testers.",
        "download-help": androidPublic ? "Download Cytrea for your device" : "Download or join Android early access",
        "onboarding-help": androidPublic
          ? "For onboarding questions, contact support@cytrea.com."
          : "Requesting help does not automatically grant Android testing access.",
        "help-success": androidPublic
          ? "Your request was sent. If you need help getting started, contact support@cytrea.com."
          : "Your request was sent. If you need help with access, contact support@cytrea.com. This request does not automatically enroll you in Android testing."
      }
    };
  }

  return Object.freeze({ config, resolve });
});
