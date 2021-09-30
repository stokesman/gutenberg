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
import { forwardRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InputBase from './input-base';
import InputField from './input-field';
import type { InputControlProps } from './types';
import type { ActionDispatchers } from './reducer/actions';
import { useInputControlStateReducer } from './reducer/reducer';

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

	const valuePropString = String( valueProp );
	const {
		// State
		state,
		state: { _event, value, isDragging, isDirty, isFocused },
		// Actions
		...actions
	} = useInputControlStateReducer( stateReducer, {
		isDragEnabled,
		value: valuePropString,
		isPressEnterToChange,
	} );

	// Propagates the value when it has updated due to a reducer action.
	useEffect( () => {
		if ( _event ) {
			onChange( value, {
				event: _event as ChangeEvent< HTMLInputElement >,
			} );
		}
	}, [ value, _event ] );

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
				isDragEnabled={ state.isDragEnabled }
				isDragging={ isDragging }
				isFocused={ isFocused }
				isPressEnterToChange={ state.isPressEnterToChange }
				ref={ ref }
				size={ size }
				value={ value }
			/>
		</InputBase>
	);
}

const ForwardedComponent = forwardRef( InputControl );

export default ForwardedComponent;
