/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Reducer, SyntheticEvent } from 'react';

/**
 * Internal dependencies
 */
import type { InputAction } from './actions';

export interface InputState {
	_event: SyntheticEvent | undefined;
	error: unknown;
	initialValue?: string;
	isDirty: boolean;
	isDragEnabled: boolean;
	isDragging: boolean;
	isFocused: boolean;
	isPressEnterToChange: boolean;
	value?: string;
}

export type StateReducer = Reducer< InputState, InputAction >;

export const initialStateReducer: StateReducer = ( state: InputState ) => state;

export const initialInputControlState: InputState = {
	_event: undefined,
	error: null,
	initialValue: '',
	isDirty: false,
	isDragEnabled: false,
	isDragging: false,
	isFocused: false,
	isPressEnterToChange: false,
	value: '',
};
