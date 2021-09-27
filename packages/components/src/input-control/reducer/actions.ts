/**
 * Internal dependencies
 */
import type { InputState } from './state';

export const CHANGE = 'CHANGE';
export const COMMIT = 'COMMIT';
export const INVALIDATE = 'INVALIDATE';
export const RESET = 'RESET';
export const UPDATE = 'UPDATE';

interface Action< Type, ExtraPayload = {} > {
	type: Type;
	payload: ExtraPayload;
}

interface ValuePayload {
	value: string;
}

export type ChangeAction = Action< typeof CHANGE, ValuePayload >;
export type CommitAction = Action< typeof COMMIT, ValuePayload >;
export type ResetAction = Action< typeof RESET, Partial< ValuePayload > >;
export type UpdateAction = Action< typeof UPDATE, Partial< InputState > >;
export type InvalidateAction = Action< typeof INVALIDATE, { error: unknown } >;

export type ChangeEventAction = ChangeAction | ResetAction | UpdateAction;

export type InputAction = ChangeEventAction | InvalidateAction | CommitAction;
