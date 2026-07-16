export const DEFAULT_KALEIDOSCOPE_PARAMS = {
    segments: 8,
    rotation: 0,
    contrast: 1.18,
    brightness: -0.03,
    invert: false,
    geometry: "square",
    mode: "procedural",
    harmonicsL: 3,
    harmonicsM: 2,
    colorScheme: "majico",
    seedHue: 0,
    seedColor: undefined,
    pulse: 0.35,
    speed: 0.5,
    animateRotation: true,
    image: null,
    mirror: true,
    breathe: 0,
    waves: 5,
    freq: 7,
    phaseSpeed: 0.0012,
    petals: 4,
    radialFreq: 8,
    spin: 0.001,
    noiseScale: 1.4,
    noiseWarp: 0.45,
    noiseOctaves: 1,
    noiseSeed: 0,
    dualLayer: false,
    dualBlend: undefined,
    paletteOrbit: false,
};
const MODES = [
    "procedural",
    "harmonics",
    "interference",
    "rose",
    "noise-warp",
    "image",
];
export const kaleidoscopeParamsSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    title: "KaleidoscopeParams",
    additionalProperties: false,
    properties: {
        segments: { type: "integer", minimum: 3, maximum: 16, default: 8 },
        rotation: { type: "number", minimum: 0, maximum: 360, default: 0 },
        contrast: { type: "number", minimum: 0.5, maximum: 2, default: 1.18 },
        brightness: { type: "number", minimum: -0.3, maximum: 0.3, default: -0.03 },
        invert: { type: "boolean", default: false },
        geometry: { type: "string", enum: ["square", "circle"], default: "square" },
        mode: {
            type: "string",
            enum: MODES,
            default: "procedural",
            description: "Maps to --pattern procedural|spherical-harmonics|interference|rose|noise-warp (+ image)",
        },
        harmonicsL: { type: "integer", minimum: 0, maximum: 4, default: 3 },
        harmonicsM: { type: "integer", minimum: -4, maximum: 4, default: 2 },
        colorScheme: {
            type: "string",
            enum: ["majico", "neon", "ember", "mono", "vinyl", "ice"],
            default: "majico",
        },
        seedHue: { type: "number", minimum: 0, maximum: 360, default: 0 },
        seedColor: { type: "string", description: "Hex color override for seed hue" },
        pulse: { type: "number", minimum: 0, maximum: 1, default: 0.35 },
        speed: { type: "number", minimum: 0.25, maximum: 2, default: 0.5 },
        animateRotation: { type: "boolean", default: true },
        mirror: {
            type: "boolean",
            default: true,
            description: "true = dihedral Dn mirrors; false = cyclic Cn pie copies",
        },
        breathe: {
            type: "number",
            minimum: 0,
            maximum: 1,
            default: 0,
            description: "Radial breathe amplitude on fold",
        },
        waves: { type: "integer", minimum: 3, maximum: 9, default: 5 },
        freq: { type: "number", minimum: 2, maximum: 20, default: 7 },
        phaseSpeed: { type: "number", default: 0.0012 },
        petals: { type: "integer", minimum: 2, maximum: 8, default: 4 },
        radialFreq: { type: "number", minimum: 1, maximum: 20, default: 8 },
        spin: { type: "number", default: 0.001 },
        noiseScale: { type: "number", minimum: 0.5, maximum: 4, default: 1.4 },
        noiseWarp: { type: "number", minimum: 0, maximum: 1.5, default: 0.45 },
        noiseOctaves: { type: "integer", minimum: 1, maximum: 2, default: 1 },
        noiseSeed: { type: "number", default: 0 },
        dualLayer: { type: "boolean", default: false },
        dualBlend: { type: "number", minimum: 0, maximum: 1 },
        paletteOrbit: { type: "boolean", default: false },
    },
};
function parseMode(v) {
    if (typeof v === "string" && MODES.includes(v)) {
        return v;
    }
    return DEFAULT_KALEIDOSCOPE_PARAMS.mode;
}
export function normalizeParams(input) {
    const p = (input && typeof input === "object" ? input : {});
    return {
        segments: clampInt(p.segments ?? DEFAULT_KALEIDOSCOPE_PARAMS.segments, 3, 16),
        rotation: Number(p.rotation ?? DEFAULT_KALEIDOSCOPE_PARAMS.rotation),
        contrast: Number(p.contrast ?? DEFAULT_KALEIDOSCOPE_PARAMS.contrast),
        brightness: Number(p.brightness ?? DEFAULT_KALEIDOSCOPE_PARAMS.brightness),
        invert: Boolean(p.invert ?? DEFAULT_KALEIDOSCOPE_PARAMS.invert),
        geometry: p.geometry === "circle" ? "circle" : "square",
        mode: parseMode(p.mode),
        harmonicsL: clampInt(p.harmonicsL ?? DEFAULT_KALEIDOSCOPE_PARAMS.harmonicsL, 0, 4),
        harmonicsM: clampInt(p.harmonicsM ?? DEFAULT_KALEIDOSCOPE_PARAMS.harmonicsM, -4, 4),
        colorScheme: p.colorScheme ?? DEFAULT_KALEIDOSCOPE_PARAMS.colorScheme,
        seedHue: Number(p.seedHue ?? DEFAULT_KALEIDOSCOPE_PARAMS.seedHue),
        seedColor: p.seedColor,
        pulse: clampNum(p.pulse ?? DEFAULT_KALEIDOSCOPE_PARAMS.pulse, 0, 1),
        speed: clampNum(p.speed ?? DEFAULT_KALEIDOSCOPE_PARAMS.speed, 0.25, 2),
        animateRotation: p.animateRotation ?? DEFAULT_KALEIDOSCOPE_PARAMS.animateRotation,
        image: p.image ?? null,
        mirror: p.mirror ?? DEFAULT_KALEIDOSCOPE_PARAMS.mirror,
        breathe: clampNum(p.breathe ?? DEFAULT_KALEIDOSCOPE_PARAMS.breathe, 0, 1),
        waves: clampInt(p.waves ?? DEFAULT_KALEIDOSCOPE_PARAMS.waves, 3, 9),
        freq: clampNum(p.freq ?? DEFAULT_KALEIDOSCOPE_PARAMS.freq, 2, 20),
        phaseSpeed: Number(p.phaseSpeed ?? DEFAULT_KALEIDOSCOPE_PARAMS.phaseSpeed),
        petals: clampInt(p.petals ?? DEFAULT_KALEIDOSCOPE_PARAMS.petals, 2, 8),
        radialFreq: clampNum(p.radialFreq ?? DEFAULT_KALEIDOSCOPE_PARAMS.radialFreq, 1, 20),
        spin: Number(p.spin ?? DEFAULT_KALEIDOSCOPE_PARAMS.spin),
        noiseScale: clampNum(p.noiseScale ?? DEFAULT_KALEIDOSCOPE_PARAMS.noiseScale, 0.5, 4),
        noiseWarp: clampNum(p.noiseWarp ?? DEFAULT_KALEIDOSCOPE_PARAMS.noiseWarp, 0, 1.5),
        noiseOctaves: clampInt(p.noiseOctaves ?? DEFAULT_KALEIDOSCOPE_PARAMS.noiseOctaves, 1, 2),
        noiseSeed: Number(p.noiseSeed ?? DEFAULT_KALEIDOSCOPE_PARAMS.noiseSeed),
        dualLayer: Boolean(p.dualLayer ?? DEFAULT_KALEIDOSCOPE_PARAMS.dualLayer),
        dualBlend: p.dualBlend !== undefined ? clampNum(p.dualBlend, 0, 1) : undefined,
        paletteOrbit: Boolean(p.paletteOrbit ?? DEFAULT_KALEIDOSCOPE_PARAMS.paletteOrbit),
    };
}
function clampInt(v, min, max) {
    return Math.max(min, Math.min(max, Math.round(Number(v))));
}
function clampNum(v, min, max) {
    return Math.max(min, Math.min(max, Number(v)));
}
//# sourceMappingURL=params.js.map