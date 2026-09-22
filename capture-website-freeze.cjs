"use strict";
// Local visual evidence only. Never submit forms, request external URLs, inject
// screenshot-only styles, or alter the app imagery. Requires existing Playwright.
const fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
const root = path.join(__dirname, ".verification/final-website-freeze");
const base = "http://127.0.0.1:4173";
const routes = ["/", "/product", "/providers", "/caregivers", "/vendor-partners", "/resources", "/about", "/showcase", "/walkthrough"];
const focus = {
  "/": { hero: ".opening", download: "#download", footer: ".colophon" },
  "/product": { product: ".product-console" },
  "/providers": { features: ".detail-grid" },
  "/caregivers": { features: ".detail-grid" },
  "/vendor-partners": { hero: ".page-opening--network", directory: "#vendor-directory", form: "#vendor-intake" },
  "/showcase": { gallery: "#applicant-review" },
  "/walkthrough": { journey: ".walk-layout" }
};
const report = { startedAt: new Date().toISOString(), captures: [], pages: [], errors: [], blockedRequests: [] };
let browser;

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let top = 0; top < height; top += 650) {
    await page.evaluate(y => scrollTo({ top: y, behavior: "instant" }), top);
    await page.waitForTimeout(110);
  }
  await page.locator("img:visible").evaluateAll(images => Promise.all(images.map(img => img.decode().catch(() => {}))));
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(850);
}

async function renderWidth(width) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, serviceWorkers: "block" });
  await context.route("**/*", async route => {
    const request = route.request();
    if (new URL(request.url()).origin !== base || !["GET", "HEAD"].includes(request.method())) {
      report.blockedRequests.push({ url: request.url(), method: request.method() });
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
  try {
    for (const route of routes) {
      const page = await context.newPage(), slug = route === "/" ? "home" : route.slice(1);
      const directory = path.join(root, `${width}px`);
      fs.mkdirSync(directory, { recursive: true });
      page.on("pageerror", error => report.errors.push(`${route} ${width}: ${error.message}`));
      const response = await page.goto(base + route);
      if (response.status() !== 200) throw Error(`${route}: HTTP ${response.status()}`);
      await settle(page);
      const metrics = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth > innerWidth, hiddenReveals: [...document.querySelectorAll(".reveal-pending")].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== "hidden").length, intentionallyHiddenReveals: [...document.querySelectorAll(".reveal-pending")].filter(el => !el.getClientRects().length || getComputedStyle(el).visibility === "hidden").length, brokenImages: [...document.querySelectorAll("img")].filter(img => img.getClientRects().length && (!img.complete || !img.naturalWidth)).map(img => img.getAttribute("src")) }));
      report.pages.push({ route, width, ...metrics });
      if (metrics.overflow || metrics.hiddenReveals || metrics.brokenImages.length) report.errors.push(`${route} ${width}: incomplete visual state ${JSON.stringify(metrics)}`);
      async function capture(name, selector) {
        const relative = `${width}px/${slug}-${name}.png`, destination = path.join(root, relative);
        if (selector) {
          const element = page.locator(selector).first();
          if (selector === ".masthead") {
            await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
            await page.waitForTimeout(850);
            const box = await element.boundingBox();
            await page.screenshot({ path: destination, clip: { x: 0, y: 0, width, height: Math.ceil(box.height) } });
          } else {
            const box = await element.boundingBox();
            await page.setViewportSize({ width, height: Math.max(1000, Math.ceil(box.height) + 180) });
            await element.evaluate(el => scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + scrollY - 110), behavior: "instant" }));
            await page.waitForTimeout(850);
            await element.screenshot({ path: destination });
            await page.setViewportSize({ width, height: 1000 });
          }
        } else if (name === "full" && route === "/walkthrough" && width > 900) {
          await page.setViewportSize({ width, height: metrics.height });
          await page.waitForTimeout(850);
          await page.screenshot({ path: destination });
          await page.setViewportSize({ width, height: 1000 });
        } else {
          await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
          await page.waitForTimeout(850);
          await page.screenshot({ path: destination, fullPage: name === "full" });
        }
        report.captures.push({ route, width, name, file: relative });
      }
      await capture("top"); await capture("full");
      for (const [name, selector] of Object.entries(focus[route] || {})) await capture(name, selector);
      if (route === "/" && width < 901) {
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page.locator(".menu-control").click(); await capture("menu", ".masthead");
        await page.keyboard.press("Escape");
      }
      await page.close();
      console.log(`Captured ${width}px ${route}`);
    }
  } finally { await context.close(); }
}

async function main() {
  fs.mkdirSync(root, { recursive: true });
  browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  await Promise.all([390, 768, 1440].map(renderWidth));
  report.finishedAt = new Date().toISOString();
  report.captures.sort((a, b) => a.width - b.width || routes.indexOf(a.route) - routes.indexOf(b.route) || a.name.localeCompare(b.name));
  fs.writeFileSync(path.join(root, "captures.json"), JSON.stringify(report, null, 2) + "\n");
  const sections = [390, 768, 1440].map(width => `<section id="width-${width}"><h2>${width}px</h2><div class="grid">${routes.map(route => {
    const images = report.captures.filter(item => item.width === width && item.route === route), top = images.find(item => item.name === "top");
    return `<article><h3>${route === "/" ? "Home" : route.slice(1)}</h3><a href="${top.file}"><img src="${top.file}" alt="${route} at ${width}px" loading="lazy"></a><p>${images.map(item => `<a href="${item.file}">${item.name}</a>`).join(" · ")}</p></article>`;
  }).join("")}</div></section>`).join("");
  fs.writeFileSync(path.join(root, "index.html"), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cytrea final website freeze — local QA</title><style>*{box-sizing:border-box}body{margin:0;background:#f2f7f7;color:#122d3d;font:16px/1.6 system-ui}main{max-width:1320px;margin:auto;padding:32px 24px}h1{line-height:1.2}a{color:#065d65;text-underline-offset:4px}a:focus-visible{outline:3px solid #c57316;outline-offset:4px}nav{display:flex;gap:20px;flex-wrap:wrap}nav a{padding-block:12px}h2{margin-top:48px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}article{padding:20px;background:white;border:1px solid #d3e2e3;border-radius:16px}img{width:100%;height:320px;object-fit:contain;object-position:top}article p{display:flex;gap:10px;flex-wrap:wrap}</style><main><p>LOCAL ONLY · NO PUSH · NO DEPLOY</p><h1>Cytrea final website freeze</h1><p>${report.captures.length} site screenshots. Real page rendering, settled motion, no screenshot-only styling or retouched app imagery.</p><p><a href="technical/summary.json">Regression QA</a> · <a href="captures.json">Capture checks</a> · <a href="/FINAL_WEBSITE_FREEZE.md">Freeze report</a> · <a href="/">Local website</a></p><p>Android remains Early Access. Social profiles remain hidden until verified URLs are supplied.</p><nav aria-label="Viewport evidence"><a href="#width-390">390px</a><a href="#width-768">768px</a><a href="#width-1440">1440px</a></nav>${sections}</main></html>\n`);
  console.log(JSON.stringify({ captures: report.captures.length, pages: report.pages.length, errors: report.errors }));
  if (report.errors.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
