const CHARSET = "@#S&%*+=-:. ";
const DEFAULT_LOOP_MS = 22000;
const SAMPLES_BASE =
  "https://raw.githubusercontent.com/reeldemo/reeldemo-kaleidoscope/main/landing/samples";

const SAMPLES = [
  { id: "neon-city", label: "Neon", segments: 8, rotation: 0 },
  { id: "tribal-pattern", label: "Tribal", segments: 12, rotation: 30 },
  { id: "vinyl", label: "Vinyl", segments: 4, rotation: 45 },
  { id: "abstract", label: "Abstract", segments: 10, rotation: 60 },
];

const els = {
  output: document.getElementById("ka-demo-ascii"),
  outputWrap: document.getElementById("ka-demo-output"),
  canvas: document.getElementById("ka-demo-canvas"),
  file: document.getElementById("ka-demo-file"),
  segments: document.getElementById("ka-segments"),
  rotation: document.getElementById("ka-rotation"),
  cols: document.getElementById("ka-cols"),
  contrast: document.getElementById("ka-contrast"),
  brightness: document.getElementById("ka-brightness"),
  pulse: document.getElementById("ka-pulse"),
  speed: document.getElementById("ka-speed"),
  invert: document.getElementById("ka-invert"),
  geometry: document.getElementById("ka-geometry"),
  harmonicsL: document.getElementById("ka-harmonics-l"),
  harmonicsM: document.getElementById("ka-harmonics-m"),
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
};

const state = {
  mode: "procedural",
  image: null,
  imageSrc: null,
  playing: true,
  loopStart: performance.now(),
  lastFrame: 0,
  layoutReady: false,
};

function loopMs() {
  const speed = Number(els.speed.value) / 100;
  return DEFAULT_LOOP_MS / Math.max(0.25, speed);
}

function hsvToRgb(h, s, v) {
  const c = v * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  const sector = Math.floor(hp) % 6;
  if (sector === 0) [r, g, b] = [c, x, 0];
  else if (sector === 1) [r, g, b] = [x, c, 0];
  else if (sector === 2) [r, g, b] = [0, c, x];
  else if (sector === 3) [r, g, b] = [0, x, c];
  else if (sector === 4) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = v - c;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function paletteColor(lum, segIdx, rotationDeg, imageMode) {
  if (imageMode) {
    return hsvToRgb(
      (lum * 300 + 220 + rotationDeg * 0.15) % 360,
      0.55 + lum * 0.35,
      0.38 + lum * 0.58,
    );
  }
  return hsvToRgb(168 + lum * 28 + segIdx * 4, 0.42 + lum * 0.4, 0.38 + lum * 0.58);
}

function luminance(r, g, b, contrast, brightness, invert) {
  let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  lum = Math.min(1, Math.max(0, (lum - 0.5) * contrast + 0.5 + brightness));
  if (invert) lum = 1 - lum;
  return lum;
}

function foldSamplePosition(x, y, cols, rows, rotationRad, segments, geometry) {
  const cx = cols / 2;
  const cy = rows / 2;
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  const segmentAngle = (Math.PI * 2) / segments;

  if (geometry === "circle") {
    const r = Math.hypot(dx, dy);
    const radius = Math.min(cx, cy);
    if (r > radius) return null;

    let theta = Math.atan2(dy, dx) - rotationRad;
    while (theta < 0) theta += Math.PI * 2;
    while (theta >= Math.PI * 2) theta -= Math.PI * 2;
    const segIdx = Math.floor(theta / segmentAngle);
    let local = theta - segIdx * segmentAngle;
    if (local > segmentAngle / 2) local = segmentAngle - local;
    const folded = local + rotationRad;
    return { sx: cx + r * Math.cos(folded), sy: cy + r * Math.sin(folded) };
  }

  const nx = dx / cx;
  const ny = dy / cy;
  const r = Math.hypot(nx, ny);
  let theta = Math.atan2(ny, nx) - rotationRad;
  while (theta < 0) theta += Math.PI * 2;
  while (theta >= Math.PI * 2) theta -= Math.PI * 2;
  const segIdx = Math.floor(theta / segmentAngle);
  let local = theta - segIdx * segmentAngle;
  if (local > segmentAngle / 2) local = segmentAngle - local;
  const folded = local + rotationRad;
  return {
    sx: cx + r * cx * Math.cos(folded),
    sy: cy + r * cy * Math.sin(folded),
  };
}

function associatedLegendre(l, mAbs, cosTheta) {
  const x = Math.max(-1, Math.min(1, cosTheta));
  if (l === 0 && mAbs === 0) return 1;
  if (l === 1 && mAbs === 0) return x;
  if (l === 1 && mAbs === 1) return Math.sqrt(1 - x * x);
  if (l === 2 && mAbs === 0) return 0.5 * (3 * x * x - 1);
  if (l === 2 && mAbs === 1) return 3 * x * Math.sqrt(1 - x * x);
  if (l === 2 && mAbs === 2) return 3 * (1 - x * x);
  if (l === 3 && mAbs === 0) return 0.5 * x * (5 * x * x - 3);
  if (l === 3 && mAbs === 1) return 1.5 * (5 * x * x - 1) * Math.sqrt(1 - x * x);
  if (l === 3 && mAbs === 2) return 15 * x * (1 - x * x);
  if (l === 3 && mAbs === 3) return 15 * (1 - x * x) * Math.sqrt(1 - x * x);
  if (l === 4 && mAbs === 0) return 0.125 * (35 * x ** 4 - 30 * x * x + 3);
  if (l === 4 && mAbs === 1) return 2.5 * x * (7 * x * x - 3) * Math.sqrt(1 - x * x);
  if (l === 4 && mAbs === 2) return 7.5 * (7 * x * x - 1) * (1 - x * x);
  if (l === 4 && mAbs === 3) return 105 * x * (1 - x * x) * Math.sqrt(1 - x * x);
  if (l === 4 && mAbs === 4) return 105 * (1 - x * x) ** 2;
  return 0;
}

function factorialRatio(lMinusM, lPlusM) {
  let result = 1;
  for (let k = lMinusM + 1; k <= lPlusM; k++) result /= k;
  return result;
}

function sphericalHarmonicNorm(l, mAbs) {
  return Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * factorialRatio(l - mAbs, l + mAbs));
}

