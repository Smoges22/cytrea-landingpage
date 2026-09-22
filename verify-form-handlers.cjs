"use strict";
// Offline only. Each standalone Apps Script runs in a VM with in-memory Google
// services, no credentials, no network, and no real spreadsheet or deployment.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const root = __dirname;
const baseline = "5b4662dc270082ef7c6ac78173574f9ee8a232ca";
const definitions = [
  {
    name: "early-access", sheet: "Early Access",
    columns: ["Submitted At", "Role", "Name", "Email", "Phone", "City", "Source Page", "Status"],
    valid: { role: "caregiver", name: "QA Example", email: "qa@example.test", phone: "+1 206-555-0199", city: "Seattle" },
    required: ["role", "name", "email"],
    textFields: { name: "Name", phone: "Phone", city: "City", "Source Page": "Source Page", Status: "Status", "Submitted At": "Submitted At" }
  },
  {
    name: "vendor-intake", sheet: "Vendor Applications",
    columns: ["Submitted At", "Business Name", "Contact Person", "Email", "Phone", "Website", "Primary Category", "Subcategory", "Other Category", "Service Area", "Short Description", "Logo File Name", "Status", "Notes", "Source Page", "Form Type"],
    valid: { "Business Name": "QA Example", "Contact Person": "QA Tester", Email: "qa@example.test", Phone: "+1 206-555-0199", Website: "https://example.test", Subcategory: "Electricians", "Service Area": "Washington", "Short Description": "Local test only.", "Form Type": "vendor_partner_application", form_type: "vendor_partner_application" },
    required: ["Business Name", "Contact Person", "Email", "Phone", "Website", "Subcategory", "Service Area", "Short Description"],
    textFields: Object.fromEntries(["Submitted At", "Business Name", "Contact Person", "Phone", "Primary Category", "Subcategory", "Other Category", "Service Area", "Short Description", "Logo File Name", "Status", "Notes", "Source Page"].map(key => [key, key]))
  }
];
const results = [];
function test(label, run) {
  try { run(); results.push({ label, pass: true }); }
  catch (error) { results.push({ label, pass: false, error: error.message }); }
}
function eventFor(payload) {
  return {
    parameter: { ...payload },
    parameters: Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, [value]])),
    postData: { type: "application/x-www-form-urlencoded", contents: new URLSearchParams(payload).toString() }
  };
}
function harness(definition, options = {}) {
  const rows = [], headerWrites = [], calls = [];
  let headers = options.headers === undefined ? definition.columns : options.headers;
  const sheet = {
    getLastColumn() { return headers.length; },
    getRange() { return {
      getValues() { return [headers]; },
      setValues(values) { headerWrites.push(Array.from(values[0])); headers = Array.from(values[0]); }
    }; },
    appendRow(row) {
      if (options.appendError) throw new Error("PRIVATE spreadsheet-id secret@example.test");
      rows.push(Array.from(row));
    }
  };
  const spreadsheet = {
    getSheetByName(name) { calls.push(["getSheetByName", name]); return options.missingNamedSheet ? null : sheet; },
    getSheets() { calls.push(["getSheets"]); return options.noSheets ? [] : [sheet]; }
  };
  const sandbox = {
    SpreadsheetApp: { getActiveSpreadsheet() {
      calls.push(["getActiveSpreadsheet"]);
      if (options.accessError) throw new Error("PRIVATE spreadsheet-id secret@example.test");
      return spreadsheet;
    } },
    ContentService: { MimeType: { JSON: "application/json" }, createTextOutput(text) {
      return { text, setMimeType(mime) { this.mime = mime; return this; } };
    } }
  };
  const file = path.join(root, "apps-script", definition.name, "Code.gs");
  const source = fs.readFileSync(file, "utf8");
  new vm.Script(source, { filename: file }); // Full .gs syntax check, not an extension guess.
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 1000 });
  function response(output) {
    assert.equal(output.mime, "application/json");
    const data = JSON.parse(output.text);
    assert.equal(typeof data.success, "boolean");
    assert.equal(typeof data.message, "string");
    assert.ok(data.message.length > 0);
    return data;
  }
  return { rows, headerWrites, calls, sandbox,
    post(event) { sandbox.testEvent = event; return response(vm.runInContext("doPost(testEvent)", sandbox, { timeout: 1000 })); },
    get() { return response(sandbox.doGet()); }
  };
}
function rejected(definition, event) {
  const h = harness(definition, { headers: [] });
  assert.equal(h.post(event).success, false);
  assert.deepEqual(h.rows, []);
  assert.deepEqual(h.headerWrites, []);
  assert.deepEqual(h.calls, [], "invalid request must not access Sheets at all");
}
const prefixes = ["", " ", "\t", "\r\n", "\u0000", "\u00a0", "\u200b", "\u200e", "\u202e", "\u2060", "\ufeff", " \t\u200b"];
const formulaStarts = ["=1+1", "+123", "-123", "@SUM(A1:A2)", "*ordinary-looking bullet"];
const normalText = ["Ordinary text", "O'Connor", "Élodie — 東京", "line one\nline two", "  Keep spacing  ", "A+B=3", "'=1+1", " \t'=1+1", "123", "🙂 Hello"];

