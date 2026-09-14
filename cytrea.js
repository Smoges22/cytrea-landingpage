/* Progressive enhancement only: all routes, download links and POST forms are HTML. */
"use strict";
document.documentElement.classList.add("js");

const downloadState = window.CYTREA_DOWNLOADS?.resolve();
const CYTREA_CONFIG = Object.freeze({
  appleAppStoreUrl: downloadState?.apple.url,
  androidEarlyAccessUrl: window.CYTREA_DOWNLOADS?.config.android.earlyAccessUrl,
  earlyAccessEndpoint: "https://script.google.com/macros/s/AKfycbxyvPokvsdvnuiPA_aXt-WrLD9W_etfs0WozEDqMutnvtR21dUC56iBu-S9S_dSCx1z/exec",
  vendorEndpoint: "https://script.google.com/macros/s/AKfycbzWxhbI9gJkns-ZJytlmEXMA5vlcmTUzFgEraQWoK3e556-Lt3XeNzkT5BqUE4PDdgI/exec"
});
window.CYTREA_CONFIG = CYTREA_CONFIG;

if (downloadState) {
  document.querySelectorAll("[data-store]").forEach(control => {
    const store = downloadState[control.dataset.store];
    if (!store) return;
    control.href = store.url;
    control.dataset.storeState = store.status;
    control.setAttribute("aria-label", `${store.label} (opens in a new tab)`);
    control.querySelectorAll("[data-store-label]").forEach(node => { node.textContent = store.label; });
    control.querySelectorAll("[data-store-detail]").forEach(node => { node.textContent = store.detail; });
    control.querySelectorAll("[data-store-platform]").forEach(node => { node.textContent = store.platform; });
    control.querySelectorAll("img[data-store-artwork]").forEach(artwork => {
      artwork.src = store.artwork;
      artwork.alt = store.artworkAlt;
      artwork.dataset.artworkKind = store.artworkKind;
    });
    control.querySelectorAll("[data-store-early-only]").forEach(node => { node.hidden = store.status !== "early-access"; });
    control.querySelectorAll("[data-store-public-only]").forEach(node => { node.hidden = store.status !== "public"; });
  });
  document.querySelectorAll("[data-download-copy]").forEach(node => {
    const text = downloadState.copy[node.dataset.downloadCopy];
    if (typeof text === "string") node.textContent = text;
  });
}

const masthead = document.querySelector(".masthead");
const menu = document.querySelector(".menu-control");
const nav = document.querySelector(".primary-nav");
if (masthead && menu && nav) {
  const mobile = window.matchMedia("(max-width: 900px)");
  const closeMenu = (restoreFocus = false) => {
    masthead.classList.remove("menu-open");
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Open menu");
    if (restoreFocus) menu.focus();
  };
  const syncMenu = () => {
    menu.hidden = !mobile.matches;
    if (!mobile.matches) closeMenu();
  };
  syncMenu();
  mobile.addEventListener("change", syncMenu);
  menu.addEventListener("click", () => {
    const opening = menu.getAttribute("aria-expanded") !== "true";
    masthead.classList.toggle("menu-open", opening);
    menu.setAttribute("aria-expanded", String(opening));
    menu.setAttribute("aria-label", opening ? "Close menu" : "Open menu");
    if (opening) nav.querySelector("a")?.focus();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && masthead.classList.contains("menu-open")) closeMenu(true);
  });
  nav.addEventListener("click", event => {
    if (event.target.closest("a") && mobile.matches) closeMenu();
  });
  document.addEventListener("click", event => {
    if (!masthead.contains(event.target)) closeMenu();
  });
}

