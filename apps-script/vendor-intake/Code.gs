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
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(VENDOR_APPLICATIONS_SHEET_NAME);

    if (!sheet) {
      throw new Error(`Missing sheet: ${VENDOR_APPLICATIONS_SHEET_NAME}`);
    }

    const payload = event && event.parameter ? event.parameter : {};
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
    });

    sheet.appendRow(row);

    return createJsonResponse({
      success: true,
      message: "Vendor Partner application received."
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
    message: "Cytrea Vendor Partner intake endpoint is live."
  });
}

function createJsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
