export class SceneRegistry {
    factories = new Map();
    register(factory) {
        const scene = factory();
        this.factories.set(scene.id, factory);
        scene.dispose();
    }
    registerScene(scene) {
        const id = scene.id;
        this.factories.set(id, () => {
            // Callers that register a live instance should prefer register(factory).
            // This path reuses the same instance (demo / single-shot).
            return scene;
        });
    }
    has(id) {
        return this.factories.has(id);
    }
    ids() {
        return [...this.factories.keys()];
    }
    create(id) {
        const factory = this.factories.get(id);
        if (!factory) {
            throw new Error(`Unknown scene: ${id}. Registered: ${this.ids().join(", ") || "(none)"}`);
        }
        return factory();
    }
    listSchemas() {
        return this.ids().map((id) => {
            const scene = this.create(id);
            const schema = scene.paramsSchema;
            scene.dispose();
            return { id, paramsSchema: schema };
        });
    }
}
//# sourceMappingURL=registry.js.map