const roleForTab = tab => tab.dataset.role || tab.id.match(/^(?:role|home-product|product-tour|provider-tour|caregiver-tour)-(provider|caregiver)-tab$/)?.[1];
const roleGroups = [];
const contextualProductLinks = [...document.querySelectorAll("a[href]")].filter(link => {
  const url = new URL(link.href, window.location.href);
  return url.origin === window.location.origin && /^\/product\/?$/.test(url.pathname)
    && (link.hasAttribute("data-role-link") || !url.searchParams.has("role"));
});
const setRoleContext = (role, updateAddress = false) => {
  if (!["provider", "caregiver"].includes(role)) return;
  roleGroups.forEach(controller => {
    const tab = controller.tabs.find(candidate => roleForTab(candidate) === role);
    if (tab) controller.activate(tab);
  });
  contextualProductLinks.forEach(link => {
    const url = new URL(link.href, window.location.href);
    url.searchParams.set("role", role);
    link.setAttribute("href", `${url.pathname}${url.search}${url.hash}`);
  });
  if (updateAddress && /^\/product\/?$/.test(window.location.pathname)) {
    const url = new URL(window.location.href);
    url.searchParams.set("role", role);
    window.history.replaceState(window.history.state, "", url);
  }
};

document.querySelectorAll("[data-switch-group]").forEach(group => {
  const tabs = [...group.querySelectorAll("[role=tab]")].filter(tab => tab.closest("[data-switch-group]") === group);
  const activate = (selected, focus = false) => {
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(tab.dataset.switch);
      if (panel) panel.hidden = !active;
    });
    if (focus) selected.focus({ preventScroll: true });
  };
  if (!tabs.length) return;
  activate(tabs.find(tab => tab.getAttribute("aria-selected") === "true") || tabs[0]);
  if (tabs.some(tab => roleForTab(tab))) roleGroups.push({ tabs, activate });
  const selectTab = (tab, focus = false) => {
    const role = roleForTab(tab);
    if (role) setRoleContext(role, true);
    activate(tab, focus);
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(tabs[next], true);
      }
    });
  });
});

const requestedRole = new URLSearchParams(window.location.search).get("role");
const defaultRoleTab = roleGroups[0]?.tabs.find(tab => tab.getAttribute("aria-selected") === "true");
setRoleContext(["provider", "caregiver"].includes(requestedRole) ? requestedRole : defaultRoleTab && roleForTab(defaultRoleTab));

const waitlist = document.getElementById("waitlist-form");
const waitlistMessage = document.getElementById("form-message");
const waitlistFrame = document.getElementById("waitlist-hidden-frame");
if (waitlist && waitlistMessage && waitlistFrame) {
  waitlist.action = CYTREA_CONFIG.earlyAccessEndpoint;
  const submit = waitlist.querySelector("button[type=submit]");
  let pending = false;
  let timer;
  const finish = (loaded) => {
    if (!pending) return;
    pending = false;
    window.clearTimeout(timer);
    if (submit) { submit.disabled = false; submit.textContent = "Request onboarding help"; }
    waitlistMessage.hidden = false;
    waitlistMessage.textContent = loaded
      ? (downloadState?.copy["help-success"] || "Your request was sent. If you need help getting started, contact support@cytrea.com.")
      : "We could not confirm the response. Your details are still here. Please contact support@cytrea.com before trying again.";
    waitlistMessage.focus({ preventScroll: true });
    if (loaded) waitlist.reset();
  };
  waitlist.addEventListener("submit", () => {
    pending = true;
    waitlistMessage.hidden = true;
    if (submit) { submit.disabled = true; submit.textContent = "Sending…"; }
    timer = window.setTimeout(() => finish(false), 20000);
  });
  waitlistFrame.addEventListener("load", () => finish(true));
  waitlistFrame.addEventListener("error", () => finish(false));
}
const vendorForm = document.getElementById("vendor-intake-form");
if (vendorForm) vendorForm.action = CYTREA_CONFIG.vendorEndpoint;

const directorySearch = document.getElementById("vendor-directory-search");
if (directorySearch) {
  const rows = [...document.querySelectorAll("[data-vendor-search]")];
  directorySearch.addEventListener("input", () => {
    const query = directorySearch.value.trim().toLowerCase();
    rows.forEach(row => { row.hidden = !row.dataset.vendorSearch.toLowerCase().includes(query); });
    const empty = document.getElementById("vendor-no-results");
    if (empty) empty.hidden = rows.some(row => !row.hidden);
  });
}