function realSphericalHarmonic(l, m, theta, phi) {
  const lClamped = Math.min(4, Math.max(0, l));
  const maxM = lClamped;
  const mClamped = Math.max(-maxM, Math.min(maxM, m));
  const mAbs = Math.abs(mClamped);
  if (mAbs > lClamped) return 0;
  const p = associatedLegendre(lClamped, mAbs, Math.cos(phi));
  const norm = sphericalHarmonicNorm(lClamped, mAbs);
  if (mClamped > 0) return norm * p * Math.cos(mClamped * theta);
  if (mClamped < 0) return norm * p * Math.sin(mAbs * theta);
  return norm * p;
}

function sampleProcedural(nx, ny, t, segments) {
  const r = Math.hypot(nx, ny);
  const a = Math.atan2(ny, nx);
  const loop = loopMs();
  const pulse = Math.sin((t / loop) * Math.PI * 2) * 0.5 + 0.5;
  const ring = Math.sin(r * 12 - t * 0.0014);
  const spoke = Math.cos(a * segments + r * 5 + t * 0.0011);
  const weave = Math.sin(a * 3 + r * 9 - t * 0.0009);
  let v = 0.42 + 0.22 * ring + 0.2 * spoke + 0.12 * weave + pulse * 0.06;
  return Math.min(1, Math.max(0, v));
}

function sampleSphericalHarmonics(nx, ny, t, l, m) {
  const r = Math.min(1, Math.hypot(nx, ny));
  const azimuth = Math.atan2(ny, nx);
  const colatitude = r * Math.PI;
  const phase = t * 0.00045 * (Math.abs(m) + 1);
  const value = realSphericalHarmonic(l, m, azimuth + phase, colatitude);
  return Math.min(1, Math.max(0, value * 0.5 + 0.5));
}

function foldCoords(nx, ny, rotationRad, segments) {
  const r = Math.hypot(nx, ny);
  if (r < 0.001) return { x: 0, y: 0, segIdx: 0 };
  let theta = Math.atan2(ny, nx) - rotationRad;
  while (theta < 0) theta += Math.PI * 2;
  while (theta >= Math.PI * 2) theta -= Math.PI * 2;
  const segmentAngle = (Math.PI * 2) / segments;
  const segIdx = Math.floor(theta / segmentAngle);
  let local = theta - segIdx * segmentAngle;
  if (local > segmentAngle / 2) local = segmentAngle - local;
  const folded = local + rotationRad;
  return {
    x: Math.cos(folded) * r,
    y: Math.sin(folded) * r,
    segIdx,
  };
}

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

