import { Container } from "pixi.js";
import { addDebugOverlay, DebugColors } from "./DebugOverlay";
// Layout properties we care about
const LAYOUT_KEYS = [
    // Size
    "width",
    "height",
    "minWidth",
    "maxWidth",
    "minHeight",
    "maxHeight",
    // Flexbox Container
    "flexDirection",
    "flexWrap",
    "justifyContent",
    "alignItems",
    "alignContent",
    "gap",
    "rowGap",
    "columnGap",
    // Flexbox Item
    "flex",
    "flexGrow",
    "flexShrink",
    "flexBasis",
    "alignSelf",
    // Spacing
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "margin",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
];
// Global instance for dev mode
export let debugBridge = null;
export function initDebugBridge() {
    debugBridge = new LayoutDebugBridge();
    return debugBridge;
}
export class LayoutDebugBridge {
    constructor() {
        this._root = null;
        this._channel = null;
        this._highlightOverlay = null;
        this._highlightedContainer = null;
    }
    start(root) {
        this._root = root;
        // Use BroadcastChannel for same-origin communication
        this._channel = new BroadcastChannel("layout-editor");
        this._channel.onmessage = (event) => {
            this.handleMessage(event.data);
        };
        // Send initial hierarchy
        setTimeout(() => {
            this.sendHierarchy();
        }, 100);
        console.log(`[LayoutDebugBridge] Started on BroadcastChannel 'layout-editor'`);
    }
    handleMessage(message) {
        switch (message.type) {
            case "get-hierarchy":
                this.sendHierarchy();
                break;
            case "set-property":
                this.setProperty(message.id, message.property, message.value);
                break;
            case "highlight":
                this.highlightContainer(message.id);
                break;
            case "get-layout":
                this.sendLayoutConfig(message.id);
                break;
        }
    }
    sendHierarchy() {
        this._channel?.postMessage({
            type: "hierarchy",
            data: this.getHierarchy(),
        });
    }
    sendLayoutConfig(id) {
        const container = this.findContainerById(id);
        if (container) {
            this._channel?.postMessage({
                type: "layout-config",
                id,
                config: this.extractLayout(container),
            });
        }
    }
    getHierarchy() {
        if (!this._root)
            return [];
        return [this.serializeContainer(this._root)];
    }
    serializeContainer(container) {
        const layout = this.extractLayout(container);
        const layoutObj = container.layout;
        const layoutEnabled = layoutObj !== undefined && layoutObj !== null;
        const transform = this.extractTransform(container);
        const children = [];
        for (const child of container.children) {
            if (child instanceof Container && child.label !== "Debug Overlay") {
                children.push(this.serializeContainer(child));
            }
        }
        return {
            id: container.label || `[${container.constructor.name}]`,
            type: container.constructor.name,
            layout,
            layoutEnabled,
            transform,
            children,
        };
    }
    extractTransform(container) {
        const hasAnchor = "anchor" in container;
        const anchor = hasAnchor ? container.anchor : null;
        return {
            x: container.x,
            y: container.y,
            scaleX: container.scale.x,
            scaleY: container.scale.y,
            rotation: container.rotation,
            pivotX: container.pivot.x,
            pivotY: container.pivot.y,
            anchorX: anchor?.x,
            anchorY: anchor?.y,
            alpha: container.alpha,
            hasAnchor,
        };
    }
    extractLayout(container) {
        const result = {};
        const layoutObj = container.layout;
        if (!layoutObj)
            return result;
        // Try different possible property locations
        const layout = layoutObj;
        const style = (layout._style || layout.style || layout);
        for (const key of LAYOUT_KEYS) {
            if (style[key] !== undefined) {
                result[key] = style[key];
            }
        }
        return result;
    }
    findContainerById(id) {
        if (!this._root)
            return null;
        const search = (container) => {
            if (container.label === id)
                return container;
            for (const child of container.children) {
                if (child instanceof Container) {
                    const found = search(child);
                    if (found)
                        return found;
                }
            }
            return null;
        };
        return search(this._root);
    }
    setProperty(id, property, value) {
        const container = this.findContainerById(id);
        if (!container)
            return;
        // Handle special _layoutEnabled property
        if (property === '_layoutEnabled') {
            const containerWithLayout = container;
            if (value) {
                // Enable layout - set empty layout object if none exists
                if (!containerWithLayout.layout) {
                    containerWithLayout.layout = {};
                }
            }
            else {
                // Disable layout - remove layout object
                containerWithLayout.layout = null;
            }
            // Send updated state back
            this._channel?.postMessage({
                type: "updated",
                id,
                layout: this.extractLayout(container),
                layoutEnabled: !!value,
                transform: this.extractTransform(container),
            });
            return;
        }
        // Handle transform properties (set directly on container)
        const transformProps = {
            x: (c, v) => { c.x = v; },
            y: (c, v) => { c.y = v; },
            scaleX: (c, v) => { c.scale.x = v; },
            scaleY: (c, v) => { c.scale.y = v; },
            rotation: (c, v) => { c.rotation = v; },
            pivotX: (c, v) => { c.pivot.x = v; },
            pivotY: (c, v) => { c.pivot.y = v; },
            alpha: (c, v) => { c.alpha = v; },
            anchorX: (c, v) => {
                if ("anchor" in c) {
                    c.anchor.x = v;
                }
            },
            anchorY: (c, v) => {
                if ("anchor" in c) {
                    c.anchor.y = v;
                }
            },
        };
        if (property in transformProps) {
            transformProps[property](container, value);
            this._channel?.postMessage({
                type: "updated",
                id,
                layout: this.extractLayout(container),
                transform: this.extractTransform(container),
            });
            return;
        }
        // Handle layout properties
        const layout = container.layout;
        if (!layout)
            return;
        if (value === undefined) {
            if (layout._style) {
                delete layout._style[property];
            }
        }
        else {
            if (layout.setStyle) {
                layout.setStyle({ [property]: value });
            }
        }
        // Send updated layout back
        this._channel?.postMessage({
            type: "updated",
            id,
            layout: this.extractLayout(container),
            transform: this.extractTransform(container),
        });
    }
    highlightContainer(id) {
        // Remove existing highlight
        if (this._highlightOverlay && this._highlightedContainer) {
            this._highlightedContainer.removeChild(this._highlightOverlay);
            this._highlightOverlay = null;
            this._highlightedContainer = null;
        }
        if (!id)
            return;
        const container = this.findContainerById(id);
        if (!container) {
            console.log(`[LayoutDebugBridge] Container not found: ${id}`);
            return;
        }
        this._highlightedContainer = container;
        this._highlightOverlay = addDebugOverlay(container, {
            ...DebugColors.cyan,
            fillAlpha: 0.3,
            label: id,
        });
        // Force visibility since debug overlays may be disabled globally
        this._highlightOverlay.visible = true;
    }
    destroy() {
        this._channel?.close();
        this._channel = null;
    }
}
//# sourceMappingURL=LayoutDebugBridge.js.map