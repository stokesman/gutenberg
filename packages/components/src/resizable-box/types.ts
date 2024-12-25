/**
 * External dependencies
 */
import type * as React from 'react';

/**
 * Internal dependencies
 */
import type { ResizeTooltipProps } from './resize-tooltip';

export type Direction =
	| 'top'
	| 'right'
	| 'bottom'
	| 'left'
	| 'topRight'
	| 'bottomRight'
	| 'bottomLeft'
	| 'topLeft';

export interface Enable {
	top?: boolean;
	right?: boolean;
	bottom?: boolean;
	left?: boolean;
	topRight?: boolean;
	bottomRight?: boolean;
	bottomLeft?: boolean;
	topLeft?: boolean;
}

export interface HandleStyles {
	top?: React.CSSProperties;
	right?: React.CSSProperties;
	bottom?: React.CSSProperties;
	left?: React.CSSProperties;
	topRight?: React.CSSProperties;
	bottomRight?: React.CSSProperties;
	bottomLeft?: React.CSSProperties;
	topLeft?: React.CSSProperties;
}

export interface HandleClassName {
	top?: string;
	right?: string;
	bottom?: string;
	left?: string;
	topRight?: string;
	bottomRight?: string;
	bottomLeft?: string;
	topLeft?: string;
}

export interface Size {
	width: string | number;
	height: string | number;
}

export interface NumberSize {
	width: number;
	height: number;
}

export interface HandleComponent {
	top?: React.ReactElement< any >;
	right?: React.ReactElement< any >;
	bottom?: React.ReactElement< any >;
	left?: React.ReactElement< any >;
	topRight?: React.ReactElement< any >;
	bottomRight?: React.ReactElement< any >;
	bottomLeft?: React.ReactElement< any >;
	topLeft?: React.ReactElement< any >;
}

// TODO: make sure this type is accurate – it ought to be whatever `useDrag` defines…
type ResizeEvent = MouseEvent | TouchEvent | KeyboardEvent | PointerEvent;

export type ResizeCallback = (
	event: ResizeEvent,
	direction: Direction,
	elementRef: HTMLElement,
	delta: NumberSize
) => void;

export type ResizeStartCallback = (
	event: ResizeEvent,
	direction: Direction,
	elementRef: HTMLElement
) => void | boolean;

export interface ResizableBoxProps {
	showHandle?: boolean;
	__experimentalShowTooltip?: boolean;
	__experimentalTooltipProps?: ResizeTooltipProps;

	// The rest are the original props from re-resizable.
	as?: string | React.ComponentType< any >;
	style?: React.CSSProperties;
	className?: string;
	grid?: [ number, number ];
	snap?: {
		x?: number[];
		y?: number[];
	};
	snapGap?: number;
	bounds?: 'parent' | 'window' | HTMLElement;
	/** Only applies when `bounds` prop is specified. */
	boundsByDirection?: boolean;
	size?: Partial< Size >;
	minWidth?: string | number;
	minHeight?: string | number;
	maxWidth?: string | number;
	maxHeight?: string | number;
	lockAspectRatio?: boolean | number;
	lockAspectRatioExtraWidth?: number;
	lockAspectRatioExtraHeight?: number;
	enable?: Enable;
	handleStyles?: HandleStyles;
	handleClasses?: HandleClassName;
	handleWrapperStyle?: React.CSSProperties;
	handleWrapperClass?: string;
	handleComponent?: HandleComponent;
	children?: React.ReactNode;
	onResizeStart?: ResizeStartCallback;
	onResize?: ResizeCallback;
	onResizeStop?: ResizeCallback;
	defaultSize?: Partial< Size >;
	scale?: number;
	resizeRatio?: number;
}

export interface ImperativeHandle {
	resizable: HTMLElement | null;
	updateSize: ( size: Partial< Size > ) => void;
}
