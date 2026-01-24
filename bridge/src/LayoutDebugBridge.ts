import { Container } from "pixi.js";
import { ContainerNode, EditorMessage } from "./types";
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
export let debugBridge: LayoutDebugBridge | null = null;

export function initDebugBridge(): LayoutDebugBridge {
	debugBridge = new LayoutDebugBridge();
	return debugBridge;
}

export class LayoutDebugBridge {
	private _root: Container | null = null;
	private _channel: BroadcastChannel | null = null;
	private _highlightOverlays: Array<{ overlay: Container; container: Container }> = [];

	start(root: Container): void {
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

	private handleMessage(message: EditorMessage): void {
		console.log(`[LayoutDebugBridge] Received message:`, message);
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
		}
	}

	private sendHierarchy(): void {
		this._channel?.postMessage({
			type: "hierarchy",
			data: this.getHierarchy(),
		});
	}

	private sendLayoutConfig(id: string): void {
		const container = this.findContainerById(id);
		if (container) {
			this._channel?.postMessage({
				type: "layout-config",
				id,
				config: this.extractLayout(container),
			});
		}
	}

	private getHierarchy(): ContainerNode[] {
		if (!this._root) return [];
		return [this.serializeContainer(this._root)];
	}

	private serializeContainer(container: Container): ContainerNode {
		const layout = this.extractLayout(container);
		const layoutObj = (container as Container & { layout?: unknown }).layout;
		// Check for truthy layout value - false, null, undefined all mean disabled
		const layoutEnabled = !!layoutObj;
		const transform = this.extractTransform(container);

		const children: ContainerNode[] = [];
		for (const child of container.children) {
			if (child instanceof Container && child.label !== "Debug Overlay") {
				children.push(this.serializeContainer(child as Container));
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

	private extractTransform(container: Container): ContainerNode["transform"] {
		const hasAnchor = "anchor" in container;
		const anchor = hasAnchor ? (container as Container & { anchor: { x: number; y: number } }).anchor : null;

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

	private extractLayout(container: Container): Record<string, unknown> {
		const result: Record<string, unknown> = {};
		const layoutObj = (container as Container & { layout?: unknown }).layout;

		if (!layoutObj) return result;


		// Try different possible property locations
		const layout = layoutObj as unknown as Record<string, unknown>;
		const style = (layout._style || layout.style || layout) as Record<string, unknown>;

		for (const key of LAYOUT_KEYS) {
			if (style[key] !== undefined) {
				result[key] = style[key];
			}
		}

		return result;
	}

	private findContainerById(id: string): Container | null {
		if (!this._root) return null;

		const search = (container: Container): Container | null => {
			if (container.label === id) return container;

			for (const child of container.children) {
				if (child instanceof Container) {
					const found = search(child as Container);
					if (found) return found;
				}
			}

			return null;
		};

		return search(this._root);
	}

	private setProperty(id: string, property: string, value: unknown): void {
		const container = this.findContainerById(id);
		if (!container) return;

		// Handle special _layoutEnabled property
		if (property === '_layoutEnabled') {
			const containerWithLayout = container as Container & { layout?: { forceUpdate?: () => void; invalidateRoot?: () => void } | boolean };
			if (value) {
				// Enable layout - set layout to true to opt-in to layout system
				// Per pixi/layout docs, this is equivalent to { width: 'intrinsic', height: 'intrinsic' }
				containerWithLayout.layout = true;
			} else {
				// Disable layout - set to false to opt-out
				containerWithLayout.layout = false;
			}

			// Force parent layout to recalculate since a child's participation changed
			const parent = container.parent as Container & { layout?: { forceUpdate?: () => void; invalidateRoot?: () => void } } | null;
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
		const transformProps: Record<string, (c: Container, v: number) => void> = {
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
					(c as Container & { anchor: { x: number } }).anchor.x = v;
				}
			},
			anchorY: (c, v) => {
				if ("anchor" in c) {
					(c as Container & { anchor: { y: number } }).anchor.y = v;
				}
			},
		};

		if (property in transformProps) {
			transformProps[property](container, value as number);
			this._channel?.postMessage({
				type: "updated",
				id,
				layout: this.extractLayout(container),
				transform: this.extractTransform(container),
			});
			return;
		}

		// Handle layout properties
		const layout = (container as Container & { layout?: { _style?: Record<string, unknown>; setStyle?: (style: Record<string, unknown>) => void } }).layout;
		if (!layout) return;

		if (value === undefined) {
			if (layout._style) {
				delete layout._style[property];
			}
		} else {
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

	private highlightContainer(id: string | null, showChildren?: boolean): void {
		// Remove existing highlights
		for (const { overlay, container } of this._highlightOverlays) {
			container.removeChild(overlay);
		}
		this._highlightOverlays = [];

		if (!id) return;

		const container = this.findContainerById(id);
		if (!container) {
			console.log(`[LayoutDebugBridge] Container not found: ${id}`);
			return;
		}

		console.log(`[LayoutDebugBridge] Highlighting ${id}, showChildren: ${showChildren}, children count: ${container.children.length}`);

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

	destroy(): void {
		this._channel?.close();
		this._channel = null;
	}
}
