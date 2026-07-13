/* Shared nav, mobile menu, and active-state helper */
(function () {
  const path = window.location.pathname.replace(/\/$/, "") || "/";

  document.querySelectorAll(".nav a[data-nav]").forEach((link) => {
    const href = link.getAttribute("href").replace(/\/$/, "") || "/";
    if (path === href || (href !== "/" && path.startsWith(href))) {
      link.classList.add("active");
    }
  });

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        toggle.focus();
      }
    });
  }

  const year = document.getElementById("footer-year");
  if (year) year.textContent = String(new Date().getFullYear());
})();