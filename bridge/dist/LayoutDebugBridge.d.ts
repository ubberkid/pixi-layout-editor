import { Container } from "pixi.js";
export declare let debugBridge: LayoutDebugBridge | null;
export declare function initDebugBridge(): LayoutDebugBridge;
export declare class LayoutDebugBridge {
    private _root;
    private _channel;
    private _highlightOverlay;
    private _highlightedContainer;
    start(root: Container): void;
    private handleMessage;
    private sendHierarchy;
    private sendLayoutConfig;
    private getHierarchy;
    private serializeContainer;
    private extractTransform;
    private extractLayout;
    private findContainerById;
    private setProperty;
    private highlightContainer;
    destroy(): void;
}
//# sourceMappingURL=LayoutDebugBridge.d.ts.map