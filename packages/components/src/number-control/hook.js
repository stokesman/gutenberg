// @ts-nocheck
/**
 * External dependencies
 */
import classNames from 'classnames';
import { useDrag } from 'react-use-gesture';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { UP, DOWN, ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { useInputControl } from '../input-control';
import * as inputControlActionTypes from '../input-control/reducer/actions';
import { useDragCursor } from './utils';
import { add, roundClamp } from '../utils/math';
import { useJumpStep } from '../utils/hooks';
import { isValueEmpty } from '../utils/values';

export function useNumberControl( {
	__unstableStateReducer: stateReducer,
	className,
	dragDirection = 'n',
	dragThreshold = 10,
	hideHTMLArrows = false,
	isDragEnabled = true,
	isShiftStepEnabled = true,
	max = Infinity,
	min = -Infinity,
	required = false,
	shiftStep = 10,
	step = 1,
	type: typeProp = 'number',
	...props
} ) {
	const classes = classNames( 'components-number-control', className );

	const baseValue = roundClamp( 0, min, max, step );
	/**
	 * State reducer to specialize InputControl’s standard reducer.
	 *
	 * @param {Object} state  State from InputControl
	 * @param {Object} action Action triggering state change
	 * @return {Object} The updated state to apply to InputControl
	 */
	const numberControlStateReducer = ( state, action ) => {
		const { type, payload } = action;
		const currentValue = state.value;

		/**
		 * Handles STEP actions
		 */
		if ( type === 'STEP' ) {
			const { quantity, isShift } = payload;
			const enableShift = isShiftStepEnabled && isShift;
			const nextStep = enableShift
				? parseFloat( shiftStep ) * parseFloat( step )
				: parseFloat( step );
			const fromValue = isValueEmpty( currentValue )
				? baseValue
				: currentValue;
			const nextValue = add( fromValue, nextStep * quantity );

			state.value = roundClamp( nextValue, min, max, nextStep );
			state.isDirty = false;
		}

		/**
		 * Handles commit (ENTER key press or on blur if isPressEnterToChange)
		 */
		if ( type === inputControlActionTypes.COMMIT ) {
			const applyEmptyValue = required === false && currentValue === '';

			state.value = applyEmptyValue
				? currentValue
				: roundClamp( currentValue, min, max, step );
		}

		return stateReducer?.( state, action ) ?? state;
	};

	const { actions, ...inputControlProps } = useInputControl( {
		...props,
		__unstableStateReducer: numberControlStateReducer,
		className: classes,
	} );

	// Facilitate dispatch of 'STEP' actions to reducer.
	actions.step = ( quantity, isShift, event ) =>
		actions.dispatch( 'STEP', { quantity, isShift }, event );

	const jumpStep = useJumpStep( {
		step,
		shiftStep,
		isShiftStepEnabled,
	} );

	const [ isDragging, setIsDragging ] = useState( false );
	const dragCursor = useDragCursor( isDragging, dragDirection );

	const autoComplete = typeProp === 'number' ? 'off' : null;

	const onKeyDown = ( event ) => {
		const { keyCode, currentTarget } = event;
		props.onKeyDown?.( event );

		if ( keyCode === UP || keyCode === DOWN ) {
			actions.step( keyCode === UP ? 1 : -1, event.shiftKey, event );
			event.preventDefault();
			return;
		}

		if ( keyCode === ENTER ) {
			event.preventDefault();
			actions.commit( currentTarget.value, props.onValidate, event );
		}
	};

	const bindDragGesture = useDrag(
		( dragProps ) => {
			const { distance, dragging, event } = dragProps;

			if ( ! distance ) return;
			// event.stopPropagation(); // TODO why? add comment or remove

			/**
			 * Quick return if no longer dragging.
			 * This prevents unnecessary value calculations.
			 */
			if ( ! dragging ) {
				props.onDragEnd?.( dragProps );
				setIsDragging( false );
				return;
			}

			props.onDrag?.( dragProps );
			const [ xDelta, yDelta ] = dragProps.delta;

			let [ delta, orientation ] = {
				n: [ yDelta, -1 ],
				e: [ xDelta, 1 ],
				s: [ yDelta, 1 ],
				w: [ xDelta, -1 ],
			}[ dragDirection ];

			if ( isRTL() && delta === xDelta ) {
				orientation *= -1;
			}

			const stepQuantity = Math.round( Math.abs( delta / step ) );
			if ( stepQuantity !== 0 ) {
				const sign = Math.sign( delta ) * orientation;
				actions.step( stepQuantity * sign, event.shiftKey, event );
			}

			if ( ! isDragging ) {
				props.onDragStart?.( dragProps );
				setIsDragging( true );
			}
		},
		{
			threshold: dragThreshold,
			enabled: isDragEnabled,
		}
	);

	const dragHandlers = isDragEnabled ? bindDragGesture() : {};

	return {
		...inputControlProps,
		...dragHandlers,
		actions,
		autoComplete,
		dragCursor,
		hideHTMLArrows,
		isDragging,
		min,
		max,
		onKeyDown,
		required,
		step: jumpStep,
		type: typeProp,
	};
}
