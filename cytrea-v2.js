const CYTREA_V2_CONFIG = {
  stores: {
    googlePlayUrl: "https://play.google.com/store/apps/details?id=com.cytrea.mobile",
    appleAppStoreUrl: ""
  },
  demos: {
    caregiver: {
      videoUrl: "",
      posterImage: "images/mockups/caregiver-dashboard-mockup.png",
      posterAlt: "Cytrea caregiver dashboard phone mockup",
      roleLabel: "Caregiver Demo",
      title: "Caregiver App Walkthrough",
      description: "A guided walkthrough of profile setup, job discovery, applications, and provider messaging."
    },
    provider: {
      videoUrl: "",
      posterImage: "images/mockups/provider-dashboard-mockup.png",
      posterAlt: "Cytrea provider dashboard phone mockup",
      roleLabel: "Provider Demo",
      title: "Provider App Walkthrough",
      description: "A guided walkthrough of job posting, applicant review, messaging, and the hiring workflow."
    }
  },
  endpoints: {
    earlyAccess: "https://script.google.com/macros/s/AKfycbxyvPokvsdvnuiPA_aXt-WrLD9W_etfs0WozEDqMutnvtR21dUC56iBu-S9S_dSCx1z/exec",
    vendorApplication: "https://script.google.com/macros/s/AKfycbzWxhbI9gJkns-ZJytlmEXMA5vlcmTUzFgEraQWoK3e556-Lt3XeNzkT5BqUE4PDdgI/exec"
  }
};

window.CYTREA_V2_CONFIG = CYTREA_V2_CONFIG;

const renderStoreBadge = ({ type, href }) => {
  const isGoogle = type === "google";
  const label = isGoogle ? "Get it on Google Play" : "Coming Soon on the App Store";
  const eyebrow = isGoogle ? "GET IT ON" : "COMING SOON ON THE";
  const brand = isGoogle ? "Google Play" : "App Store";
  const icon = isGoogle ? "GP" : "A";
  const tag = href ? "a" : "span";
  const attributes = href
    ? `href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${label}"`
    : `role="text" aria-label="${label}" aria-disabled="true"`;

  return `
    <${tag} class="store-badge store-badge--${type}${href ? "" : " is-disabled"}" ${attributes}>
      <span class="store-badge-icon" aria-hidden="true">${icon}</span>
      <span><span>${eyebrow}</span><strong>${brand}</strong></span>
    </${tag}>`;
};

document.querySelectorAll("[data-cytrea-download]").forEach((container) => {
  const { stores } = CYTREA_V2_CONFIG;
  container.innerHTML = `
    <div class="store-badge-row">
      ${renderStoreBadge({ type: "google", href: stores.googlePlayUrl })}
      ${renderStoreBadge({ type: "apple", href: stores.appleAppStoreUrl })}
    </div>
    <p class="store-availability">Availability may vary during the early-access rollout.</p>
  `;
});

document.querySelectorAll("[data-cytrea-demo]").forEach((container) => {
  const role = container.dataset.cytreaDemo;
  const demo = CYTREA_V2_CONFIG.demos[role];

  if (!demo) return;

  const media = demo.videoUrl
    ? `<video class="demo-video" controls preload="metadata" poster="${demo.posterImage}">
        <source src="${demo.videoUrl}" />
      </video>`
    : `<div class="demo-placeholder-card" role="img" aria-label="${demo.roleLabel}: interactive walkthrough coming soon">
        <div class="demo-device-frame">
          <img loading="lazy" src="${demo.posterImage}" alt="${demo.posterAlt}" />
        </div>
        <div class="demo-play-badge" aria-hidden="true"><span></span></div>
        <div class="demo-coming-soon">Interactive walkthrough coming soon.</div>
      </div>`;

  container.innerHTML = `
    <div class="demo-showcase-grid">
      <div class="demo-copy">
        <span class="badge">${demo.roleLabel}</span>
        <h3>${demo.title}</h3>
        <p>${demo.description}</p>
      </div>
      ${media}
    </div>
  `;
});

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

document.querySelectorAll("[data-tab-group]").forEach((group) => {
  const tabs = Array.from(group.querySelectorAll(":scope > [role='tablist'] [role='tab'], :scope > .segmented-tabs [role='tab'], :scope > .scroll-tabs [role='tab']"));
  const panels = tabs
    .map((tab) => document.getElementById(tab.dataset.tabTarget))
    .filter(Boolean);

  if (!tabs.length || !panels.length) return;

  const activateTab = (tab, shouldFocus = false) => {
    tabs.forEach((item) => {
      const isActive = item === tab;
      item.setAttribute("aria-selected", String(isActive));
      item.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isActive = panel.id === tab.dataset.tabTarget;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
    });

    if (shouldFocus) tab.focus();
  };

  tabs.forEach((tab, index) => {
    tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;

    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      const currentIndex = tabs.indexOf(tab);
      const keyMap = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

      if (event.key in keyMap) {
        event.preventDefault();
        const nextIndex = (currentIndex + keyMap[event.key] + tabs.length) % tabs.length;
        activateTab(tabs[nextIndex], true);
      }

      if (event.key === "Home") {
        event.preventDefault();
        activateTab(tabs[0], true);
      }

      if (event.key === "End") {
        event.preventDefault();
        activateTab(tabs[tabs.length - 1], true);
      }
    });

    if (index === 0 && !tabs.some((item) => item.getAttribute("aria-selected") === "true")) {
      activateTab(tab);
    }
  });
});

document.querySelectorAll("[data-accordion]").forEach((accordion) => {
  accordion.querySelectorAll("button[aria-controls]").forEach((button) => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;

    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      panel.hidden = isOpen;
    });
  });
});

const waitlistForm = document.querySelector("#waitlist-form");
const waitlistMessage = document.querySelector("#form-message");
const vendorApplicationForm = document.querySelector("#vendor-intake-form");

if (vendorApplicationForm) {
  vendorApplicationForm.action = CYTREA_V2_CONFIG.endpoints.vendorApplication;
}

if (waitlistForm && waitlistMessage) {
  waitlistForm.action = CYTREA_V2_CONFIG.endpoints.earlyAccess;

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
