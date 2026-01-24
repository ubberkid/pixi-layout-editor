export interface ContainerNode {
    id: string;
    type: string;
    layout: Record<string, unknown>;
    layoutEnabled: boolean;
    transform: {
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
        rotation: number;
        pivotX: number;
        pivotY: number;
        anchorX?: number;
        anchorY?: number;
        alpha: number;
        hasAnchor: boolean;
    };
    children: ContainerNode[];
}
export interface SetPropertyMessage {
    type: "set-property";
    id: string;
    property: string;
    value: unknown;
}
export interface HighlightMessage {
    type: "highlight";
    id: string | null;
    showChildren?: boolean;
}
export interface GetLayoutMessage {
    type: "get-layout";
    id: string;
}
export type EditorMessage = {
    type: "get-hierarchy";
} | SetPropertyMessage | HighlightMessage | GetLayoutMessage;
//# sourceMappingURL=types.d.ts.map