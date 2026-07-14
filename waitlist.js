(function () {
  var SUPABASE_URL = "https://supabase.reeldemo.io";
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjIwMDAwMDAwMDAsImlhdCI6MCwiaXNzIjoic3VwYWJhc2UiLCJyb2xlIjoiYW5vbiJ9.xOErZmPb_tPco7QXT55pzPBE7ce36f9dkfZGEIf3Xb8";

  function initWaitlistForm(opts) {
    var form = document.getElementById(opts.formId);
    var statusEl = document.getElementById(opts.statusId);
    if (!form || !statusEl) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      statusEl.textContent = "Submitting…";
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
      var focus = String(fd.get("focus") || "").trim();
      if (focus) body.focus = focus;

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
            statusEl.textContent =
              opts.successMessage ||
              "You're on the Studio waitlist. We'll email early access details soon.";
            form.reset();
            return;
          }
          if (res.status === 409) {
            statusEl.textContent = "That email is already on the waitlist.";
            return;
          }
          return res.text().then(function (t) {
            throw new Error(t || "HTTP " + res.status);
          });
        })
        .catch(function (err) {
          statusEl.textContent = "Could not join waitlist. Try again later.";
          console.error(err);
        });
    });
  }

  window.initWaitlistForm = initWaitlistForm;
})();
