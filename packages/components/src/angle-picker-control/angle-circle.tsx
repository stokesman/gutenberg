/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { __experimentalUseDragging as useDragging } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	CircleRoot,
	CircleIndicatorWrapper,
	CircleIndicator,
} from './styles/angle-picker-control-styles';
import { GestureInsulator } from '../gesture-insulator';

import type { WordPressComponentProps } from '../ui/context';
import type { AngleCircleProps } from './types';

type UseDraggingArgumentType = Parameters< typeof useDragging >[ 0 ];
type UseDraggingCallbackEvent =
	| Parameters< UseDraggingArgumentType[ 'onDragStart' ] >[ 0 ]
	| Parameters< UseDraggingArgumentType[ 'onDragMove' ] >[ 0 ]
	| Parameters< UseDraggingArgumentType[ 'onDragEnd' ] >[ 0 ];

function AngleCircle( {
	value,
	onChange,
	refNumberInput,
	...props
}: WordPressComponentProps< AngleCircleProps, 'div' > ) {
	const angleCircleRef = useRef< HTMLDivElement | null >( null );
	const angleCircleCenter = useRef< { x: number; y: number } | undefined >();

	const setAngleCircleCenter = () => {
		if ( angleCircleRef.current === null ) {
			return;
		}

		const rect = angleCircleRef.current.getBoundingClientRect();
		angleCircleCenter.current = {
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
		};
	};

	const changeAngleToPosition = ( event: UseDraggingCallbackEvent ) => {
		if ( event === undefined ) {
			return;
		}
		if (
			angleCircleCenter.current !== undefined &&
			onChange !== undefined
		) {
			const { x: centerX, y: centerY } = angleCircleCenter.current;
			onChange(
				getAngle( centerX, centerY, event.clientX, event.clientY )
			);
		}
	};

	const { startDrag, isDragging } = useDragging( {
		onDragStart: ( event ) => {
			const { current: numberInput } = refNumberInput;
			setAngleCircleCenter();
			changeAngleToPosition( event );
			// Preventing default allows the manual move of focus.
			event.preventDefault();
			if ( numberInput !== numberInput?.ownerDocument.activeElement )
				refNumberInput.current?.focus();
		},
		onDragMove: changeAngleToPosition,
		onDragEnd: changeAngleToPosition,
	} );

	return (
		<CircleRoot
			ref={ angleCircleRef }
			onMouseDown={ startDrag }
			className="components-angle-picker-control__angle-circle"
			{ ...props }
		>
			<CircleIndicatorWrapper
				style={
					value ? { transform: `rotate(${ value }deg)` } : undefined
				}
				className="components-angle-picker-control__angle-circle-indicator-wrapper"
			>
				<CircleIndicator className="components-angle-picker-control__angle-circle-indicator" />
			</CircleIndicatorWrapper>
			<GestureInsulator isPresent={ isDragging } cursor="grabbing" />
		</CircleRoot>
	);
}

function getAngle(
	centerX: number,
	centerY: number,
	pointX: number,
	pointY: number
) {
	const y = pointY - centerY;
	const x = pointX - centerX;

	const angleInRadians = Math.atan2( y, x );
	const angleInDeg = Math.round( angleInRadians * ( 180 / Math.PI ) ) + 90;
	if ( angleInDeg < 0 ) {
		return 360 + angleInDeg;
	}
	return angleInDeg;
}

export default AngleCircle;
