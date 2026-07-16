/** Tiny seeded 2D value noise for noise-warp patterns (ASCII-safe scales). */
function hash2(x, y, seed) {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
    return n - Math.floor(n);
}
function fade(t) {
    return t * t * (3 - 2 * t);
}
/** Value noise in ~[0,1]. */
export function valueNoise2(x, y, seed = 0) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const u = fade(fx);
    const v = fade(fy);
    const a = hash2(x0, y0, seed);
    const b = hash2(x0 + 1, y0, seed);
    const c = hash2(x0, y0 + 1, seed);
    const d = hash2(x0 + 1, y0 + 1, seed);
    const ab = a + (b - a) * u;
    const cd = c + (d - c) * u;
    return ab + (cd - ab) * v;
}
//# sourceMappingURL=noise.js.map