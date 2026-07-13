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

function luminance(r, g, b, contrast, brightness, invert) {
  let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  lum = Math.min(1, Math.max(0, (lum - 0.5) * contrast + 0.5 + brightness));
  if (invert) lum = 1 - lum;
  return lum;
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

function foldCoords(nx, ny, rotationRad, segments) {
  const r = Math.hypot(nx, ny);
  if (r < 0.001) return { x: 0, y: 0 };
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
  };
}

function computeGrid() {
  const rect = els.outputWrap.getBoundingClientRect();
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

  return { cols, rows, fontSize: Math.max(4, fontSize) };
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
  const { cols, rows, segments, rotationDeg, contrast, brightness, invert } = opts;
  const data = pixels;
  const cellW = width / cols;
  const cellH = (height / rows) * 2;
  const cx = cols / 2;
  const cy = rows / 2;
  const rotation = (rotationDeg * Math.PI) / 180;
  const segmentAngle = (Math.PI * 2) / segments;
  const lines = [];

  for (let y = 0; y < rows; y++) {
    let htmlRow = "";
    for (let x = 0; x < cols; x++) {
      const nx = (x + 0.5 - cx) / cx;
      const ny = (y + 0.5 - cy) / cy;
      let theta = Math.atan2(ny, nx) - rotation;
      while (theta < 0) theta += Math.PI * 2;
      while (theta >= Math.PI * 2) theta -= Math.PI * 2;
      const segIdx = Math.floor(theta / segmentAngle);
      let local = theta - segIdx * segmentAngle;
      if (local > segmentAngle / 2) local = segmentAngle - local;
      const folded = local + rotation;
      const r = Math.hypot(nx, ny);
      const sx = cx + r * cx * Math.cos(folded);
      const sy = cy + r * cy * Math.sin(folded);
      const px = Math.min(width - 1, Math.max(0, Math.floor(sx * cellW)));
      const py = Math.min(height - 1, Math.max(0, Math.floor(sy * cellH)));
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
      const [cr, cg, cb] = hsvToRgb(
        (lum * 300 + 220 + rotationDeg * 0.15) % 360,
        0.55 + lum * 0.35,
        0.25 + lum * 0.65,
      );
      htmlRow += `<span style="color:rgb(${cr},${cg},${cb})">${ch}</span>`;
    }
    lines.push(htmlRow);
  }
  return lines;
}

function renderProcedural(opts) {
  const { cols, rows, segments, rotationDeg, contrast, brightness, invert } = opts;
  const cx = cols / 2;
  const cy = rows / 2;
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const segmentAngle = (Math.PI * 2) / segments;
  const t = performance.now() - state.loopStart;
  const lines = [];

  for (let y = 0; y < rows; y++) {
    let htmlRow = "";
    for (let x = 0; x < cols; x++) {
      const nx = (x + 0.5 - cx) / cx;
      const ny = (y + 0.5 - cy) / cy;
      const folded = foldCoords(nx, ny, rotationRad, segments);
      let lum = sampleProcedural(folded.x, folded.y, t, segments);
      lum = Math.min(1, Math.max(0, (lum - 0.5) * contrast + 0.5 + brightness));
      if (invert) lum = 1 - lum;
      const ci = Math.round(lum * (CHARSET.length - 1));
      const ch = CHARSET[ci];
      let theta = Math.atan2(ny, nx) - rotationRad;
      while (theta < 0) theta += Math.PI * 2;
      const segIdx = Math.floor(theta / segmentAngle);
      const [cr, cg, cb] = hsvToRgb(168 + lum * 28 + segIdx * 4, 0.38 + lum * 0.42, 0.28 + lum * 0.62);
      htmlRow += `<span style="color:rgb(${cr},${cg},${cb})">${ch}</span>`;
    }
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
}

function drawFrame() {
  try {
    const { cols, rows, fontSize } = computeGrid();
    els.output.style.fontSize = `${fontSize}px`;
    els.output.style.lineHeight = "1";

    const segments = Number(els.segments.value);
    const rotationDeg = getAnimRotation(Number(els.rotation.value));
    const { contrast, brightness } = getToneAdjustments();
    const invert = els.invert.checked;

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
      });
    } else {
      lines = renderProcedural({
        cols,
        rows,
        segments,
        rotationDeg,
        contrast,
        brightness,
        invert,
      });
    }

    els.output.innerHTML = lines.join("<br/>");
    els.colsVal.textContent = `${cols}×${rows}`;
    updateLabels();
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

async function setProcedural() {
  state.mode = "procedural";
  state.image = null;
  state.imageSrc = null;
  document.querySelectorAll(".ka-sample-picks button").forEach((b) => b.classList.remove("active"));
  resetLoop();
  drawFrame();
}

async function setImageSource(src, sample) {
  state.mode = "image";
  state.image = null;
  state.imageSrc = null;
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

  ["segments", "rotation", "cols", "contrast", "brightness", "pulse", "speed"].forEach((id) => {
    els[id].addEventListener("input", onInput);
  });
  els.invert.addEventListener("change", onInput);

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
    document.querySelectorAll(".ka-sample-picks button").forEach((b) => b.classList.remove("active"));
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawFrame, 80);
  });
}

function buildSamplePicks() {
  const procBtn = document.createElement("button");
  procBtn.type = "button";
  procBtn.textContent = "Pattern";
  procBtn.classList.add("active");
  procBtn.addEventListener("click", () => {
    document.querySelectorAll(".ka-sample-picks button").forEach((b) => b.classList.remove("active"));
    procBtn.classList.add("active");
    setProcedural();
  });
  els.samplePicks.appendChild(procBtn);

  SAMPLES.forEach((sample) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = sample.label;
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".ka-sample-picks button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
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
