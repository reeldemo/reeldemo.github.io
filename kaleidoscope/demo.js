/**
 * Product demo — thin consumer of vendored @reeldemo/kaleidoscope-engine.
 * Scene picker: kaleidoscope | particles | jellyfish.
 */
import {
  createDefaultRegistry,
  EngineController,
} from "./vendor/engine/index.js";

const SAMPLES_BASE = "./samples";
const SAMPLES = [
  { id: "neon-city", label: "Neon", segments: 8, rotation: 0, colorScheme: "neon", seedHue: 0 },
  { id: "tribal-pattern", label: "Tribal", segments: 12, rotation: 30, colorScheme: "ember", seedHue: 12 },
  { id: "vinyl", label: "Vinyl", segments: 4, rotation: 45, colorScheme: "vinyl", seedHue: 30 },
  { id: "abstract", label: "Abstract", segments: 10, rotation: 60, colorScheme: "neon", seedHue: 45 },
  { id: "portrait", label: "Portrait", segments: 6, rotation: 15, colorScheme: "majico", seedHue: 0 },
  { id: "concert", label: "Concert", segments: 8, rotation: 22, colorScheme: "ember", seedHue: 20 },
];

const SCENES = [
  { id: "kaleidoscope", label: "Kaleidoscope" },
  { id: "particles", label: "Particles" },
  { id: "jellyfish", label: "Jellyfish" },
];

const PATTERN_MODES = [
  { id: "procedural", label: "Pattern" },
  { id: "harmonics", label: "Spherical harmonics" },
  { id: "interference", label: "Interference" },
  { id: "rose", label: "Rose" },
  { id: "noise-warp", label: "Noise warp" },
];

const prefersReduced =
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const els = {
  output: document.getElementById("ka-demo-ascii"),
  outputWrap: document.getElementById("ka-demo-output"),
  canvas: document.getElementById("ka-demo-canvas"),
  file: document.getElementById("ka-demo-file"),
  scenePicks: document.getElementById("ka-scene-picks"),
  panelKaleido: document.getElementById("ka-panel-kaleidoscope"),
  panelParticles: document.getElementById("ka-panel-particles"),
  panelJelly: document.getElementById("ka-panel-jellyfish"),
  segments: document.getElementById("ka-segments"),
  rotation: document.getElementById("ka-rotation"),
  cols: document.getElementById("ka-cols"),
  contrast: document.getElementById("ka-contrast"),
  brightness: document.getElementById("ka-brightness"),
  pulse: document.getElementById("ka-pulse"),
  speed: document.getElementById("ka-speed"),
  invert: document.getElementById("ka-invert"),
  geometry: document.getElementById("ka-geometry"),
  harmonicsGroup: document.getElementById("ka-harmonics-group"),
  patternExtra: document.getElementById("ka-pattern-extra"),
  harmonicsL: document.getElementById("ka-harmonics-l"),
  harmonicsM: document.getElementById("ka-harmonics-m"),
  waves: document.getElementById("ka-waves"),
  petals: document.getElementById("ka-petals"),
  noiseWarp: document.getElementById("ka-noise-warp"),
  colorScheme: document.getElementById("ka-color-scheme"),
  seedHue: document.getElementById("ka-seed-hue"),
  seedColor: document.getElementById("ka-seed-color"),
  playBtn: document.getElementById("ka-play-btn"),
  status: document.getElementById("ka-demo-status"),
  samplePicks: document.getElementById("ka-sample-picks"),
  segmentsVal: document.getElementById("ka-segments-val"),
  rotationVal: document.getElementById("ka-rotation-val"),
  colsVal: document.getElementById("ka-cols-val"),
  contrastVal: document.getElementById("ka-contrast-val"),
  brightnessVal: document.getElementById("ka-brightness-val"),
  pulseVal: document.getElementById("ka-pulse-val"),
  speedVal: document.getElementById("ka-speed-val"),
  seedHueVal: document.getElementById("ka-seed-hue-val"),
  pCount: document.getElementById("ka-p-count"),
  pAttract: document.getElementById("ka-p-attract"),
  pRadius: document.getElementById("ka-p-radius"),
  pSpeed: document.getElementById("ka-p-speed"),
  pCountVal: document.getElementById("ka-p-count-val"),
  pAttractVal: document.getElementById("ka-p-attract-val"),
  pRadiusVal: document.getElementById("ka-p-radius-val"),
  pSpeedVal: document.getElementById("ka-p-speed-val"),
  jCount: document.getElementById("ka-j-count"),
  jTentacles: document.getElementById("ka-j-tentacles"),
  jSpeed: document.getElementById("ka-j-speed"),
  jCountVal: document.getElementById("ka-j-count-val"),
  jTentaclesVal: document.getElementById("ka-j-tentacles-val"),
  jSpeedVal: document.getElementById("ka-j-speed-val"),
  jSpawn: document.getElementById("ka-j-spawn"),
};

