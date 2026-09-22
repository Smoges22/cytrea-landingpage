"use strict";
// Browser-to-handler integration entirely local: every POST is intercepted and
// fulfilled from an Apps Script VM with mocked Sheets. Never forwards requests.
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { chromium } = require("playwright");
const { createPreviewServer } = require("./preview-server.js");
const config = require("./form-config.js");
const definitions = [
  { kind: "onboarding", route: "/resources/", form: "#waitlist-form", feedback: "#form-message", handler: "early-access", name: "name",
    fields: { role: "caregiver", name: "QA Example", email: "qa@example.test", phone: "+1 206-555-0199", city: "Seattle" } },
  { kind: "vendor", route: "/vendor-partners/", form: "#vendor-intake-form", feedback: "#vendor-submission-feedback", handler: "vendor-intake", name: "Business Name",
    fields: { "Business Name": "QA Example", "Contact Person": "QA Tester", Email: "qa@example.test", Phone: "+1 206-555-0199", Website: "https://example.test", Subcategory: "Electricians", "Service Area": "Washington", "Short Description": "Local simulation only." } }
];
const report = { checkedAt: new Date().toISOString(), cases: [], blocked: [], errors: [], liveSubmissions: 0 };
let browser, server;
function runHandler(definition, parameters) {
  const rows = [], headers = [];
  const sheet = { getLastColumn: () => 0, getRange: () => ({ setValues: values => headers.push(values), getValues: () => [[]] }), appendRow: row => rows.push(Array.from(row)) };
  const sandbox = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet, getSheets: () => [sheet] }) },
    ContentService: { MimeType: { JSON: "application/json" }, createTextOutput: text => ({ text, setMimeType() { return this; } }) },
    event: { parameter: parameters, parameters: Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key, [value]])), postData: { type: "application/x-www-form-urlencoded" } }
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "apps-script", definition.handler, "Code.gs"), "utf8"), sandbox, { timeout: 1000 });
  const text = vm.runInContext("doPost(event).text", sandbox, { timeout: 1000 });
  return { text, rows, headers, result: JSON.parse(text) };
}
async function runCase(base, definition, mode) {
  const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const posts = [], held = [];
  const opaque = mode.startsWith("opaque");
  const endpoint = opaque ? config.endpoints[definition.kind] : base + "/__mock/" + definition.kind;
  page.on("pageerror", error => report.errors.push(error.message));
  await context.route("**/*", async route => {
    const request = route.request(), url = request.url();
    if (url === base + "/form-config.js") return route.fulfill({ contentType: "application/javascript", body: "window.CYTREA_FORM_CONFIG=" + JSON.stringify({ ...config, endpoints: { ...config.endpoints, [definition.kind]: endpoint } }) });
    if (url === endpoint && request.method() === "POST") {
      assert.match(request.headers()["content-type"], /^application\/x-www-form-urlencoded/);
      const parameters = Object.fromEntries(new URLSearchParams(request.postData()));
      if (mode.endsWith("rejection")) delete parameters[definition.name]; // Bypass browser only inside the test.
      const response = runHandler(definition, parameters);
      posts.push(response);
      if (mode === "rapid") { held.push({ route, response }); return; }
      return route.fulfill({ status: 200, contentType: "application/json", body: response.text });
    }
    if (new URL(url).origin === base && ["GET", "HEAD"].includes(request.method())) return route.continue();
    report.blocked.push({ url, method: request.method() });
    return route.abort();
  });
  try {
    await page.goto(base + definition.route);
    const form = page.locator(definition.form), feedback = page.locator(definition.feedback);
    for (const [name, value] of Object.entries(definition.fields)) {
      const field = form.locator(`[name="${name}"]`);
      if (await field.evaluate(element => element.tagName === "SELECT")) await field.selectOption(value);
      else await field.fill(value);
    }
    if (mode === "client-validation") await form.locator('input[type="email"]').fill("invalid-email");
    await form.locator('button[type="submit"]').click();
    if (mode === "rapid") {
      await page.waitForFunction(selector => document.querySelector(selector).dataset.formState === "pending", definition.feedback);
      await form.evaluate(element => { element.requestSubmit(); element.requestSubmit(); });
      await page.waitForTimeout(150);
      assert.equal(posts.length, 1, "in-flight browser guard prevents duplicate POST");
      assert.equal(await form.locator('button[type="submit"]').isDisabled(), true);
      await held[0].route.fulfill({ status: 200, contentType: "application/json", body: held[0].response.text });
    }
    const state = mode === "client-validation" || mode === "readable-rejection" ? "error" : opaque ? "submitted" : "success";
    await page.waitForFunction(({ selector, state }) => document.querySelector(selector).dataset.formState === state, { selector: definition.feedback, state });
    assert.equal(posts.length, mode === "client-validation" ? 0 : 1);
    if (posts.length) {
      const rejected = mode.endsWith("rejection");
      assert.equal(posts[0].result.success, !rejected);
      assert.equal(posts[0].rows.length, rejected ? 0 : 1);
      if (rejected) assert.equal(posts[0].headers.length, 0);
      else assert.ok(posts[0].rows[0].includes("'+1 206-555-0199"), "actual serialized phone is protected at the sheet boundary");
    }
    assert.equal(await form.locator(`[name="${definition.name}"]`).inputValue(), "QA Example");
    assert.equal(await form.locator('button[type="submit"]').isEnabled(), true);
    if (opaque) assert.match(await feedback.innerText(), /can’t verify receipt/);
    report.cases.push({ kind: definition.kind, mode, pass: true, state, mockedRows: posts.reduce((sum, post) => sum + post.rows.length, 0), postsIntercepted: posts.length });
  } finally { await context.close(); }
}
async function main() {
  server = createPreviewServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  for (const definition of definitions) {
    for (const mode of ["readable-success", "readable-rejection", "opaque-success", "opaque-rejection", "client-validation", "rapid"]) {
      await runCase(base, definition, mode);
    }
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.blocked, [], "no unexpected off-origin requests");
}
main().catch(error => { report.errors.push(error.stack); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  const output = path.join(__dirname, ".verification", "production-acceptance", "form-handler-flow-tests.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ cases: report.cases.length, errors: report.errors, liveSubmissions: report.liveSubmissions, output }, null, 2));
});
