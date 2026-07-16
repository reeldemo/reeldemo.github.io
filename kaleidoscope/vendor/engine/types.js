export const DEFAULT_CHARSET = "@#S&%*+=-:. ";
export function createLumaGrid(cols, rows, withRgb = false) {
    return {
        cols,
        rows,
        luma: new Float32Array(cols * rows),
        rgb: withRgb ? new Uint8ClampedArray(cols * rows * 3) : undefined,
    };
}
//# sourceMappingURL=types.js.map