const registry = createDefaultRegistry();
const controller = new EngineController(registry);

const state = {
  sceneId: "kaleidoscope",
  mode: "procedural",
  image: null,
  imageSrc: null,
  imageBuffer: null,
  playing: !prefersReduced,
  loopStart: performance.now(),
  frozenT: 0,
  lastFrame: 0,
  lastCols: 0,
  lastRows: 0,
  needsSetScene: true,
  paramsDirty: true,
};

function computeGrid() {
  const rect = els.outputWrap.getBoundingClientRect();
  if (rect.width < 16 || rect.height < 16) return null;

  const density = Number(els.cols.value) / 100;
  const minCols = 44;
  const maxCols = 130;
  const charW = 0.58;
  const charH = 1;

  let cols =
    density <= 0.05
      ? Math.floor(rect.width / 7)
      : Math.round(minCols + (maxCols - minCols) * density);

  const fontByW = rect.width / (cols * charW);
  let rows = Math.round(rect.height / fontByW / charH);
  rows = Math.max(28, Math.min(96, rows));
  cols = Math.max(36, Math.min(maxCols, cols));

  const fontSize = Math.min(
    rect.width / (cols * charW),
    rect.height / (rows * charH),
  );

  return { cols, rows, fontSize: Math.max(5, fontSize) };
}

function paletteFields() {
  const seedColor = els.seedColor?.value?.trim();
  return {
    colorScheme: els.colorScheme?.value || "majico",
    seedHue: Number(els.seedHue?.value || 0),
    seedColor: seedColor || undefined,
  };
}

function kaleidoscopeParams() {
  const p = {
    ...paletteFields(),
    segments: Number(els.segments.value),
    rotation: Number(els.rotation.value),
    contrast: Number(els.contrast.value) / 100,
    brightness: Number(els.brightness.value) / 100,
    pulse: Number(els.pulse.value) / 100,
    speed: Number(els.speed.value) / 100,
    invert: els.invert.checked,
    geometry: els.geometry.value,
    mode: state.mode,
    harmonicsL: Number(els.harmonicsL?.value || 3),
    harmonicsM: Number(els.harmonicsM?.value || 2),
    waves: Number(els.waves?.value || 5),
    petals: Number(els.petals?.value || 4),
    noiseWarp: Number(els.noiseWarp?.value || 45) / 100,
    animateRotation: state.playing,
  };
  if (state.mode === "image" && state.imageBuffer) {
    p.image = state.imageBuffer;
  }
  return p;
}

function particlesParams() {
  return {
    ...paletteFields(),
    count: Number(els.pCount?.value || 120),
    attract: Number(els.pAttract?.value || 35) / 100,
    radius: Number(els.pRadius?.value || 12) / 10,
    speed: Number(els.pSpeed?.value || 100) / 100,
  };
}

function jellyfishParams() {
  return {
    ...paletteFields(),
    count: Number(els.jCount?.value || 2),
    tentacles: Number(els.jTentacles?.value || 7),
    speed: Number(els.jSpeed?.value || 100) / 100,
  };
}

