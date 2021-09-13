/**
 * External dependencies
 */
import classNames from 'classnames';
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	forwardRef,
	useImperativeHandle,
	useRef,
	useState,
} from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import InputBase from './input-base';
import { Input } from './styles/input-control-styles';
import type { InputControlProps } from './types';
import { useInputControlStateReducer } from './reducer/reducer';
import { useUpdateEffect } from '../utils';
import { isValueEmpty } from '../utils/values';

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( InputControl );
	const id = `inspector-input-control-${ instanceId }`;

	return idProp || id;
}

export function InputControl(
	{
		__unstableStateReducer: stateReducer,
		__unstableInputWidth,
		className,
		disabled = false,
		hideLabelFromVision = false,
		id: idProp,
		isPressEnterToChange = false,
		label,
		labelPosition = 'top',
		prefix,
		size = 'default',
		suffix,
		value: valueProp,
		...props
	}: InputControlProps,
	ref: Ref< HTMLInputElement >
) {
	const [ isFocused, setIsFocused ] = useState( false );

	const id = useUniqueId( idProp );
	const classes = classNames( 'components-input-control', className );

	const {
		// State
		state,
		// Last event
		event: _event,
		// Actions
		change,
		commit,
		dispatch,
		invalidate,
		reset,
		update,
	} = useInputControlStateReducer( stateReducer, {
		value: valueProp,
		isPressEnterToChange,
	} );

	const refInput = useRef();

	// Makes the reducer methods available to consumers for extensibility
	useImperativeHandle( ref, () => ( {
		input: refInput,
		change,
		commit,
		dispatch,
		invalidate,
		reset,
		update,
	} ) );

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
				event: _event as ChangeEvent< HTMLInputElement >,
			} );
			wasDirtyOnBlur.current = false;
		}
	}, [ value, isDirty, isFocused, valueProp ] );

	const handleOnBlur = ( event: FocusEvent< HTMLInputElement > ) => {
		props.onBlur?.( event );
		setIsFocused( false );

		/**
		 * If isPressEnterToChange is set, this commits the value to
		 * the onChange callback.
		 */
		if ( isPressEnterToChange && isDirty ) {
			wasDirtyOnBlur.current = true;
			if ( ! isValueEmpty( value ) ) {
				commit( value, props.onValidate, event );
			} else {
				reset( valueProp, event );
			}
		}
	};

	const handleOnFocus = ( event: FocusEvent< HTMLInputElement > ) => {
		props.onFocus?.( event );
		setIsFocused( true );
	};

	const handleOnChange = ( event: ChangeEvent< HTMLInputElement > ) => {
		const nextValue = event.target.value;
		change( nextValue, event );
	};

	const handleOnKeyDown = ( event: KeyboardEvent< HTMLInputElement > ) => {
		const { keyCode } = event;
		const { shouldBypass = false } = props.onKeyDown?.( event ) ?? {};

		if ( ! shouldBypass && keyCode === ENTER && isPressEnterToChange ) {
			event.preventDefault();
			commit( event.currentTarget.value, props.onValidate, event );
		}
	};

	return (
		<InputBase
			__unstableInputWidth={ __unstableInputWidth }
			className={ classes }
			disabled={ disabled }
			gap={ 3 }
			hideLabelFromVision={ hideLabelFromVision }
			id={ id }
			isFocused={ isFocused }
			justify="left"
			label={ label }
			labelPosition={ labelPosition }
			prefix={ prefix }
			size={ size }
			suffix={ suffix }
		>
			<Input
				{ ...props }
				className="components-input-control__input"
				disabled={ disabled }
				id={ id }
				inputSize={ size }
				onBlur={ handleOnBlur }
				onChange={ handleOnChange }
				onFocus={ handleOnFocus }
				onKeyDown={ handleOnKeyDown }
				ref={ refInput }
				size={ size }
				value={ value }
			/>
		</InputBase>
	);
}

const ForwardedComponent = forwardRef( InputControl );

export default ForwardedComponent;
