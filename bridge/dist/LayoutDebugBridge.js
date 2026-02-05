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
        this._highlightOverlays = [];
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
                this.highlightContainer(message.id, message.showChildren);
                break;
            case "get-layout":
                this.sendLayoutConfig(message.id);
                break;
            case "set-filter-uniform":
                this.setFilterUniform(message.id, message.filterIndex, message.groupName, message.uniformName, message.value);
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
        // Check for truthy layout value - false, null, undefined all mean disabled
        const layoutEnabled = !!layoutObj;
        const transform = this.extractTransform(container);
        const filters = this.extractFilters(container);
        const children = [];
        for (const child of container.children) {
            if (child instanceof Container && child.label !== "Debug Overlay") {
                children.push(this.serializeContainer(child));
            }
        }
        const node = {
            id: container.label || `[${container.constructor.name}]`,
            type: container.constructor.name,
            layout,
            layoutEnabled,
            transform,
            children,
        };
        if (filters.length > 0) {
            node.filters = filters;
        }
        return node;
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
    extractFilters(container) {
        const filters = container.filters;
        if (!filters || !Array.isArray(filters) || filters.length === 0) {
            return [];
        }
        const result = [];
        for (let i = 0; i < filters.length; i++) {
            const filter = filters[i];
            if (!filter)
                continue;
            const uniforms = [];
            // PixiJS v8 filter structure: filter.resources contains UniformGroups
            // Resources properties are non-enumerable, so we need to use getOwnPropertyNames or for...in
            const resources = filter.resources;
            if (resources) {
                // Try multiple methods to get resource keys since they may be non-enumerable
                let resourceKeys = Object.getOwnPropertyNames(resources);
                // If that doesn't work, try Reflect.ownKeys
                if (resourceKeys.length === 0) {
                    resourceKeys = Reflect.ownKeys(resources).filter(k => typeof k === 'string');
                }
                // If still empty, try for...in loop (includes prototype chain)
                if (resourceKeys.length === 0) {
                    for (const key in resources) {
                        resourceKeys.push(key);
                    }
                }
                for (const groupName of resourceKeys) {
                    const group = resources[groupName];
                    // Skip non-uniform resources
                    if (!group || typeof group !== "object")
                        continue;
                    const uniformGroup = group;
                    // Check if this is a UniformGroup
                    if (!uniformGroup.isUniformGroup)
                        continue;
                    const groupUniforms = uniformGroup.uniforms;
                    const groupStructures = uniformGroup.uniformStructures;
                    if (!groupUniforms || typeof groupUniforms !== "object")
                        continue;
                    for (const [uniformName, value] of Object.entries(groupUniforms)) {
                        // Skip internal PixiJS uniforms
                        if (LayoutDebugBridge.INTERNAL_UNIFORMS.has(uniformName))
                            continue;
                        // Get type from uniformStructures if available
                        let uniformType = "unknown";
                        if (groupStructures && groupStructures[uniformName]) {
                            uniformType = groupStructures[uniformName].type || "unknown";
                        }
                        else {
                            // Infer type from value
                            uniformType = this.inferUniformType(value);
                        }
                        uniforms.push({
                            name: uniformName,
                            type: uniformType,
                            value: this.serializeUniformValue(value),
                            groupName,
                        });
                    }
                }
            }
            if (uniforms.length > 0) {
                result.push({
                    index: i,
                    className: filter.constructor.name,
                    uniforms,
                });
            }
        }
        return result;
    }
    inferUniformType(value) {
        if (typeof value === "number")
            return "f32";
        if (typeof value === "boolean")
            return "bool";
        if (Array.isArray(value)) {
            if (value.length === 2)
                return "vec2<f32>";
            if (value.length === 3)
                return "vec3<f32>";
            if (value.length === 4)
                return "vec4<f32>";
        }
        // Check for Float32Array
        if (value instanceof Float32Array) {
            if (value.length === 2)
                return "vec2<f32>";
            if (value.length === 3)
                return "vec3<f32>";
            if (value.length === 4)
                return "vec4<f32>";
            if (value.length === 9)
                return "mat3x3<f32>";
            if (value.length === 16)
                return "mat4x4<f32>";
        }
        return "unknown";
    }
    serializeUniformValue(value) {
        // Convert Float32Array to regular array for JSON serialization
        if (value instanceof Float32Array) {
            return Array.from(value);
        }
        return value;
    }
    setFilterUniform(id, filterIndex, groupName, uniformName, value) {
        const container = this.findContainerById(id);
        if (!container)
            return;
        const filters = container.filters;
        if (!filters || !Array.isArray(filters) || filterIndex >= filters.length) {
            console.warn(`[LayoutDebugBridge] Filter not found: ${id}[${filterIndex}]`);
            return;
        }
        const filter = filters[filterIndex];
        if (!filter)
            return;
        const resources = filter.resources;
        if (!resources)
            return;
        const group = resources[groupName];
        if (!group?.uniforms)
            return;
        // Update the uniform value
        group.uniforms[uniformName] = value;
        // Send updated filter info back
        this._channel?.postMessage({
            type: "filter-updated",
            id,
            filterIndex,
            uniforms: this.extractFilters(container)[filterIndex]?.uniforms || [],
        });
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
                // Enable layout - set layout to true to opt-in to layout system
                // Per pixi/layout docs, this is equivalent to { width: 'intrinsic', height: 'intrinsic' }
                containerWithLayout.layout = true;
            }
            else {
                // Disable layout - set to false to opt-out
                containerWithLayout.layout = false;
            }
            // Force parent layout to recalculate since a child's participation changed
            const parent = container.parent;
            if (parent?.layout && typeof parent.layout === 'object') {
                parent.layout.invalidateRoot?.();
                parent.layout.forceUpdate?.();
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
    highlightContainer(id, showChildren) {
        // Remove existing highlights
        for (const { overlay, container } of this._highlightOverlays) {
            container.removeChild(overlay);
        }
        this._highlightOverlays = [];
        if (!id)
            return;
        const container = this.findContainerById(id);
        if (!container) {
            console.log(`[LayoutDebugBridge] Container not found: ${id}`);
            return;
        }
        // Add highlight to main container
        const mainOverlay = addDebugOverlay(container, {
            ...DebugColors.cyan,
            fillAlpha: 0.3,
            label: id,
        });
        mainOverlay.visible = true;
        this._highlightOverlays.push({ overlay: mainOverlay, container });
        // Add highlights to children if requested
        if (showChildren) {
            const childColors = [
                DebugColors.magenta,
                DebugColors.yellow,
                DebugColors.green,
                DebugColors.orange,
                DebugColors.purple,
                DebugColors.red,
                DebugColors.blue,
            ];
            let colorIndex = 0;
            for (const child of container.children) {
                if (child instanceof Container && child.label !== "Debug Overlay") {
                    const childId = child.label || `[${child.constructor.name}]`;
                    const color = childColors[colorIndex % childColors.length];
                    const childOverlay = addDebugOverlay(child, {
                        ...color,
                        fillAlpha: 0.3,
                        label: childId,
                    });
                    childOverlay.visible = true;
                    this._highlightOverlays.push({ overlay: childOverlay, container: child });
                    colorIndex++;
                }
            }
        }
    }
    destroy() {
        this._channel?.close();
        this._channel = null;
    }
}
// Internal PixiJS uniforms to skip
LayoutDebugBridge.INTERNAL_UNIFORMS = new Set([
    "uTexture",
    "uSampler",
    "uInputSize",
    "uInputPixel",
    "uInputClamp",
    "uOutputFrame",
    "uGlobalFrame",
    "uOutputTexture",
]);
//# sourceMappingURL=LayoutDebugBridge.js.map