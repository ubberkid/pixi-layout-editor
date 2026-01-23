import type { Plugin, Connect } from "vite";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve, join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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
export function pixiLayoutEditor(options: PixiLayoutEditorOptions = {}): Plugin {
  const editorPath = options.path || "/layout-editor";

  return {
    name: "pixi-layout-editor",
    configureServer(server) {
      // Find the editor dist directory relative to this plugin
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const editorDistPath = resolve(currentDir, "../editor-dist");

      if (!existsSync(editorDistPath)) {
        console.warn(
          `[pixi-layout-editor] Editor files not found at ${editorDistPath}. ` +
            `The layout editor will not be available.`
        );
        return;
      }

      server.middlewares.use(((req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith(editorPath)) {
          return next();
        }

        // Get the file path relative to editor root
        let urlPath = url.slice(editorPath.length) || "/";
        if (urlPath === "/") {
          urlPath = "/index.html";
        }

        const filePath = join(editorDistPath, urlPath);

        if (existsSync(filePath) && statSync(filePath).isFile()) {
          const content = readFileSync(filePath);
          const ext = extname(filePath);
          const mimeTypes: Record<string, string> = {
            ".html": "text/html",
            ".js": "application/javascript",
            ".css": "text/css",
            ".json": "application/json",
            ".png": "image/png",
            ".svg": "image/svg+xml",
          };
          res.setHeader(
            "Content-Type",
            mimeTypes[ext] || "application/octet-stream"
          );
          res.end(content);
          return;
        }

        next();
      }) as Connect.NextHandleFunction);

      // Log that the editor is available
      const serverUrl = server.resolvedUrls?.local?.[0] || "http://localhost:5173";
      console.log(`\n  Layout Editor: ${serverUrl}${editorPath}\n`);
    },
  };
}
