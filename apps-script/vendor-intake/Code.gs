const VENDOR_APPLICATIONS_SHEET_NAME = "Vendor Applications";

const VENDOR_APPLICATION_COLUMNS = [
  "Submitted At",
  "Business Name",
  "Contact Person",
  "Email",
  "Phone",
  "Website",
  "Primary Category",
  "Subcategory",
  "Other Category",
  "Service Area",
  "Short Description",
  "Logo File Name",
  "Status",
  "Notes",
  "Source Page",
  "Form Type"
];

function doPost(event) {
  try {
    const payload = readFormPayload(event);
    const validationError = validateVendorPayload(payload);
    if (validationError) {
      return createJsonResponse({ success: false, message: validationError });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(VENDOR_APPLICATIONS_SHEET_NAME);

    if (!sheet) {
      throw new Error(`Missing sheet: ${VENDOR_APPLICATIONS_SHEET_NAME}`);
    }

    const row = VENDOR_APPLICATION_COLUMNS.map((column) => {
      if (column === "Submitted At") {
        return payload[column] || new Date().toISOString();
      }

      if (column === "Status") {
        return payload[column] || "New";
      }

      if (column === "Form Type") {
        return payload[column] || payload.form_type || "vendor_partner_application";
      }

      return payload[column] || "";
    }).map(safeSheetText);

    sheet.appendRow(row);

    return createJsonResponse({
      success: true,
      message: "Vendor Partner application received."
    });
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: "We could not save your application. Contact support@cytrea.com before retrying if receipt is uncertain."
    });
  }
}

function doGet() {
  return createJsonResponse({
    success: true,
    message: "Cytrea Vendor Partner intake endpoint is live."
  });
}

function validateVendorPayload(payload) {
  if (!payload) return "Invalid form request. Please submit the website form with all required fields.";
  const required = ["Business Name", "Contact Person", "Email", "Phone", "Website", "Subcategory", "Service Area", "Short Description"];
  if (required.some((key) => !hasVisibleText(payload[key]))) {
    return "Please complete all required Vendor Partner fields.";
  }
  if (!isFormEmail(payload.Email)) return "Please enter a valid email address.";
  // Preserve the existing type=url contract: an absolute URL, not a bare domain.
  // No URL is fetched and no new HTTP-only scheme restriction is introduced.
  if (!/^[a-z][a-z0-9+.-]*:\S+$/i.test(payload.Website.trim())) {
    return "Please enter a complete website URL, such as https://example.com.";
  }
  if (payload.Subcategory.trim() === "Other" && !hasVisibleText(payload["Other Category"])) {
    return "Please describe your business category when choosing Other.";
  }
  // The current form sends BOTH aliases. Older callers may omit this metadata.
  if (["Form Type", "form_type"].some((key) =>
    payload[key] !== undefined && payload[key] !== "" && payload[key] !== "vendor_partner_application")) {
    return "Invalid application type. Please use the Vendor Partner form.";
  }
  return "";
}

// Keep these small helpers standalone in each independently deployed project.
// Bounds reject, never truncate; leave ample space for ordinary form text.
function readFormPayload(event, normalize = (key) => key) {
  const source = event && event.parameter;
  if (!source || typeof source !== "object" || Array.isArray(source)) return null;
  const keys = Object.keys(source);
  if (!keys.length || keys.length > 64) return null;
  if (event.postData && (
    typeof event.postData.type !== "string" ||
    event.postData.type.split(";")[0].trim().toLowerCase() !== "application/x-www-form-urlencoded"
  )) return null;
  const repeated = event.parameters;
  if (repeated !== undefined && (!repeated || typeof repeated !== "object" ||
    Array.isArray(repeated) || Object.keys(repeated).length !== keys.length)) return null;

  const payload = Object.create(null);
  let totalLength = 0;
  for (const key of keys) {
    const value = source[key];
    const normalized = normalize(key);
    if (!normalized || key.length > 128 || typeof value !== "string" || value.length > 40000 ||
      Object.prototype.hasOwnProperty.call(payload, normalized)) return null;
    totalLength += key.length + value.length;
    if (totalLength > 100000) return null;
    // Apps Script's parameter holds only the FIRST repeated value; inspect all.
    if (repeated !== undefined && (!Object.prototype.hasOwnProperty.call(repeated, key) ||
      !Array.isArray(repeated[key]) || repeated[key].length !== 1 || repeated[key][0] !== value)) return null;
    payload[normalized] = value;
  }
  return payload;
}

function hasVisibleText(value) {
  return typeof value === "string" && /[^\s\p{Cc}\p{Cf}]/u.test(value);
}

function isFormEmail(value) {
  // HTML single-address input semantics; validate a trimmed view, store original.
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value.trim());
}

function safeSheetText(value) {
  const text = value == null ? "" : String(value);
  // Apostrophe forces literal text. Keep every original character, including
  // international-phone '+', whitespace, and an already protective apostrophe.
  return /^[\s\p{Cc}\p{Cf}]*[=+\-@*]/u.test(text) ? "'" + text : text;
}

function createJsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
