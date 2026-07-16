/**
 * Org hero kaleidoscope — standalone procedural fold (v1).
 * Product demo at /kaleidoscope/ uses @reeldemo/kaleidoscope-engine; this hero stays as-is.
 */
(function () {
  const CHARSET = "@#S&%*+=-:. ";
  const LOOP_MS = 22000;

  const el = document.getElementById("ascii-hero");
  if (!el) return;

  const visual = el.closest('.hero-visual') || el;

  let loopStart = performance.now();
  let grid = { cols: 48, rows: 48, fontSize: 7 };
  let mouse = { x: 0.5, y: 0.5, active: false };
  let lastFrame = 0;
  const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  function measureGrid() {
    const rect = el.getBoundingClientRect();
    if (rect.width < 16 || rect.height < 16) {
      el.style.fontSize = "6px";
      return;
    }

    const isMobile = Math.min(rect.width, rect.height) < 420 || rect.width < 520;
    const charAspect = 0.62;
    // Lower target density on mobile for performance + legibility
    const target = isMobile ? 32 : 48;
    const fontByW = rect.width / (target * charAspect);
    const fontByH = rect.height / target;
    let fontSize = Math.max(isMobile ? 4.5 : 5, Math.min(fontByW, fontByH));
    // Cap very dense grids
    const cols = Math.max(22, Math.min(isMobile ? 38 : 52, Math.floor(rect.width / (fontSize * charAspect))));
    const rows = Math.max(22, Math.min(isMobile ? 36 : 48, Math.floor(rect.height / fontSize)));

    // Slightly larger font on tiny screens for readability
    if (rect.width < 340) fontSize = Math.max(fontSize, 5.5);

    grid = { cols, rows, fontSize };
    el.style.fontSize = `${fontSize}px`;
    el.style.lineHeight = "1";
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

  function samplePattern(nx, ny, t, segments) {
    const r = Math.hypot(nx, ny);
    const a = Math.atan2(ny, nx);
    const pulse = Math.sin((t / LOOP_MS) * Math.PI * 2) * 0.5 + 0.5;
    const ring = Math.sin(r * 13 - t * 0.00155);
    const spoke = Math.cos(a * segments + r * 4.6 + t * 0.00125);
    const weave = Math.sin(a * 3.2 + r * 9.5 - t * 0.00095);
    const tribal = Math.abs(Math.sin(a * (segments / 2) * 2 + r * 6.8));
    let v =
      0.40 +
      0.23 * ring +
      0.19 * spoke +
      0.115 * weave +
      0.09 * tribal +
      pulse * 0.065 * Math.sin(r * 19 - t * 0.00195);
    return Math.min(1, Math.max(0, v));
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
    const scale = 0.94 + Math.sin(folded * 3) * 0.03;
    return {
      x: Math.cos(folded) * r * scale,
      y: Math.sin(folded) * r * scale,
      segIdx,
    };
  }

  function colorFor(lum, segIdx) {
    const hue = 166 + lum * 32 + segIdx * 3.5;
    return hsvToRgb(hue, 0.44 + lum * 0.38, 0.36 + lum * 0.62);
  }

  function renderFrame(now) {
    measureGrid();
    const { cols, rows } = grid;
    const segments = 8;
    const t = (now - loopStart) % LOOP_MS;
    const mx = mouse.active ? (mouse.x - 0.5) * 1.15 : 0;
    const my = mouse.active ? (mouse.y - 0.5) * 0.7 : 0;
    const rotationRad = (t / LOOP_MS) * Math.PI * 2 + mx * 0.9;
    const pulse = Math.sin((t / LOOP_MS) * Math.PI * 2 * 2) * 0.5 + 0.5;
    const contrast = 1.06 + pulse * 0.22 + Math.abs(mx) * 0.12;
    const brightness = -0.03 + pulse * 0.06 + my * 0.07;

    const cx = cols / 2;
    const cy = rows / 2;
    let html = "";

    for (let y = 0; y < rows; y++) {
      html += '<div class="ka-row">';
      for (let x = 0; x < cols; x++) {
        const nx = (x + 0.5 - cx) / cx;
        const ny = (y + 0.5 - cy) / cy;
        const folded = foldCoords(nx, ny, rotationRad, segments);
        let lum = samplePattern(folded.x, folded.y, t, segments);
        lum = Math.min(1, Math.max(0, (lum - 0.5) * contrast + 0.5 + brightness));
        const ci = Math.round(lum * (CHARSET.length - 1));
        const ch = CHARSET[ci];
        const [cr, cg, cb] = colorFor(lum, folded.segIdx);
        html += `<span class="ka-cell" style="color:rgb(${cr},${cg},${cb})">${ch}</span>`;
      }
      html += "</div>";
    }

    el.innerHTML = html;
    lastFrame = now;

    // Throttle a bit on touch devices for smoother scroll + battery
    const targetInterval = isCoarsePointer ? 55 : 16;
    const nextDelay = Math.max(0, targetInterval - (performance.now() - now));
    if (nextDelay > 8) {
      setTimeout(() => requestAnimationFrame(renderFrame), nextDelay);
    } else {
      requestAnimationFrame(renderFrame);
    }
  }

  // Mouse / pointer interaction for motion design
  function updateMouse(e) {
    const rect = visual.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    mouse.x = x;
    mouse.y = y;
    mouse.active = true;
  }

  function resetMouse() {
    mouse.active = false;
    // gently return toward center over time via render
  }

  visual.addEventListener('mousemove', updateMouse, { passive: true });
  visual.addEventListener('mouseenter', () => { mouse.active = true; }, { passive: true });
  visual.addEventListener('mouseleave', resetMouse, { passive: true });
  // Touch support for mobile/tablet interaction
  visual.addEventListener('touchmove', (e) => {
    if (e.touches[0]) updateMouse(e.touches[0]);
  }, { passive: true });
  visual.addEventListener('touchend', resetMouse, { passive: true });

  const onResize = () => measureGrid();
  window.addEventListener("resize", onResize);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
  }
  measureGrid();
  requestAnimationFrame(renderFrame);
})();
