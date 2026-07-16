import { SceneRegistry } from "./registry.js";
import { createKaleidoscopeScene } from "./scenes/kaleidoscope/index.js";
import { createParticlesScene } from "./scenes/particles/index.js";
import { createJellyfishScene } from "./scenes/jellyfish/index.js";
export function createDefaultRegistry() {
    const registry = new SceneRegistry();
    registry.register(createKaleidoscopeScene);
    registry.register(createParticlesScene);
    registry.register(createJellyfishScene);
    return registry;
}
export * from "./types.js";
export * from "./palette.js";
export * from "./rasterizer.js";
export * from "./registry.js";
export * from "./render.js";
export * from "./controller.js";
export * from "./scenes/kaleidoscope/index.js";
export * from "./scenes/particles/index.js";
export * from "./scenes/jellyfish/index.js";
//# sourceMappingURL=index.js.map