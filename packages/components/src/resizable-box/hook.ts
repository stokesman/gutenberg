/**
 * External dependencies
 */
import { useDrag } from '@use-gesture/react';
import type { Handler, Vector2 } from '@use-gesture/react';

/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Direction, ResizeCallback } from './types';
// import { clamp } from '../utils/math';

export type ResizableHookHandler = ( state: {
	event: Parameters< ResizeCallback >[ 0 ];
	size: Vector2;
	startSize: Vector2;
	handleName: Direction;
} ) => Record< string | number | symbol, unknown > | void;

export type ResizeHandleBinder = (
	handleName: Direction
) => // This is likely due a more specific type
ReturnType< typeof useDrag >;

/** The minimum width and height followed by the maximum width and height. */
export type Constraints = [ Partial< Vector2 >?, Partial< Vector2 >? ];
export type Constrainer = (
	target: HTMLElement,
	handleName: Direction
) => Constraints;

type ResizableHookProps = {
	constraints?: Constraints | Constrainer;
	onResize?: ResizableHookHandler;
	onResizeStart?: ResizableHookHandler;
	onResizeStop?: ResizableHookHandler;
	specializer?: Specializer;
};

// This clamp doesn’t NaN when passed strings with units – e.g.'5%' whereas the one from utils does.
const clamp = ( value: number, min: number, max: number ) => {
	console.log('clamp', {value, min, max})
	if ( value < min ) {
		return min;
	}
	if ( value > max ) {
		return max;
	}
	return value;
};

/**
 * Enables resizable behavior on an element with one or more resize handles. Returns a
 * ref and a binder function. The latter is to be called for each resize handle and
 * requires the handle’s position key as an argument. It returns props to be applied to
 * the handle element.
 *
 * @param props
 * @param props.constraints   Limits for the size.
 * @param props.onResize      Called for each size change after `onResizeStart`
 * @param props.onResizeStart Called once resize begins. When originating from a “keydown” event
 *                            this includes a size change (whereas pointer events do not).
 * @param props.onResizeStop  Called once the resize ends.
 * @param props.specializer   Called for each size change and its return value is the next size.
 */
export default ( {
	constraints = [],
	onResize,
	onResizeStart,
	onResizeStop,
	specializer,
}: ResizableHookProps ) => {
	const resizableRef = useRef< HTMLElement >();
	const sizeRef = useRef< Vector2 >( [ 0, 0 ] );
	const [ sizeObserver ] = useState< ResizeObserver >(
		() =>
			new ResizeObserver( ( [ entry ] ) => {
				const [ { blockSize, inlineSize } ] = entry.borderBoxSize;
				sizeRef.current = [ inlineSize, blockSize ];
			} )
	);
	const effectInitialize = useRefEffect< HTMLElement >( ( node ) => {
		resizableRef.current = node;
		sizeObserver.observe( node, { box: 'border-box' } );
	}, [] );
	const dragHandler: Handler< 'drag' > = ( state ) => {
		const { first, last } = state;
		if ( ! resizableRef.current ) {
			return;
		}
		const [ handleName ] = state.args;
		let fromWidth, fromHeight;
		if ( first ) {
			sizeObserver.unobserve( resizableRef.current );
			const [
				[ minWidth = 0, minHeight = 0 ] = [],
				[ maxWidth = Infinity, maxHeight = Infinity ] = [],
			] =
				typeof constraints === 'function'
					? constraints( resizableRef.current, handleName )
					: constraints;
			[ fromWidth, fromHeight ] = sizeRef.current;
			// Due to the ResizeObserver, clamping the from values is not always
			// needed, but there’s no guarantee that the constraints are applied
			// in styles like `max-height`.
			fromHeight = clamp( fromHeight, minHeight, maxHeight );
			fromWidth = clamp( fromWidth, minWidth, maxWidth );
			const size = [ fromWidth, fromHeight ];
			state = {
				...state,
				memo: {
					size,
					from: size,
					constraints: [
						[ minWidth, minHeight ],
						[ maxWidth, maxHeight ],
					],
				},
			};
		} else {
			[ fromWidth, fromHeight ] = state.memo.from;
		}
		// On the first invocation pointer input doesn’t change the size but keyboard
		// input does. The last invocation never changes the size.
		const [ width, height ] = ! last
			? applySize( resizableRef.current, state, specializer )
			: state.memo.size;
		state.memo.size = [ width, height ];
		const stateOut: Parameters< ResizableHookHandler >[ 0 ] = {
			handleName,
			event: state.event,
			size: [ width, height ],
			startSize: [ fromWidth, fromHeight ],
		};
		if ( first ) {
			// TODO?: support memo extension with the value returned by resize handlers.
			onResizeStart?.( stateOut );
			return state.memo;
		}
		if ( ! first && ! last ) {
			onResize?.( stateOut );
			return state.memo;
		}
		// By now, `last` must be true.
		onResizeStop?.( stateOut );
		sizeObserver.observe( resizableRef.current, { box: 'border-box' } );
		sizeRef.current = [ width, height ];
	};
	const binder: ResizeHandleBinder = useDrag( dragHandler, {
		keyboardDisplacement: 20,
	} );
	return [ effectInitialize, binder ] as const;
};

