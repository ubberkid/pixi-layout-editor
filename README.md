# PixiJS Layout Editor

A visual editor for inspecting and editing [@pixi/layout](https://github.com/pixijs/layout) properties in real-time.

> **Note:** This project was completely vibe coded with [Claude Code](https://claude.ai/code).

## Features

- **Live Container Tree**: View your PixiJS container hierarchy
- **Property Editing**: Edit flexbox layout properties (width, height, flexDirection, justifyContent, alignItems, gap, padding, margin, etc.)
- **Transform Editing**: Modify position, scale, rotation, pivot, anchor, and alpha
- **Visual Highlighting**: See which container you're editing highlighted in your game
- **Session Management**: Save and load different layout configurations
- **Auto-Save**: Automatically save changes as you edit

## Installation

```bash
npm install github:ubberkid/pixi-layout-editor
```

## Quick Start

### 1. Add the Vite plugin (recommended)

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { pixiLayoutEditor } from "pixi-layout-editor/vite";

export default defineConfig({
  plugins: [pixiLayoutEditor()],
});
```

### 2. Add the debug bridge to your game

```typescript
import { initDebugBridge } from "pixi-layout-editor";

// After your app is set up and your root container is ready:
if (import.meta.env.DEV) {
  const bridge = initDebugBridge();
  bridge.start(app.stage); // or your root layout container
}
```

### 3. Open the editor

Run your dev server and navigate to `/layout-editor` in your browser.

That's it! The editor runs on the same origin as your game, so they can communicate automatically.

## How It Works

The bridge runs in your game and exposes your container hierarchy via `BroadcastChannel`. The editor connects to this channel and can:

- Request the container hierarchy
- Highlight containers in your game
- Send property changes that are applied in real-time

## Plugin Options

```typescript
pixiLayoutEditor({
  path: "/layout-editor", // Custom path for the editor (default: "/layout-editor")
});
```

## API

### initDebugBridge()

Creates and returns a new `LayoutDebugBridge` instance.

### LayoutDebugBridge

#### `start(root: Container): void`

Starts the bridge with the given root container. This container and all its children will be visible in the editor.

#### `destroy(): void`

Closes the BroadcastChannel and cleans up.

### Debug Utilities

The package also exports some debug utilities:

```typescript
import { addDebugOverlay, DebugColors } from "pixi-layout-editor";

// Add a colored overlay to visualize a container's bounds
addDebugOverlay(container, {
  ...DebugColors.cyan,
  fillAlpha: 0.3,
  label: "My Container",
});
```

## Development

```bash
# Clone the repo
git clone https://github.com/ubberkid/pixi-layout-editor
cd pixi-layout-editor

# Install dependencies
npm install

# Run the editor standalone (for development)
npm run dev

# Build everything
npm run build
```

## License

MIT
