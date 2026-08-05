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
          if (res.status === 201 || res.status === 204 || res.status === 409) {
            var already = res.status === 409;
            setFormStatus(
              statusEl,
              already
                ? opts.alreadyMessage ||
                    "You're already on the list — download unlocked."
                : opts.successMessage ||
                    "You're on the Studio waitlist. We'll email early access details soon.",
              "success"
            );
            if (!already) form.reset();
            if (typeof opts.onSuccess === "function") {
              opts.onSuccess({ already: already, email: body.email });
            }
            return;
          }
          return res.text().then(function (t) {
            throw new Error(t || "HTTP " + res.status);
          });
        })
        .catch(function (err) {
          setFormStatus(
            statusEl,
            opts.errorMessage || "Could not join waitlist. Try again later.",
            "error"
          );
          console.error(err);
        });
    });
  }

  /** Email-gate a download: unlock UI + trigger zip after successful waitlist insert. */
  function initLeadMagnetDownload(opts) {
    var unlockKey = opts.storageKey || "reeldemo_leadmagnet_unlocked";
    var gate = document.getElementById(opts.gateId);
    var unlocked = document.getElementById(opts.unlockedId);
    var downloadBtn = document.getElementById(opts.downloadId);
    var downloadUrl = opts.downloadUrl;
    if (!gate || !unlocked || !downloadBtn || !downloadUrl) return;

    function reveal(autoStart) {
      try {
        sessionStorage.setItem(unlockKey, "1");
      } catch (e) {}
      gate.hidden = true;
      unlocked.hidden = false;
      downloadBtn.href = downloadUrl;
      if (autoStart) {
        // Defer so the success message paints first.
        setTimeout(function () {
          window.location.href = downloadUrl;
        }, 400);
      }
    }

    try {
      if (sessionStorage.getItem(unlockKey) === "1") {
        reveal(false);
      }
    } catch (e) {}

    initWaitlistForm({
      formId: opts.formId,
      statusId: opts.statusId,
      product: opts.product || "reelsynth_starter_tables",
      source: opts.source || "reeldemo.github.io/reelsynth/wavetables",
      touchpoint: opts.touchpoint || "lead_magnet",
      optionalField: opts.optionalField || "focus",
      successMessage:
        opts.successMessage || "Thanks — your download is starting.",
      alreadyMessage:
        opts.alreadyMessage || "Welcome back — download unlocked.",
      onSuccess: function () {
        reveal(true);
        if (typeof opts.onUnlocked === "function") opts.onUnlocked();
      },
    });
  }

  window.initWaitlistForm = initWaitlistForm;
  window.initLeadMagnetDownload = initLeadMagnetDownload;
})();
