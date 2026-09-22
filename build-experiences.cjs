"use strict";
// Build two static editorial pages from genuine screenshot mappings; no framework.
const fs = require("node:fs");
const { screens, chapters, journeys } = require("./experience-content.cjs");
const { synchronize, escape: e } = require("./sync-site.cjs");
const { synchronizeHtml } = require("./sync-downloads.cjs");
const home = fs.readFileSync("index.html", "utf8");
const header = home.match(/<header\b[\s\S]*?<\/header>/)[0].replace('href="#download"', 'href="/#download"');
const footer = home.match(/<footer\b[\s\S]*?<\/footer>/)[0];
const figure = (key, extra = "", eager = false) => {
  const s = screens[key];
  return `<figure class="app-mockup ${extra}"><div class="screen-frame mockup-phone"><a href="/images/current-app/${s.file}.png" target="_blank" rel="noopener noreferrer" aria-label="Enlarge screenshot: ${e(s.alt)}"><img src="/images/web/${s.file}.webp" width="780" height="1691" alt="${e(s.alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async"></a></div><figcaption>${e(s.caption)}</figcaption></figure>`;
};
const page = (route, title, description, body) => synchronizeHtml(synchronize(`---
layout: null
permalink: /${route}/
redirect_from: /${route}.html
---
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title><meta name="description" content="${e(description)}"><meta name="theme-color" content="#ffffff">
<link rel="canonical" href="https://cytrea.com/${route}/"><link rel="icon" type="image/png" href="/images/branding/Cytrea-logo.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="Cytrea"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="https://cytrea.com/${route}/"><meta property="og:image" content="https://cytrea.com/images/social/cytrea-social-preview.png" data-download-social="image"><meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/fonts/plus-jakarta-sans-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/cytrea.css"><script src="/download-config.js" defer></script><script src="/cytrea.js" defer></script>
</head><body class="experience-page ${route}-page"><a class="skip" href="#content">Skip to content</a>${header}<main id="content">${body}</main>${footer}</body></html>`));
const chapterNav = `<nav class="chapter-nav page-width" aria-label="Showcase chapters">${chapters.map((c,i)=>`<a href="#${c.id}"><span aria-hidden="true">${String(i+1).padStart(2,"0")}</span>${c.label}</a>`).join("")}</nav>`;
const showcase = `<section class="experience-opening showcase-opening"><div class="page-width experience-hero-grid"><div><p class="overline">Cytrea Showcase · Real app screens</p><h1>See Cytrea<br>in action.</h1><p class="intro">A closer look at the everyday tools that bring caregivers and Adult Family Homes together.</p><a class="quiet-link" href="#provider-workspace">Explore the screens<span aria-hidden="true">↓</span></a></div><div class="mockup-composition mockup-pair"><div class="mockup-primary" data-reveal="right">${figure("provider", "", true)}</div><div class="mockup-secondary" data-reveal="up">${figure("caregiver", "", true)}</div><span class="composition-note">One platform.<br>Both sides of the connection.</span></div></div></section>${chapterNav}
${chapters.map((c,i)=>`<section class="showcase-chapter chapter--${c.tone}" id="${c.id}"><div class="page-width showcase-chapter-grid ${i%2 ? "chapter-reversed" : ""}"><div class="chapter-copy" data-reveal="${i%2 ? "right" : "left"}"><p class="overline"><span class="chapter-number">${String(i+1).padStart(2,"0")}</span>${c.label}</p><h2>${c.title}</h2><p>${c.copy}</p><a class="quiet-link" href="/walkthrough?role=${c.screen.startsWith("provider")||["jobs","applicants","information","workflow"].includes(c.screen)?"provider":"caregiver"}">Follow the workflow<span aria-hidden="true">→</span></a></div><div class="showcase-visual ${c.companion ? "mockup-composition mockup-stack" : "mockup-solo"}"><div class="mockup-primary" data-reveal="up">${figure(c.screen)}</div>${c.companion ? `<div class="mockup-secondary" data-reveal="right">${figure(c.companion)}</div>` : ""}</div></div></section>`).join("\n")}
<section class="block"><div class="page-width product-banner" data-reveal="up"><span class="banner-motif" aria-hidden="true">C</span><div><p class="overline">From seeing to doing</p><h2>Take your next step with Cytrea.</h2><p>Follow the journey for caregivers or AFH providers.</p></div><a class="action" href="/walkthrough">Take the Walkthrough<span aria-hidden="true">→</span></a></div></section>`;
const walkRole = (role, steps) => `<section id="journey-${role}" role="tabpanel" aria-labelledby="walk-${role}-tab" class="walk-journey" data-walk-journey><div class="walk-journey-heading"><p class="overline">${role === "caregiver" ? "Completely free for caregivers" : "Built for Adult Family Homes"}</p><h2>${role === "caregiver" ? "Your caregiver journey." : "Your provider journey."}</h2></div><div class="walk-layout"><div class="walk-rail" data-walk-rail hidden><p class="walk-progress" data-walk-progress aria-live="polite">Step 1 of ${steps.length}</p><div class="walk-step-nav" role="tablist" aria-orientation="vertical" aria-label="${role === "caregiver" ? "Caregiver" : "Provider"} walkthrough steps">${steps.map((s,i)=>`<button type="button" id="walk-${role}-step-${i+1}-tab" role="tab" aria-selected="${i===0}" aria-controls="walk-${role}-step-${i+1}" data-step="${i}"><span aria-hidden="true">${String(i+1).padStart(2,"0")}</span>${s[0]}</button>`).join("")}</div><button type="button" class="quiet-link walk-next" data-walk-next>Next step<span aria-hidden="true">→</span></button></div><div class="walk-panels">${steps.map((s,i)=>`<article class="walk-step" id="walk-${role}-step-${i+1}" data-walk-step><div class="walk-step-copy"><p class="overline">Step ${String(i+1).padStart(2,"0")} / ${String(steps.length).padStart(2,"0")}</p><h3>${s[0]}</h3><p>${s[1]}</p></div><div class="walk-screen" data-reveal="up">${figure(s[2])}</div></article>`).join("\n")}</div></div></section>`;
const walkthrough = `<section class="experience-opening walkthrough-opening"><div class="page-width"><p class="overline">The Cytrea Walkthrough</p><h1>A clear path to your<br>next connection.</h1><p class="intro">Choose your role. Follow the real screens from setup to conversation.</p><a class="quiet-link" href="/showcase">Prefer a visual overview? Explore the Showcase<span aria-hidden="true">→</span></a></div></section>
<section class="block walkthrough-body"><div class="page-width" data-switch-group><div class="switch-track walk-role-tabs" data-enhanced-only role="tablist" aria-label="Choose a walkthrough" hidden><button id="walk-caregiver-tab" type="button" role="tab" data-role="caregiver" aria-selected="true" aria-controls="journey-caregiver" data-switch="journey-caregiver">For Caregivers</button><button id="walk-provider-tab" type="button" role="tab" data-role="provider" aria-selected="false" aria-controls="journey-provider" data-switch="journey-provider">For Providers</button></div><noscript><p>Both journeys are shown below. <a href="#journey-caregiver">Caregiver journey</a> · <a href="#journey-provider">Provider journey</a></p></noscript>${walkRole("caregiver",journeys.caregiver)}${walkRole("provider",journeys.provider)}</div></section>
<section class="block"><div class="page-width product-banner"><span class="banner-motif" aria-hidden="true">C</span><div><p class="overline">Built around real decisions</p><h2>The connection is yours to make.</h2><p>Cytrea is a marketplace, not an employer or verification service. Providers make their own hiring decisions.</p></div><a class="action" href="/#download">Get Cytrea<span aria-hidden="true">→</span></a></div></section>`;
const pages = {
  "showcase.html": page("showcase", "Cytrea Showcase | See the AFH Hiring App in Action", "Explore real Cytrea app screens for caregivers and Adult Family Home providers.", showcase),
  "walkthrough.html": page("walkthrough", "How Cytrea Works | Caregiver & AFH Hiring Walkthrough", "See how caregivers and Adult Family Home providers use Cytrea from profile setup to applications and hiring conversations.", walkthrough)
};
const check = process.argv.includes("--check");
let changed = false;
for (const [file, html] of Object.entries(pages)) {
  if (!fs.existsSync(file) || fs.readFileSync(file,"utf8") !== html) { changed = true; if (!check) fs.writeFileSync(file,html); console.log(`${check?"Needs build":"Built"}: ${file}`); }
}
if (check && changed) process.exitCode = 1;
if (!changed) console.log("Experience pages are current.");
