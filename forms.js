/* Preserve native POST + hidden iframe transport. An opaque frame load is not
 * proof of receipt: existing Apps Script JSON cannot be read cross-origin. */
(function () {
  "use strict";
  const config = window.CYTREA_FORM_CONFIG;
  if (!config) return; // The existing static HTML POST remains the fallback.
  const attached = new WeakSet();

  function attach({ form, frame, feedback, endpoint, kind, prepare = () => {} }) {
    if (!form || !frame || !feedback || !endpoint || attached.has(form)) return;
    attached.add(form);
    form.action = endpoint;
    form.noValidate = true;
    const button = form.querySelector("button[type=submit]");
    const buttonMarkup = button.innerHTML;
    const fields = [...form.elements].filter(field => field.matches("input:not([type=hidden]):not([type=file]), select, textarea") && !field.hasAttribute("data-form-honeypot"));
    const errors = new Map();
    let activeAttempt = null;
    let currentFrame = frame;

    fields.forEach((field, index) => {
      if (!field.id) field.id = `${form.id}-field-${index + 1}`;
      const error = document.createElement("span");
      error.id = `${field.id}-error`;
      error.className = "field-error";
      error.hidden = true;
      field.closest("label")?.append(error);
      errors.set(field, error);
      const clear = () => {
        field.setCustomValidity("");
        field.removeAttribute("aria-invalid");
        const describedBy = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(id => id && id !== error.id);
        if (describedBy.length) field.setAttribute("aria-describedby", describedBy.join(" "));
        else field.removeAttribute("aria-describedby");
        error.hidden = true;
        error.textContent = "";
      };
      field.addEventListener("input", clear);
      field.addEventListener("change", clear);
      if (field.type === "email") field.addEventListener("blur", () => { field.value = field.value.trim().toLowerCase(); });
    });

    function show(state, title, text, focus = true) {
      feedback.hidden = false;
      feedback.classList.remove("is-hidden");
      feedback.dataset.formState = state;
      feedback.classList.toggle("vendor-submission-feedback--error", state === "error");
      feedback.setAttribute("role", state === "error" ? "alert" : "status");
      feedback.setAttribute("aria-live", state === "error" ? "assertive" : "polite");
      const heading = document.createElement("h3");
      heading.textContent = title;
      const copy = document.createElement("p");
      copy.textContent = text;
      feedback.replaceChildren(heading, copy);
      if (focus) {
        feedback.focus({ preventScroll: true });
        feedback.scrollIntoView({ block: "nearest", behavior: "instant" });
      }
    }

    function validate() {
      let firstInvalid = null;
      fields.forEach(field => {
        field.setCustomValidity("");
        if (field.type === "email") field.value = field.value.trim().toLowerCase();
        if (field.required && !field.value.trim()) field.setCustomValidity(field.tagName === "SELECT" ? "Please choose an option." : "Please complete this field.");
        const error = errors.get(field);
        if (field.checkValidity()) {
          field.removeAttribute("aria-invalid");
          error.hidden = true;
          error.textContent = "";
          return;
        }
        let message = field.validationMessage;
        if (field.validity.typeMismatch) message = field.type === "email" ? "Enter a valid email address." : "Enter a valid website URL, such as https://example.com.";
        error.textContent = message;
        error.hidden = false;
        field.setAttribute("aria-invalid", "true");
        const ids = new Set((field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
        ids.add(error.id);
        field.setAttribute("aria-describedby", [...ids].join(" "));
        firstInvalid ||= field;
      });
      if (firstInvalid) {
        show("error", "Please check the highlighted fields.", "Your details are still here. Correct the fields with messages and submit again.", false);
        firstInvalid.focus();
      }
      return !firstInvalid;
    }

    function finish(attempt, outcome) {
      if (activeAttempt !== attempt) return;
      window.clearTimeout(attempt.timer);
      attempt.frame.removeEventListener("load", attempt.onLoad);
      attempt.frame.removeEventListener("error", attempt.onError);
      activeAttempt = null;
      form.setAttribute("aria-busy", "false");
      button.disabled = false;
      button.innerHTML = buttonMarkup;
      // Keep the draft even after completion: users may have edited it while
      // waiting, and the cross-origin response often cannot confirm receipt.
      if (outcome === "success") {
        show("success", kind === "vendor" ? "Thanks for applying to the Cytrea Vendor Partner program." : "Thanks — we received your request.", kind === "vendor" ? "We received your information and will follow up after review." : "The Cytrea team will follow up with next steps.");
      } else if (outcome === "submitted") {
        show("submitted", kind === "vendor" ? "Your application was submitted." : "Your request was submitted.", "We can’t verify receipt from this page. Your details are kept in the form. If you’re unsure whether it arrived, contact support@cytrea.com before submitting again.");
      } else {
        show("error", "We couldn’t confirm your submission.", "Your details are still here and you can try again. The request may already have arrived; contact support@cytrea.com if you’re unsure before retrying.");
      }
    }

    form.addEventListener("submit", event => {
      event.preventDefault();
      if (activeAttempt) return;
      if (form.querySelector("[data-form-honeypot]")?.value.trim()) {
        show("error", "We couldn’t submit this request.", "Your details are still here. Please contact support@cytrea.com if this continues.");
        return;
      }
      prepare();
      if (!validate()) return;
      const nextFrame = currentFrame.cloneNode(false);
      nextFrame.src = "about:blank";
      const attempt = { frame: nextFrame, sent: false };
      activeAttempt = attempt;
      button.disabled = true;
      button.textContent = kind === "vendor" ? "Submitting..." : "Sending...";
      form.setAttribute("aria-busy", "true");
      show("pending", kind === "vendor" ? "Submitting your application…" : "Sending your request…", "Please keep this page open while the request is sent.", false);
      attempt.onError = () => finish(attempt, "error");
      attempt.onLoad = () => {
        if (activeAttempt !== attempt) return;
        if (!attempt.sent) {
          attempt.sent = true;
          // Native serialization keeps the established urlencoded POST contract.
          try { HTMLFormElement.prototype.submit.call(form); }
          catch { finish(attempt, "error"); }
          return;
        }
        try {
          const doc = nextFrame.contentDocument;
          if (doc?.URL === "about:blank") return;
          const result = doc && JSON.parse(doc.body.textContent);
          if (result?.success === true) return finish(attempt, "success");
          if (result?.success === false) return finish(attempt, "error");
        } catch { /* Expected for existing cross-origin Apps Script responses. */ }
        finish(attempt, "submitted");
      };
      nextFrame.addEventListener("load", attempt.onLoad);
      nextFrame.addEventListener("error", attempt.onError);
      attempt.timer = window.setTimeout(() => finish(attempt, "error"), config.responseTimeoutMs);
      // A fresh browsing context isolates every retry from late prior responses.
      currentFrame.replaceWith(nextFrame);
      currentFrame = nextFrame;
    });
  }

  window.CytreaForms = Object.freeze({ attach });
  attach({
    form: document.getElementById("waitlist-form"),
    frame: document.getElementById("waitlist-hidden-frame"),
    feedback: document.getElementById("form-message"),
    endpoint: config.endpoints.onboarding,
    kind: "onboarding"
  });
})();
