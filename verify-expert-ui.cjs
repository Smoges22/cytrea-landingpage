/* Local-only expert UI QA. NODE_PATH must point to an existing Playwright install.
 * No injected styles, removed sticky headers, or forced eager-image attributes.
 * Off-origin traffic is blocked; the two form POSTs are fulfilled inside Playwright.
 * payment-return is inspected with JS off so its app deep link never launches.
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

const repo = __dirname;
const out = path.join(repo, ".verification", "expert-ui-upgrade");
const baselineCommit = "427003dde36cd8e4e5430a0ffe96db4e7989cef5";
const routes = ["/", "/product", "/providers", "/caregivers", "/vendor-partners", "/resources", "/about", "/support", "/privacy", "/terms", "/delete-account", "/pricing", "/payment-return/"];
const visualRoutes = routes.slice(0, 7);
const widths = [390, 430, 768, 1024, 1440];
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".xml": "application/xml" };
const errors = [], warnings = [], imageUrls = new Set(), internalLinks = new Set();
const report = { startedAt: new Date().toISOString(), baselineCommit, widths, viewportHeight: 900, deviceScaleFactor: 1, motion: "normal unless explicitly noted", routes: [], pages: [], interactions: [], forms: [], downloadStates: [], screenshots: [], sourceHashes: {}, errors, warnings };
const check = (value, message) => { if (!value) errors.push(message); };
const slug = route => route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replaceAll("/", "-");
const sourceFile = route => route === "/" ? "index.html" : route.endsWith("/") ? `${route.slice(1)}index.html` : `${route.slice(1)}.html`;
const readBaseline = file => execFileSync("git", ["show", `${baselineCommit}:${file}`], { cwd: repo, encoding: "utf8" });
const hash = data => crypto.createHash("sha256").update(data).digest("hex");
let base, browser;
const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname); }
  catch { response.writeHead(400).end(); return; }
  const target = path.resolve(repo, pathname === "/" ? "index.html" : pathname.replace(/^\/+/, ""));
  if (target !== repo && !target.startsWith(repo + path.sep)) { response.writeHead(403).end(); return; }
  const file = [target, `${target}.html`, path.join(target, "index.html")].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!file) { response.writeHead(404).end("Not found"); return; }
  response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(response);
});

async function guardedContext(options = {}, formMocks) {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, serviceWorkers: "block", ...options });
  await context.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === base) { await route.continue(); return; }
    if (url.hostname === "script.google.com" && formMocks && request.method() === "POST") {
      formMocks.push({ url: request.url(), method: request.method(), body: request.postData() });
      await route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>LOCAL QA MOCK</title><p>No external submission occurred.</p>" });
      return;
    }
    warnings.push(`Blocked off-origin request: ${request.method()} ${request.url()}`);
    await route.abort("blockedbyclient");
  });
  return context;
}

async function frames(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function instantScroll(page, top) {
  await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), top);
  await frames(page);
}

async function loadVisibleImages(page) {
  await page.evaluate(async () => { await document.fonts.ready; });
  const images = await page.locator("img:visible").all();
  for (const image of images) {
    const top = await image.evaluate(element => Math.max(0, element.getBoundingClientRect().top + window.scrollY - 120));
    await instantScroll(page, top);
    await image.evaluate(async element => {
      await Promise.race([element.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 4000))]);
    });
  }
  await instantScroll(page, 0);
  await page.waitForTimeout(180);
}

async function capture(page, width, route, name, fullPage = false) {
  const directory = path.join(out, `${width}px`);
  fs.mkdirSync(directory, { recursive: true });
  const relative = `${width}px/${name}.png`;
  await page.screenshot({ path: path.join(out, relative), fullPage });
  report.screenshots.push({ route, width, file: relative, fullPage, ...await page.evaluate(() => ({ scrollY, pageHeight: document.documentElement.scrollHeight })) });
}

async function focused(page, width, route, name, selector) {
  const locator = page.locator(selector).first();
  if (!await locator.count() || !await locator.isVisible()) { errors.push(`${width} ${route}: missing focus target ${selector}`); return; }
  const top = await locator.evaluate(element => Math.max(0, element.getBoundingClientRect().top + scrollY - (document.querySelector(".masthead")?.getBoundingClientRect().height || 0) - 16));
  await instantScroll(page, top);
  await page.waitForTimeout(180);
  for (const image of await page.locator(`${selector} img:visible`).all()) await image.evaluate(element => Promise.race([element.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 4000))]));
  await capture(page, width, route, name);
}

async function metrics(page, route, width) {
  const data = await page.evaluate(() => {
    const all = [...document.querySelectorAll("*")], ids = all.filter(element => element.id).map(element => element.id);
    const visible = element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(element => ({ level: +element.tagName.slice(1), text: element.textContent.trim() }));
    const controls = [...document.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,summary")].filter(visible).filter(element => !element.classList.contains("skip"));
    const smallTargets = controls.map(element => ({ element, box: element.getBoundingClientRect() })).filter(({ box }) => box.width < 43.5 || box.height < 43.5).map(({ element, box }) => ({ text: element.textContent.trim().slice(0, 90), width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10, tag: element.tagName, html: element.outerHTML.slice(0, 200), inline: element.tagName === "A" && !!element.closest("p,li") && getComputedStyle(element).display === "inline" }));
    return {
      width: innerWidth, pageHeight: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth > innerWidth,
      h1: document.querySelectorAll("h1").length, duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
      headingSkips: headings.filter((heading, index) => index && heading.level > headings[index - 1].level + 1),
      smallTargets, missingAlt: [...document.images].filter(image => !image.hasAttribute("alt")).map(image => image.src),
      unloadedVisibleImages: [...document.images].filter(image => visible(image) && (!image.complete || image.naturalWidth === 0)).map(image => image.src),
      images: [...document.images].map(image => ({ src: image.src, alt: image.alt, visible: visible(image), width: Math.round(image.getBoundingClientRect().width), height: Math.round(image.getBoundingClientRect().height), naturalWidth: image.naturalWidth })),
      styles: [...document.styleSheets].map(sheet => sheet.href), scripts: [...document.scripts].map(script => script.src).filter(Boolean),
      anchors: [...document.querySelectorAll("a[href]")].map(anchor => anchor.getAttribute("href")),
      title: document.title, description: document.querySelector('meta[name="description"]')?.content,
      mainWords: document.querySelector("main")?.innerText.trim().split(/\s+/).length || 0,
      paragraphs: [...document.querySelectorAll("main p")].filter(visible).map(element => ({ text: element.textContent.trim(), lines: Math.round(element.getBoundingClientRect().height / (parseFloat(getComputedStyle(element).lineHeight) || 24)) })).filter(paragraph => paragraph.lines > 4),
      stores: [...document.querySelectorAll("a[data-store]")].map(element => ({ platform: element.dataset.store, state: element.dataset.storeState, href: element.href, label: element.getAttribute("aria-label"), artwork: element.querySelector("[data-store-artwork]")?.getAttribute("src") }))
    };
  });
  Object.assign(data, { route, viewport: width });
  report.pages.push(data);
  const prefix = `${width}px ${route}`;
  check(!data.overflow, `${prefix}: horizontal overflow`);
  check(data.h1 === 1, `${prefix}: H1 count ${data.h1}`);
  check(!data.duplicateIds.length, `${prefix}: duplicate IDs ${data.duplicateIds.join(", ")}`);
  check(!data.headingSkips.length, `${prefix}: heading hierarchy ${JSON.stringify(data.headingSkips)}`);
  check(!data.missingAlt.length, `${prefix}: images missing alt ${data.missingAlt.join(", ")}`);
  check(!data.unloadedVisibleImages.length, `${prefix}: visible image load failures ${data.unloadedVisibleImages.join(", ")}`);
  const strictSmall = data.smallTargets.filter(target => !target.inline);
  check(!strictSmall.length, `${prefix}: controls below 44px ${JSON.stringify(strictSmall)}`);
  if (data.smallTargets.some(target => target.inline)) warnings.push(`${prefix}: inline prose links below 44px; inspect spacing exception manually.`);
  check(data.title && data.description, `${prefix}: missing title/description`);
  check(!data.styles.some(src => /cytrea-v2|legal\.css/.test(src || "")), `${prefix}: legacy CSS`);
  check(!data.scripts.some(src => /cytrea-v2/.test(src)), `${prefix}: legacy JS`);
  check(data.styles.some(src => /\/cytrea\.css$/.test(src || "")), `${prefix}: greenfield CSS missing`);
  check(data.scripts.some(src => /\/download-config\.js$/.test(src)), `${prefix}: download config script missing`);
  const current = downloads.resolve();
  for (const store of data.stores) {
    check(store.href === current[store.platform]?.url, `${prefix}: wrong ${store.platform} URL ${store.href}`);
    if (route !== "/payment-return/") check(store.state === current[store.platform]?.status, `${prefix}: wrong ${store.platform} state`);
  }
  data.images.forEach(image => imageUrls.add(image.src));
  data.anchors.filter(href => href.startsWith("/") || href.startsWith("#")).forEach(href => internalLinks.add(new URL(href, base + route).href));
  return data;
}

async function faqChecks(page, width, route) {
  for (const summary of await page.locator("summary:visible").all()) {
    await summary.focus();
    await page.keyboard.press("Enter");
    check(await summary.evaluate(element => element.closest("details").open), `${width} ${route}: FAQ Enter failed`);
    await page.keyboard.press("Enter");
    check(!await summary.evaluate(element => element.closest("details").open), `${width} ${route}: FAQ close failed`);
    report.interactions.push({ route, width, type: "FAQ keyboard", label: await summary.innerText() });
  }
}

async function tabChecks(page, width, route, group) {
  const ids = await group.evaluate(element => [...element.querySelectorAll('[role="tab"]')].filter(tab => tab.closest("[data-switch-group]") === element).map(tab => tab.id));
  for (const id of ids) {
    const tab = page.locator(`#${id}`);
    await tab.click();
    const target = await tab.getAttribute("aria-controls"), panel = page.locator(`#${target}`);
    check(await panel.isVisible(), `${width} ${route}: tab panel hidden ${id}`);
    check(await tab.getAttribute("aria-selected") === "true", `${width} ${route}: tab not selected ${id}`);
    const state = await group.evaluate(element => [...element.querySelectorAll('[role="tab"]')].filter(tab => tab.closest("[data-switch-group]") === element).map(tab => ({ selected: tab.getAttribute("aria-selected"), tabIndex: tab.tabIndex, panelHidden: document.getElementById(tab.getAttribute("aria-controls"))?.hidden })));
    check(state.filter(tabState => tabState.selected === "true").length === 1 && state.filter(tabState => tabState.tabIndex === 0).length === 1, `${width} ${route}: roving tab state ${id}`);
    check(state.every(tabState => tabState.panelHidden === (tabState.selected !== "true")), `${width} ${route}: one active panel ${id}`);
    report.interactions.push({ route, width, type: "tab", id, panel: target });
    const nested = await panel.locator("[data-switch-group]").all();
    for (const child of nested) if (await child.isVisible()) await tabChecks(page, width, route, child);
    if (route === "/resources" && target === "resource-faq") await faqChecks(page, width, route);
    if (route === "/product" && /-(dashboard|jobs|applicants|profile|applications|credentials)-tab$/.test(id)) {
      await focused(page, width, route, id.replace(/-tab$/, ""), ".product-console");
    }
  }
  if (ids.length > 1) {
    const first = page.locator(`#${ids[0]}`), last = page.locator(`#${ids.at(-1)}`);
    for (const [start, key, expected] of [[first, "End", ids.at(-1)], [last, "Home", ids[0]], [first, "ArrowRight", ids[1]], [first, "ArrowLeft", ids.at(-1)]]) {
      await start.focus();
      await page.keyboard.press(key);
      check(await page.evaluate(() => document.activeElement.id) === expected, `${width} ${route}: ${key} focus ${ids[0]}`);
      check(await page.locator(`#${expected}`).getAttribute("aria-selected") === "true", `${width} ${route}: ${key} selection ${ids[0]}`);
    }
    report.interactions.push({ route, width, type: "keyboard arrows/Home/End", group: ids[0] });
  }
}

async function interactions(page, width, route) {
  const groups = await page.locator("[data-switch-group]").all();
  for (const group of groups) if (await group.evaluate(element => !element.parentElement.closest("[data-switch-group]"))) await tabChecks(page, width, route, group);
  if (route === "/") {
    await page.locator("#role-caregiver-tab").click();
    check(await page.locator("#home-product-caregiver-tab").getAttribute("aria-selected") === "true", `${width}: Home audience→product role sync`);
    await focused(page, width, route, "home-role-caregiver", ".audience-console");
    await page.locator("#home-product-provider-tab").click();
    check(await page.locator("#role-provider-tab").getAttribute("aria-selected") === "true", `${width}: Home product→audience role sync`);
    await faqChecks(page, width, route);
  }
  const menu = page.locator(".menu-control");
  if (width <= 900) {
    check(await menu.isVisible(), `${width} ${route}: mobile menu unavailable`);
    await instantScroll(page, 0);
    await menu.click();
    check(await menu.getAttribute("aria-expanded") === "true", `${width} ${route}: menu not expanded`);
    check(await page.locator(".primary-nav a").first().evaluate(element => element === document.activeElement), `${width} ${route}: menu focus not moved`);
    if (route === "/") await capture(page, width, route, "home-menu-open");
    await page.keyboard.press("Escape");
    check(await menu.getAttribute("aria-expanded") === "false", `${width} ${route}: menu not closed`);
    check(await menu.evaluate(element => element === document.activeElement), `${width} ${route}: menu focus not restored`);
  } else check(!await menu.isVisible(), `${width} ${route}: desktop menu toggle visible`);
  report.interactions.push({ route, width, type: "navigation/Escape/focus" });
  if (route === "/vendor-partners") {
    const search = page.locator("#vendor-directory-search");
    await search.fill("wingwi");
    check(await page.locator("[data-vendor-search]:visible").count() === 1, `${width}: vendor search`);
    await search.fill("zz-local-no-match");
    check(await page.locator("#vendor-no-results").isVisible(), `${width}: vendor empty state`);
    await search.fill("");
    await page.locator("#vendor-category").selectOption("Other");
    check(await page.locator("#other-category-input").isVisible() && await page.locator("#other-category-input").getAttribute("required") !== null, `${width}: vendor Other required field`);
    await page.locator("#vendor-category").selectOption({ label: "Electricians" });
    check(!await page.locator("#other-category-input").isVisible(), `${width}: vendor Other field reset`);
    report.interactions.push({ route, width, type: "vendor search/empty/category" });
  }
}

async function formChecks() {
  const requests = [], context = await guardedContext({ reducedMotion: "reduce" }, requests), page = await context.newPage();
  const contracts = {};
  for (const [name, file, selector] of [["vendor", "vendor-partners.html", "#vendor-intake-form"], ["earlyAccess", "resources.html", "#waitlist-form"]]) {
    const html = readBaseline(file);
    contracts[name] = await page.evaluate(({ html, selector }) => {
      const form = new DOMParser().parseFromString(html, "text/html").querySelector(selector);
      return { endpoint: form.getAttribute("action"), method: form.getAttribute("method").toUpperCase(), target: form.getAttribute("target"), names: [...form.querySelectorAll("[name]")].map(element => element.name).sort() };
    }, { html, selector });
  }
  await page.goto(base + "/vendor-partners");
  check(!await page.locator("#vendor-intake-form").evaluate(form => form.checkValidity()), "Empty vendor form should be invalid");
  await page.locator("#vendor-category").selectOption({ label: "Electricians" });
  for (const [name, value] of Object.entries({ "Business Name": "Local QA Business", "Contact Person": "Local QA", Email: "qa@example.invalid", Phone: "2065550199", Website: "https://example.invalid", "Service Area": "Local QA", "Short Description": "Local contract test only; never sent externally." })) await page.locator(`[name="${name}"]`).fill(value);
  await page.locator("#vendor-services-offered").fill("Electrical");
  await page.locator("#vendor-notes-input").fill("Local QA only");
  await page.locator("#vendor-logo-input").setInputFiles({ name: "local-qa-logo.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>') });
  check(await page.locator('[name="Phone"]').inputValue() === "(206) 555-0199", "Vendor phone formatting");
  await Promise.all([page.waitForRequest(request => request.url() === contracts.vendor.endpoint && request.method() === "POST"), page.locator("#vendor-submit-button").click()]);
  await page.locator(".vendor-submission-feedback--success").waitFor();
  const vendorRequest = requests.at(-1), vendorFields = new URLSearchParams(vendorRequest.body);
  check(vendorFields.get("Primary Category") === "Home & Facility Services", "Vendor category mapping");
  check(vendorFields.get("form_type") === "vendor_partner_application" && vendorFields.get("Form Type") === "vendor_partner_application", "Vendor type contract");
  check(vendorFields.get("Status") === "New" && vendorFields.get("Source Page") === "https://cytrea.com/vendor-partners", "Vendor metadata contract");
  // Native form encoding serializes line breaks as CRLF; compare the same text.
  check(vendorFields.get("Notes")?.replace(/\r\n/g, "\n") === "Services offered: Electrical\n\nNotes: Local QA only", "Vendor notes contract");
  check(vendorFields.get("Phone") === "(206) 555-0199" && !!vendorFields.get("Submitted At"), "Vendor phone/timestamp payload");
  check(vendorFields.get("Logo File Name") === "local-qa-logo.svg", "Vendor logo filename-only contract");
  await page.goto(base + "/resources");
  check(!await page.locator("#waitlist-form").evaluate(form => form.checkValidity()), "Empty onboarding form should be invalid");
  await page.locator('[name="role"]').selectOption("caregiver");
  for (const [name, value] of Object.entries({ name: "Local QA", email: "qa@example.invalid", phone: "2065550199", city: "Local QA" })) await page.locator(`[name="${name}"]`).fill(value);
  await Promise.all([page.waitForRequest(request => request.url() === contracts.earlyAccess.endpoint && request.method() === "POST"), page.locator('#waitlist-form button[type="submit"]').click()]);
  await page.locator("#form-message").waitFor({ state: "visible" });
  const earlyRequest = requests.at(-1), earlyFields = new URLSearchParams(earlyRequest.body);
  check(earlyFields.get("role") === "caregiver", "Onboarding role contract");
  for (const [name, request, fields] of [["vendor", vendorRequest, vendorFields], ["earlyAccess", earlyRequest, earlyFields]]) {
    check(request.url === contracts[name].endpoint && request.method === contracts[name].method, `${name}: endpoint/method changed from baseline`);
    check(JSON.stringify([...fields.keys()].sort()) === JSON.stringify(contracts[name].names), `${name}: field names differ from baseline`);
    report.forms.push({ form: name, url: request.url, method: request.method, fields: [...fields.keys()].sort(), baselineFields: contracts[name].names, transport: "Locally fulfilled Playwright route; no external network submission" });
  }
  check(requests.length === 2, `Expected exactly two local form mocks; saw ${requests.length}`);
  await context.close();
}

async function downloadChecks() {
  const originalConfig = fs.readFileSync(path.join(repo, "download-config.js"), "utf8");
  for (const mode of ["early-access", "public"]) {
    const state = downloads.resolve({ ...downloads.config, android: { ...downloads.config.android, status: mode } });
    const context = await guardedContext();
    if (mode === "public") await context.route(`${base}/download-config.js`, route => route.fulfill({ contentType: "application/javascript", body: originalConfig.replace('status: "early-access"', 'status: "public"') }));
    const page = await context.newPage();
    for (const route of visualRoutes) {
      await page.goto(base + route);
      const states = await page.locator("[data-store=android]").evaluateAll(controls => controls.map(control => ({ url: control.href, label: control.getAttribute("aria-label"), state: control.dataset.storeState, artwork: control.querySelector("[data-store-artwork]")?.getAttribute("src") })));
      check(states.every(control => control.url === state.android.url && control.state === mode && control.label.includes(state.android.label) && (!control.artwork || control.artwork === state.android.artwork)), `${route}: ${mode} runtime download binding`);
      const copy = await page.locator("[data-download-copy]").evaluateAll(nodes => nodes.map(node => ({ key: node.dataset.downloadCopy, text: node.textContent })));
      check(copy.every(node => node.text === state.copy[node.key]), `${route}: ${mode} runtime status copy`);
      const html = fs.readFileSync(path.join(repo, sourceFile(route)), "utf8"), synchronized = synchronizeHtml(html, state);
      check(synchronizeHtml(synchronized, state) === synchronized, `${route}: ${mode} static sync not idempotent`);
      if (mode === "early-access") check(html === synchronized, `${route}: static download fallback needs sync`);
    }
    report.downloadStates.push({ mode, url: state.android.url, artwork: state.android.artwork, isolatedResponseOverride: mode === "public", sourceConfigChanged: false });
    await context.close();
  }
  check(fs.readFileSync(path.join(repo, "download-config.js"), "utf8") === originalConfig, "Public-mode test changed source config");
  const context = await guardedContext({ javaScriptEnabled: false }), page = await context.newPage();
  for (const route of visualRoutes) {
    await page.goto(base + route);
    check(await page.locator("main").isVisible(), `${route}: no-JS main content`);
    for (const control of await page.locator("[data-store]").all()) {
      const platform = await control.getAttribute("data-store");
      check(await control.getAttribute("href") === downloads.resolve()[platform].url, `${route}: no-JS store link`);
    }
  }
  await context.close();
}

async function extraChecks() {
  const context = await guardedContext({ reducedMotion: "reduce", deviceScaleFactor: 2 }), page = await context.newPage();
  await page.goto(base + "/product?role=caregiver");
  check(await page.locator("#product-tour-caregiver-tab").getAttribute("aria-selected") === "true", "Product caregiver query context");
  await page.locator("#product-tour-provider-tab").click();
  check(new URL(page.url()).searchParams.get("role") === "provider", "Product selection updates role query");
  const reduced = await page.locator(".action").first().evaluate(element => ({ transition: getComputedStyle(element).transitionDuration, animation: getComputedStyle(element).animationDuration, scroll: getComputedStyle(document.documentElement).scrollBehavior }));
  check(reduced.transition.split(",").every(duration => parseFloat(duration) === 0), "Reduced motion transitions not disabled");
  check(reduced.scroll !== "smooth", "Reduced motion retains smooth scroll");
  report.interactions.push({ type: "role query / reduced-motion / DPR2", reduced });
  await page.goto(base + "/");
  await page.locator(".menu-control").click();
  await page.setViewportSize({ width: 1024, height: 900 });
  check(!await page.locator(".menu-control").isVisible(), "Menu not hidden after desktop resize");
  await page.setViewportSize({ width: 390, height: 900 });
  check(await page.locator(".menu-control").getAttribute("aria-expanded") === "false", "Menu remains open after breakpoint round trip");
  await context.close();
}

async function main() {
  fs.mkdirSync(out, { recursive: true });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  report.browser = browser.version();
  report.head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
  for (const file of ["cytrea.css", "cytrea.js", "download-config.js", "vendor-intake.js", ...routes.map(sourceFile)]) report.sourceHashes[file] = hash(fs.readFileSync(path.join(repo, file)));
  for (const route of routes) { const response = await fetch(base + route); report.routes.push({ route, status: response.status }); check(response.status === 200, `${route}: HTTP ${response.status}`); }
  for (const width of widths) {
    const context = await guardedContext({ viewport: { width, height: 900 } }), page = await context.newPage();
    page.on("pageerror", error => errors.push(`${width}px JS: ${error.message}`));
    page.on("response", response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${width}px resource ${response.status()}: ${response.url()}`); });
    for (const route of routes.filter(route => route !== "/payment-return/")) {
      await page.goto(base + route, { waitUntil: "load" });
      await loadVisibleImages(page);
      await metrics(page, route, width);
      if (visualRoutes.includes(route)) {
        await instantScroll(page, 0);
        check(await page.evaluate(() => scrollY) === 0, `${width} ${route}: capture not at page top`);
        await capture(page, width, route, `${slug(route)}-full`, true);
        await capture(page, width, route, `${slug(route)}-above-fold`);
        if (route === "/") for (const [name, selector] of [["hero", ".opening-grid"], ["roles", ".audience-console"], ["product", ".product-console"], ["download", "#download"], ["footer", ".colophon"]]) await focused(page, width, route, `home-${name}`, selector);
        if (route === "/vendor-partners") for (const [name, selector] of [["directory", ".partner-row"], ["form", "#vendor-intake"]]) await focused(page, width, route, `vendor-${name}`, selector);
        if (route === "/resources") await focused(page, width, route, "resources-controls", ".resource-switch");
        await interactions(page, width, route);
      }
      console.log(`${width}px ${route} checked`);
    }
    await context.close();
    const safeContext = await guardedContext({ viewport: { width, height: 900 }, javaScriptEnabled: false }), safePage = await safeContext.newPage();
    await safePage.goto(base + "/payment-return/");
    // DevTools can synchronously inspect a JS-disabled document, but animation
    // frames/font-ready callbacks do not run there. Native load is sufficient
    // for this simple route and avoids executing its app-opening script.
    const safeMetrics = await metrics(safePage, "/payment-return/", width);
    safeMetrics.javascriptDisabledToPreventAppDeepLink = true;
    await safeContext.close();
  }
  for (const href of internalLinks) {
    const url = new URL(href), response = await fetch(url);
    check(response.status === 200, `Broken internal link ${href}`);
    if (url.hash && response.ok) { const body = await response.text(); check(body.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Missing fragment ${href}`); }
  }
  for (const src of imageUrls) { if (src.startsWith(base)) check((await fetch(src)).status === 200, `Broken image source ${src}`); else errors.push(`Unexpected external image ${src}`); }
  await formChecks();
  await downloadChecks();
  await extraChecks();
  report.internalLinks = internalLinks.size;
  report.imageSources = imageUrls.size;
  report.completedAt = new Date().toISOString();
  report.summary = { routes: report.routes.length, responsivePageChecks: report.pages.length, screenshots: report.screenshots.length, interactionChecks: report.interactions.length, mockedForms: report.forms.length, errors: errors.length, warnings: warnings.length };
  console.log(JSON.stringify(report.summary, null, 2));
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
}

main().catch(error => { errors.push(error.stack || error.message); console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  server.close();
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "qa-report.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(out, "screenshot-index.json"), JSON.stringify(report.screenshots, null, 2));
});
