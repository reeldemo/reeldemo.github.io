(function () {
  var SUPABASE_URL = "https://supabase.reeldemo.io";
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.I8fF0UAMPf2P4fUhN5QJ1S1nomhNre9qRBHiiimMdhc";
  var LEADMAGNET_CLAIM_URL = SUPABASE_URL + "/leadmagnet/claim";

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

  function claimDownloadUrl(opts, email, focus) {
    return fetch(opts.claimUrl || LEADMAGNET_CLAIM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        product: opts.product || "reelsynth_genre_tables",
        source: opts.source || "reeldemo.github.io/reelsynth/wavetables",
        focus: focus || "",
        page: location.pathname,
      }),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || !data.download_url) {
          throw new Error(
            (data && data.error) || "claim failed HTTP " + res.status
          );
        }
        return data;
      });
    });
  }

  /** Email-gate a download via token claim (zip is not on a public CDN). */
  function initLeadMagnetDownload(opts) {
    var unlockKey = opts.storageKey || "reeldemo_leadmagnet_unlocked";
    var emailKey = unlockKey + "_email";
    var gate = document.getElementById(opts.gateId);
    var unlocked = document.getElementById(opts.unlockedId);
    var downloadBtn = document.getElementById(opts.downloadId);
    var form = document.getElementById(opts.formId);
    var statusEl = document.getElementById(opts.statusId);
    if (!gate || !unlocked || !downloadBtn || !form || !statusEl) return;

    function showUnlocked() {
      gate.hidden = true;
      unlocked.hidden = false;
    }

    function startDownload(url) {
      downloadBtn.href = url;
      setTimeout(function () {
        window.location.href = url;
      }, 400);
    }

    function unlockWithClaim(email, focus, autoStart) {
      setFormStatus(statusEl, "Preparing download…", "pending");
      return claimDownloadUrl(opts, email, focus)
        .then(function (data) {
          try {
            sessionStorage.setItem(unlockKey, "1");
            sessionStorage.setItem(emailKey, email);
          } catch (e) {}
          showUnlocked();
          setFormStatus(
            statusEl,
            data.already
              ? opts.alreadyMessage || "Welcome back — download unlocked."
              : opts.successMessage || "Thanks — your download is starting.",
            "success"
          );
          downloadBtn.href = data.download_url;
          if (autoStart) startDownload(data.download_url);
          if (typeof opts.onUnlocked === "function") opts.onUnlocked(data);
        })
        .catch(function (err) {
          setFormStatus(
            statusEl,
            opts.errorMessage || "Could not unlock download. Try again later.",
            "error"
          );
          console.error(err);
        });
    }

    try {
      if (sessionStorage.getItem(unlockKey) === "1") {
        showUnlocked();
        var savedEmail = sessionStorage.getItem(emailKey) || "";
        if (savedEmail) {
          downloadBtn.addEventListener("click", function (e) {
            if (downloadBtn.getAttribute("href") && downloadBtn.getAttribute("href") !== "#") {
              return;
            }
            e.preventDefault();
            unlockWithClaim(savedEmail, "", true);
          });
        }
      }
    } catch (e) {}

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var email = String(fd.get("email") || "").trim();
      var focus = String(fd.get(opts.optionalField || "focus") || "").trim();
      if (!email) {
        setFormStatus(statusEl, "Enter a valid email.", "error");
        return;
      }
      unlockWithClaim(email, focus, true);
    });
  }

  window.initWaitlistForm = initWaitlistForm;
  window.initLeadMagnetDownload = initLeadMagnetDownload;
})();
