/** Palette — ported from reeldemo.io/kaleidoscope/palette.js */
export const COLOR_SCHEMES = [
    { id: "majico", label: "Majico (teal)" },
    { id: "neon", label: "Neon" },
    { id: "ember", label: "Ember" },
    { id: "mono", label: "Mono" },
    { id: "vinyl", label: "Vinyl" },
    { id: "ice", label: "Ice" },
];
function hsvToRgb(h, s, v) {
    const c = v * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0;
    let g = 0;
    let b = 0;
    const sector = Math.floor(hp) % 6;
    if (sector === 0)
        [r, g, b] = [c, x, 0];
    else if (sector === 1)
        [r, g, b] = [x, c, 0];
    else if (sector === 2)
        [r, g, b] = [0, c, x];
    else if (sector === 3)
        [r, g, b] = [0, x, c];
    else if (sector === 4)
        [r, g, b] = [x, 0, c];
    else
        [r, g, b] = [c, 0, x];
    const m = v - c;
    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ];
}
function parseHexColor(hex) {
    const clean = String(hex || "")
        .trim()
        .replace(/^#/, "");
    if (clean.length !== 6)
        return null;
    const n = parseInt(clean, 16);
    if (Number.isNaN(n))
        return null;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHue(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    if (d < 1e-9)
        return 0;
    let h;
    if (max === rn)
        h = ((gn - bn) / d) % 6;
    else if (max === gn)
        h = (bn - rn) / d + 2;
    else
        h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0)
        h += 360;
    return h;
}
function hueOffset({ seedHue = 0, seedColor }) {
    const rgb = seedColor ? parseHexColor(seedColor) : null;
    if (rgb)
        return rgbToHue(rgb[0], rgb[1], rgb[2]);
    return ((seedHue % 360) + 360) % 360;
}
export function paletteColor(lum, segIdx, rotationDeg, imageMode, options = {}) {
    const scheme = options.colorScheme || "majico";
    const offset = hueOffset(options);
    if (scheme === "mono") {
        const v = 0.38 + lum * 0.58;
        const g = Math.round(v * 255);
        return [g, g, g];
    }
    let h;
    let s;
    let v;
    if (scheme === "neon") {
        if (imageMode) {
            h = lum * 360 + rotationDeg * 0.25;
            s = 0.78 + lum * 0.22;
            v = 0.48 + lum * 0.52;
        }
        else {
            h = 120 + lum * 48 + segIdx * 6;
            s = 0.72 + lum * 0.28;
            v = 0.5 + lum * 0.5;
        }
    }
    else if (scheme === "ember") {
        if (imageMode) {
            h = lum * 50 + 10 + rotationDeg * 0.12;
            s = 0.65 + lum * 0.35;
            v = 0.4 + lum * 0.55;
        }
        else {
            h = 18 + lum * 35 + segIdx * 3;
            s = 0.55 + lum * 0.45;
            v = 0.42 + lum * 0.52;
        }
    }
    else if (scheme === "vinyl") {
        if (imageMode) {
            h = lum * 80 + 280 + rotationDeg * 0.18;
            s = 0.6 + lum * 0.4;
            v = 0.4 + lum * 0.55;
        }
        else {
            h = 290 + lum * 40 + segIdx * 5;
            s = 0.58 + lum * 0.42;
            v = 0.4 + lum * 0.52;
        }
    }
    else if (scheme === "ice") {
        if (imageMode) {
            h = lum * 40 + 195 + rotationDeg * 0.1;
            s = 0.35 + lum * 0.45;
            v = 0.45 + lum * 0.55;
        }
        else {
            h = 205 + lum * 22 + segIdx * 3;
            s = 0.32 + lum * 0.38;
            v = 0.48 + lum * 0.52;
        }
    }
    else {
        // majico (default)
        if (imageMode) {
            h = lum * 300 + 220 + rotationDeg * 0.15;
            s = 0.55 + lum * 0.35;
            v = 0.38 + lum * 0.58;
        }
        else {
            h = 168 + lum * 28 + segIdx * 4;
            s = 0.42 + lum * 0.4;
            v = 0.38 + lum * 0.58;
        }
    }
    h = (h + offset) % 360;
    if (h < 0)
        h += 360;
    return hsvToRgb(h, Math.min(1, s), Math.min(1, v));
}
//# sourceMappingURL=palette.js.map