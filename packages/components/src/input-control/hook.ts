/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ChangeEvent, KeyboardEvent, FocusEvent, MouseEvent } from 'react';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useRef, useState } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import type { InputControlHookProps, InputControlProps } from './types';
import InputControl from './';
import { useInputControlStateReducer } from './reducer/reducer';
import { useUpdateEffect } from '../utils';
import { isValueEmpty } from '../utils/values';

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( InputControl );
	const id = `inspector-input-control-${ instanceId }`;

	return idProp || id;
}

export function useInputControl( {
	__unstableStateReducer: stateReducer,
	className,
	disabled = false,
	hideLabelFromVision = false,
	id: idProp,
	isPressEnterToChange = false,
	labelPosition = 'top',
	size = 'default',
	value: valueProp,
	type,
	...props
}: InputControlHookProps ): InputControlProps {
	const [ isFocused, setIsFocused ] = useState( false );

	const id = useUniqueId( idProp );
	const classes = classNames( 'components-input-control', className );

	const {
		// State
		state,
		// Last event
		event: lastEvent,
		// Actions
		...actions
	} = useInputControlStateReducer( stateReducer, {
		value: valueProp,
		isPressEnterToChange,
	} );

	const { change, commit, reset, update } = actions;

	const { value, isDirty } = state;
	const wasDirtyOnBlur = useRef( false );

	/*
	 * Handles synchronization of external and internal value state.
	 * If not focused and did not hold a dirty value[1] on blur
	 * updates the value from the props. Otherwise if not holding
	 * a dirty value[1] propagates the value and event through onChange.
	 * [1] value is only made dirty if isPressEnterToChange is true
	 */
	useUpdateEffect( () => {
		if ( valueProp === value ) {
			return;
		}
		if ( ! isFocused && ! wasDirtyOnBlur.current ) {
			update( { value: valueProp, isDirty: false } );
		} else if ( ! isDirty ) {
			props.onChange?.( value, {
				event: lastEvent.current as ChangeEvent< HTMLInputElement >,
			} );
			wasDirtyOnBlur.current = false;
		}
	}, [ value, isDirty, isFocused, valueProp ] );

	const onBlur = ( event: FocusEvent< HTMLInputElement > ) => {
		props.onBlur?.( event );
		setIsFocused( false );
		// update( { isFocused: false } );

		/**
		 * If isPressEnterToChange is set, this commits the value to
		 * the onChange callback.
		 */
		if ( isPressEnterToChange && isDirty ) {
			const nextValue = event.target.value;
			wasDirtyOnBlur.current = true;
			if ( ! isValueEmpty( nextValue ) ) {
				commit( nextValue, props.onValidate, event );
			} else {
				reset( valueProp, event );
			}
		}
	};

	const onFocus = ( event: FocusEvent< HTMLInputElement > ) => {
		props.onFocus?.( event );
		setIsFocused( true );
		// update( { isFocused: true } );
	};

	const onChange = ( event: ChangeEvent< HTMLInputElement > ) => {
		const nextValue = event.target.value;
		change( nextValue, event );
	};

	const onKeyDown = ( event: KeyboardEvent< HTMLInputElement > ) => {
		const { keyCode } = event;
		props.onKeyDown?.( event );

		if ( keyCode === ENTER && isPressEnterToChange ) {
			event.preventDefault();
			commit( event.currentTarget.value, props.onValidate, event );
		}
	};

	let onMouseDown;
	if ( type === 'number' ) {
		// Works around the odd UA (e.g. Firefox) that does not focus inputs of
		// type=number when their spinner arrows are pressed.
		onMouseDown = ( event: MouseEvent< HTMLInputElement > ) => {
			props.onMouseDown?.( event );
			if (
				event.currentTarget !==
				event.currentTarget.ownerDocument.activeElement
			) {
				event.currentTarget.focus();
			}
		};
	}

	return {
		...props,
		actions,
		className: classes,
		disabled,
		hideLabelFromVision,
		id,
		isFocused,
		labelPosition,
		onBlur,
		onFocus,
		onChange,
		onKeyDown,
		onMouseDown,
		size,
		value,
		type,
	};
}
