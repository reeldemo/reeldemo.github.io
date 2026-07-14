(function () {
  var SUPABASE_URL = "https://supabase.reeldemo.io";
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjIwMDAwMDAwMDAsImlhdCI6MCwiaXNzIjoic3VwYWJhc2UiLCJyb2xlIjoiYW5vbiJ9.xOErZmPb_tPco7QXT55pzPBE7ce36f9dkfZGEIf3Xb8";

  function setFormStatus(statusEl, message, state) {
    statusEl.textContent = message;
    statusEl.className = "form-status";
    if (state) statusEl.classList.add("form-status--" + state);
  }

  function initWaitlistForm(opts) {
    var form = document.getElementById(opts.formId);
    var statusEl = document.getElementById(opts.statusId);
    if (!form || !statusEl) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setFormStatus(statusEl, "Submitting…", "pending");
      var fd = new FormData(form);
      var body = {
        email: String(fd.get("email") || "").trim(),
        product: opts.product || "studio",
        source: opts.source || "reeldemo.github.io",
        utm: {
          page: location.pathname,
          touchpoint: opts.touchpoint || "section",
        },
      };
      var optionalField = opts.optionalField || "focus";
      var optionalValue = String(fd.get(optionalField) || "").trim();
      if (optionalValue) body[optionalField] = optionalValue;

      fetch(SUPABASE_URL + "/rest/v1/plugin_waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: "Bearer " + SUPABASE_ANON_KEY,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(body),
      })
        .then(function (res) {
          if (res.status === 201 || res.status === 204) {
            setFormStatus(
              statusEl,
              opts.successMessage ||
                "You're on the Studio waitlist. We'll email early access details soon.",
              "success"
            );
            form.reset();
            return;
          }
          if (res.status === 409) {
            setFormStatus(statusEl, "That email is already on the waitlist.", "error");
            return;
          }
          return res.text().then(function (t) {
            throw new Error(t || "HTTP " + res.status);
          });
        })
        .catch(function (err) {
          setFormStatus(statusEl, "Could not join waitlist. Try again later.", "error");
          console.error(err);
        });
    });
  }

  window.initWaitlistForm = initWaitlistForm;
})();
