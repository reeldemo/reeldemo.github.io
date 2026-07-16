import { paletteColor } from "../../palette.js";
export const DEFAULT_JELLYFISH_PARAMS = {
    count: 2,
    tentacles: 7,
    speed: 1,
    colorScheme: "ice",
    seedHue: 190,
    seed: 7,
};
export const jellyfishParamsSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    title: "JellyfishParams",
    additionalProperties: false,
    properties: {
        count: { type: "integer", minimum: 0, maximum: 12, default: 2 },
        tentacles: { type: "integer", minimum: 3, maximum: 12, default: 7 },
        speed: { type: "number", minimum: 0.1, maximum: 3, default: 1 },
        colorScheme: {
            type: "string",
            enum: ["majico", "neon", "ember", "mono", "vinyl", "ice"],
            default: "ice",
        },
        seedHue: { type: "number", minimum: 0, maximum: 360, default: 190 },
        seed: { type: "number", default: 7 },
    },
};
function normalize(input) {
    const p = (input && typeof input === "object" ? input : {});
    return {
        count: clampInt(p.count ?? DEFAULT_JELLYFISH_PARAMS.count, 0, 12),
        tentacles: clampInt(p.tentacles ?? DEFAULT_JELLYFISH_PARAMS.tentacles, 3, 12),
        speed: clamp(p.speed ?? DEFAULT_JELLYFISH_PARAMS.speed, 0.1, 3),
        colorScheme: p.colorScheme ?? DEFAULT_JELLYFISH_PARAMS.colorScheme,
        seedHue: Number(p.seedHue ?? DEFAULT_JELLYFISH_PARAMS.seedHue),
        seed: Number(p.seed ?? DEFAULT_JELLYFISH_PARAMS.seed),
    };
}
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, Number(v)));
}
function clampInt(v, min, max) {
    return Math.max(min, Math.min(max, Math.round(Number(v))));
}
function hash(n) {
    const x = Math.sin(n * 91.7) * 43758.5453;
    return x - Math.floor(x);
}
/**
 * Procedural jellyfish — soft bell + waving tentacles → luma field.
 * Supports spawn/despawn entity ops for MCP.
 */
export class JellyfishScene {
    id = "jellyfish";
    paramsSchema = jellyfishParamsSchema;
    ctx = null;
    params = { ...DEFAULT_JELLYFISH_PARAMS };
    t = 0;
    entities = [];
    nextId = 1;
    get paletteOptions() {
        return {
            colorScheme: this.params.colorScheme,
            seedHue: this.params.seedHue,
        };
    }
    listEntities() {
        return this.entities.map((e) => e.id);
    }
    init(ctx, params) {
        this.ctx = ctx;
        this.params = normalize(params);
        this.t = 0;
        this.entities = [];
        this.nextId = 1;
        for (let i = 0; i < this.params.count; i++) {
            const h = hash(this.params.seed + i * 19.3);
            this.spawn({
                x: 0.25 + h * 0.5,
                y: 0.2 + hash(this.params.seed + i * 41.1) * 0.35,
                size: 0.12 + hash(this.params.seed + i * 7.7) * 0.1,
                tentacles: this.params.tentacles,
                phase: h * Math.PI * 2,
            });
        }
    }
    updateParams(params) {
        this.params = normalize({ ...this.params, ...params });
    }
    spawn(opts = {}) {
        const id = `jelly-${this.nextId++}`;
        this.entities.push({
            id,
            x: opts.x ?? 0.5,
            y: opts.y ?? 0.35,
            size: opts.size ?? 0.16,
            tentacles: opts.tentacles ?? this.params.tentacles,
            phase: opts.phase ?? Math.random() * Math.PI * 2,
        });
        return id;
    }
    despawn(id) {
        if (!id) {
            if (this.entities.length === 0)
                return false;
            this.entities.pop();
            return true;
        }
        const before = this.entities.length;
        this.entities = this.entities.filter((e) => e.id !== id);
        return this.entities.length < before;
    }
    tick(t, _dt) {
        this.t = t;
    }
    sample(out) {
        if (!this.ctx)
            throw new Error("JellyfishScene.init() required before sample()");
        const { cols, rows } = out;
        const writeRgb = Boolean(out.rgb);
        const palette = this.paletteOptions;
        const tt = this.t * this.params.speed;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                const nx = (x + 0.5) / cols;
                const ny = (y + 0.5) / rows;
                let best = 0;
                for (const jelly of this.entities) {
                    const v = sampleJelly(nx, ny, jelly, tt);
                    if (v > best)
                        best = v;
                }
                out.luma[i] = best;
                if (writeRgb && out.rgb) {
                    const [cr, cg, cb] = paletteColor(best, 0, 0, false, palette);
                    const o = i * 3;
                    out.rgb[o] = cr;
                    out.rgb[o + 1] = cg;
                    out.rgb[o + 2] = cb;
                }
            }
        }
    }
    dispose() {
        this.ctx = null;
        this.entities = [];
        this.params = { ...DEFAULT_JELLYFISH_PARAMS };
    }
}
function sampleJelly(nx, ny, jelly, t) {
    const bob = Math.sin(t * 0.0015 + jelly.phase) * 0.04;
    const jx = jelly.x + Math.sin(t * 0.0007 + jelly.phase) * 0.03;
    const jy = jelly.y + bob;
    const s = jelly.size;
    // Bell: soft half-ellipse
    const dx = (nx - jx) / s;
    const dy = (ny - jy) / (s * 0.7);
    const bellR = Math.hypot(dx, dy * (dy > 0 ? 1.4 : 0.85));
    let bell = 0;
    if (bellR < 1.1) {
        bell = Math.max(0, 1 - bellR) ** 1.4;
        if (dy > 0.15)
            bell *= 0.35;
    }
    // Tentacles: parametric curtains below the bell
    let tent = 0;
    const n = jelly.tentacles;
    const baseY = jy + s * 0.35;
    for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n - 0.5;
        const rootX = jx + u * s * 1.4;
        for (let step = 0; step < 10; step++) {
            const v = step / 9;
            const len = s * (1.8 + 0.4 * Math.sin(jelly.phase + k));
            const wave = Math.sin(t * 0.0022 + jelly.phase + k * 0.9 + v * 4) * s * 0.35 * (0.3 + v);
            const tx = rootX + wave;
            const ty = baseY + v * len;
            const d = Math.hypot(nx - tx, (ny - ty) * 1.15);
            const thick = s * (0.12 + (1 - v) * 0.08);
            if (d < thick) {
                tent = Math.max(tent, (1 - d / thick) * (0.85 - v * 0.35));
            }
        }
    }
    return Math.min(1, Math.max(bell * 0.95, tent));
}
export function createJellyfishScene() {
    return new JellyfishScene();
}
//# sourceMappingURL=index.js.map