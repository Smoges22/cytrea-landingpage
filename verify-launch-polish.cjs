/* Local launch QA. Requires an existing Playwright installation via NODE_PATH.
 * All off-origin browser traffic and every non-GET request are blocked.
 * Form contracts are inspected/serialized without submitting either form.
 * No production configuration, source image, style, or markup is modified.
 */
"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");
const downloads = require("./download-config.js");
const { synchronizeHtml } = require("./sync-downloads.cjs");

const root = __dirname;
const baseline = "d0d2902b7553df29c9b7eae109a64584526602a7";
const out = path.join(root, ".verification/final-launch-polish/technical");
const widths = [390, 430, 768, 1024, 1440];
const routes = ["/", "/product", "/providers", "/caregivers", "/vendor-partners", "/resources", "/about", "/support", "/privacy", "/terms", "/delete-account", "/pricing", "/payment-return/"];
const pageRoutes = routes.filter(route => route !== "/payment-return/");
const errors = [], warnings = [];
const report = { baseline, startedAt: new Date().toISOString(), widths, viewportHeight: 900, routes: [], pages: [], interactions: [], focusChecks: [], forms: [], sourceContracts: [], imageContracts: [], downloadStates: [], reducedMotion: [], links: [], images: [], blockedRequests: [], screenshots: [], errors, warnings };
const check = (condition, message) => { if (!condition) errors.push(message); };
const digest = content => crypto.createHash("sha256").update(content).digest("hex");
const readBaseline = file => execFileSync("git", ["show", `${baseline}:${file}`], { cwd: root, encoding: "utf8" });
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
let browser, base;
const server = http.createServer((request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405).end(); return; }
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const candidate = path.resolve(root, pathname === "/" ? "index.html" : pathname.replace(/^\/+/, ""));
  if (!candidate.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  const file = [candidate, `${candidate}.html`, path.join(candidate, "index.html")].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
  if (!file) { response.writeHead(404).end("Not found"); return; }
  response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(response);
});

