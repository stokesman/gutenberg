/**
 * External dependencies
 */
import classnames from 'classnames';
import type { Ref, ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Label from './label';
import { getSizeLabel, useResizeLabel, Axis, Position, POSITIONS } from './utils';
import { Root } from './styles/resize-tooltip.styles';
import { useUpdateEffect } from '../../utils';

export type ResizeTooltipProps = React.ComponentProps< typeof Root > & {
	'aria-hidden'?: boolean;
	axis?: Axis;
	className?: string;
	fadeTimeout?: number;
	isVisible?: boolean;
	labelRef?: Ref< HTMLDivElement >;
	onResize?: Parameters< typeof useResizeLabel >[ 0 ][ 'onResize' ];
	position?: Position;
	showPx?: boolean;
	size?: [ number, number ];
	zIndex?: number;
};

const noop = () => {};

function ResizeTooltip(
	{
		axis,
		className,
		fadeTimeout = 180,
		isVisible = true,
		labelRef,
		onResize = noop,
		position = POSITIONS.bottom,
		showPx = true,
		size: [ width, height ] = [ 0, 0 ],
		zIndex = 1000,
		...props
	}: ResizeTooltipProps,
	ref: ForwardedRef< HTMLDivElement >
): JSX.Element | null {
	const { label, resizeListener } = useResizeLabel( {
		axis,
		fadeTimeout,
		onResize,
		showPx,
		position,
	} );

	const refIdleTimeout = useRef< number >();
	const [ isIdle, setIsIdle ] = useState( true );
	useUpdateEffect( () => {
		setIsIdle( false );
		clearTimeout( refIdleTimeout.current );
		refIdleTimeout.current = window.setTimeout( () => {
			if ( ! isVisible ) setIsIdle( true );
		}, fadeTimeout );
	}, [ fadeTimeout, width, height ] );

	// TODO try moving to after the early return once logging is removed.
	let label2: string | undefined;
	if ( ! isIdle && isVisible )
		label2 = getSizeLabel( {
			axis,
			height,
			moveX: true,
			moveY: true,
			position,
			showPx,
			width,
		} );

	useEffect( () => {
		console.log( {
			'listener size': label,
			'props size': label2,
		} );
	}, [ label, label2 ] );

	if ( ! isVisible ) return null;

	const classes = classnames( 'components-resize-tooltip', className );

	return (
		<Root aria-hidden="true" className={ classes } ref={ ref } { ...props }>
			{ resizeListener }
			<Label
				aria-hidden={ props[ 'aria-hidden' ] }
				label={ label2 }
				position={ position }
				ref={ labelRef }
				zIndex={ zIndex }
			/>
		</Root>
	);
}

const ForwardedComponent = forwardRef( ResizeTooltip );

export default ForwardedComponent;
