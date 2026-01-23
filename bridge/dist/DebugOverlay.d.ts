import { Container } from "pixi.js";
export interface DebugOverlayOptions {
    fillColor?: number;
    fillAlpha?: number;
    borderColor?: number;
    borderWidth?: number;
    label?: string;
    labelColor?: number;
}
export declare const DebugColors: {
    red: {
        fillColor: number;
        borderColor: number;
    };
    green: {
        fillColor: number;
        borderColor: number;
    };
    blue: {
        fillColor: number;
        borderColor: number;
    };
    yellow: {
        fillColor: number;
        borderColor: number;
    };
    cyan: {
        fillColor: number;
        borderColor: number;
    };
    magenta: {
        fillColor: number;
        borderColor: number;
    };
    orange: {
        fillColor: number;
        borderColor: number;
    };
    purple: {
        fillColor: number;
        borderColor: number;
    };
};
/**
 * Creates and adds a debug overlay to a container.
 */
export declare function addDebugOverlay(container: Container, options?: DebugOverlayOptions): Container;
//# sourceMappingURL=DebugOverlay.d.ts.map