function currentParams() {
  if (state.sceneId === "particles") return particlesParams();
  if (state.sceneId === "jellyfish") return jellyfishParams();
  return kaleidoscopeParams();
}

function imageToBuffer(img) {
  const ctx = els.canvas.getContext("2d", { willReadFrequently: true });
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (els.canvas.width !== w || els.canvas.height !== h) {
    els.canvas.width = w;
    els.canvas.height = h;
  }
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  return { width: w, height: h, data: imageData.data };
}

function updateLabels() {
  if (els.segmentsVal) els.segmentsVal.textContent = els.segments.value;
  if (els.rotationVal) els.rotationVal.textContent = `${els.rotation.value}°`;
  if (els.contrastVal) els.contrastVal.textContent = (Number(els.contrast.value) / 100).toFixed(2);
  if (els.brightnessVal) {
    els.brightnessVal.textContent = (Number(els.brightness.value) / 100).toFixed(2);
  }
  if (els.pulseVal) els.pulseVal.textContent = `${els.pulse.value}%`;
  if (els.speedVal) els.speedVal.textContent = `${els.speed.value}%`;
  if (els.harmonicsL) {
    document.getElementById("ka-harmonics-l-val").textContent = els.harmonicsL.value;
  }
  if (els.harmonicsM) {
    document.getElementById("ka-harmonics-m-val").textContent = els.harmonicsM.value;
  }
  if (els.waves) {
    document.getElementById("ka-waves-val").textContent = els.waves.value;
  }
  if (els.petals) {
    document.getElementById("ka-petals-val").textContent = els.petals.value;
  }
  if (els.noiseWarp) {
    document.getElementById("ka-noise-warp-val").textContent = `${els.noiseWarp.value}%`;
  }
  if (els.seedHueVal) els.seedHueVal.textContent = `${els.seedHue?.value || 0}°`;
  if (els.pCountVal) els.pCountVal.textContent = els.pCount.value;
  if (els.pAttractVal) els.pAttractVal.textContent = `${els.pAttract.value}%`;
  if (els.pRadiusVal) els.pRadiusVal.textContent = (Number(els.pRadius.value) / 10).toFixed(1);
  if (els.pSpeedVal) els.pSpeedVal.textContent = `${els.pSpeed.value}%`;
  if (els.jCountVal) els.jCountVal.textContent = els.jCount.value;
  if (els.jTentaclesVal) els.jTentaclesVal.textContent = els.jTentacles.value;
  if (els.jSpeedVal) els.jSpeedVal.textContent = `${els.jSpeed.value}%`;
}

function updatePanelVisibility() {
  const id = state.sceneId;
  if (els.panelKaleido) els.panelKaleido.hidden = id !== "kaleidoscope";
  if (els.panelParticles) els.panelParticles.hidden = id !== "particles";
  if (els.panelJelly) els.panelJelly.hidden = id !== "jellyfish";

  const showHarmonics = id === "kaleidoscope" && state.mode === "harmonics";
  if (els.harmonicsGroup) els.harmonicsGroup.hidden = !showHarmonics;
  if (els.harmonicsL) els.harmonicsL.disabled = !showHarmonics;
  if (els.harmonicsM) els.harmonicsM.disabled = !showHarmonics;

  if (els.patternExtra) {
    const showExtra =
      id === "kaleidoscope" &&
      (state.mode === "interference" || state.mode === "rose" || state.mode === "noise-warp");
    els.patternExtra.hidden = !showExtra;
    document.getElementById("ka-extra-interference")?.toggleAttribute(
      "hidden",
      state.mode !== "interference",
    );
    document.getElementById("ka-extra-rose")?.toggleAttribute("hidden", state.mode !== "rose");
    document.getElementById("ka-extra-noise")?.toggleAttribute(
      "hidden",
      state.mode !== "noise-warp",
    );
  }
}

function setActiveScenePick() {
  els.scenePicks?.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("active", b.dataset.scene === state.sceneId);
  });
}

