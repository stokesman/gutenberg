/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useControlledValue } from '../utils/hooks';
import { clamp } from '../utils/math';

import type { UseControlledRangeValueArgs } from './types';

/**
 * A float supported clamp function for a specific value.
 *
 * @param value The value to clamp.
 * @param min   The minimum value.
 * @param max   The maximum value.
 *
 * @return A (float) number
 */
export function floatClamp( value: number | null, min: number, max: number ) {
	if ( typeof value !== 'number' ) {
		return null;
	}

	return parseFloat( `${ clamp( value, min, max ) }` );
}

/**
 * Hook to store a clamped value, derived from props.
 *
 * @param settings
 * @return The controlled value and the value setter.
 */
export function useControlledRangeValue(
	settings: UseControlledRangeValueArgs
) {
	const {
		min,
		max,
		value: valueProp,
		initial,
		onChange,
		resetFallbackValue,
	} = settings;

	const [ state, setInternalState ] = useControlledValue<
		number | null | typeof resetSymbol
	>( {
		value: floatClamp( valueProp, min, max ),
		defaultValue: floatClamp( initial ?? null, min, max ),
		onChange: ( v ) => {
			if ( ! onChange ) return;

			if ( v === resetSymbol ) {
				let resetValue: number | null = parseFloat(
					`${ resetFallbackValue }`
				);
				let onChangeResetValue: number | undefined = resetValue;

				if ( isNaN( resetValue ) ) {
					resetValue = null;
					onChangeResetValue = undefined;
				}
				// To maintain compatibility, send undefined as the reset value
				// except when resetFallbackValue is defined.
				onChange( onChangeResetValue );
			} else onChange( v );
		},
	} );

	const setState = useCallback(
		( nextValue: number | null ) => {
			if ( nextValue === null ) {
				setInternalState( null );
			} else {
				setInternalState( floatClamp( nextValue, min, max ) );
			}
		},
		[ min, max, setInternalState ]
	);

	const reset = () => setInternalState( resetSymbol );

	// `state` can't be an empty string because we specified a fallback value of
	// `null` in `useControlledState`
	return [ state as Exclude< typeof state, '' >, setState, reset ] as const;
}

const resetSymbol = Symbol();
