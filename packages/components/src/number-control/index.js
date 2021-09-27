// @ts-nocheck
/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useNumberControl } from './hook';
import { NumberControlElement } from './styles/number-control-styles';

/**
 * @typedef {import('@wordpress/element').RefObject} RefObject
 * @typedef {import("../../input-control/types").InputControlProps} InputControlProps
 *
 * @typedef { Object } NumberControlAddedProps
 * @property { number }         min  Minimum valid value.
 * @property { number }         max  Maximum valid value.
 * @property { number | 'any' } step Amount by which value changes in step actions.
 *
 * @typedef { InputControlProps & NumberControlAddedProps } NumberControlProps
 */

/**
 * @param { NumberControlProps } props
 * @param { RefObject }          ref
 */
const NumberControl = ( props, ref ) => (
	<NumberControlElement { ...useNumberControl( props ) } ref={ ref } />
);

export default forwardRef( NumberControl );

export { useNumberControl, NumberControlElement };
