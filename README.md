# PixiJS Layout Editor

A visual editor for inspecting and editing [@pixi/layout](https://github.com/pixijs/layout) properties in real-time.

![Layout Editor Screenshot](screenshot.png)

## Features

- **Live Container Tree**: View your PixiJS container hierarchy
- **Property Editing**: Edit flexbox layout properties (width, height, flexDirection, justifyContent, alignItems, gap, padding, margin, etc.)
- **Transform Editing**: Modify position, scale, rotation, pivot, anchor, and alpha
- **Visual Highlighting**: See which container you're editing highlighted in your game
- **Session Management**: Save and load different layout configurations
- **Auto-Save**: Automatically save changes as you edit

## Installation

```bash
npm install pixi-layout-editor
```

## Quick Start

### 1. Add the bridge to your PixiJS game

```typescript
import { initDebugBridge } from "pixi-layout-editor";

// After your app is set up and your root container is ready:
const bridge = initDebugBridge();
bridge.start(app.stage); // or your root layout container
```

### 2. Open the editor

Run the editor locally:

```bash
git clone https://github.com/ubberkid/pixi-layout-editor
cd pixi-layout-editor
npm install
npm run dev
```

Or use the hosted version at: `https://ubberkid.github.io/pixi-layout-editor`

### 3. Connect

Make sure both your game and the editor are running on the same origin (same host and port), or use the hosted editor with your local game via the same port.

The editor uses `BroadcastChannel` for communication, which requires same-origin.

## How It Works

The bridge runs in your game and exposes your container hierarchy via `BroadcastChannel`. The editor connects to this channel and can:

- Request the container hierarchy
- Highlight containers in your game
- Send property changes that are applied in real-time

## Project Structure

```
pixi-layout-editor/
├── bridge/          # npm package - add this to your game
│   └── src/
│       ├── LayoutDebugBridge.ts
│       ├── DebugOverlay.ts
│       └── types.ts
├── editor/          # standalone editor web app
│   └── src/
│       ├── main.ts
│       ├── connection.ts
│       ├── tree-view.ts
│       └── property-panel.ts
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Run the editor in dev mode
npm run dev

# Build everything
npm run build

# Build just the bridge (for npm publishing)
npm run build:bridge
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

## License

MIT
