import { DEFAULT_CHARSET, createLumaGrid } from "./types.js";
import { rasterize } from "./rasterizer.js";
/**
 * Stateful session over SceneRegistry — used by MCP and multi-frame loops.
 * Unlike renderFrame(), does not re-init on every sample.
 */
export class EngineController {
    registry;
    scene = null;
    sceneId = null;
    t = 0;
    cols;
    rows;
    charset;
    looping = false;
    loopFramesLeft = 0;
    constructor(registry, options = {}) {
        this.registry = registry;
        this.cols = options.cols ?? 64;
        this.rows = options.rows ?? 32;
        this.charset = options.charset ?? DEFAULT_CHARSET;
    }
    listScenes() {
        return this.registry.listSchemas();
    }
    get activeSceneId() {
        return this.sceneId;
    }
    get time() {
        return this.t;
    }
    get isLooping() {
        return this.looping;
    }
    setScene(id, params = {}, size) {
        if (size?.cols)
            this.cols = size.cols;
        if (size?.rows)
            this.rows = size.rows;
        this.scene?.dispose();
        this.scene = this.registry.create(id);
        this.sceneId = id;
        this.t = 0;
        this.scene.init(this.ctx(), params);
    }
    updateParams(params) {
        if (!this.scene)
            throw new Error("No active scene — call set_scene first");
        if (this.scene.updateParams)
            this.scene.updateParams(params);
        else {
            // Re-init with merged params when scene lacks hot-patch
            this.scene.init(this.ctx(), params);
        }
    }
    spawn(opts) {
        if (!this.scene)
            throw new Error("No active scene");
        const jelly = this.scene;
        if (typeof jelly.spawn !== "function") {
            throw new Error(`Scene "${this.sceneId}" does not support spawn`);
        }
        return jelly.spawn(opts);
    }
    despawn(id) {
        if (!this.scene)
            throw new Error("No active scene");
        const jelly = this.scene;
        if (typeof jelly.despawn !== "function") {
            throw new Error(`Scene "${this.sceneId}" does not support despawn`);
        }
        return jelly.despawn(id);
    }
    /** Advance time and sample one frame. */
    renderFrame(options = {}) {
        if (!this.scene || !this.sceneId) {
            throw new Error("No active scene — call set_scene first");
        }
        const dt = options.dt ?? 0;
        if (options.t !== undefined)
            this.t = options.t;
        else
            this.t += dt;
        this.scene.tick(this.t, dt);
        const format = options.format ?? "plain";
        const withRgb = options.withRgb ?? format !== "plain";
        const grid = createLumaGrid(this.cols, this.rows, withRgb);
        this.scene.sample(grid);
        const rasterOpts = {
            charset: this.charset,
            format,
            palette: this.palette(),
            segIdx: undefined,
            rotationDeg: 0,
            imageMode: false,
        };
        if ("lastSegIdx" in this.scene) {
            const ka = this.scene;
            rasterOpts.segIdx = ka.lastSegIdx ?? undefined;
            rasterOpts.rotationDeg = ka.effectiveRotationDeg;
            rasterOpts.imageMode = ka.imageMode;
        }
        const ascii = rasterize(grid, rasterOpts);
        return { ascii, grid, t: this.t, sceneId: this.sceneId };
    }
    /**
     * Simplified loop: render N frames at dt ms, return last (or all) ASCII.
     * Sets isLooping while running; stop_loop clears the flag.
     */
    startLoop(options = {}) {
        const n = Math.max(1, Math.min(120, options.frames ?? 8));
        const dt = options.dt ?? 100;
        const format = options.format ?? "plain";
        this.looping = true;
        this.loopFramesLeft = n;
        const frames = [];
        try {
            for (let i = 0; i < n; i++) {
                if (!this.looping)
                    break;
                const { ascii } = this.renderFrame({ format, dt });
                frames.push(ascii);
                this.loopFramesLeft--;
            }
        }
        finally {
            this.looping = false;
            this.loopFramesLeft = 0;
        }
        return {
            frames: options.returnAll ? frames : [frames[frames.length - 1]],
            last: frames[frames.length - 1],
            t: this.t,
        };
    }
    stopLoop() {
        this.looping = false;
        this.loopFramesLeft = 0;
    }
    resize(cols, rows, params = {}) {
        this.cols = cols;
        this.rows = rows;
        if (this.scene && this.sceneId) {
            this.scene.init(this.ctx(), params);
        }
    }
    dispose() {
        this.stopLoop();
        this.scene?.dispose();
        this.scene = null;
        this.sceneId = null;
    }
    ctx() {
        return {
            cols: this.cols,
            rows: this.rows,
            charset: this.charset,
            palette: this.palette(),
        };
    }
    palette() {
        if (!this.scene)
            return {};
        if ("paletteOptions" in this.scene) {
            return this.scene.paletteOptions;
        }
        return {};
    }
}
//# sourceMappingURL=controller.js.map