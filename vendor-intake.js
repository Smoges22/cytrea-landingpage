/* Vendor payload preparation only. Shared validation/POST states live in forms.js. */
(function () {
  "use strict";
  const form = document.getElementById("vendor-intake-form");
  if (!form) return;
  const category = document.getElementById("vendor-category");
  const otherField = document.getElementById("other-category-field");
  const otherInput = document.getElementById("other-category-input");
  const logo = document.getElementById("vendor-logo-input");

  function prepare() {
    document.getElementById("vendor-submitted-at").value = new Date().toISOString();
    document.getElementById("vendor-primary-category").value = category.selectedOptions[0]?.parentElement?.label || "";
    document.getElementById("vendor-logo-file-name").value = logo.files?.[0]?.name || "";
    const services = document.getElementById("vendor-services-offered").value.trim();
    const notes = document.getElementById("vendor-notes-input").value.trim();
    document.getElementById("vendor-notes-payload").value = [
      services ? `Services offered: ${services}` : "",
      notes ? `Notes: ${notes}` : ""
    ].filter(Boolean).join("\n\n");
  }

  function updateCategory() {
    const isOther = category.value === "Other";
    otherField.classList.toggle("is-hidden", !isOther);
    otherInput.required = isOther;
    if (!isOther) {
      otherInput.value = "";
      otherInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    prepare();
  }
  category.addEventListener("change", updateCategory);
  logo.addEventListener("change", prepare);
  updateCategory();

  window.CytreaForms?.attach({
    form,
    frame: document.getElementById("vendor-intake-hidden-frame"),
    feedback: document.getElementById("vendor-submission-feedback"),
    endpoint: window.CYTREA_FORM_CONFIG?.endpoints.vendor,
    kind: "vendor",
    prepare
  });
})();
