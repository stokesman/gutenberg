/**
 * External dependencies
 */
import type { RefCallback, SyntheticEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useCallback } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import useConstrainedTabbing from '../use-constrained-tabbing';
import useFocusOnMount from '../use-focus-on-mount';
import useFocusReturn from '../use-focus-return';
import useFocusOutside from '../use-focus-outside';
import useMergeRefs from '../use-merge-refs';

type DialogOptions = {
	focusOnMount?: Parameters< typeof useFocusOnMount >[ 0 ];
	onClose?: () => void;
	/**
	 * Use the `onClose` prop instead.
	 *
	 * @deprecated
	 */
	__unstableOnClose?: (
		type: string | undefined,
		event: SyntheticEvent | Event
	) => void;
};

type useDialogReturn< DO > = [
	RefCallback< HTMLElement >,
	DO extends DialogOptions & NonNullable< DialogOptions[ 'focusOnMount' ] >
		? Omit< ReturnType< typeof useFocusOutside >, 'ref' > &
				Pick< HTMLElement, 'tabIndex' >
		: Pick< HTMLElement, 'tabIndex' >
];

/**
 * Returns a ref and props to apply to a dialog wrapper to enable the following behaviors:
 *  - constrained tabbing.
 *  - focus on mount.
 *  - return focus on unmount.
 *  - focus outside.
 *
 * @param options Dialog Options.
 */
function useDialog(
	options: DialogOptions
): useDialogReturn< typeof options > {
	const refOptions = useRef< DialogOptions | undefined >();
	useEffect( () => {
		refOptions.current = options;
	}, Object.values( options ) );
	const constrainedTabbingRef = useConstrainedTabbing();
	const focusOnMountRef = useFocusOnMount( options.focusOnMount );
	const focusReturnRef = useFocusReturn();
	const { ref: focusOutsideRef, ...focusOutsideProps } = useFocusOutside(
		( event ) => {
			// This unstable prop is here only to manage backward compatibility
			// for the Popover component otherwise, the onClose should be enough.
			if ( refOptions.current?.__unstableOnClose ) {
				refOptions.current.__unstableOnClose( 'focus-outside', event );
			} else if ( refOptions.current?.onClose ) {
				refOptions.current.onClose();
			}
		}
	);
	const closeOnEscapeRef = useCallback( ( node: HTMLElement ) => {
		if ( ! node ) {
			return;
		}

		node.addEventListener( 'keydown', ( event: KeyboardEvent ) => {
			// Close on escape.
			if (
				event.keyCode === ESCAPE &&
				! event.defaultPrevented &&
				refOptions.current?.onClose
			) {
				event.preventDefault();
				refOptions.current.onClose();
			}
		} );
	}, [] );

	const usedRefs = [ closeOnEscapeRef ];
	const propsOut = { tabIndex: -1 };
	if ( options.focusOnMount !== false ) {
		usedRefs.push(
			constrainedTabbingRef,
			focusReturnRef,
			focusOnMountRef,
			focusOutsideRef,
			closeOnEscapeRef
		);
		Object.assign( propsOut, focusOutsideProps );
	}
	return [ useMergeRefs( usedRefs ), propsOut ];
}

export default useDialog;