function getAnimRotation(baseRotation) {
  if (!state.playing) return baseRotation;
  const elapsed = (performance.now() - state.loopStart) % loopMs();
  return baseRotation + (elapsed / loopMs()) * 360;
}

function getToneAdjustments() {
  const contrastBase = Number(els.contrast.value) / 100;
  const brightnessBase = Number(els.brightness.value) / 100;
  const pulseAmt = Number(els.pulse.value) / 100;

  if (!state.playing || pulseAmt <= 0) {
    return { contrast: contrastBase, brightness: brightnessBase };
  }

  const elapsed = (performance.now() - state.loopStart) % loopMs();
  const wave = Math.sin((elapsed / loopMs()) * Math.PI * 2 * 2) * 0.5 + 0.5;
  return {
    contrast: contrastBase + wave * 0.22 * pulseAmt,
    brightness: brightnessBase + (wave - 0.5) * 0.12 * pulseAmt,
  };
}

function renderFramePixels(pixels, width, height, opts) {
  const { cols, rows, segments, rotationDeg, contrast, brightness, invert, geometry } = opts;
  const data = pixels;
  const cellW = width / cols;
  const cellH = (height / rows) * 2;
  const rotation = (rotationDeg * Math.PI) / 180;
  const lines = [];

  for (let y = 0; y < rows; y++) {
    let htmlRow = '<div class="ka-row">';
    for (let x = 0; x < cols; x++) {
      const sample = foldSamplePosition(x, y, cols, rows, rotation, segments, geometry);
      if (!sample) {
        htmlRow += '<span class="ka-cell"> </span>';
        continue;
      }
      const px = Math.min(width - 1, Math.max(0, Math.floor(sample.sx * cellW)));
      const py = Math.min(height - 1, Math.max(0, Math.floor(sample.sy * cellH)));
      const idx = (py * width + px) * 4;
      const lum = luminance(
        data[idx] / 255,
        data[idx + 1] / 255,
        data[idx + 2] / 255,
        contrast,
        brightness,
        invert,
      );
      const ci = Math.round(lum * (CHARSET.length - 1));
      const ch = CHARSET[ci];
      const [cr, cg, cb] = paletteColor(lum, 0, rotationDeg, true);
      htmlRow += `<span class="ka-cell" style="color:rgb(${cr},${cg},${cb})">${ch}</span>`;
    }
    htmlRow += "</div>";
    lines.push(htmlRow);
  }
  return lines;
}

function renderPattern(opts) {
  const {
    cols,
    rows,
    segments,
    rotationDeg,
    contrast,
    brightness,
    invert,
    geometry,
    mode,
    harmonicsL,
    harmonicsM,
    t,
  } = opts;
  const cx = cols / 2;
  const cy = rows / 2;
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const lines = [];

  for (let y = 0; y < rows; y++) {
    let htmlRow = '<div class="ka-row">';
    for (let x = 0; x < cols; x++) {
      if (geometry === "circle") {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (Math.hypot(dx, dy) > Math.min(cx, cy)) {
          htmlRow += '<span class="ka-cell"> </span>';
          continue;
        }
      }

      const nx = (x + 0.5 - cx) / cx;
      const ny = (y + 0.5 - cy) / cy;
      const folded = foldCoords(nx, ny, rotationRad, segments);
      let raw =
        mode === "harmonics"
          ? sampleSphericalHarmonics(folded.x, folded.y, t, harmonicsL, harmonicsM)
          : sampleProcedural(folded.x, folded.y, t, segments);
      let lum = Math.min(1, Math.max(0, (raw - 0.5) * contrast + 0.5 + brightness));
      if (invert) lum = 1 - lum;
      const ci = Math.round(lum * (CHARSET.length - 1));
      const ch = CHARSET[ci];
      const [cr, cg, cb] = paletteColor(lum, folded.segIdx, rotationDeg, false);
      htmlRow += `<span class="ka-cell" style="color:rgb(${cr},${cg},${cb})">${ch}</span>`;
    }
    htmlRow += "</div>";
    lines.push(htmlRow);
  }
  return lines;
}

