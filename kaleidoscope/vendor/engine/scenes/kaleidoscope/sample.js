import { valueNoise2 } from "./noise.js";
export const DEFAULT_LOOP_MS = 22000;
function clamp01(v) {
    return Math.min(1, Math.max(0, v));
}
/** Classic ring/spoke/weave + hero tribal blend. */
export function sampleProcedural(nx, ny, t, segments, loopMs = DEFAULT_LOOP_MS) {
    const r = Math.hypot(nx, ny);
    const a = Math.atan2(ny, nx);
    const pulse = Math.sin((t / loopMs) * Math.PI * 2) * 0.5 + 0.5;
    const ring = Math.sin(r * 12 - t * 0.0014);
    const spoke = Math.cos(a * segments + r * 5 + t * 0.0011);
    const weave = Math.sin(a * 3 + r * 9 - t * 0.0009);
    const tribal = Math.abs(Math.sin(a * segments + r * 6.8));
    const v = 0.4 +
        0.22 * ring +
        0.19 * spoke +
        0.115 * weave +
        0.09 * tribal +
        pulse * 0.065 * Math.sin(r * 19 - t * 0.00195);
    return clamp01(v);
}
/** Quasicrystal: sum of rotated cosines. */
export function sampleInterference(nx, ny, t, opts = {}) {
    const n = Math.max(3, Math.min(9, Math.round(opts.waves ?? 5)));
    const f = opts.freq ?? 7;
    const phi = t * (opts.phaseSpeed ?? 0.0012);
    let s = 0;
    for (let k = 0; k < n; k++) {
        const ang = (Math.PI * 2 * k) / n;
        s += Math.cos(f * (nx * Math.cos(ang) + ny * Math.sin(ang)) + phi);
    }
    return clamp01(0.5 + (0.5 * s) / n);
}
/** Rhodonea / polar rose intensity. */
export function sampleRose(nx, ny, t, opts = {}) {
    const r = Math.hypot(nx, ny);
    const a = Math.atan2(ny, nx);
    const k = Math.max(2, Math.min(8, Math.round(opts.petals ?? 4)));
    const petal = Math.abs(Math.cos(k * a + t * (opts.spin ?? 0.001)));
    const ring = Math.cos(r * (opts.radialFreq ?? 8) - t * (opts.breathe ?? 0.0013));
    const falloff = r < 0.15 ? 1 : r > 1 ? 0 : 1 - (r - 0.15) / 0.85;
    const smooth = falloff * falloff * (3 - 2 * falloff);
    return clamp01(petal * smooth * (0.55 + 0.45 * ring));
}
/** Domain-warped value noise in the folded wedge. */
export function sampleNoiseWarp(nx, ny, t, opts = {}) {
    const scale = opts.scale ?? 1.4;
    const warp = opts.warp ?? 0.45;
    const octaves = opts.octaves ?? 1;
    const seed = opts.seed ?? 0;
    const qx = nx * scale;
    const qy = ny * scale;
    const w1 = valueNoise2(qx + t * 0.0003, qy, seed);
    const w2 = valueNoise2(qy * 1.7, qx + t * 0.00025, seed + 17);
    const wx = qx + warp * (w1 * 2 - 1);
    const wy = qy + warp * (w2 * 2 - 1);
    let n = valueNoise2(wx, wy, seed + 31);
    if (octaves >= 2) {
        n = 0.65 * n + 0.35 * valueNoise2(wx * 2.1, wy * 2.1, seed + 53);
    }
    return clamp01(n);
}
export function samplePattern(nx, ny, t, opts, harmonicsSample) {
    const primary = samplePrimary(nx, ny, t, opts, harmonicsSample);
    if (!opts.dualLayer)
        return primary;
    const secondary = sampleInterference(nx, ny, t, {
        waves: (opts.waves ?? 5) + 2,
        freq: (opts.freq ?? 7) * 0.7,
        phaseSpeed: -(opts.phaseSpeed ?? 0.0012) * 0.8,
    });
    const blend = opts.dualBlend ?? 0.5 + 0.5 * Math.sin(t * 0.0008);
    return clamp01(primary * (1 - blend) + secondary * blend);
}
function samplePrimary(nx, ny, t, opts, harmonicsSample) {
    switch (opts.mode) {
        case "interference":
            return sampleInterference(nx, ny, t, {
                waves: opts.waves,
                freq: opts.freq,
                phaseSpeed: opts.phaseSpeed,
            });
        case "rose":
            return sampleRose(nx, ny, t, {
                petals: opts.petals,
                radialFreq: opts.radialFreq,
                spin: opts.spin,
                breathe: opts.roseBreathe,
            });
        case "noise-warp":
            return sampleNoiseWarp(nx, ny, t, {
                scale: opts.noiseScale,
                warp: opts.noiseWarp,
                octaves: opts.noiseOctaves,
                seed: opts.noiseSeed,
            });
        case "harmonics":
            return harmonicsSample ? harmonicsSample(nx, ny, t) : sampleProcedural(nx, ny, t, opts.segments, opts.loopMs);
        case "procedural":
        default:
            return sampleProcedural(nx, ny, t, opts.segments, opts.loopMs);
    }
}
//# sourceMappingURL=sample.js.map