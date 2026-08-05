(function () {
  var players = [];

  function pauseOthers(active) {
    players.forEach(function (p) {
      if (p !== active && !p.paused) {
        p.pause();
        p.currentTime = 0;
        syncButton(p);
      }
    });
  }

  function syncButton(audio) {
    var btn = audio.parentElement && audio.parentElement.querySelector(".genre-sample__play");
    if (!btn) return;
    var playing = !audio.paused && !audio.ended;
    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    btn.textContent = playing ? "Pause" : "Play";
  }

  function initGenrePreviews() {
    document.querySelectorAll(".genre-sample audio").forEach(function (audio) {
      players.push(audio);
      var btn = audio.parentElement && audio.parentElement.querySelector(".genre-sample__play");
      if (!btn) return;

      btn.addEventListener("click", function () {
        if (audio.paused) {
          pauseOthers(audio);
          audio.play().catch(function () {});
        } else {
          audio.pause();
          audio.currentTime = 0;
        }
        syncButton(audio);
      });

      audio.addEventListener("ended", function () {
        syncButton(audio);
      });
      audio.addEventListener("pause", function () {
        syncButton(audio);
      });
      audio.addEventListener("play", function () {
        syncButton(audio);
      });
    });
  }

  window.initGenrePreviews = initGenrePreviews;
})();
