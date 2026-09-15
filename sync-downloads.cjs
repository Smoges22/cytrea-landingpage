"use strict";

/* Keep static links and copy usable without JavaScript. No dependencies or build
 * framework: run after editing download-config.js; --check makes no changes. */
const fs = require("node:fs");
const path = require("node:path");
const downloads = require("./download-config.js");

const escapeHtml = value => String(value).replace(/[&<>\"]/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
})[character]);

function attribute(tag, name, value) {
  const matcher = new RegExp(`\\s${name}(?:=(?:"[^"]*"|'[^']*'|[^\\s>]+))?(?=\\s|/?>)`, "i");
  const next = ` ${name}="${escapeHtml(value)}"`;
  return matcher.test(tag) ? tag.replace(matcher, next) : tag.replace(/\s*\/?>$/, ending => `${next}${ending}`);
}

function markedText(html, marker, value) {
  const matcher = new RegExp(`(<([a-z][\\w:-]*)\\b[^>]*\\s${marker}(?:=(?:"[^"]*"|'[^']*'|[^\\s>]+))?[^>]*>)[\\s\\S]*?(<\\/\\2>)`, "gi");
  return html.replace(matcher, (_, opening, tag, closing) => `${opening}${escapeHtml(value)}${closing}`);
}

function toggleMarked(html, marker, visible) {
  const matcher = new RegExp(`<[^/!][^>]*\\s${marker}(?:=(?:"[^"]*"|'[^']*'|[^\\s>]+))?[^>]*>`, "gi");
  return html.replace(matcher, tag => {
    const clean = tag.replace(/\s+hidden(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?(?=\s|\/?>)/gi, "");
    return visible ? clean : attribute(clean, "hidden", "");
  });
}

function synchronizeHtml(html, state = downloads.resolve()) {
  let result = html.replace(/(<a\b[^>]*\sdata-store=(['"])(apple|android)\2[^>]*>)([\s\S]*?)(<\/a>)/gi,
    (_, opening, quote, platform, contents, closing) => {
      const store = state[platform.toLowerCase()];
      let tag = attribute(opening, "href", store.url);
      tag = attribute(tag, "aria-label", `${store.label} (opens in a new tab)`);
      tag = attribute(tag, "data-store-state", store.status);
      // Migrate the existing Android footer label once; the wrapper is absent
      // from layout in public mode, leaving only the official store badge.
      let inner = contents;
      if (/\bdownload-choice\b/.test(opening)) {
        // One shared compact control, usable before enhancement and in either state.
        inner = `<span class="download-platform"><span data-store-platform></span><span aria-hidden="true">↗</span></span><span data-store-badge data-early-access-control><img data-store-artwork width="180" height="60" loading="lazy"><span class="store-control-copy" data-store-early-only><strong data-store-label></strong><span data-store-detail></span></span></span>`;
      }
      if (platform.toLowerCase() === "android" && /\bfooter-store\b/.test(opening) && !/\bfooter-store-copy\b/.test(inner)) {
        inner = inner.replace(/(<span\b[^>]*\sdata-store-label(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?[^>]*>)[\s\S]*?<\/span>/i,
          '<span class="footer-store-copy" data-store-early-only><span data-store-label></span><span class="footer-store-detail" data-store-detail></span></span>');
      }
      inner = markedText(inner, "data-store-label", store.label);
      inner = markedText(inner, "data-store-detail", store.detail);
      inner = markedText(inner, "data-store-platform", store.platform);
      inner = inner.replace(/<img\b[^>]*\sdata-store-artwork(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?[^>]*>/gi, image => {
        let updated = attribute(image, "src", store.artwork);
        updated = attribute(updated, "alt", store.artworkAlt);
        return attribute(updated, "data-artwork-kind", store.artworkKind);
      });
      inner = toggleMarked(inner, "data-store-early-only", store.status === "early-access");
      inner = toggleMarked(inner, "data-store-public-only", store.status === "public");
      return `${tag}${inner}${closing}`;
    });
  result = result.replace(/<p\b[^>]*\sdata-download-copy="android-notice"[^>]*>[\s\S]*?<\/p>/gi, "");
  result = result.replace(/<p class="page-width trademark-note">[\s\S]*?<\/p>/g, "");
  result = result.replace(/(<([a-z][\w:-]*)\b[^>]*\sdata-download-copy=(['"])([\w-]+)\3[^>]*>)[\s\S]*?(<\/\2>)/gi,
    (_, opening, tag, quote, key, closing) => {
      if (!Object.hasOwn(state.copy, key)) throw new Error(`Unknown download copy key: ${key}`);
      return `${opening}${escapeHtml(state.copy[key])}${closing}`;
    });
  result = result.replace(/<meta\b[^>]*\sproperty=(['"])og:image\1[^>]*>/gi, tag =>
    attribute(attribute(tag, "content", state.socialImage), "data-download-social", "image"));
  result = result.replace(/\/fonts\/inter-latin-variable\.woff2/g, "/fonts/plus-jakarta-sans-latin-variable.woff2");
  if (!/\bhref=(['"])\/fonts\/plus-jakarta-sans-latin-variable\.woff2\1/i.test(result)) {
    result = result.replace(/(<link\b[^>]*\srel=(['"])stylesheet\2[^>]*\shref=(['"])\/cytrea\.css\3[^>]*>)/i,
      '<link rel="preload" href="/fonts/plus-jakarta-sans-latin-variable.woff2" as="font" type="font/woff2" crossorigin>\n$1');
  }
  return result;
}

function main() {
  const check = process.argv.includes("--check");
  if (process.argv.slice(2).some(argument => argument !== "--check")) {
    throw new Error("Usage: node sync-downloads.cjs [--check]");
  }
  const files = fs.readdirSync(__dirname).filter(name => name.endsWith(".html"));
  if (fs.existsSync(path.join(__dirname, "payment-return", "index.html"))) files.push("payment-return/index.html");
  files.sort();
  const changed = [];
  for (const name of files) {
    const file = path.join(__dirname, name);
    const original = fs.readFileSync(file, "utf8");
    const updated = synchronizeHtml(original);
    if (updated === original) continue;
    changed.push(name);
    if (!check) fs.writeFileSync(file, updated);
  }
  console.log(changed.length
    ? `${check ? "Needs download sync" : "Updated download fallbacks"}: ${changed.join(", ")}`
    : `Download fallbacks are current (${files.length} HTML pages).`);
  if (check && changed.length) process.exitCode = 1;
}

if (require.main === module) main();
module.exports = { synchronizeHtml };
