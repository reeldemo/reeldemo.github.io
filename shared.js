/* Shared nav active-state helper */
(function () {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll(".nav a[data-nav]").forEach((link) => {
    const href = link.getAttribute("href").replace(/\/$/, "") || "/";
    if (path === href || (href !== "/" && path.startsWith(href))) {
      link.classList.add("active");
    }
  });
})();
