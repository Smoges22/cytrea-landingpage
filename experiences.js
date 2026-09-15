/* Additive website enhancement. No forms, account calls, or external requests. */
(function () {
  "use strict";
  const site = window.CYTREA_SITE;
  if (site) {
    const links = site.resolveSocial();
    document.querySelectorAll("[data-social-links]").forEach(mount => {
      mount.replaceChildren();
      mount.hidden = !links.length;
      if (!links.length) return;
      const title = document.createElement("p");
      title.className = "footer-social-label";
      title.textContent = "Follow Cytrea";
      const row = document.createElement("div");
      row.className = "social-row";
      links.forEach(item => {
        const link = document.createElement("a");
        link.className = `social-link social-link--${item.key}`;
        link.href = item.url; link.target = "_blank"; link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", `Cytrea on ${item.name} (opens in a new tab)`);
        if (item.icon) {
          const icon = document.createElement("img");
          icon.src = item.icon; icon.alt = ""; icon.width = 24; icon.height = 24;
          icon.setAttribute("aria-hidden", "true"); link.append(icon);
        } else {
          const monogram = document.createElement("span");
          monogram.textContent = item.monogram; monogram.setAttribute("aria-hidden", "true"); link.append(monogram);
        }
        row.append(link);
      });
      mount.append(title, row);
    });
    const banner = site.resolveBanner(window.CYTREA_DOWNLOADS?.resolve());
    document.querySelectorAll("[data-site-banner]").forEach(mount => {
      mount.replaceChildren(); mount.hidden = !banner;
      if (!banner) return;
      const inner = document.createElement("div"); inner.className = "page-width";
      const copy = document.createElement("p"); copy.textContent = banner.text;
      const link = document.createElement("a"); link.className = "quiet-link";
      link.href = banner.href; link.textContent = `${banner.label} →`;
      inner.append(copy, link); mount.append(inner);
    });
  }

  /* A static vertical journey is the fallback. Only desktop becomes a stepper. */
  const desktop = window.matchMedia("(min-width: 901px)");
  document.querySelectorAll("[data-enhanced-only]").forEach(element => { element.hidden = false; });
  document.querySelectorAll("[data-walk-journey]").forEach(journey => {
    const rail = journey.querySelector("[data-walk-rail]");
    const tabs = [...journey.querySelectorAll("[data-step]")];
    const panels = [...journey.querySelectorAll("[data-walk-step]")];
    const progress = journey.querySelector("[data-walk-progress]");
    const next = journey.querySelector("[data-walk-next]");
    let current = 0;
    const activate = (index, focus = false) => {
      current = Math.max(0, Math.min(index, panels.length - 1));
      rail.hidden = !desktop.matches;
      tabs.forEach((tab, i) => { tab.setAttribute("aria-selected", String(i === current)); tab.tabIndex = i === current ? 0 : -1; });
      panels.forEach((panel, i) => {
        panel.hidden = desktop.matches && i !== current;
        if (desktop.matches) {
          panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", tabs[i].id); panel.tabIndex = 0;
        } else {
          panel.removeAttribute("role"); panel.removeAttribute("aria-labelledby"); panel.removeAttribute("tabindex");
        }
      });
      progress.textContent = `Step ${current + 1} of ${panels.length}`;
      next.disabled = current === panels.length - 1;
      next.setAttribute("aria-label", current === panels.length - 1 ? "Last step reached" : `Next step: ${tabs[current + 1].textContent.trim()}`);
      if (focus) tabs[current].focus({ preventScroll: true });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => activate(i));
      tab.addEventListener("keydown", event => {
        let index;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") index = (i + 1) % tabs.length;
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") index = (i + tabs.length - 1) % tabs.length;
        if (event.key === "Home") index = 0;
        if (event.key === "End") index = tabs.length - 1;
        if (index !== undefined) { event.preventDefault(); activate(index, true); }
      });
    });
    next.addEventListener("click", () => activate(current + 1, true));
    desktop.addEventListener("change", () => {
      const focused = document.activeElement;
      const focusedPanel = panels.findIndex(panel => panel.contains(focused));
      if (desktop.matches && focusedPanel >= 0) current = focusedPanel;
      if (!desktop.matches && rail.contains(focused)) panels[current].querySelector("a")?.focus({ preventScroll: true });
      activate(current);
    });
    activate(0);
  });

  /* One observer, one-time entrances, no scroll handlers or continuous movement.
   * Base CSS never hides content. Unsupported/reduced-motion browsers stay static. */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const targets = new Set(document.querySelectorAll("[data-reveal]"));
  document.querySelectorAll(".detail-grid > article,.logo-strip img,.ecosystem-node,.footer-social .social-link,.experience-invite").forEach((element, i) => {
    element.dataset.reveal = "up";
    element.style.setProperty("--reveal-delay", `${(i % 3) * 70}ms`);
    targets.add(element);
  });
  let observer;
  const show = element => {
    element.classList.remove("reveal-pending");
    element.dataset.revealState = "visible";
    observer?.unobserve(element);
  };
  const initialize = () => {
    observer?.disconnect();
    if (reduced.matches || !("IntersectionObserver" in window)) { targets.forEach(show); return; }
    try {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) show(entry.target); });
      }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
      targets.forEach(element => {
        if (element.dataset.revealState === "visible") return;
        // Do not delay the first screen or hide focused content.
        const rect = element.getBoundingClientRect();
        if (rect.height && rect.top < innerHeight - 24 && rect.bottom > 0 || element.contains(document.activeElement)) { show(element); return; }
        element.classList.add("reveal-pending"); element.dataset.revealState = "pending";
        observer.observe(element);
      });
    } catch { targets.forEach(show); }
  };
  document.addEventListener("focusin", event => {
    const target = event.target.closest?.("[data-reveal]");
    if (target) { target.classList.add("reveal-instant"); show(target); }
  });
  reduced.addEventListener("change", initialize);
  window.addEventListener("beforeprint", () => targets.forEach(show));
  initialize();
})();
