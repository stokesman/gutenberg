/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Reducer } from 'react';

/**
 * Internal dependencies
 */
import type { InputAction } from './actions';

export interface InputState {
	_event: Event | {};
	error: unknown;
	initialValue?: string;
	isDirty: boolean;
	isPressEnterToChange: boolean;
	value?: string;
}

export type StateReducer = Reducer< InputState, InputAction >;

export const initialInputControlState: InputState = {
	_event: {},
	error: null,
	initialValue: '',
	isDirty: false,
	isPressEnterToChange: false,
	value: '',
};
