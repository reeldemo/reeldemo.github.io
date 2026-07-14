/* Loader, scroll motion, nav */
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Page loader ── */
  function initLoader() {
    let loader = document.getElementById("site-loader");
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "site-loader";
      loader.className = "site-loader is-active";
      loader.setAttribute("role", "status");
      loader.setAttribute("aria-live", "polite");
      loader.setAttribute("aria-label", "Loading Reeldemo");
      loader.innerHTML = `
        <div class="loader-scan" aria-hidden="true"></div>
        <div class="loader-glow loader-glow--teal" aria-hidden="true"></div>
        <div class="loader-glow loader-glow--ember" aria-hidden="true"></div>
        <div class="loader-inner">
          <div class="loader-mark" aria-hidden="true"></div>
          <div class="loader-title">REELDEMO</div>
          <div class="loader-ascii" id="loader-ascii" aria-hidden="true"></div>
          <div class="loader-bar" aria-hidden="true"><div class="loader-bar-fill" id="loader-bar-fill"></div></div>
          <div class="loader-status" id="loader-status">INITIALIZING SESSION</div>
        </div>`;
      document.body.prepend(loader);
    }

    document.documentElement.classList.add("is-loading");

    const bar = document.getElementById("loader-bar-fill");
    const status = document.getElementById("loader-status");
    const ascii = document.getElementById("loader-ascii");
    const CHARSET = "@#S&%*+=-:. ";
    const statuses = [
      "ROUTING AGENT",
      "LOADING ORACLE",
      "SYNCING WAVETABLES",
      "ARMING HANDOFF",
    ];
    let progress = 0;
    let statusIdx = 0;

    const tickAscii = () => {
      if (!ascii || prefersReduced) return;
      let out = "";
      for (let i = 0; i < 48; i++) {
        const ch = CHARSET[Math.floor(Math.random() * CHARSET.length)];
        const hue = 168 + Math.random() * 40;
        const lit = 45 + Math.random() * 35;
        out += `<span style="color:hsl(${hue},42%,${lit}%)">${ch}</span>`;
      }
      ascii.innerHTML = out;
    };

    const progressTimer = setInterval(() => {
      progress = Math.min(progress + 4 + Math.random() * 12, 92);
      if (bar) bar.style.width = `${progress}%`;
      if (status && progress > (statusIdx + 1) * 22 && statusIdx < statuses.length - 1) {
        statusIdx += 1;
        status.textContent = statuses[statusIdx];
      }
    }, 90);

    const asciiTimer = prefersReduced ? null : setInterval(tickAscii, 80);
    tickAscii();

    const dismiss = () => {
      clearInterval(progressTimer);
      if (asciiTimer) clearInterval(asciiTimer);
      if (bar) bar.style.width = "100%";
      if (status) status.textContent = "SESSION READY";

      window.setTimeout(() => {
        loader.classList.add("is-done");
        document.documentElement.classList.remove("is-loading");
        document.documentElement.classList.add("is-ready");
        window.setTimeout(() => loader.remove(), prefersReduced ? 0 : 650);
        initReveal();
      }, prefersReduced ? 0 : 280);
    };

    const minDelay = prefersReduced ? 0 : 900;
    const start = performance.now();

    const finish = () => {
      const elapsed = performance.now() - start;
      window.setTimeout(dismiss, Math.max(0, minDelay - elapsed));
    };

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
  }

  /* ── Scroll reveal ── */
  function initReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (prefersReduced) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ── Nav ── */
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

  /* ── Smooth scroll for hash links ── */
  function scrollToHash(hash, replace) {
    if (!hash || hash === "#") return;
    const id = hash.replace(/^#/, "");
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
    if (replace) history.replaceState(null, "", "#" + id);
    else history.pushState(null, "", "#" + id);
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      const id = href.slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      scrollToHash(href, false);
    });
  });

  if (location.hash) {
    window.requestAnimationFrame(() => {
      scrollToHash(location.hash, true);
    });
  }

  initLoader();
})();