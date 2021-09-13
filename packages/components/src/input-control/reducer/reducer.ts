/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { SyntheticEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useReducer, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { InputState, StateReducer, initialInputControlState } from './state';
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

/*
 * Creates a reducer that opens the channel for external state subscription
 * and modification.
 *
 * This technique uses the "stateReducer" design pattern:
 * https://kentcdodds.com/blog/the-state-reducer-pattern/
 *
 * @param  specializedReducer A custom reducer that can subscribe and modify state.
 * @return The reducer.
 */
function inputControlStateReducer(
	specializedReducer?: StateReducer
): StateReducer {
	return ( state, action ) => {
		// Update actions are fundamental and unavailable to specialized
		// reducers. They merely merge state and return.
		if ( action.type === actions.UPDATE ) {
			return { ...state, ...action.payload };
		}

		const nextState = { ...state };

		switch ( action.type ) {
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
				nextState.value = action.payload.value ?? state.initialValue;
				break;

			/**
			 * Validation
			 */
			case actions.INVALIDATE:
				nextState.error = action.payload.error;
				break;
		}

		// Continue through a specialized reducer if one is defined, otherwise
		// return the nextState.
		return specializedReducer?.( nextState, action ) ?? nextState;
	};
}

/**
 * This hook sets up the state reducer for InputControl and creates some
 * specialized dispatch methods for each action type.
 *
 * This technique uses the "stateReducer" design pattern:
 * https://kentcdodds.com/blog/the-state-reducer-pattern/
 *
 * @param  stateReducer An external state reducer.
 * @param  initialState The initial state for the reducer.
 * @return State, event, dispatch and action specific dispatch methods.
 */
export function useInputControlStateReducer(
	stateReducer: StateReducer,
	initialState: Partial< InputState > = initialInputControlState
) {
	const refEvent = useRef< SyntheticEvent | undefined >();
	const setEvent = ( event: SyntheticEvent | undefined ) => {
		event?.persist();
		refEvent.current = event;
	};

	const [ state, dispatch ] = useReducer< StateReducer >(
		inputControlStateReducer( stateReducer ),
		mergeInitialState( initialState )
	);

	const createChangeEvent = ( type: actions.ChangeEventAction[ 'type' ] ) => (
		nextValue: actions.ChangeEventAction[ 'payload' ][ 'value' ],
		event: actions.ChangeEventAction[ 'payload' ][ 'event' ]
	) => {
		setEvent( event );

		dispatch( {
			type,
			payload: { value: nextValue },
		} as actions.InputAction );
	};

	// Actions for the reducer
	const change = createChangeEvent( actions.CHANGE );
	const reset = createChangeEvent( actions.RESET );
	const invalidate = ( error: unknown, event: SyntheticEvent ) => {
		setEvent( event );
		dispatch( { type: actions.INVALIDATE, payload: { error } } );
	};
	const update = ( nextState: InputState ) =>
		dispatch( { type: actions.UPDATE, payload: nextState } );
	const commit = (
		value: string,
		onValidate: Function,
		event: SyntheticEvent
	) => {
		setEvent( event );
		try {
			onValidate?.( value, event );
			dispatch( { type: actions.COMMIT, payload: { value } } );
		} catch ( error ) {
			invalidate( error, event );
		}
	};

	return {
		change,
		commit,
		dispatch,
		event: refEvent.current,
		invalidate,
		reset,
		state,
		update,
	} as const;
}
