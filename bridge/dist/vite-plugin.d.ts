import type { Plugin } from "vite";
export interface PixiLayoutEditorOptions {
    /** Path to serve the editor at. Defaults to "/layout-editor" */
    path?: string;
}
/**
 * Vite plugin that serves the PixiJS Layout Editor in dev mode.
 * The editor will be available at /layout-editor (or custom path).
 *
 * @example
 * ```ts
 * import { defineConfig } from 'vite';
 * import { pixiLayoutEditor } from 'pixi-layout-editor/vite';
 *
 * export default defineConfig({
 *   plugins: [pixiLayoutEditor()],
 * });
 * ```
 */
export declare function pixiLayoutEditor(options?: PixiLayoutEditorOptions): Plugin;
//# sourceMappingURL=vite-plugin.d.ts.map