/** Luma grid → charset → plain / ANSI / HTML — extracted from demo.js */
import { DEFAULT_CHARSET } from "./types.js";
import { paletteColor } from "./palette.js";
function clamp01(v) {
    return Math.min(1, Math.max(0, v));
}
export function lumaToChar(lum, charset) {
    const ci = Math.round(clamp01(lum) * (charset.length - 1));
    return charset[ci] ?? " ";
}
export function applyTone(raw, contrast, brightness, invert) {
    let lum = clamp01((raw - 0.5) * contrast + 0.5 + brightness);
    if (invert)
        lum = 1 - lum;
    return lum;
}
export function luminanceFromRgb(r, g, b, contrast, brightness, invert) {
    let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lum = clamp01((lum - 0.5) * contrast + 0.5 + brightness);
    if (invert)
        lum = 1 - lum;
    return lum;
}
function ansiFg(r, g, b) {
    return `\x1b[38;2;${r};${g};${b}m`;
}
const ANSI_RESET = "\x1b[0m";
function cellColor(grid, i, lum, opts) {
    if (grid.rgb) {
        const o = i * 3;
        return [grid.rgb[o], grid.rgb[o + 1], grid.rgb[o + 2]];
    }
    const seg = opts.segIdx?.[i] ?? 0;
    return paletteColor(lum, seg, opts.rotationDeg ?? 0, opts.imageMode ?? false, opts.palette ?? {});
}
/** Raster a filled LumaGrid to a multiline string. */
export function rasterize(grid, options = {}) {
    const charset = options.charset ?? DEFAULT_CHARSET;
    const format = options.format ?? "plain";
    const emptyChar = options.emptyChar ?? " ";
    const { cols, rows, luma } = grid;
    const lines = [];
    for (let y = 0; y < rows; y++) {
        let row = "";
        if (format === "html")
            row += '<div class="ka-row">';
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            const lum = luma[i];
            // Negative sentinel = outside geometry (circle mask)
            if (lum < 0) {
                if (format === "html") {
                    row += `<span class="ka-cell">${emptyChar}</span>`;
                }
                else {
                    row += emptyChar;
                }
                continue;
            }
            const ch = lumaToChar(lum, charset);
            if (format === "plain") {
                row += ch;
                continue;
            }
            const [cr, cg, cb] = cellColor(grid, i, lum, options);
            if (format === "ansi") {
                row += `${ansiFg(cr, cg, cb)}${ch}`;
            }
            else {
                row += `<span class="ka-cell" style="color:rgb(${cr},${cg},${cb})">${ch}</span>`;
            }
        }
        if (format === "ansi")
            row += ANSI_RESET;
        if (format === "html")
            row += "</div>";
        lines.push(row);
    }
    return lines.join(format === "html" ? "" : "\n");
}
//# sourceMappingURL=rasterizer.js.map