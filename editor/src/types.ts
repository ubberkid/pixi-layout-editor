export interface FilterUniform {
  name: string;
  type: string; // "f32", "vec2<f32>", "vec3<f32>", "vec4<f32>", etc.
  value: any;
  groupName: string;
}

export interface FilterInfo {
  index: number;
  className: string;
  uniforms: FilterUniform[];
}

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
  filters?: FilterInfo[];
  children: ContainerNode[];
}
