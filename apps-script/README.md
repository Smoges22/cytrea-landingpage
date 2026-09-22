# Cytrea website form handler references

Each `Code.gs` is a standalone source file for its existing bound Apps Script project. Local hardening does not update either deployed endpoint. Do not deploy, change runtime/access settings, rebind Sheets, or replace deployment IDs without separate authorization.

## Preserved contracts

- Early Access: `role`, `name`, `email` required; `phone`, `city` optional. Normalized header aliases remain supported. Destination: `Early Access`, with the existing first-sheet fallback.
- Vendor: Business Name, Contact Person, Email, Phone, Website, Subcategory, Service Area, Short Description required; Other Category required for Other. Both `Form Type` and `form_type` are accepted. Destination: `Vendor Applications`; column order unchanged.
- Native URL-encoded iframe POST and JSON `{success, message}` remain unchanged. The website cannot confirm receipt from opaque cross-origin responses, including rejection responses. Client validation and endpoints are untouched.

## Local protections

Validate before any sheet access or header write. Reject empty/nonstrings, missing required fields, unsupported roles, invalid email syntax, non-absolute website syntax, ambiguous repeated parameters, and conflicting aliases. Website checking is a basic absolute-URL syntax guard, not a full URL parser or reachability test; no new HTTP-only restriction. Required phone is not identity verification.

Bounds: 64 keys, 128 UTF-16 code units per key, 40,000 per value, 100,000 combined key/value units. Reject oversize input, never silently truncate it. This does not constitute rate limiting.

All appended values pass through `safeSheetText`. A leading `=`, `+`, `-`, `@`, or `*`, even after whitespace/control/format characters, gets an apostrophe prefix. Preserve all original text after the prefix, including international phone numbers. Ordinary and already apostrophe-prefixed values remain unchanged. The wider prefix set is defensive; it is not a claim that every character alone executes a Sheets formula.

Validation messages are static and service errors do not expose internal exception details. Existing success messages and GET health responses remain compatible.

No server-side idempotency was present or added: separate valid requests each append a row. Existing same-page in-flight suppression remains in the frontend.

## Offline verification

From the repository root:

```text
node --check verify-form-handlers.cjs
node --check verify-form-handler-flow.cjs
node verify-form-handlers.cjs
node verify-form-handler-flow.cjs
node sync-forms.cjs --check
git diff --check
```

The first suite needs only Node built-ins. The browser suite needs Playwright and local Chrome (the repository's existing Windows QA setup). Both mock Sheets; all browser POSTs are intercepted. No remote form request is sent. Results go into ignored `.verification/production-acceptance/`.

Before any separately authorized remote update, compare with the actual project source and confirm its V8 runtime and bound spreadsheet. If a runtime/configuration change is needed, stop for approval. Mock append arguments do not certify real Sheets parsing: verify literal display and empty formulas in a separately approved test environment. Follow the controlled live test plan; do not send formula probes or duplicate requests to production.
