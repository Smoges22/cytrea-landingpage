"use strict";
const fs = require("node:fs");
const path = require("node:path");
const config = require("./form-config.js");
const forms = [
  { file: "resources.html", id: "waitlist-form", endpoint: config.endpoints.onboarding },
  { file: "vendor-partners.html", id: "vendor-intake-form", endpoint: config.endpoints.vendor }
];
function synchronize(html, form) {
  const pattern = new RegExp(`<form\\b(?=[^>]*\\bid=["']${form.id}["'])[^>]*>`, "i");
  if (!pattern.test(html)) throw new Error(`Missing form: ${form.id}`);
  return html.replace(pattern, tag => {
    if (!/\baction=["'][^"']*["']/.test(tag)) throw new Error(`Missing action: ${form.id}`);
    return tag.replace(/\baction=["'][^"']*["']/, `action="${form.endpoint}"`);
  });
}
if (require.main === module) {
  const check = process.argv.includes("--check");
  if (process.argv.slice(2).some(arg => arg !== "--check")) throw new Error("Usage: node sync-forms.cjs [--check]");
  const changed = [];
  for (const form of forms) {
    const file = path.join(__dirname, form.file);
    const original = fs.readFileSync(file, "utf8");
    const updated = synchronize(original, form);
    if (original === updated) continue;
    changed.push(form.file);
    if (!check) fs.writeFileSync(file, updated);
  }
  console.log(changed.length ? `${check ? "Needs form sync" : "Updated form actions"}: ${changed.join(", ")}` : "Both static form actions match form-config.js.");
  if (check && changed.length) process.exitCode = 1;
}
module.exports = { forms, synchronize };
