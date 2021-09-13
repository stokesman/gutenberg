// @ts-nocheck
/**
 * External dependencies
 */
import classNames from 'classnames';
import { useDrag } from 'react-use-gesture';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { UP, DOWN, ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { Input } from './styles/number-control-styles';
import * as inputControlActionTypes from '../input-control/reducer/actions';
import { useDragCursor } from './utils';
import { add, roundClamp } from '../utils/math';
import { useJumpStep } from '../utils/hooks';
import { isValueEmpty } from '../utils/values';

export function NumberControl(
	{
		__unstableStateReducer: stateReducer,
		className,
		dragDirection = 'n',
		dragThreshold = 10,
		hideHTMLArrows = false,
		isDragEnabled = true,
		isShiftStepEnabled = true,
		label,
		max = Infinity,
		min = -Infinity,
		required = false,
		shiftStep = 10,
		step = 1,
		type: typeProp = 'number',
		value: valueProp,
		...props
	},
	ref
) {
	const [ isDragging, setIsDragging ] = useState( false );

	const refInputControl = useRef();

	// Queues actions dispatched before the actual reducer dispatch method is
	// available. Unit tests are probably the only time that happens.
	const queuedActions = useRef( [] );
	const queueAction = ( action ) => queuedActions.current.push( action );

	const {
		current: { dispatch = queueAction, commit = queueAction } = {},
	} = refInputControl;

	const canDispatch = dispatch !== queueAction;
	useEffect( () => {
		if ( canDispatch && queuedActions.current.length ) {
			queuedActions.current.forEach( ( action ) => dispatch( action ) );
		}
	}, [ canDispatch ] );

	// Sugar for dispatching 'STEP' actions to reducer
	const stepChange = ( quantity, isShift ) =>
		dispatch( { type: 'STEP', payload: { quantity, isShift } } );

	// Makes the reducer methods and ref to the input element of InputControl
	// available to consumers for extensibility
	useImperativeHandle( ref, () => ( {
		...refInputControl.current,
		step: stepChange,
	} ) );

	const baseValue = roundClamp( 0, min, max, step );

	const jumpStep = useJumpStep( {
		step,
		shiftStep,
		isShiftStepEnabled,
	} );

	const dragCursor = useDragCursor( isDragging, dragDirection );

	const autoComplete = typeProp === 'number' ? 'off' : null;
	const classes = classNames( 'components-number-control', className );

	const onKeyDown = ( event ) => {
		const { keyCode } = event;
		props.onKeyDown?.( event );

		if ( keyCode === UP || keyCode === DOWN ) {
			stepChange( keyCode === UP ? 1 : -1, event.shiftKey );
			event.preventDefault();
			return;
		}

		if ( keyCode === ENTER ) {
			event.preventDefault();
			commit( event.currentTarget.value, props.onValidate, event );
			// Instructs the calling handler to skip its default behavior
			return { shouldBypass: true };
		}
	};

	const dragGestureProps = useDrag(
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
				stepChange( stepQuantity * sign, event.shiftKey );
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

	const dragProps = isDragEnabled ? dragGestureProps() : {};
	/*
	 * Works around the odd UA (e.g. Firefox) that does not focus inputs of
	 * type=number when their spinner arrows are pressed.
	 */
	const onMouseDown = ( event ) => {
		props.onMouseDown?.( event );
		if (
			event.currentTarget !==
			event.currentTarget.ownerDocument.activeElement
		) {
			event.currentTarget.focus();
		}
	};

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

	return (
		<Input
			autoComplete={ autoComplete }
			inputMode="numeric"
			{ ...props }
			{ ...dragProps }
			className={ classes }
			dragCursor={ dragCursor }
			dragDirection={ dragDirection }
			hideHTMLArrows={ hideHTMLArrows }
			isDragging={ isDragging }
			label={ label }
			max={ max }
			min={ min }
			onKeyDown={ onKeyDown }
			onMouseDown={ onMouseDown }
			ref={ refInputControl }
			required={ required }
			step={ jumpStep }
			type={ typeProp }
			value={ valueProp }
			__unstableStateReducer={ numberControlStateReducer }
		/>
	);
}

export default forwardRef( NumberControl );
