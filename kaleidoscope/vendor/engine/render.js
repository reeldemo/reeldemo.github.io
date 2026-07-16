import { DEFAULT_CHARSET, createLumaGrid } from "./types.js";
import { rasterize } from "./rasterizer.js";
/** One-shot: init → tick → sample → rasterize. Reuses scene if already inited. */
export function renderFrame(scene, options = {}) {
    const cols = options.cols ?? 64;
    const rows = options.rows ?? 32;
    const charset = options.charset ?? DEFAULT_CHARSET;
    const format = options.format ?? "plain";
    const t = options.t ?? 0;
    const dt = options.dt ?? 0;
    const withRgb = options.withRgb ?? format !== "plain";
    const palette = "paletteOptions" in scene
        ? scene.paletteOptions
        : {};
    const ctx = {
        cols,
        rows,
        charset,
        palette,
    };
    scene.init(ctx, options.params ?? {});
    scene.tick(t, dt);
    const grid = createLumaGrid(cols, rows, withRgb);
    scene.sample(grid);
    const rasterOpts = {
        charset,
        format,
        palette: ctx.palette,
    };
    if ("lastSegIdx" in scene) {
        const ka = scene;
        rasterOpts.segIdx = ka.lastSegIdx ?? undefined;
        rasterOpts.rotationDeg = ka.effectiveRotationDeg;
        rasterOpts.imageMode = ka.imageMode;
    }
    const ascii = rasterize(grid, rasterOpts);
    return { ascii, grid, ctx };
}
//# sourceMappingURL=render.js.map