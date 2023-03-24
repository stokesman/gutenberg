/**
 * WordPress dependencies
 */
import { forwardRef, useCallback, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import classnames from 'classnames';
import { Resizable } from 're-resizable';
import type { ResizableProps, ResizeCallback } from 're-resizable';
import type { ReactNode, ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import ResizeTooltip, { ResizeTooltipProps } from './resize-tooltip';

const HANDLE_CLASS_NAME = 'components-resizable-box__handle';
const SIDE_HANDLE_CLASS_NAME = 'components-resizable-box__side-handle';
const CORNER_HANDLE_CLASS_NAME = 'components-resizable-box__corner-handle';

const HANDLE_CLASSES = {
	top: classnames(
		HANDLE_CLASS_NAME,
		SIDE_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-top'
	),
	right: classnames(
		HANDLE_CLASS_NAME,
		SIDE_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-right'
	),
	bottom: classnames(
		HANDLE_CLASS_NAME,
		SIDE_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-bottom'
	),
	left: classnames(
		HANDLE_CLASS_NAME,
		SIDE_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-left'
	),
	topLeft: classnames(
		HANDLE_CLASS_NAME,
		CORNER_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-top',
		'components-resizable-box__handle-left'
	),
	topRight: classnames(
		HANDLE_CLASS_NAME,
		CORNER_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-top',
		'components-resizable-box__handle-right'
	),
	bottomRight: classnames(
		HANDLE_CLASS_NAME,
		CORNER_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-bottom',
		'components-resizable-box__handle-right'
	),
	bottomLeft: classnames(
		HANDLE_CLASS_NAME,
		CORNER_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-bottom',
		'components-resizable-box__handle-left'
	),
};

// Removes the inline styles in the drag handles.
const HANDLE_STYLES_OVERRIDES = {
	width: undefined,
	height: undefined,
	top: undefined,
	right: undefined,
	bottom: undefined,
	left: undefined,
};
const HANDLE_STYLES = {
	top: HANDLE_STYLES_OVERRIDES,
	right: HANDLE_STYLES_OVERRIDES,
	bottom: HANDLE_STYLES_OVERRIDES,
	left: HANDLE_STYLES_OVERRIDES,
	topLeft: HANDLE_STYLES_OVERRIDES,
	topRight: HANDLE_STYLES_OVERRIDES,
	bottomRight: HANDLE_STYLES_OVERRIDES,
	bottomLeft: HANDLE_STYLES_OVERRIDES,
};

type ResizableBoxProps = ResizableProps & {
	children: ReactNode;
	showHandle?: boolean;
	__experimentalShowTooltip?: boolean;
	__experimentalTooltipProps?: Omit<
		Parameters< typeof ResizeTooltip >[ 0 ],
		'size'
	>;
};

function UnforwardedResizableBox(
	{
		className,
		children,
		showHandle = true,
		__experimentalShowTooltip: showTooltip = false,
		__experimentalTooltipProps: tooltipProps = {},
		...props
	}: ResizableBoxProps,
	ref: ForwardedRef< Resizable >
): JSX.Element {
	const [ startSize, setStartSize ] =
		useState< ResizeTooltipProps[ 'size' ] >();
	const [ size, setSize ] = useState< typeof startSize >();
	const updateSize = useCallback(
		( delta: Parameters< ResizeCallback >[ 3 ] ) => {
			const [ width, height ] = startSize!;
			setSize( [ width! + delta.width, height! + delta.height ] );
		},
		[ startSize ]
	);

	const { onResize, onResizeStart, onResizeStop } = props;
	props.onResizeStart = ( e, direction, el ) => {
		onResizeStart?.( e, direction, el );
		const sizeAtStart: typeof startSize = [
			el.clientWidth,
			el.clientHeight,
		];
		setStartSize( sizeAtStart );
		setSize( sizeAtStart );
	};
	props.onResize = ( e, direction, el, delta ) => {
		onResize?.( e, direction, el, delta );
		updateSize( delta );
	};
	props.onResizeStop = ( e, direction, el, delta ) => {
		onResizeStop?.( e, direction, el, delta );
		updateSize( delta );
	};

	return (
		<Resizable
			className={ classnames(
				'components-resizable-box__container',
				showHandle && 'has-show-handle',
				className
			) }
			handleClasses={ HANDLE_CLASSES }
			handleStyles={ HANDLE_STYLES }
			ref={ ref }
			{ ...props }
		>
			{ children }
			{ showTooltip && (
				<ResizeTooltip
					// The key ensures state tracking size is reset each time a resize operation
					// starts. Without it a resize in one dimension may be detected as both
					// dimensions because the tracked size wasn't synced. For such a case to present
					// the size has to have changed externally, `axis` has to be unset and `position`
					// has to be `bottom`.
					key={ startSize?.join( ',' ) || '' }
					size={ size }
					{ ...tooltipProps }
				/>
			) }
		</Resizable>
	);
}

export const ResizableBox = forwardRef( UnforwardedResizableBox );

export default ResizableBox;
