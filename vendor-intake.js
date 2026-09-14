/* Existing vendor POST field preparation and response UI, retained from the prior implementation. */
"use strict";
    const intakeForm = document.querySelector("#vendor-intake-form");
    const vendorPhoneInput = document.querySelector("#vendor-phone-input");
    const categorySelect = document.querySelector("#vendor-category");
    const otherCategoryField = document.querySelector("#other-category-field");
    const otherCategoryInput = document.querySelector("#other-category-input");
    const submittedAtInput = document.querySelector("#vendor-submitted-at");
    const primaryCategoryInput = document.querySelector("#vendor-primary-category");
    const logoInput = document.querySelector("#vendor-logo-input");
    const logoFileNameInput = document.querySelector("#vendor-logo-file-name");
    const servicesOfferedInput = document.querySelector("#vendor-services-offered");
    const notesInput = document.querySelector("#vendor-notes-input");
    const notesPayloadInput = document.querySelector("#vendor-notes-payload");
    const vendorSubmitButton = document.querySelector("#vendor-submit-button");
    const vendorSubmissionFeedback = document.querySelector("#vendor-submission-feedback");
    const vendorIntakeFrame = document.querySelector("#vendor-intake-hidden-frame");
    let vendorSubmissionStarted = false;
    let vendorSubmissionTimer;

    const getPhoneDigits = (value) => value.replace(/\D/g, "").slice(0, 10);

    const formatPhoneNumber = (value) => {
      const digits = getPhoneDigits(value);

      if (digits.length <= 3) {
        return digits ? `(${digits}` : "";
      }

      if (digits.length <= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      }

      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    };

    const updatePhoneFormatting = () => {
      if (!vendorPhoneInput) {
        return;
      }

      vendorPhoneInput.value = formatPhoneNumber(vendorPhoneInput.value);
    };

    const setVendorSubmissionFeedback = (state) => {
      if (!vendorSubmissionFeedback) {
        return;
      }

      window.clearTimeout(vendorSubmissionTimer);
      vendorSubmissionFeedback.className = `vendor-submission-feedback vendor-submission-feedback--${state}`;
      vendorSubmissionFeedback.setAttribute("role", state === "error" ? "alert" : "status");
      intakeForm?.setAttribute("aria-busy", String(state === "pending"));

      if (state === "pending") {
        vendorSubmissionFeedback.innerHTML = `
          <p class="feedback-kicker">Submitting application</p>
          <h3>Sending your Vendor Partner application...</h3>
          <p>Please keep this page open while Cytrea receives your information.</p>
        `;
        return;
      }

      if (state === "success") {
        vendorSubmissionFeedback.innerHTML = `
          <p class="feedback-kicker">Application submitted</p>
          <h3>Thank you for submitting your Vendor Partner application.</h3>
          <p>The Cytrea team will review your information and follow up with next steps.</p>
          <div class="feedback-next-steps">
            <strong>What happens next?</strong>
            <ol>
              <li>Cytrea reviews your application</li>
              <li>If approved, your business may be added to the Vendor Partner Directory</li>
              <li>We may contact you to collect your logo file or confirm details</li>
            </ol>
          </div>
        `;
        vendorSubmissionFeedback.focus({ preventScroll: true });
        vendorSubmissionFeedback.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
        return;
      }

      vendorSubmissionFeedback.innerHTML = `
        <p class="feedback-kicker">Submission issue</p>
        <h3>We couldn’t confirm the response.</h3>
        <p>Your details are still here. Please contact support@cytrea.com before trying again.</p>
      `;
      vendorSubmissionFeedback.focus({ preventScroll: true });
      vendorSubmissionFeedback.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    };

    const updateVendorSubmissionFields = () => {
      if (submittedAtInput) {
        submittedAtInput.value = new Date().toISOString();
      }

      if (primaryCategoryInput && categorySelect) {
        primaryCategoryInput.value = categorySelect.selectedOptions[0]?.parentElement?.label || "";
      }

      if (logoFileNameInput && logoInput) {
        logoFileNameInput.value = logoInput.files?.[0]?.name || "";
      }

      if (notesPayloadInput) {
        const notesParts = [];
        const servicesOffered = servicesOfferedInput?.value?.trim();
        const notes = notesInput?.value?.trim();

        if (servicesOffered) {
          notesParts.push(`Services offered: ${servicesOffered}`);
        }

        if (notes) {
          notesParts.push(`Notes: ${notes}`);
        }

        notesPayloadInput.value = notesParts.join("\n\n");
      }
    };

    const updateOtherCategoryField = () => {
      const isOther = categorySelect && categorySelect.value === "Other";

      if (otherCategoryField) {
        otherCategoryField.classList.toggle("is-hidden", !isOther);
      }

      if (otherCategoryInput) {
        otherCategoryInput.required = isOther;
        if (!isOther) {
          otherCategoryInput.value = "";
        }
      }

      updateVendorSubmissionFields();
    };

    if (categorySelect) {
      categorySelect.addEventListener("change", updateOtherCategoryField);
      updateOtherCategoryField();
    }

    if (logoInput) {
      logoInput.addEventListener("change", updateVendorSubmissionFields);
    }

    if (vendorPhoneInput) {
      vendorPhoneInput.addEventListener("beforeinput", (event) => {
        if (!event.data || event.inputType.startsWith("delete")) {
          return;
        }

        if (!/^\d+$/.test(event.data)) {
          event.preventDefault();
        }
      });

      vendorPhoneInput.addEventListener("input", updatePhoneFormatting);
      vendorPhoneInput.addEventListener("paste", () => {
        window.setTimeout(updatePhoneFormatting, 0);
      });
    }

    if (intakeForm) {
      intakeForm.addEventListener("submit", () => {
        updatePhoneFormatting();
        updateVendorSubmissionFields();
        vendorSubmissionStarted = true;

        if (vendorSubmitButton) {
          vendorSubmitButton.disabled = true;
          vendorSubmitButton.textContent = "Submitting...";
        }

        setVendorSubmissionFeedback("pending");
        vendorSubmissionTimer = window.setTimeout(() => {
          vendorSubmissionStarted = false;
          if (vendorSubmitButton) {
            vendorSubmitButton.disabled = false;
            vendorSubmitButton.textContent = "Submit Vendor Application";
          }

          setVendorSubmissionFeedback("error");
        }, 20000);
      });
    }

    if (vendorIntakeFrame) {
      vendorIntakeFrame.addEventListener("load", () => {
        if (!vendorSubmissionStarted) {
          return;
        }

        vendorSubmissionStarted = false;
        if (vendorSubmitButton) {
          vendorSubmitButton.disabled = false;
          vendorSubmitButton.textContent = "Submit Vendor Application";
        }

        intakeForm?.reset();
        updateOtherCategoryField();
        setVendorSubmissionFeedback("success");
      });

      vendorIntakeFrame.addEventListener("error", () => {
        if (!vendorSubmissionStarted) {
          return;
        }

        vendorSubmissionStarted = false;
        if (vendorSubmitButton) {
          vendorSubmitButton.disabled = false;
          vendorSubmitButton.textContent = "Submit Vendor Application";
        }

        setVendorSubmissionFeedback("error");
      });
    }