function updateLabels() {
  els.segmentsVal.textContent = els.segments.value;
  els.rotationVal.textContent = `${els.rotation.value}°`;
  els.contrastVal.textContent = (Number(els.contrast.value) / 100).toFixed(2);
  els.brightnessVal.textContent = (Number(els.brightness.value) / 100).toFixed(2);
  els.pulseVal.textContent = `${els.pulse.value}%`;
  els.speedVal.textContent = `${els.speed.value}%`;
  if (els.harmonicsL && els.harmonicsM) {
    document.getElementById("ka-harmonics-l-val").textContent = els.harmonicsL.value;
    document.getElementById("ka-harmonics-m-val").textContent = els.harmonicsM.value;
  }
}

function drawFrame() {
  try {
    const grid = computeGrid();
    if (!grid) return;

    const { cols, rows, fontSize } = grid;
    els.output.style.fontSize = `${fontSize}px`;
    els.output.style.lineHeight = "1";

    const segments = Number(els.segments.value);
    const rotationDeg = getAnimRotation(Number(els.rotation.value));
    const { contrast, brightness } = getToneAdjustments();
    const invert = els.invert.checked;
    const geometry = els.geometry.value;
    const t = performance.now() - state.loopStart;

    let lines;
    if (state.mode === "image" && state.image) {
      const img = state.image;
      const ctx = els.canvas.getContext("2d", { willReadFrequently: true });
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (els.canvas.width !== w || els.canvas.height !== h) {
        els.canvas.width = w;
        els.canvas.height = h;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);
      lines = renderFramePixels(imageData.data, w, h, {
        cols,
        rows,
        segments,
        rotationDeg,
        contrast,
        brightness,
        invert,
        geometry,
      });
    } else {
      lines = renderPattern({
        cols,
        rows,
        segments,
        rotationDeg,
        contrast,
        brightness,
        invert,
        geometry,
        mode: state.mode,
        harmonicsL: Number(els.harmonicsL.value),
        harmonicsM: Number(els.harmonicsM.value),
        t,
      });
    }

    els.output.innerHTML = lines.join("");
    els.colsVal.textContent = `${cols}×${rows}`;
    updateLabels();
    state.layoutReady = true;
  } catch (err) {
    els.output.textContent = `Render error: ${err.message}`;
  }
}

function animationLoop(now) {
  if (!state.lastFrame || now - state.lastFrame >= 32) {
    drawFrame();
    state.lastFrame = now;
  }
  requestAnimationFrame(animationLoop);
}

function resetLoop() {
  state.loopStart = performance.now();
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
    img.onerror = reject;
    img.src = src;
  });
}

async function setPatternMode(mode) {
  state.mode = mode;
  state.image = null;
  state.imageSrc = null;
  document.querySelectorAll(".ka-sample-picks button").forEach((b) => b.classList.remove("active"));
  document.querySelector(`.ka-sample-picks button[data-mode="${mode}"]`)?.classList.add("active");
  resetLoop();
  drawFrame();
}

async function setImageSource(src, sample) {
  state.mode = "image";
  state.image = null;
  state.imageSrc = null;
  document.querySelectorAll(".ka-sample-picks button").forEach((b) => b.classList.remove("active"));
  document.querySelector(`.ka-sample-picks button[data-sample="${sample?.id || ""}"]`)?.classList.add("active");
  await loadImage(src);
  if (sample) {
    els.segments.value = sample.segments;
    els.rotation.value = sample.rotation;
  }
  resetLoop();
  drawFrame();
}

function bindControls() {
  const onInput = () => drawFrame();

  ["segments", "rotation", "cols", "contrast", "brightness", "pulse", "speed", "harmonics-l", "harmonics-m"].forEach((id) => {
    const key = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    els[key]?.addEventListener("input", onInput);
  });
  els.invert.addEventListener("change", onInput);
  els.geometry.addEventListener("change", onInput);

  els.playBtn.addEventListener("click", () => {
    state.playing = !state.playing;
    els.playBtn.textContent = state.playing ? "Pause loop" : "Play loop";
    els.status.textContent = state.playing ? "● live loop" : "○ paused";
    els.status.classList.toggle("paused", !state.playing);
    if (state.playing) resetLoop();
    drawFrame();
  });

  els.file.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await setImageSource(URL.createObjectURL(file));
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
}

function buildSamplePicks() {
  const modes = [
    { id: "procedural", label: "Pattern" },
    { id: "harmonics", label: "Harmonics" },
  ];
  modes.forEach((mode) => {
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
  buildSamplePicks();
  updateLabels();
  els.status.textContent = "● live loop";
  drawFrame();
  animationLoop();
}

init();
