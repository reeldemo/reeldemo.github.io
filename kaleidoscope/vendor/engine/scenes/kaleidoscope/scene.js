import { paletteColor } from "../../palette.js";
import { applyTone, luminanceFromRgb } from "../../rasterizer.js";
import { foldCoords, foldSamplePosition } from "./fold.js";
import { sampleSphericalHarmonics } from "./harmonics.js";
import { DEFAULT_KALEIDOSCOPE_PARAMS, kaleidoscopeParamsSchema, normalizeParams, } from "./params.js";
import { DEFAULT_LOOP_MS, samplePattern } from "./sample.js";
export class KaleidoscopeScene {
    id = "kaleidoscope";
    paramsSchema = kaleidoscopeParamsSchema;
    ctx = null;
    params = { ...DEFAULT_KALEIDOSCOPE_PARAMS };
    t = 0;
    segIdxBuf = null;
    /** Expose last sample's segment indices for palette-aware rasterization. */
    get lastSegIdx() {
        return this.segIdxBuf;
    }
    get effectiveRotationDeg() {
        const loop = this.loopMs();
        if (!this.params.animateRotation)
            return this.params.rotation;
        return this.params.rotation + (this.t / loop) * 360;
    }
    get paletteOptions() {
        let seedHue = this.params.seedHue;
        if (this.params.paletteOrbit) {
            seedHue = (seedHue + (this.t / this.loopMs()) * 360) % 360;
        }
        return {
            colorScheme: this.params.colorScheme,
            seedHue,
            seedColor: this.params.seedColor,
        };
    }
    get imageMode() {
        return this.params.mode === "image";
    }
    init(ctx, params) {
        this.ctx = ctx;
        this.params = normalizeParams(params);
        this.t = 0;
        this.segIdxBuf = new Int16Array(ctx.cols * ctx.rows);
    }
    updateParams(params) {
        const next = normalizeParams({ ...this.params, ...params });
        if (params?.image === undefined) {
            next.image = this.params.image;
        }
        this.params = next;
    }
    setImage(image) {
        this.params = { ...this.params, image, mode: image ? "image" : this.params.mode };
    }
    tick(t, _dt) {
        this.t = t;
    }
    sample(out) {
        if (!this.ctx)
            throw new Error("KaleidoscopeScene.init() required before sample()");
        const { cols, rows } = out;
        if (cols !== this.ctx.cols || rows !== this.ctx.rows) {
            this.ctx = { ...this.ctx, cols, rows };
            this.segIdxBuf = new Int16Array(cols * rows);
        }
        const tone = this.toneAdjustments();
        const rotationDeg = this.effectiveRotationDeg;
        const rotationRad = (rotationDeg * Math.PI) / 180;
        const { segments, geometry, mode, invert } = this.params;
        const palette = this.paletteOptions;
        const writeRgb = Boolean(out.rgb);
        const foldOpts = this.foldOpts();
        if (mode === "image" && this.params.image) {
            this.sampleImage(out, tone, rotationDeg, rotationRad, writeRgb, palette, foldOpts);
            return;
        }
        const cx = cols / 2;
        const cy = rows / 2;
        const loopMs = this.loopMs();
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                if (geometry === "circle") {
                    const dx = x + 0.5 - cx;
                    const dy = y + 0.5 - cy;
                    if (Math.hypot(dx, dy) > Math.min(cx, cy)) {
                        out.luma[i] = -1;
                        if (this.segIdxBuf)
                            this.segIdxBuf[i] = 0;
                        continue;
                    }
                }
                const nx = (x + 0.5 - cx) / cx;
                const ny = (y + 0.5 - cy) / cy;
                const folded = foldCoords(nx, ny, rotationRad, segments, foldOpts);
                const raw = samplePattern(folded.x, folded.y, this.t, {
                    mode,
                    segments,
                    loopMs,
                    waves: this.params.waves,
                    freq: this.params.freq,
                    phaseSpeed: this.params.phaseSpeed,
                    petals: this.params.petals,
                    radialFreq: this.params.radialFreq,
                    spin: this.params.spin,
                    roseBreathe: this.params.phaseSpeed,
                    noiseScale: this.params.noiseScale,
                    noiseWarp: this.params.noiseWarp,
                    noiseOctaves: this.params.noiseOctaves,
                    noiseSeed: this.params.noiseSeed,
                    dualLayer: this.params.dualLayer,
                    dualBlend: this.params.dualBlend,
                }, (fx, fy, tt) => sampleSphericalHarmonics(fx, fy, tt, this.params.harmonicsL, this.params.harmonicsM));
                const lum = applyTone(raw, tone.contrast, tone.brightness, invert);
                out.luma[i] = lum;
                if (this.segIdxBuf)
                    this.segIdxBuf[i] = folded.segIdx;
                if (writeRgb && out.rgb) {
                    const [cr, cg, cb] = paletteColor(lum, folded.segIdx, rotationDeg, false, palette);
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
        this.segIdxBuf = null;
        this.params = { ...DEFAULT_KALEIDOSCOPE_PARAMS };
    }
    foldOpts() {
        return {
            mirror: this.params.mirror,
            breathe: this.params.breathe,
            breathePhase: (this.t / this.loopMs()) * Math.PI * 2,
        };
    }
    loopMs() {
        return DEFAULT_LOOP_MS / Math.max(0.25, this.params.speed);
    }
    toneAdjustments() {
        const contrastBase = this.params.contrast;
        const brightnessBase = this.params.brightness;
        const pulseAmt = this.params.pulse;
        if (pulseAmt <= 0) {
            return { contrast: contrastBase, brightness: brightnessBase };
        }
        const loop = this.loopMs();
        const wave = Math.sin((this.t / loop) * Math.PI * 2 * 2) * 0.5 + 0.5;
        return {
            contrast: contrastBase + wave * 0.22 * pulseAmt,
            brightness: brightnessBase + (wave - 0.5) * 0.12 * pulseAmt,
        };
    }
    sampleImage(out, tone, rotationDeg, rotationRad, writeRgb, palette, foldOpts) {
        const img = this.params.image;
        const { cols, rows } = out;
        const { segments, geometry, invert } = this.params;
        const cellW = img.width / cols;
        const cellH = (img.height / rows) * 2;
        const data = img.data;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                const sample = foldSamplePosition(x, y, cols, rows, rotationRad, segments, geometry, foldOpts);
                if (!sample) {
                    out.luma[i] = -1;
                    if (this.segIdxBuf)
                        this.segIdxBuf[i] = 0;
                    continue;
                }
                const px = Math.min(img.width - 1, Math.max(0, Math.floor(sample.sx * cellW)));
                const py = Math.min(img.height - 1, Math.max(0, Math.floor(sample.sy * cellH)));
                const idx = (py * img.width + px) * 4;
                const lum = luminanceFromRgb(data[idx] / 255, data[idx + 1] / 255, data[idx + 2] / 255, tone.contrast, tone.brightness, invert);
                out.luma[i] = lum;
                if (this.segIdxBuf)
                    this.segIdxBuf[i] = 0;
                if (writeRgb && out.rgb) {
                    const [cr, cg, cb] = paletteColor(lum, 0, rotationDeg, true, palette);
                    const o = i * 3;
                    out.rgb[o] = cr;
                    out.rgb[o + 1] = cg;
                    out.rgb[o + 2] = cb;
                }
            }
        }
    }
}
export function createKaleidoscopeScene() {
    return new KaleidoscopeScene();
}
//# sourceMappingURL=scene.js.map