type SpecializerState = {
	constraints: [ Vector2, Vector2 ];
	difference: Vector2;
	from: Vector2;
};

/**
 * Called for every user size change and its return value determines the width and height
 * applied in the resizable element’s style attribute.
 */
export type Specializer = ( state: SpecializerState ) => {
	/** Either value may be `undefined` to specify no change. */
	size: Partial< Vector2 >;
	/**
	 * Supports sizes with CSS units. If specified, its values are applied instead of
	 * those from `size` yet `size` is still required as the pixel equivalent.
	 */
	styleSize?: [ string?, string? ];
};

const mapHandleNameToSign = {
	top: [ -1, 0 ],
	topRight: [ -1, 1 ],
	right: [ 0, 1 ],
	bottomRight: [ 1, 1 ],
	bottom: [ 1, 0 ],
	bottomLeft: [ 1, -1 ],
	left: [ 0, -1 ],
	topLeft: [ -1, -1 ],
};

const applySize = (
	target: HTMLElement,
	state: Parameters< Handler< 'drag' > >[ 0 ],
	specializer?: Specializer
) => {
	const { args, memo, movement } = state;
	const [ handleName ] = args as [ Direction ];
	const [ xMovement, yMovement ] = movement;
	const [ fromWidth, fromHeight ] = memo.from as Vector2;
	const [ priorWidth, priorHeight ] = memo.size as Vector2;
	const [ blockSign, inlineSign ] = mapHandleNameToSign[ handleName ];
	const yDiff = yMovement * blockSign;
	const xDiff = xMovement * inlineSign;
	let width, height, styleWidth, styleHeight;
	if ( specializer ) {
		const { size, styleSize = [] } = specializer( {
			constraints: memo.constraints,
			difference: [ xDiff, yDiff ],
			from: [ fromWidth, fromHeight ],
		} );
		// If needed, falls back to prior width or height values since the specializer
		// can return undefined for either dimension (as a way to opt out of a change).
		[ width = priorWidth, height = priorHeight ] = size;
		[ styleWidth, styleHeight ] = styleSize;
	} else {
		width = fromWidth + xDiff;
		height = fromHeight + yDiff;
	}
	const [ [ minWidth, minHeight ], [ maxWidth, maxHeight ] ] =
		memo.constraints;
	if ( height !== priorHeight ) {
		height = Math.min( maxHeight, Math.max( minHeight, height ) );
		target.style.height = styleHeight ?? `${ height }px`;
	}
	if ( width !== priorWidth ) {
		width = Math.min( maxWidth, Math.max( minWidth, width ) );
		target.style.width = styleWidth ?? `${ width }px`;
	}
	return [ width, height ] as Vector2;
};
