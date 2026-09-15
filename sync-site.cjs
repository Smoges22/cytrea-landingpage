"use strict";
// Shared, static social/banner fallbacks. No network requests or endpoint changes.
const fs = require("node:fs"), path = require("node:path");
const site = require("./site-config.js"), downloads = require("./download-config.js");
const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function socialMarkup(links = site.resolveSocial()) {
  return `<div class="footer-social" data-social-links role="group" aria-label="Follow Cytrea"${links.length ? "" : " hidden"}>${links.length ? '<p class="footer-social-label">Follow Cytrea</p><div class="social-row">' + links.map(item => `<a class="social-link social-link--${item.key}" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="Cytrea on ${item.name} (opens in a new tab)">${item.icon ? `<img src="${item.icon}" width="24" height="24" alt="" aria-hidden="true">` : `<span aria-hidden="true">${item.monogram}</span>`}</a>`).join("") + "</div>" : ""}</div>`;
}
function bannerMarkup(banner = site.resolveBanner(downloads.resolve())) {
  return `<aside class="site-banner" data-site-banner aria-label="Cytrea availability"${banner ? "" : " hidden"}>${banner ? `<div class="page-width"><p>${escape(banner.text)}</p><a class="quiet-link" href="${banner.href}">${banner.label}<span aria-hidden="true">→</span></a></div>` : ""}</aside>`;
}
function synchronize(html) {
  let next = html;
  if (!next.includes('src="/site-config.js"')) next = next.replace('<script src="/cytrea.js" defer></script>', '<script src="/site-config.js" defer></script>\n<script src="/cytrea.js" defer></script>\n<script src="/experiences.js" defer></script>');
  if (!next.includes('href="/experiences.css"')) next = next.replace('<link rel="stylesheet" href="/cytrea.css">', '<link rel="stylesheet" href="/cytrea.css">\n<link rel="stylesheet" href="/experiences.css">');
  const social = `<!-- cytrea-social:start -->${socialMarkup()}<!-- cytrea-social:end -->`;
  next = next.includes("<!-- cytrea-social:start -->") ? next.replace(/<!-- cytrea-social:start -->[\s\S]*?<!-- cytrea-social:end -->/, social) : next.replace('<p>Caregiver hiring, built around Adult Family Homes.</p>', '<p>Caregiver hiring, built around Adult Family Homes.</p>' + social);
  const banner = `<!-- cytrea-banner:start -->${bannerMarkup()}<!-- cytrea-banner:end -->`;
  next = next.includes("<!-- cytrea-banner:start -->") ? next.replace(/<!-- cytrea-banner:start -->[\s\S]*?<!-- cytrea-banner:end -->/, banner) : next.replace('</header>', '</header>\n' + banner);
  next = next.replace(/(<nav aria-label="Explore">)([\s\S]*?)(<\/nav>)/, (_, open, contents, close) => open + contents + (contents.includes('href="/showcase"') ? '' : '<a href="/showcase">Showcase</a><a href="/walkthrough">Walkthrough</a>') + close);
  return next;
}
if (require.main === module) {
  const check = process.argv.includes("--check"), changed = [];
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith(".html")).concat("payment-return/index.html");
  for (const file of files) {
    const full = path.join(__dirname, file), old = fs.readFileSync(full, "utf8"), next = synchronize(old);
    if (old !== next) { changed.push(file); if (!check) fs.writeFileSync(full, next); }
  }
  console.log(changed.length ? `${check ? "Needs" : "Applied"} site sync: ${changed.join(", ")}` : `Site fallbacks current (${files.length} pages).`);
  if (check && changed.length) process.exitCode = 1;
}
module.exports = { synchronize, socialMarkup, bannerMarkup, escape };
