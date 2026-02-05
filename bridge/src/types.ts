export interface FilterUniform {
	name: string;
	type: string; // "f32", "vec2<f32>", "vec3<f32>", "vec4<f32>", etc.
	value: unknown;
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
	filters?: FilterInfo[];
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

export interface SetFilterUniformMessage {
	type: "set-filter-uniform";
	id: string;
	filterIndex: number;
	groupName: string;
	uniformName: string;
	value: unknown;
}

export type EditorMessage =
	| { type: "get-hierarchy" }
	| SetPropertyMessage
	| HighlightMessage
	| GetLayoutMessage
	| SetFilterUniformMessage;
