const siteHeader = document.querySelector(".site-header");
const headerInner = document.querySelector(".header-inner");
const desktopNav = document.querySelector(".site-nav");

if (siteHeader && headerInner && desktopNav) {
  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "menu-toggle";
  menuButton.setAttribute("aria-label", "Open menu");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.innerHTML = "<span></span>";

  const mobilePanel = document.createElement("div");
  mobilePanel.className = "mobile-panel";
  mobilePanel.id = "mobile-menu";
  mobilePanel.innerHTML = `<div class="mobile-panel-inner">${desktopNav.innerHTML}</div>`;

  menuButton.setAttribute("aria-controls", mobilePanel.id);
  headerInner.appendChild(menuButton);
  siteHeader.appendChild(mobilePanel);

  const setMenuOpen = (isOpen) => {
    siteHeader.classList.toggle("is-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  };

  menuButton.addEventListener("click", () => {
    setMenuOpen(!siteHeader.classList.contains("is-open"));
  });

  mobilePanel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });
}

const waitlistForm = document.querySelector("#waitlist-form");
const waitlistMessage = document.querySelector("#form-message");

if (waitlistForm && waitlistMessage) {
  const submitButton = waitlistForm.querySelector("button[type='submit']");
  const roleSelect = waitlistForm.querySelector('select[name="role"]');
  const defaultText = submitButton ? submitButton.textContent.trim() : "Join Early Access";

  const confirmations = {
    caregiver: {
      title: "You are on the Cytrea caregiver early access list.",
      body: "Thank you. We will send onboarding instructions when caregiver invitations open."
    },
    provider: {
      title: "You are on the Cytrea provider early access list.",
      body: "Thank you. We will follow up with provider onboarding details as launch access expands."
    }
  };

  waitlistForm.addEventListener("submit", () => {
    const role = roleSelect?.value || "caregiver";
    const confirmation = confirmations[role] || confirmations.caregiver;

    waitlistMessage.className = "form-message hidden";
    waitlistMessage.innerHTML = "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    window.setTimeout(() => {
      waitlistMessage.innerHTML = `<strong>${confirmation.title}</strong><p>${confirmation.body}</p>`;
      waitlistMessage.className = "form-message";
      waitlistMessage.focus?.({ preventScroll: true });
      waitlistForm.reset();

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultText;
      }
    }, 1400);
  });
}