for (const d of definitions) {
  test(`${d.name}: syntax and valid response/column order/destination`, () => {
    const h = harness(d);
    assert.equal(h.post(eventFor(d.valid)).success, true);
    assert.equal(h.rows.length, 1);
    assert.equal(h.rows[0].length, d.columns.length);
    assert.deepEqual(h.calls, [["getActiveSpreadsheet"], ["getSheetByName", d.sheet]]);
    assert.equal(h.rows[0][d.columns.indexOf("Status")], "New");
    assert.ok(!Number.isNaN(Date.parse(h.rows[0][0])));
  });
  test(`${d.name}: GET health never writes`, () => {
    const h = harness(d); assert.equal(h.get().success, true); assert.deepEqual(h.calls, []); assert.deepEqual(h.rows, []);
  });
  for (const field of d.required) {
    for (const blank of [undefined, "", " \t\r\n", "\u200b\ufeff"]) {
      test(`${d.name}: missing/blank ${field} ${JSON.stringify(blank)}`, () => {
        const payload = { ...d.valid, [field]: blank };
        if (blank === undefined) delete payload[field];
        rejected(d, eventFor(payload));
      });
    }
  }
  for (const [label, event] of [
    ["missing event", undefined], ["null event", null], ["missing parameters", {}],
    ["empty request", eventFor({})], ["array request", { parameter: [] }],
    ["string request", { parameter: "name=test" }]
  ]) test(`${d.name}: ${label}`, () => rejected(d, event));
  for (const value of [[], {}, null, 42, false]) test(`${d.name}: nonscalar field ${JSON.stringify(value)}`, () => {
    rejected(d, eventFor({ ...d.valid, [d.required[0]]: value }));
  });
  test(`${d.name}: repeated parameter rejected, including equal repeats`, () => {
    for (const second of [d.valid[d.required[0]], "different"]) {
      const event = eventFor(d.valid); event.parameters[d.required[0]].push(second); rejected(d, event);
    }
  });
  test(`${d.name}: inconsistent parameter maps rejected`, () => {
    for (const change of [e => delete e.parameters[d.required[0]], e => e.parameters.extra = ["unexpected"], e => e.parameters[d.required[0]] = ["different"], e => e.parameters = []]) {
      const event = eventFor(d.valid); change(event); rejected(d, event);
    }
  });
  test(`${d.name}: supplied non-form content type rejected`, () => {
    const event = eventFor(d.valid); event.postData.type = "application/json"; rejected(d, event);
  });
  test(`${d.name}: charset and older scalar-only events compatible`, () => {
    const h = harness(d), event = eventFor(d.valid); event.postData.type += "; charset=UTF-8";
    assert.equal(h.post(event).success, true);
    assert.equal(h.post({ parameter: d.valid }).success, true);
  });
  test(`${d.name}: cell/request/key bounds reject before Sheets`, () => {
    rejected(d, eventFor({ ...d.valid, extra: "a".repeat(40001) }));
    rejected(d, eventFor({ ...d.valid, a: "a".repeat(40000), b: "b".repeat(40000), c: "c".repeat(40000) }));
    rejected(d, eventFor({ ...d.valid, ["k".repeat(129)]: "value" }));
    rejected(d, eventFor({ ...d.valid, ...Object.fromEntries(Array.from({ length: 65 }, (_, i) => [`extra${i}`, "v"])) }));
  });
  const emailField = d.name === "early-access" ? "email" : "Email";
  for (const email of ["bad", "a@", "@example.test", "a b@example.test", "a@example..test", "a@-example.test", "a@example.test,b@example.test", "a\n@example.test"]) {
    test(`${d.name}: malformed email ${JSON.stringify(email)}`, () => rejected(d, eventFor({ ...d.valid, [emailField]: email })));
  }
  test(`${d.name}: email subaddress/case/local host preserved`, () => {
    for (const email of [" QA+Tag@Example.Test ", "a@localhost", "o'connor@example.test"]) {
      const h = harness(d); assert.equal(h.post(eventFor({ ...d.valid, [emailField]: email })).success, true);
      assert.equal(h.rows[0][d.columns.indexOf("Email")], email);
    }
  });
  for (const [field, column] of Object.entries(d.textFields)) {
    for (const formula of formulaStarts) {
      test(`${d.name}: literal ${field} ${formula[0]} across ${prefixes.length} control/space prefixes`, () => {
        for (const prefix of prefixes) {
          const h = harness(d), value = prefix + formula;
          assert.equal(h.post(eventFor({ ...d.valid, [field]: value })).success, true);
          assert.equal(h.rows[0][d.columns.indexOf(column)], "'" + value);
        }
      });
    }
    test(`${d.name}: exact ordinary text preserved in ${field}`, () => {
      for (const value of normalText) {
        const h = harness(d); assert.equal(h.post(eventFor({ ...d.valid, [field]: value })).success, true);
        assert.equal(h.rows[0][d.columns.indexOf(column)], value);
      }
    });
  }
  test(`${d.name}: valid formula-prefixed email becomes literal`, () => {
    for (const value of ["=qa@example.test", "+qa@example.test", "-qa@example.test", "*qa@example.test"]) {
      const h = harness(d); assert.equal(h.post(eventFor({ ...d.valid, [emailField]: value })).success, true);
      assert.equal(h.rows[0][d.columns.indexOf("Email")], "'" + value);
    }
  });
  test(`${d.name}: all cell helper cases, including existing apostrophe`, () => {
    const h = harness(d);
    assert.equal(h.sandbox.safeSheetText(null), "");
    for (const text of normalText) assert.equal(h.sandbox.safeSheetText(text), text);
    const longText = "=" + "a".repeat(39999);
    assert.equal(h.sandbox.safeSheetText(longText), "'" + longText);
  });
  test(`${d.name}: repeat requests remain independent, not falsely deduplicated`, () => {
    const h = harness(d);
    for (let i = 0; i < 3; i++) assert.equal(h.post(eventFor(d.valid)).success, true);
    assert.equal(h.rows.length, 3);
  });
  test(`${d.name}: no success or sensitive error text on service failure`, () => {
    for (const options of [{ accessError: true }, { appendError: true }]) {
      const h = harness(d, options), response = h.post(eventFor(d.valid));
      assert.equal(response.success, false); assert.doesNotMatch(response.message, /PRIVATE|spreadsheet-id|secret@example/); assert.equal(h.rows.length, 0);
    }
  });
}
const early = definitions[0], vendor = definitions[1];
test("early-access: both roles accepted; unknown role rejected", () => {
  assert.equal(harness(early).post(eventFor({ ...early.valid, role: "provider" })).success, true);
  for (const role of ["admin", "=1+1", "Caregiver"]) rejected(early, eventFor({ ...early.valid, role }));
});
test("early-access: normalized header/field aliases and custom column fidelity", () => {
  const h = harness(early, { headers: ["Timestamp", "Full Custom Field", "e-mail", "Name", "ROLE"] });
  assert.equal(h.post(eventFor({ Role: "provider", Name: "QA", "E-mail": "qa@example.test", "Full Custom Field": "\t=1+1" })).success, true);
  assert.deepEqual(h.rows[0].slice(1), ["'\t=1+1", "qa@example.test", "QA", "provider"]);
});
test("early-access: conflicting normalized aliases rejected", () => {
  rejected(early, eventFor({ ...early.valid, Name: "ambiguous" }));
});
test("early-access: existing header creation and first-sheet fallback unchanged", () => {
  const h = harness(early, { headers: [], missingNamedSheet: true });
  assert.equal(h.post(eventFor(early.valid)).success, true);
  assert.deepEqual(h.headerWrites, [early.columns]);
  assert.deepEqual(h.calls, [["getActiveSpreadsheet"], ["getSheetByName", "Early Access"], ["getSheets"]]);
});
test("vendor: missing destination is error; no sheet creation or fallback", () => {
  const h = harness(vendor, { missingNamedSheet: true });
  assert.equal(h.post(eventFor(vendor.valid)).success, false);
  assert.deepEqual(h.rows, []); assert.deepEqual(h.calls, [["getActiveSpreadsheet"], ["getSheetByName", "Vendor Applications"]]);
});
test("vendor: conditional Other is required, visible text retained", () => {
  for (const value of [undefined, "", " \t", "\u200b"]) {
    const payload = { ...vendor.valid, Subcategory: "Other" };
    if (value !== undefined) payload["Other Category"] = value;
    rejected(vendor, eventFor(payload));
  }
  const h = harness(vendor);
  assert.equal(h.post(eventFor({ ...vendor.valid, Subcategory: "Other", "Other Category": "  Specialist  " })).success, true);
  assert.equal(h.rows[0][vendor.columns.indexOf("Other Category")], "  Specialist  ");
});
test("vendor: both form-type aliases/defaults remain compatible; invalid values rejected", () => {
  for (const omitted of [["Form Type"], ["form_type"], ["Form Type", "form_type"]]) {
    const payload = { ...vendor.valid }; omitted.forEach(key => delete payload[key]);
    const h = harness(vendor); assert.equal(h.post(eventFor(payload)).success, true);
    assert.equal(h.rows[0].at(-1), "vendor_partner_application");
  }
  for (const key of ["Form Type", "form_type"]) rejected(vendor, eventFor({ ...vendor.valid, [key]: "different" }));
});
test("vendor: absolute website URL syntax without new scheme restriction", () => {
  for (const value of ["example.test", "https://bad host", "/relative", "https:"]) rejected(vendor, eventFor({ ...vendor.valid, Website: value }));
  for (const value of ["https://example.test/a?q=1#b", "http://localhost:8080/path", "ftp://example.test", " https://例え.test/ "]) {
    const h = harness(vendor); assert.equal(h.post(eventFor({ ...vendor.valid, Website: value })).success, true);
    assert.equal(h.rows[0][vendor.columns.indexOf("Website")], value);
  }
});
test("frontend contract/client validation bytes unchanged from approved baseline", () => {
  for (const file of ["form-config.js", "forms.js", "vendor-intake.js", "resources.html", "vendor-partners.html"]) {
    const previous = execFileSync("git", ["show", `${baseline}:${file}`], { cwd: root, encoding: "utf8" });
    // git normalizes CRLF; compare the actual tracked content, not checkout EOLs.
    assert.equal(fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n"), previous.replace(/\r\n/g, "\n"), file);
  }
});
test("independent project common helpers stay identical", () => {
  const a = harness(early).sandbox, b = harness(vendor).sandbox;
  for (const name of ["readFormPayload", "hasVisibleText", "isFormEmail", "safeSheetText"]) assert.equal(a[name].toString(), b[name].toString());
});
const report = { checkedAt: new Date().toISOString(), baseline, scope: "Offline mocked handlers only; no network or real Sheets", cases: results.length, passed: results.filter(r => r.pass).length, failures: results.filter(r => !r.pass), results };
const output = path.join(root, ".verification", "production-acceptance", "form-handler-hardening-tests.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ cases: report.cases, passed: report.passed, failures: report.failures, output }, null, 2));
if (report.failures.length) process.exitCode = 1;
