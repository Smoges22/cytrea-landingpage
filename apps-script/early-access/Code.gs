const DEFAULT_EARLY_ACCESS_SHEET_NAME = "Early Access";

const DEFAULT_EARLY_ACCESS_COLUMNS = [
  "Submitted At",
  "Role",
  "Name",
  "Email",
  "Phone",
  "City",
  "Source Page",
  "Status"
];

function doPost(event) {
  try {
    const payload = readFormPayload(event, normalizeKey);
    const validationError = validateEarlyAccessPayload(payload);
    if (validationError) {
      return createJsonResponse({ success: false, message: validationError });
    }

    // Validate before any sheet access, including creation of the header row.
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getEarlyAccessSheet(spreadsheet);
    const headers = getOrCreateHeaders(sheet);
    const row = headers.map((header) => safeSheetText(getEarlyAccessValue(header, payload)));

    sheet.appendRow(row);

    return createJsonResponse({
      success: true,
      message: "Early Access submission received."
    });
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: "We could not save your request. Contact support@cytrea.com before retrying if receipt is uncertain."
    });
  }
}

function doGet() {
  return createJsonResponse({
    success: true,
    message: "Cytrea Early Access intake endpoint is live."
  });
}

function getEarlyAccessSheet(spreadsheet) {
  return spreadsheet.getSheetByName(DEFAULT_EARLY_ACCESS_SHEET_NAME) ||
    spreadsheet.getSheets()[0];
}

function getOrCreateHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn > 0) {
    const headers = sheet
      .getRange(1, 1, 1, lastColumn)
      .getValues()[0]
      .map((header) => String(header || "").trim())
      .filter(Boolean);

    if (headers.length > 0) {
      return headers;
    }
  }

  sheet.getRange(1, 1, 1, DEFAULT_EARLY_ACCESS_COLUMNS.length)
    .setValues([DEFAULT_EARLY_ACCESS_COLUMNS]);

  return DEFAULT_EARLY_ACCESS_COLUMNS;
}

function getEarlyAccessValue(header, payload) {
  const normalizedHeader = normalizeKey(header);
  const normalizedPayload = payload;

  if (normalizedHeader === "submittedat" || normalizedHeader === "timestamp") {
    return normalizedPayload[normalizedHeader] || new Date().toISOString();
  }

  if (normalizedHeader === "status") {
    return normalizedPayload[normalizedHeader] || "New";
  }

  if (normalizedHeader === "sourcepage") {
    return normalizedPayload[normalizedHeader] || "https://cytrea.com/";
  }

  return normalizedPayload[normalizedHeader] || "";
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function validateEarlyAccessPayload(payload) {
  if (!payload) return "Invalid form request. Please submit the website form with all required fields.";
  if (["role", "name", "email"].some((key) => !hasVisibleText(payload[key]))) {
    return "Please complete role, name, and email.";
  }
  if (!["caregiver", "provider"].includes(payload.role.trim())) {
    return "Please choose Caregiver or AFH Owner / Provider.";
  }
  if (!isFormEmail(payload.email)) return "Please enter a valid email address.";
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
