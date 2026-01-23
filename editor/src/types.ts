export interface ContainerNode {
  id: string;
  type: string;
  layout: Record<string, any>;
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
