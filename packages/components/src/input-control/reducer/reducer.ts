/**
 * External dependencies
 */
import type { SyntheticEvent, ChangeEvent, PointerEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useReducer, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	InputState,
	StateReducer,
	initialInputControlState,
	initialStateReducer,
} from './state';
import * as actions from './actions';
import type { InputChangeCallback } from '../types';

/**
 * Defaults state for the reducer.
 *
 * @param  state The partial state.
 * @return Prepared state for the reducer
 */
function defaultState(
	state: Partial< InputState > = initialInputControlState
): InputState {
	const { value } = state;

	return {
		...initialInputControlState,
		...state,
		initialValue: value,
	} as InputState;
}

/**
 * Creates a reducer that opens the channel for external state subscription
 * and modification.
 *
 * This technique uses the "stateReducer" design pattern:
 * https://kentcdodds.com/blog/the-state-reducer-pattern/
 *
 * @param  composedStateReducers A custom reducer that can subscribe and modify state.
 * @return The reducer.
 */
function inputControlStateReducer(
	composedStateReducers: StateReducer
): StateReducer {
	return ( state, action ) => {
		// Returns early for CONTROL actions. These are updates from props and
		// do not need to be specialized via additional reducers.
		if ( action.type === actions.CONTROL ) {
			let { value = state.value } = action.payload;
			value ??= '';
			if ( value !== '' ) value = `${ value }`;

			const {
				isDragEnabled = state.isDragEnabled,
				isPressEnterToChange = state.isPressEnterToChange,
			} = action.payload;

			return { ...state, value, isDragEnabled, isPressEnterToChange };
		}

		let nextState = { ...state };

		switch ( action.type ) {
			/**
			 * Keyboard events
			 */
			case actions.PRESS_UP:
				nextState.isDirty = false;
				break;

			case actions.PRESS_DOWN:
				nextState.isDirty = false;
				break;

			/**
			 * Drag events
			 */
			case actions.DRAG_START:
				nextState.isDragging = true;
				break;

			case actions.DRAG_END:
				nextState.isDragging = false;
				break;

			/**
			 * Input events
			 */
			case actions.CHANGE:
				nextState.error = null;
				nextState.value = action.payload.value;

				if ( state.isPressEnterToChange ) {
					nextState.isDirty = true;
				}

				break;

			case actions.COMMIT:
				nextState.value = action.payload.value;
				nextState.isDirty = false;
				break;

			case actions.RESET:
				nextState.error = null;
				nextState.isDirty = false;
				nextState.value = action.payload.value || state.initialValue;
				break;

			/**
			 * Validation
			 */
			case actions.INVALIDATE:
				nextState.error = action.payload.error;
				break;
		}

		/**
		 * Send the nextState + action to the composedReducers via
		 * this "bridge" mechanism. This allows external stateReducers
		 * to hook into actions, and modify state if needed.
		 */
		nextState = composedStateReducers( nextState, action );

		// Ensures the value is a string
		if ( typeof nextState.value !== 'string' )
			nextState.value = `${ nextState.value }`;

		return nextState;
	};
}

/**
 * A custom hook that connects and external stateReducer with an internal
 * reducer. This hook manages the internal state of InputControl.
 * However, by connecting an external stateReducer function, other
 * components can react to actions as well as modify state before it is
 * applied.
 *
 * This technique uses the "stateReducer" design pattern:
 * https://kentcdodds.com/blog/the-state-reducer-pattern/
 *
 * @param  stateReducer    An external state reducer.
 * @param  incomingState   The initial state for the reducer.
 * @param  onChangeHandler A callback to handle changes.
 * @return State, dispatch, and a collection of actions.
 */
export function useInputControlStateReducer(
	stateReducer: StateReducer = initialStateReducer,
	incomingState: Partial< InputState > = initialInputControlState,
	onChangeHandler: InputChangeCallback
) {
	const [ state, dispatch ] = useReducer< StateReducer >(
		inputControlStateReducer( stateReducer ),
		defaultState( incomingState )
	);
	// These are the state values that are controlled by props.
	const { value, isPressEnterToChange, isDragEnabled } = incomingState;

	const refEvent = useRef< SyntheticEvent | null >( null );
	const refIncomingState = useRef( incomingState );
	const refLastChange = useRef< InputState[ 'value' ] >(
		`${ incomingState.value }`
	);

	// Freshens the ref.
	useLayoutEffect( () => void ( refIncomingState.current = incomingState ) );

	// Sends the value out through onChange when internal actions change it.
	useLayoutEffect( () => {
		if (
			refEvent.current &&
			! state.isDirty &&
			state.value !== refLastChange.current
		) {
			onChangeHandler( state.value, {
				event: refEvent.current as
					| ChangeEvent< HTMLInputElement >
					| PointerEvent< HTMLInputElement >,
			} );
			refLastChange.current = state.value;
			refEvent.current = null;
		}
	}, [ state.value ] );

	// Updates state from when incoming props change.
	useLayoutEffect( () => {
		if ( ! refEvent.current ) {
			dispatch( {
				type: actions.CONTROL,
				payload: refIncomingState.current,
			} );
		}
	}, [ value, isPressEnterToChange, isDragEnabled ] );

	const createChangeEvent = ( type: actions.ChangeEventAction[ 'type' ] ) => (
		nextValue: actions.ChangeEventAction[ 'payload' ][ 'value' ],
		event: actions.ChangeEventAction[ 'payload' ][ 'event' ]
	) => {
		refEvent.current = event;
		dispatch( {
			type,
			payload: { value: nextValue, event },
		} as actions.InputAction );
	};

	const createKeyEvent = ( type: actions.KeyEventAction[ 'type' ] ) => (
		event: actions.KeyEventAction[ 'payload' ][ 'event' ]
	) => {
		refEvent.current = event;
		dispatch( { type, payload: { event } } );
	};

	const createDragEvent = ( type: actions.DragEventAction[ 'type' ] ) => (
		payload: actions.DragEventAction[ 'payload' ]
	) => {
		refEvent.current = payload.event;
		dispatch( { type, payload } );
	};

	/**
	 * Actions for the reducer
	 */
	const change = createChangeEvent( actions.CHANGE );
	const invalidate = ( error: unknown, event: SyntheticEvent ) =>
		dispatch( { type: actions.INVALIDATE, payload: { error, event } } );
	const reset = createChangeEvent( actions.RESET );
	const commit = createChangeEvent( actions.COMMIT );

	const dragStart = createDragEvent( actions.DRAG_START );
	const drag = createDragEvent( actions.DRAG );
	const dragEnd = createDragEvent( actions.DRAG_END );

	const pressUp = createKeyEvent( actions.PRESS_UP );
	const pressDown = createKeyEvent( actions.PRESS_DOWN );
	const pressEnter = createKeyEvent( actions.PRESS_ENTER );

	return {
		change,
		commit,
		dispatch,
		drag,
		dragEnd,
		dragStart,
		invalidate,
		pressDown,
		pressEnter,
		pressUp,
		reset,
		state,
	} as const;
}
