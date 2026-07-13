(function () {
  const CHARSET = "@#S&%*+=-:. ";
  const LOOP_MS = 22000;

  const el = document.getElementById("ascii-hero");
  if (!el) return;

  let loopStart = performance.now();
  let grid = { cols: 48, rows: 48, fontSize: 7 };

  function measureGrid() {
    const rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;

    const charAspect = 0.62;
    const target = 52;
    const fontByW = rect.width / (target * charAspect);
    const fontByH = rect.height / target;
    const fontSize = Math.max(4, Math.min(fontByW, fontByH));
    const cols = Math.max(28, Math.floor(rect.width / (fontSize * charAspect)));
    const rows = Math.max(28, Math.floor(rect.height / fontSize));

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
    const ring = Math.sin(r * 12 - t * 0.0014);
    const spoke = Math.cos(a * segments + r * 5 + t * 0.0011);
    const weave = Math.sin(a * 3 + r * 9 - t * 0.0009);
    const tribal = Math.abs(Math.sin(a * (segments / 2) * 2 + r * 7));
    let v =
      0.42 +
      0.22 * ring +
      0.18 * spoke +
      0.12 * weave +
      0.08 * tribal +
      pulse * 0.06 * Math.sin(r * 18 - t * 0.0018);
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
    const scale = 0.94 + Math.sin(folded * 3) * 0.03;
    return {
      x: Math.cos(folded) * r * scale,
      y: Math.sin(folded) * r * scale,
    };
  }

  function colorFor(lum, segIdx) {
    const h = 168 + lum * 28 + segIdx * 4;
    const s = 0.38 + lum * 0.42;
    const v = 0.28 + lum * 0.62;
    return hsvToRgb(h, s, v);
  }

  function renderFrame(now) {
    measureGrid();
    const { cols, rows } = grid;
    const segments = 8;
    const t = (now - loopStart) % LOOP_MS;
    const rotationRad = ((t / LOOP_MS) * Math.PI * 2);
    const pulse = Math.sin((t / LOOP_MS) * Math.PI * 2 * 2) * 0.5 + 0.5;
    const contrast = 1.08 + pulse * 0.18;
    const brightness = -0.04 + pulse * 0.05;

    const cx = cols / 2;
    const cy = rows / 2;
    const segmentAngle = (Math.PI * 2) / segments;
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
        let theta = Math.atan2(ny, nx) - rotationRad;
        while (theta < 0) theta += Math.PI * 2;
        const segIdx = Math.floor(theta / segmentAngle);
        const [cr, cg, cb] = colorFor(lum, segIdx);
        html += `<span class="ka-cell" style="color:rgb(${cr},${cg},${cb})">${ch}</span>`;
      }
      html += "</div>";
    }

    el.innerHTML = html;
    requestAnimationFrame(renderFrame);
  }

  window.addEventListener("resize", measureGrid);
  measureGrid();
  requestAnimationFrame(renderFrame);
})();
