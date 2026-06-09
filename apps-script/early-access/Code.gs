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
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getEarlyAccessSheet(spreadsheet);
    const headers = getOrCreateHeaders(sheet);
    const payload = event && event.parameter ? event.parameter : {};
    const row = headers.map((header) => getEarlyAccessValue(header, payload));

    sheet.appendRow(row);

    return createJsonResponse({
      success: true,
      message: "Early Access submission received."
    });
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: error && error.message ? error.message : String(error)
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
  const normalizedPayload = {};

  Object.keys(payload).forEach((key) => {
    normalizedPayload[normalizeKey(key)] = payload[key];
  });

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

function createJsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
