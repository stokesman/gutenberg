/**
 * External dependencies
 */
import { isEmpty } from 'lodash';
// eslint-disable-next-line no-restricted-imports
import type { SyntheticEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useReducer } from '@wordpress/element';

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

/**
 * Prepares initialState for the reducer.
 *
 * @param  initialState The initial state.
 * @return Prepared initialState for the reducer
 */
function mergeInitialState(
	initialState: Partial< InputState > = initialInputControlState
): InputState {
	const { value } = initialState;

	return {
		...initialInputControlState,
		...initialState,
		initialValue: value,
	} as InputState;
}

/**
 * Composes multiple stateReducers into a single stateReducer, building
 * the pipeline to control the flow for state and actions.
 *
 * @param  fns State reducers.
 * @return The single composed stateReducer.
 */
export const composeStateReducers = (
	...fns: StateReducer[]
): StateReducer => {
	return ( ...args ) => {
		return fns.reduceRight( ( state, fn ) => {
			const fnState = fn( ...args );
			return isEmpty( fnState ) ? state : { ...state, ...fnState };
		}, {} as InputState );
	};
};

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
		// Ensures undefined for the nextState._event if there was no event
		const nextState = { ...state, _event: action.payload?.event };

		// Update actions merely merge state and return without further ado.
		if ( action.type === actions.UPDATE ) {
			return Object.assign( nextState, action.payload );
		}

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
		return composedStateReducers( nextState, action );
	};
}

/**
 * Handles state for InputControl through `useReducer` while keeping the value
 * property updated to the incoming value when a render has occured without a
 * dispatch. Also creates a specialized dispatch function for each action type.
 *
 * @param  stateReducer  An external state reducer.
 * @param  incomingState Used to set the initial state and for conditional
 *                       updates to the value property of the state.
 * @return State, dispatch and a collection of action dispatchers.
 */
export function useInputControlStateReducer(
	stateReducer: StateReducer = initialStateReducer,
	incomingState: Partial< InputState > = initialInputControlState
) {
	const [ state, dispatch ] = useReducer< StateReducer >(
		inputControlStateReducer( stateReducer ),
		mergeInitialState( incomingState )
	);

	// Keeps the value in state synchronized with the incoming value. Applies
	// only on renders for which no input event has occurred.
	if ( ! state._event ) {
		state.value = incomingState.value;
	}

	const createChangeEvent = ( type: actions.ChangeEventAction[ 'type' ] ) => (
		nextValue: actions.ChangeEventAction[ 'payload' ][ 'value' ],
		event: actions.ChangeEventAction[ 'payload' ][ 'event' ]
	) => {
		/**
		 * Persist allows for the (Synthetic) event to be used outside of
		 * this function call.
		 * https://reactjs.org/docs/events.html#event-pooling
		 */
		if ( event && event.persist ) {
			event.persist();
		}

		dispatch( {
			type,
			payload: { value: nextValue, event },
		} as actions.InputAction );
	};

	const createKeyEvent = ( type: actions.KeyEventAction[ 'type' ] ) => (
		event: actions.KeyEventAction[ 'payload' ][ 'event' ]
	) => {
		/**
		 * Persist allows for the (Synthetic) event to be used outside of
		 * this function call.
		 * https://reactjs.org/docs/events.html#event-pooling
		 */
		if ( event && event.persist ) {
			event.persist();
		}

		dispatch( { type, payload: { event } } );
	};

	const createDragEvent = ( type: actions.DragEventAction[ 'type' ] ) => (
		payload: actions.DragEventAction[ 'payload' ]
	) => {
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

	const update = ( nextState: Partial< InputState > ) =>
		dispatch( {
			type: actions.UPDATE,
			payload: nextState,
		} );

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
		update,
	} as const;
}
