(function () {
  const CHARSET = "@#S&%*+=-:. ";
  const SEGMENTS = 8;
  const LOOP_MS = 9000;
  const COLS = 52;
  const ROWS = 40;

  const el = document.getElementById("ascii-hero");
  if (!el) return;

  let loopStart = performance.now();

  function hsvToRgb(h, s, v) {
    const c = v * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0, g = 0, b = 0;
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

  function samplePattern(x, y, t) {
    const r = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    const pulse = Math.sin((t / LOOP_MS) * Math.PI * 2) * 0.5 + 0.5;
    const ring = Math.sin(r * 14 - t * 0.004);
    const spoke = Math.cos(a * SEGMENTS + r * 6 + t * 0.003);
    const weave = Math.sin(a * 3 + r * 10 - t * 0.0025);
    const tribal = Math.abs(Math.sin(a * (SEGMENTS / 2) * 2 + r * 8));
    let v =
      0.42 +
      0.22 * ring +
      0.18 * spoke +
      0.12 * weave +
      0.08 * tribal +
      pulse * 0.06 * Math.sin(r * 20 - t * 0.005);
    return Math.min(1, Math.max(0, v));
  }

  function foldCoords(dx, dy, rotationRad, segments) {
    const r = Math.hypot(dx, dy);
    if (r < 0.001) return { x: 0, y: 0, r: 0 };
    let theta = Math.atan2(dy, dx) - rotationRad;
    while (theta < 0) theta += Math.PI * 2;
    while (theta >= Math.PI * 2) theta -= Math.PI * 2;
    const segmentAngle = (Math.PI * 2) / segments;
    const segIdx = Math.floor(theta / segmentAngle);
    let local = theta - segIdx * segmentAngle;
    if (local > segmentAngle / 2) local = segmentAngle - local;
    const folded = local + rotationRad;
    const scale = 0.92 + Math.sin(folded * 3) * 0.04;
    return {
      x: Math.cos(folded) * r * scale,
      y: Math.sin(folded) * r * scale,
      r,
    };
  }

  function colorFor(lum, segIdx) {
    const h = 168 + lum * 28 + segIdx * 4;
    const s = 0.38 + lum * 0.42;
    const v = 0.28 + lum * 0.62;
    return hsvToRgb(h, s, v);
  }

  function renderFrame(now) {
    const t = (now - loopStart) % LOOP_MS;
    const rotationDeg = (t / LOOP_MS) * 360;
    const rotationRad = (rotationDeg * Math.PI) / 180;
    const pulse = Math.sin((t / LOOP_MS) * Math.PI * 2 * 2) * 0.5 + 0.5;
    const contrast = 1.08 + pulse * 0.22;
    const brightness = -0.04 + pulse * 0.07;

    const cx = COLS / 2;
    const cy = ROWS / 2;
    const radius = Math.min(cx, cy) * 0.96;
    const segmentAngle = (Math.PI * 2) / SEGMENTS;
    let html = "";

    for (let y = 0; y < ROWS; y++) {
      html += '<div class="ka-row">';
      for (let x = 0; x < COLS; x++) {
        const dx = x + 0.5 - cx;
        const dy = (y + 0.5 - cy) * 1.15;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) {
          html += '<span class="ka-cell ka-empty"> </span>';
          continue;
        }
        const folded = foldCoords(dx, dy, rotationRad, SEGMENTS);
        let lum = samplePattern(folded.x / radius, folded.y / radius, now - loopStart);
        lum = Math.min(1, Math.max(0, (lum - 0.5) * contrast + 0.5 + brightness));
        const ci = Math.round(lum * (CHARSET.length - 1));
        const ch = CHARSET[ci];
        let theta = Math.atan2(dy, dx) - rotationRad;
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

  requestAnimationFrame(renderFrame);
})();