function setActivePatternPick({ mode, sampleId } = {}) {
  els.samplePicks?.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
  if (mode) {
    els.samplePicks
      ?.querySelector(`button[data-mode="${mode}"]`)
      ?.classList.add("active");
  } else if (sampleId) {
    els.samplePicks
      ?.querySelector(`button[data-sample="${sampleId}"]`)
      ?.classList.add("active");
  }
}

function syncPlayUi() {
  els.playBtn.textContent = state.playing ? "Pause loop" : "Play loop";
  els.status.textContent = state.playing
    ? "● live loop"
    : prefersReduced && state.frozenT === 0
      ? "○ reduced motion"
      : "○ paused";
  els.status.classList.toggle("paused", !state.playing);
}

function resetLoop() {
  state.loopStart = performance.now();
  state.frozenT = 0;
}

function applySampleSettings(sample) {
  if (!sample) return;
  if (sample.segments != null) els.segments.value = sample.segments;
  if (sample.rotation != null) els.rotation.value = sample.rotation;
  if (sample.colorScheme && els.colorScheme) els.colorScheme.value = sample.colorScheme;
  if (sample.seedHue != null && els.seedHue) els.seedHue.value = sample.seedHue;
}

async function loadImage(src) {
  if (state.image && state.imageSrc === src) return state.image;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      state.image = img;
      state.imageSrc = src;
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function switchScene(sceneId) {
  if (!registry.has(sceneId)) return;
  state.sceneId = sceneId;
  state.needsSetScene = true;
  if (sceneId !== "kaleidoscope") {
    state.mode = "procedural";
    state.image = null;
    state.imageSrc = null;
    state.imageBuffer = null;
  }
  setActiveScenePick();
  updatePanelVisibility();
  resetLoop();
  drawFrame();
}

async function setPatternMode(mode) {
  state.sceneId = "kaleidoscope";
  state.mode = mode;
  state.image = null;
  state.imageSrc = null;
  state.imageBuffer = null;
  state.needsSetScene = true;
  setActiveScenePick();
  setActivePatternPick({ mode });
  updatePanelVisibility();
  resetLoop();
  drawFrame();
}

async function setImageSource(src, sample) {
  try {
    state.sceneId = "kaleidoscope";
    state.mode = "image";
    state.image = null;
    state.imageSrc = null;
    state.imageBuffer = null;
    setActiveScenePick();
    setActivePatternPick({ sampleId: sample?.id || "" });
    const img = await loadImage(src);
    state.imageBuffer = imageToBuffer(img);
    applySampleSettings(sample);
    state.needsSetScene = true;
    updatePanelVisibility();
    syncPlayUi();
    resetLoop();
    drawFrame();
  } catch (err) {
    console.error(err);
    els.status.textContent = "✕ sample load failed";
  }
}

function ensureController(cols, rows) {
  const params = currentParams();
  const sizeChanged = cols !== state.lastCols || rows !== state.lastRows;

  if (state.needsSetScene || controller.activeSceneId !== state.sceneId) {
    controller.setScene(state.sceneId, params, { cols, rows });
    state.needsSetScene = false;
    state.paramsDirty = false;
    state.lastCols = cols;
    state.lastRows = rows;
    return;
  }

  if (sizeChanged) {
    controller.resize(cols, rows, params);
    state.paramsDirty = false;
    state.lastCols = cols;
    state.lastRows = rows;
    return;
  }

  if (state.paramsDirty) {
    controller.updateParams(params);
    state.paramsDirty = false;
  }
}

function drawFrame() {
  try {
    const grid = computeGrid();
    if (!grid) return;

    const { cols, rows, fontSize } = grid;
    els.output.style.fontSize = `${fontSize}px`;
    els.output.style.lineHeight = "1";

    ensureController(cols, rows);

    let t;
    if (state.playing) {
      t = performance.now() - state.loopStart;
      state.frozenT = t;
    } else {
      t = state.frozenT;
    }

    const { ascii } = controller.renderFrame({ format: "html", t, dt: 0 });
    els.output.innerHTML = ascii;
    els.colsVal.textContent = `${cols}×${rows}`;
    updateLabels();
  } catch (err) {
    els.output.textContent = `Render error: ${err.message}`;
  }
}

function animationLoop(now) {
  if (state.playing && (!state.lastFrame || now - state.lastFrame >= 32)) {
    drawFrame();
    state.lastFrame = now;
  }
  requestAnimationFrame(animationLoop);
}

function bindControls() {
  const onInput = () => {
    state.paramsDirty = true;
    drawFrame();
  };

  [
    "segments",
    "rotation",
    "cols",
    "contrast",
    "brightness",
    "pulse",
    "speed",
    "harmonics-l",
    "harmonics-m",
    "waves",
    "petals",
    "noise-warp",
    "seed-hue",
    "p-count",
    "p-attract",
    "p-radius",
    "p-speed",
    "j-count",
    "j-tentacles",
    "j-speed",
  ].forEach((id) => {
    const key = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const el = els[key] || document.getElementById(`ka-${id}`);
    el?.addEventListener("input", () => {
      // Jellyfish entities are created in init — re-set scene when spawn layout params change.
      if (id === "j-count" || id === "j-tentacles") state.needsSetScene = true;
      else state.paramsDirty = true;
      drawFrame();
    });
  });

  els.invert?.addEventListener("change", onInput);
  els.geometry?.addEventListener("change", onInput);
  els.colorScheme?.addEventListener("change", onInput);
  els.seedColor?.addEventListener("input", onInput);

  els.playBtn?.addEventListener("click", () => {
    state.playing = !state.playing;
    state.paramsDirty = true; // animateRotation follows playing for kaleidoscope
    if (state.playing) {
      state.loopStart = performance.now() - state.frozenT;
    }
    syncPlayUi();
    drawFrame();
  });

  els.file?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await setImageSource(URL.createObjectURL(file));
    } catch (err) {
      console.error(err);
      els.status.textContent = "✕ upload failed";
    }
  });

  els.jSpawn?.addEventListener("click", () => {
    if (state.sceneId !== "jellyfish") return;
    try {
      ensureController(state.lastCols || 64, state.lastRows || 32);
      controller.spawn({
        x: 0.2 + Math.random() * 0.6,
        y: 0.15 + Math.random() * 0.35,
        size: 0.1 + Math.random() * 0.1,
      });
      drawFrame();
    } catch (err) {
      console.error(err);
    }
  });

  let resizeTimer;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawFrame, 80);
  };
  window.addEventListener("resize", onResize);
  if (window.ResizeObserver && els.outputWrap) {
    const ro = new ResizeObserver(onResize);
    ro.observe(els.outputWrap);
  }

  const reducedMq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  reducedMq?.addEventListener?.("change", (e) => {
    if (e.matches && state.playing) {
      state.playing = false;
      syncPlayUi();
      drawFrame();
    }
  });
}

function buildScenePicks() {
  if (!els.scenePicks) return;
  SCENES.forEach((scene) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = scene.label;
    btn.dataset.scene = scene.id;
    if (scene.id === state.sceneId) btn.classList.add("active");
    btn.addEventListener("click", () => switchScene(scene.id));
    els.scenePicks.appendChild(btn);
  });
}

function buildSamplePicks() {
  if (!els.samplePicks) return;
  PATTERN_MODES.forEach((mode) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = mode.label;
    btn.dataset.mode = mode.id;
    if (mode.id === "procedural") btn.classList.add("active");
    btn.addEventListener("click", () => setPatternMode(mode.id));
    els.samplePicks.appendChild(btn);
  });

  SAMPLES.forEach((sample) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = sample.label;
    btn.dataset.sample = sample.id;
    btn.addEventListener("click", async () => {
      await setImageSource(`${SAMPLES_BASE}/${sample.id}.jpg`, sample);
    });
    els.samplePicks.appendChild(btn);
  });
}

function init() {
  bindControls();
  buildScenePicks();
  buildSamplePicks();
  updatePanelVisibility();
  updateLabels();
  syncPlayUi();
  drawFrame();
  requestAnimationFrame(animationLoop);
}

init();
