/**
 * WordPress dependencies
 */
import { useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useUpdateEffect } from '../../utils';

export type Axis = 'x' | 'y';

export const POSITIONS = {
	bottom: 'bottom',
	corner: 'corner',
} as const;

export type Position = ( typeof POSITIONS )[ keyof typeof POSITIONS ];

interface GetSizeLabelArgs {
	axis?: Axis;
	height: number | null;
	moveX: boolean;
	moveY: boolean;
	position: Position;
	showPx: boolean;
	width: number | null;
}

/**
 * Gets the resize label based on width and height values (as well as recent changes).
 *
 * @param props
 * @param props.axis     Only shows the label corresponding to the axis.
 * @param props.height   Height value.
 * @param props.moveX    Recent width (x axis) changes.
 * @param props.moveY    Recent width (y axis) changes.
 * @param props.position Adjusts label value.
 * @param props.showPx   Whether to add `PX` to the label.
 * @param props.width    Width value.
 *
 * @return The rendered label.
 */
export function getSizeLabel( {
	axis,
	height,
	moveX = false,
	moveY = false,
	position = POSITIONS.bottom,
	showPx = false,
	width,
}: GetSizeLabelArgs ) {
	/*
	 * Corner position...
	 * We want the label to appear like width x height.
	 */
	if ( position === POSITIONS.corner ) {
		return `${ width } x ${ height }`;
	}

	/*
	 * Other POSITIONS...
	 * The label will combine both width x height values if both
	 * values have recently been changed.
	 *
	 * Otherwise, only width or height will be displayed.
	 * The `PX` unit will be added, if specified by the `showPx` prop.
	 */
	const labelUnit = showPx ? ' px' : '';

	if ( axis ) {
		if ( axis === 'x' && moveX ) {
			return `${ width }${ labelUnit }`;
		}
		if ( axis === 'y' && moveY ) {
			return `${ height }${ labelUnit }`;
		}
	}

	if ( moveX && moveY ) {
		return `${ width } x ${ height }`;
	}
	if ( moveX ) {
		return `${ width }${ labelUnit }`;
	}
	if ( moveY ) {
		return `${ height }${ labelUnit }`;
	}

	return '';
}

export function useIsIdle( value: unknown, period: number ) {
	const timeoutId = useRef( -1 );
	const [ hold, setHold ] = useState( { value, isIdle: true } );

	useUpdateEffect( () => {
		setHold( ( held ) => Object.assign( held, { value, isIdle: false } ) );
		clearTimeout( timeoutId.current );
		timeoutId.current = window.setTimeout( () => {
			setHold( { value, isIdle: true } );
		}, period );
	}, [ value, period ] );

	return value === hold.value && hold.isIdle;
}
