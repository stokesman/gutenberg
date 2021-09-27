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
import type { InputControlHookProps } from './types';
import { useInputControl } from './hook';
import { default as InputControlElement } from './component';

export default forwardRef(
	(
		props: Partial< InputControlHookProps >,
		ref: Ref< HTMLInputElement >
	) => <InputControlElement { ...useInputControl( props ) } ref={ ref } />
);

export { useInputControl, InputControlElement };
