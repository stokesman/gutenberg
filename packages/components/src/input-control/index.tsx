/**
 * External dependencies
 */
import { noop } from 'lodash';
import classNames from 'classnames';
// eslint-disable-next-line no-restricted-imports
import type { ChangeEvent, Ref } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InputBase from './input-base';
import InputField from './input-field';
import type { InputControlProps } from './types';
import type { ActionDispatchers } from './reducer/actions';
import { useInputControlStateReducer } from './reducer/reducer';
import { useUpdateEffect } from '../utils';

function useUniqueId( idProp?: string ) {
	const instanceId = useInstanceId( InputControl );
	const id = `inspector-input-control-${ instanceId }`;

	return idProp || id;
}

export function InputControl(
	{
		__unstableStateReducer: stateReducer = ( state ) => state,
		__unstableInputWidth,
		className,
		disabled = false,
		hideLabelFromVision = false,
		id: idProp,
		isDragEnabled = false,
		isPressEnterToChange = false,
		label,
		labelPosition = 'top',
		onChange = noop,
		prefix,
		size = 'default',
		suffix,
		value: valueProp,
		...props
	}: InputControlProps,
	ref: Ref< HTMLInputElement >
) {
	const id = useUniqueId( idProp );
	const classes = classNames( 'components-input-control', className );

	const {
		// State
		state: { _event, value, isDragging, isDirty, isFocused },
		// Actions
		...actions
	} = useInputControlStateReducer( stateReducer, {
		isDragEnabled,
		value: valueProp,
		isPressEnterToChange,
	} );

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
			actions.update( { value: valueProp, isDirty: false } );
		} else if ( ! isDirty ) {
			onChange( value, {
				event: _event as ChangeEvent< HTMLInputElement >,
			} );
			wasDirtyOnBlur.current = false;
		}
	}, [ value, isDirty, isFocused, valueProp ] );

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
			<InputField
				{ ...props }
				actions={ ( actions as unknown ) as ActionDispatchers }
				className="components-input-control__input"
				disabled={ disabled }
				id={ id }
				isDirty={ isDirty }
				isDragging={ isDragging }
				isFocused={ isFocused }
				isPressEnterToChange={ isPressEnterToChange }
				ref={ ref }
				size={ size }
				value={ value }
				wasDirtyOnBlur={ wasDirtyOnBlur }
			/>
		</InputBase>
	);
}

const ForwardedComponent = forwardRef( InputControl );

export default ForwardedComponent;
