import { Graphics, Container, Text, Sprite, Texture } from "pixi.js";
const DEFAULT_OPTIONS = {
    fillColor: 0x0000ff,
    fillAlpha: 0.3,
    borderColor: 0xff0000,
    borderWidth: 2,
    label: "",
    labelColor: 0xffffff,
};
export const DebugColors = {
    red: { fillColor: 0xff0000, borderColor: 0xff0000 },
    green: { fillColor: 0x00ff00, borderColor: 0x00ff00 },
    blue: { fillColor: 0x0000ff, borderColor: 0x0000ff },
    yellow: { fillColor: 0xffff00, borderColor: 0xffff00 },
    cyan: { fillColor: 0x00ffff, borderColor: 0x00ffff },
    magenta: { fillColor: 0xff00ff, borderColor: 0xff00ff },
    orange: { fillColor: 0xff8800, borderColor: 0xff8800 },
    purple: { fillColor: 0x8800ff, borderColor: 0x8800ff },
};
/**
 * Creates and adds a debug overlay to a container.
 */
export function addDebugOverlay(container, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const overlayContainer = new Container();
    overlayContainer.label = "Debug Overlay";
    overlayContainer.measurable = false;
    // Use a tinted sprite for the fill
    const fill = Sprite.from(Texture.WHITE);
    fill.tint = opts.fillColor;
    fill.alpha = opts.fillAlpha;
    overlayContainer.addChild(fill);
    // Border graphics
    const border = new Graphics();
    overlayContainer.addChild(border);
    const resolveOverlaySize = () => {
        const layout = container.layout;
        if (layout?.computedLayout) {
            const { width, height } = layout.computedLayout;
            if (width > 0 || height > 0) {
                return { width, height };
            }
        }
        const bounds = container.getLocalBounds();
        return { width: bounds.width, height: bounds.height };
    };
    const redrawBorder = () => {
        const { width, height } = resolveOverlaySize();
        fill.width = width;
        fill.height = height;
        border.clear();
        border.rect(0, 0, width, height);
        border.stroke({ color: opts.borderColor, width: opts.borderWidth, alignment: 1 });
    };
    if (opts.label) {
        const label = new Text({
            text: opts.label,
            style: {
                fontSize: 14,
                fill: opts.labelColor,
                fontFamily: "Arial",
                fontWeight: "bold",
                stroke: { color: 0x000000, width: 3 },
            },
        });
        label.position.set(6, 4);
        overlayContainer.addChild(label);
    }
    container.addChildAt(overlayContainer, 0);
    let redrawScheduled = false;
    const scheduleRedraw = () => {
        if (redrawScheduled)
            return;
        redrawScheduled = true;
        requestAnimationFrame(() => {
            redrawScheduled = false;
            redrawBorder();
        });
    };
    const onLayout = () => scheduleRedraw();
    container.on("layout", onLayout);
    scheduleRedraw();
    const onResize = () => scheduleRedraw();
    window.addEventListener("resize", onResize);
    overlayContainer.cleanup = () => {
        window.removeEventListener("resize", onResize);
        container.off("layout", onLayout);
    };
    return overlayContainer;
}
//# sourceMappingURL=DebugOverlay.js.map