async function context(options = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, serviceWorkers: "block", ...options });
  await context.route("**/*", async route => {
    const request = route.request();
    if (new URL(request.url()).origin !== base || !["GET", "HEAD"].includes(request.method())) {
      report.blockedRequests.push({ method: request.method(), url: request.url() });
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
  return context;
}

async function settleImages(page) {
  await page.evaluate(async () => { await document.fonts.ready; });
  for (const image of await page.locator("img:visible").all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(image => Promise.race([image.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 2500))]));
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(80);
}

async function metrics(page, route, width) {
  const data = await page.evaluate(() => {
    const visible = element => !!element.getClientRects().length && getComputedStyle(element).visibility !== "hidden" && !element.closest('[aria-hidden="true"]');
    const ids = [...document.querySelectorAll("[id]")].map(element => element.id);
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(element => ({ level: Number(element.tagName[1]), text: element.textContent.trim() }));
    const controls = [...document.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,summary")].filter(visible).filter(element => !element.classList.contains("skip"));
    const tiny = controls.map(element => {
      const box = element.getBoundingClientRect();
      return { text: (element.innerText || element.getAttribute("aria-label") || element.name || "").trim().slice(0, 80), tag: element.tagName, class: element.className, width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10, inline: element.tagName === "A" && getComputedStyle(element).display === "inline" && !!element.closest("p,li") };
    }).filter(item => item.width < 43.5 || item.height < 43.5);
    const rgb = value => value.match(/[\d.]+/g)?.map(Number);
    const luminance = color => color.slice(0, 3).map(value => { value /= 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const contrast = [];
    for (const element of document.querySelectorAll('.primary-nav a,.action,.quiet-link,.footer-group-label,.colophon nav a,.footer-attribution,.trademark-note,label,.form-help,.intro,.overline,[role="tab"]')) {
      if (!visible(element) || !element.textContent.trim()) continue;
      const style = getComputedStyle(element), foreground = rgb(style.color);
      let node = element, background, complex = false;
      while (node) {
        const current = getComputedStyle(node), color = rgb(current.backgroundColor);
        if (current.backgroundImage !== "none") complex = true;
        if (color && (color.length < 4 || color[3] === 1)) { background = color; break; }
        node = node.parentElement;
      }
      if (!background) background = [255, 255, 255];
      if (!foreground || foreground.length === 4 && foreground[3] !== 1 || complex) continue;
      const a = luminance(foreground), b = luminance(background), ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const size = parseFloat(style.fontSize), large = size >= 24 || size >= 18.66 && Number(style.fontWeight) >= 700;
      contrast.push({ text: element.textContent.trim().slice(0, 75), class: element.className, foreground: style.color, background: background.slice(0, 3), ratio: Math.round(ratio * 100) / 100, minimum: large ? 3 : 4.5 });
    }
    const attribution = document.querySelector(".footer-attribution");
    return {
      route: location.pathname, width: innerWidth, height: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
      duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index), h1: document.querySelectorAll("h1").length,
      headingSkips: headings.filter((heading, index) => index && heading.level > headings[index - 1].level + 1),
      landmarks: { header: document.querySelectorAll("header").length, main: document.querySelectorAll("main").length, footer: document.querySelectorAll("footer").length },
      smallTargets: tiny, contrast,
      missingLabels: [...document.querySelectorAll("input:not([type=hidden]),select,textarea")].filter(visible).filter(element => !element.labels?.length && !element.getAttribute("aria-label") && !element.getAttribute("aria-labelledby")).map(element => element.outerHTML.slice(0, 140)),
      missingAlt: [...document.images].filter(image => !image.hasAttribute("alt")).map(image => image.src),
      brokenVisibleImages: [...document.images].filter(image => visible(image) && (!image.complete || image.naturalWidth === 0)).map(image => image.src),
      images: [...document.images].map(image => ({ src: image.src, visible: visible(image), width: Math.round(image.getBoundingClientRect().width), height: Math.round(image.getBoundingClientRect().height), naturalWidth: image.naturalWidth })),
      links: [...document.querySelectorAll("a[href]")].map(element => element.href),
      styles: [...document.querySelectorAll('link[rel="stylesheet"]')].map(element => element.href), scripts: [...document.scripts].map(element => element.src).filter(Boolean),
      stores: [...document.querySelectorAll("a[data-store]")].map(element => ({ platform: element.dataset.store, state: element.dataset.storeState, url: element.href, label: element.getAttribute("aria-label"), artwork: element.querySelector("img[data-store-artwork]")?.getAttribute("src"), kind: element.querySelector("img[data-store-artwork]")?.dataset.artworkKind })),
      attribution: attribution && { text: attribution.textContent.trim(), url: attribution.href, target: attribution.target, rel: attribution.rel },
      footerHeight: document.querySelector("footer")?.getBoundingClientRect().height,
      paragraphLinesOverFour: [...document.querySelectorAll("main p")].filter(visible).map(element => ({ text: element.textContent.trim().slice(0, 160), lines: Math.round(element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight)) })).filter(item => item.lines > 4)
    };
  });
  const prefix = `${width}px ${route}`;
  report.pages.push(data);
  check(!data.overflow, `${prefix}: horizontal overflow`);
  check(data.h1 === 1, `${prefix}: expected one H1; got ${data.h1}`);
  check(!data.duplicateIds.length, `${prefix}: duplicate IDs ${data.duplicateIds}`);
  check(!data.headingSkips.length, `${prefix}: heading skips ${JSON.stringify(data.headingSkips)}`);
  check(data.landmarks.main === 1 && data.landmarks.header === 1 && data.landmarks.footer === 1, `${prefix}: missing/duplicate landmarks`);
  check(!data.missingLabels.length, `${prefix}: unlabeled fields ${JSON.stringify(data.missingLabels)}`);
  check(!data.missingAlt.length, `${prefix}: missing alt`);
  check(!data.brokenVisibleImages.length, `${prefix}: broken images ${data.brokenVisibleImages}`);
  const tooSmall = data.smallTargets.filter(item => !item.inline);
  check(!tooSmall.length, `${prefix}: controls below 44px ${JSON.stringify(tooSmall)}`);
  if (data.smallTargets.some(item => item.inline)) warnings.push(`${prefix}: inline prose links use the inline-text touch-target exception.`);
  for (const item of data.contrast.filter(item => item.ratio < item.minimum)) errors.push(`${prefix}: flat-background text contrast ${JSON.stringify(item)}`);
  check(data.styles.some(src => src.endsWith("/cytrea.css")) && data.scripts.some(src => src.endsWith("/cytrea.js")), `${prefix}: active greenfield assets missing`);
  check(![...data.styles, ...data.scripts].some(src => /cytrea-v2|legal\.css/.test(src)), `${prefix}: active V2 dependency`);
  const attribute = data.attribution;
  check(attribute?.text === "Web design by Sam" && attribute.url === "https://www.afhdesignsbysam.com/" && attribute.target === "_blank" && /noopener/.test(attribute.rel) && /noreferrer/.test(attribute.rel), `${prefix}: attribution contract`);
  validateStores(data.stores, downloads.resolve(), prefix);
  return data;
}

function validateStores(stores, state, prefix) {
  check(stores.length >= 2, `${prefix}: missing store controls`);
  for (const store of stores) {
    const expected = state[store.platform];
    check(expected && store.url === expected.url && store.state === expected.status && store.label.includes(expected.label) && store.artwork === expected.artwork && store.kind === expected.artworkKind, `${prefix}: store mismatch ${JSON.stringify(store)}`);
  }
}

async function tabs(page, group, prefix) {
  const ids = await group.evaluate(element => [...element.querySelectorAll('[role="tab"]')].filter(tab => tab.closest("[data-switch-group]") === element).map(tab => tab.id));
  for (const id of ids) {
    const tab = page.locator(`#${id}`);
    await tab.click();
    const target = await tab.getAttribute("aria-controls");
    check(await page.locator(`#${target}`).isVisible(), `${prefix}: hidden active panel ${target}`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${prefix}: horizontal overflow after selecting ${id}`);
    const state = await group.evaluate(element => [...element.querySelectorAll('[role="tab"]')].filter(tab => tab.closest("[data-switch-group]") === element).map(tab => ({ selected: tab.getAttribute("aria-selected"), index: tab.tabIndex, hidden: document.getElementById(tab.getAttribute("aria-controls"))?.hidden })));
    check(state.filter(item => item.selected === "true").length === 1 && state.filter(item => item.index === 0).length === 1 && state.every(item => item.hidden === (item.selected !== "true")), `${prefix}: roving tab state ${id}`);
    for (const nested of await page.locator(`#${target} [data-switch-group]`).all()) if (await nested.isVisible()) await tabs(page, nested, prefix);
    report.interactions.push(`${prefix}: tab ${id}`);
  }
  if (ids.length > 1) {
    for (const [start, key, target] of [[ids[0], "End", ids.at(-1)], [ids.at(-1), "Home", ids[0]], [ids[0], "ArrowRight", ids[1]], [ids[0], "ArrowLeft", ids.at(-1)]]) {
      await page.locator(`#${start}`).focus();
      await page.keyboard.press(key);
      check(await page.evaluate(() => document.activeElement.id) === target && await page.locator(`#${target}`).getAttribute("aria-selected") === "true", `${prefix}: tab keyboard ${key}`);
    }
  }
}

async function interactions(page, route, width) {
  const prefix = `${width}px ${route}`;
  // Establish keyboard modality before programmatically selecting focus targets.
  await page.keyboard.press("Tab");
  for (const selector of ['.masthead .identity', '.primary-nav a:visible', '.menu-control:visible', '.action:visible', '.quiet-link:visible', '[role="tab"]:visible', 'form input:not([type="hidden"]):visible', 'form select:visible', 'form textarea:visible', '.footer-attribution', '.colophon nav a']) {
    const target = page.locator(selector).first();
    if (!await target.count() || !await target.isVisible()) continue;
    await target.focus();
    const focus = await target.evaluate(element => { const style = getComputedStyle(element); return { focused: document.activeElement === element, focusVisible: element.matches(":focus-visible"), outline: style.outlineStyle, width: parseFloat(style.outlineWidth), color: style.outlineColor }; });
    check(focus.focused && focus.focusVisible && focus.outline !== "none" && focus.width >= 2, `${prefix}: visible keyboard focus missing ${selector}`);
    report.focusChecks.push({ route, width, selector, ...focus });
  }
  for (const group of await page.locator("[data-switch-group]").all()) if (await group.evaluate(element => !element.parentElement.closest("[data-switch-group]"))) await tabs(page, group, prefix);
  for (const summary of await page.locator("summary:visible").all()) {
    const initial = await summary.evaluate(element => element.parentElement.open);
    await summary.focus(); await page.keyboard.press("Enter");
    check(await summary.evaluate(element => element.parentElement.open) !== initial, `${prefix}: accordion Enter`);
    await page.keyboard.press("Enter");
    check(await summary.evaluate(element => element.parentElement.open) === initial, `${prefix}: accordion close`);
    report.interactions.push(`${prefix}: accordion keyboard`);
  }
  const menu = page.locator(".menu-control");
  if (width <= 900) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await menu.focus(); await page.keyboard.press("Enter");
    check(await menu.getAttribute("aria-expanded") === "true", `${prefix}: mobile menu open`);
    check(await page.locator(".primary-nav a").first().evaluate(element => element === document.activeElement), `${prefix}: menu initial focus`);
    await page.keyboard.press("Escape");
    check(await menu.getAttribute("aria-expanded") === "false" && await menu.evaluate(element => element === document.activeElement), `${prefix}: menu Escape/focus return`);
  } else check(!await menu.isVisible(), `${prefix}: unexpected desktop menu`);
  report.interactions.push(`${prefix}: menu keyboard/Escape`);
  const opener = page.locator('.screen-frame a[aria-haspopup="dialog"]:visible').first();
  if (await opener.count()) {
    await opener.focus(); await page.keyboard.press("Enter");
    const dialog = page.locator("#screenshot-lightbox");
    await dialog.waitFor({ state: "visible" });
    check(await page.locator(".lightbox-close").evaluate(element => element === document.activeElement), `${prefix}: lightbox initial focus`);
    await page.waitForFunction(() => document.querySelector(".lightbox-canvas")?.getAttribute("aria-busy") === "false");
    check(await page.locator(".lightbox-image").evaluate(image => image.complete && image.naturalWidth > 0), `${prefix}: lightbox image`);
    await page.locator(".lightbox-size").click();
    check(await dialog.evaluate(element => element.classList.contains("is-fit")), `${prefix}: lightbox fit`);
    for (let step = 0; step < 5; step++) { await page.keyboard.press("Tab"); check(await dialog.evaluate(element => element.contains(document.activeElement)), `${prefix}: lightbox focus trap`); }
    await page.keyboard.press("Escape");
    check(!await dialog.isVisible() && await opener.evaluate(element => element === document.activeElement), `${prefix}: lightbox Escape/focus return`);
    report.interactions.push(`${prefix}: lightbox image, fit, focus containment, Escape`);
  }
  if (route === "/vendor-partners") {
    const search = page.locator("#vendor-directory-search");
    await search.fill("wingwi");
    check(await page.locator("[data-vendor-search]:visible").count() === 1, `${prefix}: vendor filter`);
    await search.fill("zz-local-no-result");
    check(await page.locator("#vendor-no-results").isVisible(), `${prefix}: vendor empty state`);
    await search.fill("");
    await page.locator("#vendor-category").selectOption("Other");
    check(await page.locator("#other-category-input").isVisible() && await page.locator("#other-category-input").getAttribute("required") !== null, `${prefix}: vendor Other required`);
    await page.locator("#vendor-category").selectOption({ label: "Electricians" });
    check(!await page.locator("#other-category-input").isVisible(), `${prefix}: vendor Other reset`);
    report.interactions.push(`${prefix}: vendor filtering and conditional category`);
  }
}

async function formContracts() {
  for (const file of ["form-config.js", "forms.js", "vendor-intake.js", "apps-script/early-access/Code.gs", "apps-script/vendor-intake/Code.gs"]) {
    const original = readBaseline(file), current = read(file);
    report.sourceContracts.push({ file, baselineSha256: digest(original), currentSha256: digest(current), unchanged: original === current });
    check(original === current, `Preserved form/backend contract changed: ${file}`);
  }
  const ctx = await context(), page = await ctx.newPage();
  for (const [file, route, selector] of [["vendor-partners.html", "/vendor-partners", "#vendor-intake-form"], ["resources.html", "/resources", "#waitlist-form"]]) {
    await page.goto(base + route);
    const comparison = await page.evaluate(({ baselineHtml, selector }) => {
      const summarize = form => {
        // Disabled placeholder options are not successful form controls. Choose
        // the same first usable option in both DOMs before comparing payloads.
        for (const select of form.querySelectorAll("select")) select.value = [...select.options].find(option => !option.disabled && option.value)?.value || "";
        return { action: form.getAttribute("action"), method: form.getAttribute("method").toUpperCase(), target: form.getAttribute("target"), enctype: form.getAttribute("enctype") || "application/x-www-form-urlencoded", fields: [...form.querySelectorAll("[name]")].map(element => ({ name: element.name, tag: element.tagName, type: element.getAttribute("type") || "", required: element.required })).sort((a, b) => a.name.localeCompare(b.name)), serializedNames: [...new FormData(form).keys()].sort() };
      };
      return { baseline: summarize(new DOMParser().parseFromString(baselineHtml, "text/html").querySelector(selector)), current: summarize(document.querySelector(selector)) };
    }, { baselineHtml: readBaseline(file), selector });
    check(JSON.stringify(comparison.baseline) === JSON.stringify(comparison.current), `${file}: endpoint/method/target/field contract changed`);
    const payload = await page.locator(selector).evaluate(form => [...new FormData(form).entries()].map(([name, value]) => ({ name, value: value instanceof File ? `[file:${value.name}]` : value })));
    const baselinePayloadNames = comparison.baseline.serializedNames;
    check(JSON.stringify(payload.map(field => field.name).sort()) === JSON.stringify(baselinePayloadNames), `${file}: serialized payload keys changed`);
    report.forms.push({ file, ...comparison, payloadNames: payload.map(field => field.name), transport: "FormData inspection only; neither form was submitted" });
  }
  await ctx.close();
}

async function downloadStates() {
  for (const status of ["early-access", "public"]) {
    const settings = { ios: { ...downloads.config.ios }, android: { ...downloads.config.android, status } };
    const state = downloads.resolve(settings), ctx = await context(), page = await ctx.newPage();
    await ctx.route(`${base}/download-config.js`, route => route.fulfill({ contentType: "application/javascript", body: `window.CYTREA_DOWNLOADS = { resolve: () => (${JSON.stringify(state)}) };` }));
    for (const route of pageRoutes) {
      await page.goto(base + route);
      const stores = await page.locator("[data-store]").evaluateAll(elements => elements.map(element => ({ platform: element.dataset.store, state: element.dataset.storeState, url: element.href, label: element.getAttribute("aria-label"), artwork: element.querySelector("img[data-store-artwork]")?.getAttribute("src"), kind: element.querySelector("img[data-store-artwork]")?.dataset.artworkKind })));
      validateStores(stores, state, `runtime ${status} ${route}`);
      const file = route === "/" ? "index.html" : `${route.slice(1)}.html`;
      const staticHtml = synchronizeHtml(read(file), state);
      const staticStores = await page.evaluate(html => [...new DOMParser().parseFromString(html, "text/html").querySelectorAll("[data-store]")].map(element => ({ platform: element.dataset.store, state: element.dataset.storeState, url: element.getAttribute("href"), label: element.getAttribute("aria-label"), artwork: element.querySelector("img[data-store-artwork]")?.getAttribute("src"), kind: element.querySelector("img[data-store-artwork]")?.dataset.artworkKind })), staticHtml);
      validateStores(staticStores, state, `static ${status} ${route}`);
      report.downloadStates.push({ route, status, runtimeControls: stores.length, staticControls: staticStores.length, sourceConfigMutated: false });
    }
    await ctx.close();
  }
}

async function main() {
  fs.mkdirSync(out, { recursive: true });
  const approved = downloads.resolve();
  check(approved.apple.status === "public" && approved.apple.url === "https://apps.apple.com/app/cytrea/id6767470963", "Current iOS configuration differs from the approved public App Store URL.");
  check(approved.android.status === "early-access" && approved.android.url === "https://play.google.com/apps/testing/com.cytrea.mobile", "Current Android configuration must remain Early Access at the approved testing URL.");
  const heroPattern = /<section\b[^>]*class="[^"]*\bopening\b[^"]*"[^>]*>[\s\S]*?<\/section>/;
  const baselineHero = readBaseline("index.html").match(heroPattern)?.[0], currentHero = read("index.html").match(heroPattern)?.[0];
  report.heroContract = { unchanged: !!baselineHero && baselineHero === currentHero, baselineSha256: baselineHero && digest(baselineHero), currentSha256: currentHero && digest(currentHero) };
  check(report.heroContract.unchanged, "Approved Home hero markup changed from the starting commit.");
  const sourceFiles = ["cytrea.css", "cytrea.js", "download-config.js", "form-config.js", "forms.js", "vendor-intake.js", ...pageRoutes.map(route => route === "/" ? "index.html" : `${route.slice(1)}.html`)];
  report.startingSourceHashes = Object.fromEntries(sourceFiles.map(file => [file, digest(read(file))]));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const links = new Set(), images = new Set();
  for (const route of routes) { const response = await fetch(base + route); report.routes.push({ route, status: response.status }); check(response.status === 200, `${route}: HTTP ${response.status}`); }
  for (const width of widths) {
    console.log(`Inspecting ${width}px`);
    const ctx = await context({ viewport: { width, height: 900 } }), page = await ctx.newPage();
    page.on("pageerror", error => errors.push(`${width}px browser error: ${error.message}`));
    for (const route of pageRoutes) {
      await page.goto(base + route, { waitUntil: "load" });
      await settleImages(page);
      const data = await metrics(page, route, width);
      data.links.filter(url => url.startsWith(base)).forEach(url => links.add(url));
      data.images.filter(image => image.src.startsWith(base)).forEach(image => images.add(image.src));
      if (["/", "/product", "/vendor-partners", "/resources"].includes(route)) await interactions(page, route, width);
    }
    await ctx.close();
  }
  for (const url of links) {
    const response = await fetch(url), target = new URL(url), body = await response.text();
    const fragmentFound = !target.hash || body.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`);
    report.links.push({ url: url.replace(base, ""), status: response.status, fragmentFound });
    check(response.status === 200 && fragmentFound, `Broken local link/fragment: ${url.replace(base, "")}`);
  }
  for (const url of images) { const response = await fetch(url); report.images.push({ url: url.replace(base, ""), status: response.status }); check(response.status === 200, `Broken image: ${url.replace(base, "")}`); }
  const imageFiles = new Set([...images, ...links].map(url => new URL(url).pathname).filter(file => /^\/images\/.+\.(png|webp|jpe?g|svg)$/i.test(file)));
  for (const image of imageFiles) {
    const file = decodeURIComponent(image.slice(1));
    const original = execFileSync("git", ["show", `${baseline}:${file}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
    const current = fs.readFileSync(path.join(root, file));
    const baselineSha256 = digest(original), currentSha256 = digest(current);
    report.imageContracts.push({ file, baselineSha256, currentSha256, unchanged: baselineSha256 === currentSha256 });
    check(baselineSha256 === currentSha256, `Source image changed: ${file}`);
  }
  await formContracts();
  await downloadStates();
  const reduced = await context({ reducedMotion: "reduce" }), reducedPage = await reduced.newPage();
  for (const route of ["/", "/product", "/vendor-partners"]) {
    await reducedPage.goto(base + route);
    const motion = await reducedPage.evaluate(() => ({ matched: matchMedia("(prefers-reduced-motion: reduce)").matches, scroll: getComputedStyle(document.documentElement).scrollBehavior, longDurations: [...document.querySelectorAll("a,button,.screen-frame,.product-console")].filter(element => element.getClientRects().length).map(element => ({ selector: element.className, transition: getComputedStyle(element).transitionDuration, animation: getComputedStyle(element).animationDuration })).filter(item => [item.transition, item.animation].some(value => value.split(",").some(duration => parseFloat(duration) > 0.01))) }));
    report.reducedMotion.push({ route, ...motion });
    check(motion.matched && motion.scroll !== "smooth" && !motion.longDurations.length, `${route}: reduced-motion contract ${JSON.stringify(motion)}`);
  }
  await reduced.close();
  report.finalSourceHashes = Object.fromEntries(sourceFiles.map(file => [file, digest(read(file))]));
  check(JSON.stringify(report.startingSourceHashes) === JSON.stringify(report.finalSourceHashes), "Website source changed during this QA run; rerun after edits are finished.");
  report.finishedAt = new Date().toISOString();
  report.limitations = ["External HTTP links were inspected but not requested; all off-origin browser traffic was blocked.", "No form submission or backend receipt was tested. Endpoint, field, script, and serialized key contracts were compared to the starting commit.", "Contrast calculations cover opaque text over flat opaque ancestor backgrounds only; gradient/image/translucent surfaces require visual review.", "Automated checks do not establish complete WCAG conformance or a subjective design score.", "Payment-return route HTTP was checked without executing its app deep-link script."];
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  const summary = { routes: report.routes.length, renderedPages: report.pages.length, interactions: report.interactions.length, focusChecks: report.focusChecks.length, links: report.links.length, images: report.images.length, imageContracts: report.imageContracts.length, forms: report.forms.length, downloadStates: report.downloadStates.length, blockedRequests: report.blockedRequests.length, errors, warnings: [...new Set(warnings)] };
  fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  if (errors.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
