/**
 * External dependencies
 */
import classnames from 'classnames';
import type { Ref, ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Label from './label';
import { getSizeLabel, Axis, Position, POSITIONS, useIsIdle } from './utils';
import { Root } from './styles/resize-tooltip.styles';

export type ResizeTooltipProps = React.ComponentProps< typeof Root > & {
	'aria-hidden'?: boolean;
	axis?: Axis;
	className?: string;
	fadeTimeout?: number;
	isVisible?: boolean;
	labelRef?: Ref< HTMLDivElement >;
	position?: Position;
	showPx?: boolean;
	size?: [ number, number ];
	zIndex?: number;
};

function ResizeTooltip(
	{
		axis,
		className,
		fadeTimeout = 280,
		isVisible,
		labelRef,
		position = POSITIONS.bottom,
		showPx = true,
		size: [ width, height ] = [ 0, 0 ],
		zIndex = 1000,
		...props
	}: ResizeTooltipProps,
	ref: ForwardedRef< HTMLDivElement >
): JSX.Element | null {
	const moveX = ! useIsIdle( width, fadeTimeout );
	const moveY = ! useIsIdle( height, fadeTimeout );

	const [ [ prevLabel ], setPrevLabel ] = useState( [ '' ] );

	const label = getSizeLabel( {
		axis,
		height,
		moveX,
		moveY,
		position,
		showPx,
		width,
	} );

	if ( label && label !== prevLabel )
		setPrevLabel( ( current ) => Object.assign( current, [ label ] ) );

	const classes = classnames( 'components-resize-tooltip', className );

	return (
		<Root aria-hidden="true" className={ classes } ref={ ref } { ...props }>
			<Label
				aria-hidden={ props[ 'aria-hidden' ] }
				isVisible={ isVisible ?? ( moveX || moveY ) }
				label={ label || prevLabel }
				position={ position }
				ref={ labelRef }
				zIndex={ zIndex }
			/>
		</Root>
	);
}

const ForwardedComponent = forwardRef( ResizeTooltip );

export default ForwardedComponent;
