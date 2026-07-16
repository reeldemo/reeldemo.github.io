import { paletteColor } from "../../palette.js";
export const DEFAULT_PARTICLES_PARAMS = {
    count: 120,
    speed: 1,
    attract: 0.35,
    seed: 42,
    colorScheme: "neon",
    seedHue: 40,
    radius: 1.2,
};
export const particlesParamsSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    title: "ParticlesParams",
    additionalProperties: false,
    properties: {
        count: { type: "integer", minimum: 8, maximum: 800, default: 120 },
        speed: { type: "number", minimum: 0.1, maximum: 3, default: 1 },
        attract: { type: "number", minimum: 0, maximum: 1, default: 0.35 },
        seed: { type: "number", default: 42 },
        colorScheme: {
            type: "string",
            enum: ["majico", "neon", "ember", "mono", "vinyl", "ice"],
            default: "neon",
        },
        seedHue: { type: "number", minimum: 0, maximum: 360, default: 40 },
        radius: { type: "number", minimum: 0.4, maximum: 3, default: 1.2 },
    },
};
function normalize(input) {
    const p = (input && typeof input === "object" ? input : {});
    return {
        count: clampInt(p.count ?? DEFAULT_PARTICLES_PARAMS.count, 8, 800),
        speed: clamp(p.speed ?? DEFAULT_PARTICLES_PARAMS.speed, 0.1, 3),
        attract: clamp(p.attract ?? DEFAULT_PARTICLES_PARAMS.attract, 0, 1),
        seed: Number(p.seed ?? DEFAULT_PARTICLES_PARAMS.seed),
        colorScheme: p.colorScheme ?? DEFAULT_PARTICLES_PARAMS.colorScheme,
        seedHue: Number(p.seedHue ?? DEFAULT_PARTICLES_PARAMS.seedHue),
        radius: clamp(p.radius ?? DEFAULT_PARTICLES_PARAMS.radius, 0.4, 3),
    };
}
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, Number(v)));
}
function clampInt(v, min, max) {
    return Math.max(min, Math.min(max, Math.round(Number(v))));
}
function hash(n) {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
}
/**
 * ASCII particle cloud inspired by portfolio brownian:
 * points project into a char-grid density field (no WebGL).
 */
export class ParticlesScene {
    id = "particles";
    paramsSchema = particlesParamsSchema;
    ctx = null;
    params = { ...DEFAULT_PARTICLES_PARAMS };
    t = 0;
    get paletteOptions() {
        return {
            colorScheme: this.params.colorScheme,
            seedHue: this.params.seedHue,
        };
    }
    init(ctx, params) {
        this.ctx = ctx;
        this.params = normalize(params);
        this.t = 0;
    }
    updateParams(params) {
        this.params = normalize({ ...this.params, ...params });
    }
    tick(t, _dt) {
        this.t = t;
    }
    sample(out) {
        if (!this.ctx)
            throw new Error("ParticlesScene.init() required before sample()");
        const { cols, rows } = out;
        out.luma.fill(0);
        const { count, speed, attract, seed, radius } = this.params;
        const t = this.t * speed;
        const cx = (cols - 1) / 2;
        const cy = (rows - 1) / 2;
        const dens = new Float32Array(cols * rows);
        let maxD = 0;
        for (let i = 0; i < count; i++) {
            const h0 = hash(seed + i * 17.13);
            const h1 = hash(seed + i * 31.7 + 3.1);
            const h2 = hash(seed + i * 53.9 + 7.2);
            const h3 = hash(seed + i * 71.3 + 11.5);
            // Base cloud on a soft sphere (portfolio ballCloud vibe)
            const theta = h0 * Math.PI * 2;
            const phi = h1 * Math.PI;
            const r0 = 0.35 + 0.55 * h2;
            let x = Math.sin(phi) * Math.cos(theta) * r0;
            let y = Math.sin(phi) * Math.sin(theta) * r0 * 0.85;
            // Brownian-ish drift + mild center attract
            const drift = 0.22 * (1 - attract * 0.5);
            x += Math.sin(t * 0.0011 + h3 * 6.2) * drift + Math.cos(t * 0.0007 + i) * drift * 0.6;
            y += Math.cos(t * 0.0013 + h2 * 4.1) * drift + Math.sin(t * 0.0009 + i * 0.7) * drift * 0.6;
            x *= 1 - attract * 0.25 * (1 - Math.cos(t * 0.0004));
            y *= 1 - attract * 0.25 * (1 - Math.cos(t * 0.0004));
            const px = cx + x * cx;
            const py = cy + y * cy;
            const zBright = 0.55 + 0.45 * Math.sin(phi);
            const x0 = Math.max(0, Math.floor(px - radius));
            const x1 = Math.min(cols - 1, Math.ceil(px + radius));
            const y0 = Math.max(0, Math.floor(py - radius));
            const y1 = Math.min(rows - 1, Math.ceil(py + radius));
            const r2 = radius * radius;
            for (let gy = y0; gy <= y1; gy++) {
                for (let gx = x0; gx <= x1; gx++) {
                    const dx = gx - px;
                    const dy = gy - py;
                    const d2 = dx * dx + dy * dy;
                    if (d2 > r2)
                        continue;
                    const w = (1 - d2 / r2) * zBright;
                    const idx = gy * cols + gx;
                    dens[idx] += w;
                    if (dens[idx] > maxD)
                        maxD = dens[idx];
                }
            }
        }
        const inv = maxD > 1e-6 ? 1 / maxD : 1;
        const writeRgb = Boolean(out.rgb);
        const palette = this.paletteOptions;
        for (let i = 0; i < cols * rows; i++) {
            const lum = dens[i] * inv;
            out.luma[i] = lum;
            if (writeRgb && out.rgb) {
                const [cr, cg, cb] = paletteColor(lum, i % 8, 0, false, palette);
                const o = i * 3;
                out.rgb[o] = cr;
                out.rgb[o + 1] = cg;
                out.rgb[o + 2] = cb;
            }
        }
    }
    dispose() {
        this.ctx = null;
        this.params = { ...DEFAULT_PARTICLES_PARAMS };
    }
}
export function createParticlesScene() {
    return new ParticlesScene();
}
//# sourceMappingURL=index.js.map