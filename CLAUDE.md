# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PixiJS Layout Editor is a visual debugging tool for inspecting and editing @pixi/layout flexbox properties in real-time. It consists of two workspaces:

- **bridge/** - Debug bridge that runs in the game, monitors PixiJS containers, and communicates with the editor
- **editor/** - Browser-based UI for viewing container hierarchy and editing properties

## Commands

```bash
# Development - runs editor standalone on port 5555
npm run dev

# Build everything (editor → bundle → bridge)
npm run build

# Build individual workspaces
npm run build:editor    # Build editor UI
npm run build:bridge    # Build bridge TypeScript
npm run bundle-editor   # Copy editor/dist to bridge/editor-dist
```

## Architecture

### Communication

Bridge and editor communicate via `BroadcastChannel` (channel: "layout-editor"):

```
Game (with bridge)  <--BroadcastChannel-->  Editor UI
     |                                           |
     |-- hierarchy response ------------------>  |
     |<-- get-hierarchy request ------------    |
     |<-- set-property request -------------    |
     |-- updated confirmation ------------->    |
     |<-- highlight request ----------------    |
```

### Key Components

**Bridge (`bridge/src/`):**
- `LayoutDebugBridge.ts` - Main class that serializes container hierarchy, handles property updates
- `DebugOverlay.ts` - Visual overlays for highlighting containers
- `vite-plugin.ts` - Serves editor UI at `/layout-editor` in dev mode

**Editor (`editor/src/`):**
- `connection.ts` - BroadcastChannel client, message routing
- `tree-view.ts` - Container hierarchy display with expand/collapse
- `property-panel.ts` - Dynamic form for editing layout/transform properties

### Property Handling

- **Layout properties** (flexDirection, gap, padding, etc.) use `container.layout.setStyle()`
- **Transform properties** (x, y, scale, rotation, etc.) are set directly on the container

### Package Exports

```typescript
// Main entry - bridge for games
import { initDebugBridge, addDebugOverlay, DebugColors } from "pixi-layout-editor";

// Vite plugin
import { pixiLayoutEditor } from "pixi-layout-editor/vite";
```

## Peer Dependencies

- `pixi.js` ^8.0.0 (required)
- `vite` ^5.0.0 || ^6.0.0 (optional, for vite plugin)
