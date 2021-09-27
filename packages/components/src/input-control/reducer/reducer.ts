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

// Alias for convenience
type payloadValue = actions.ChangeEventAction[ 'payload' ][ 'value' ];

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
 * Creates the base reducer for InputControl that accepts an optional reducer
 * to further modify the next state as received from the base reducer.
 *
 * @param  specializedReducer A secondary reducer.
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
 * A `useReducer` hook customized for InputControl. Creates some specialized
 * dispatch methods for each action type and keeps a ref to track the last
 * event that triggered a dispatch.
 *
 * This technique uses the "stateReducer" design pattern:
 * https://kentcdodds.com/blog/the-state-reducer-pattern/
 *
 * @param  stateReducer A state reducer.
 * @param  initialState The initial state for the reducer.
 * @return State, event, dispatch and action specific dispatch methods.
 */
export function useInputControlStateReducer(
	stateReducer?: StateReducer,
	initialState: Partial< InputState > = initialInputControlState
) {
	const refEvent = useRef< SyntheticEvent | undefined >();

	const [ state, baseDispatch ] = useReducer< StateReducer >(
		inputControlStateReducer( stateReducer ),
		mergeInitialState( initialState )
	);

	// Specialize dispatch methods.
	const update = ( nextState: Partial< InputState > ) =>
		baseDispatch( { type: actions.UPDATE, payload: nextState } );

	const dispatch = (
		type: actions.InputAction[ 'type' ],
		payload: actions.InputAction[ 'payload' ],
		event?: SyntheticEvent
	) => {
		if ( event ) {
			event.persist();
			refEvent.current = event;
		}
		baseDispatch( { type, payload } as actions.InputAction );
	};

	const change = ( nextValue: payloadValue, event: SyntheticEvent ) =>
		dispatch( actions.CHANGE, { value: nextValue }, event );

	const reset = ( nextValue: payloadValue, event: SyntheticEvent ) =>
		dispatch( actions.RESET, { value: nextValue }, event );

	const invalidate = ( error: unknown, event: SyntheticEvent ) =>
		dispatch( actions.INVALIDATE, { error }, event );

	const commit = (
		value: payloadValue,
		onValidate: Function | undefined,
		event: SyntheticEvent
	) => {
		try {
			onValidate?.( value, event );
			dispatch( actions.COMMIT, { value }, event );
		} catch ( error ) {
			invalidate( error, event );
		}
	};

	return {
		change,
		commit,
		dispatch,
		event: refEvent,
		invalidate,
		reset,
		state,
		update,
	} as const;
}
