function applyBreathe(r, opts) {
    const amp = opts?.breathe ?? 0;
    if (amp <= 0)
        return r;
    const phase = opts?.breathePhase ?? 0;
    return r * (0.85 + 0.15 * Math.sin(phase) * amp);
}
function foldAngle(theta, segmentAngle, mirror) {
    while (theta < 0)
        theta += Math.PI * 2;
    while (theta >= Math.PI * 2)
        theta -= Math.PI * 2;
    const segIdx = Math.floor(theta / segmentAngle);
    let local = theta - segIdx * segmentAngle;
    if (mirror && local > segmentAngle / 2) {
        local = segmentAngle - local;
    }
    return { local, segIdx };
}
/** Image-mode fold: map cell (x,y) → sample position in grid space. */
export function foldSamplePosition(x, y, cols, rows, rotationRad, segments, geometry, foldOpts) {
    const cx = cols / 2;
    const cy = rows / 2;
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    const segmentAngle = (Math.PI * 2) / segments;
    const mirror = foldOpts?.mirror !== false;
    if (geometry === "circle") {
        let r = Math.hypot(dx, dy);
        const radius = Math.min(cx, cy);
        if (r > radius)
            return null;
        r = applyBreathe(r, foldOpts);
        const { local } = foldAngle(Math.atan2(dy, dx) - rotationRad, segmentAngle, mirror);
        const folded = local + rotationRad;
        return { sx: cx + r * Math.cos(folded), sy: cy + r * Math.sin(folded) };
    }
    const nx = dx / cx;
    const ny = dy / cy;
    let r = Math.hypot(nx, ny);
    r = applyBreathe(r, foldOpts);
    const { local } = foldAngle(Math.atan2(ny, nx) - rotationRad, segmentAngle, mirror);
    const folded = local + rotationRad;
    return {
        sx: cx + r * cx * Math.cos(folded),
        sy: cy + r * cy * Math.sin(folded),
    };
}
/** Procedural-mode fold in normalized coords. */
export function foldCoords(nx, ny, rotationRad, segments, foldOpts) {
    let r = Math.hypot(nx, ny);
    if (r < 0.001)
        return { x: 0, y: 0, segIdx: 0 };
    r = applyBreathe(r, foldOpts);
    const segmentAngle = (Math.PI * 2) / segments;
    const mirror = foldOpts?.mirror !== false;
    const { local, segIdx } = foldAngle(Math.atan2(ny, nx) - rotationRad, segmentAngle, mirror);
    const folded = local + rotationRad;
    return {
        x: Math.cos(folded) * r,
        y: Math.sin(folded) * r,
        segIdx,
    };
}
//# sourceMappingURL=fold.js.map