/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { InputControlProps } from './types';
import InputBase from './input-base';
import { Input } from './styles/input-control-styles';

function InputControl(
	{
		className,
		disabled,
		hideLabelFromVision,
		id,
		isFocused,
		label,
		labelPosition,
		prefix,
		size,
		suffix,
		__unstableInputWidth,
		...props
	}: InputControlProps,
	ref: Ref< HTMLInputElement >
) {
	return (
		<InputBase
			__unstableInputWidth={ __unstableInputWidth }
			className={ className }
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
				ref={ ref }
			/>
		</InputBase>
	);
}

const ForwardedComponent = forwardRef( InputControl );

export default ForwardedComponent;
