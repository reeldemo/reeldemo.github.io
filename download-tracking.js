(function () {
  var SUPABASE_URL = "https://supabase.reeldemo.io";
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjIwMDAwMDAwMDAsImlhdCI6MCwiaXNzIjoic3VwYWJhc2UiLCJyb2xlIjoiYW5vbiJ9.xOErZmPb_tPco7QXT55pzPBE7ce36f9dkfZGEIf3Xb8";

  function trackDownloadEvent(payload) {
    fetch(SUPABASE_URL + "/rest/v1/download_events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + SUPABASE_ANON_KEY,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(function (err) {
      console.error("download tracking failed", err);
    });
  }

  function initDownloadTracking(opts) {
    var selector = opts.selector || ".download-card[data-track-download]";
    var cards = document.querySelectorAll(selector);
    if (!cards.length) return;

    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        trackDownloadEvent({
          product: card.getAttribute("data-product") || opts.product || "reelsynth",
          platform: card.getAttribute("data-platform") || null,
          arch: card.getAttribute("data-arch") || null,
          version: card.getAttribute("data-version") || opts.version || null,
          asset_url: card.getAttribute("href") || null,
          source: opts.source || "reeldemo.github.io",
          utm: {
            page: location.pathname,
            touchpoint: opts.touchpoint || "download_card",
            referrer: document.referrer || null,
          },
        });
      });
    });
  }

  window.initDownloadTracking = initDownloadTracking;
})();
