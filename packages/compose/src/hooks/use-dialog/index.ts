/**
 * External dependencies
 */
import type { RefCallback } from 'react';

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
		event: React.FocusEvent | FocusEvent
	) => void;
};

type useDialogReturn = [
	RefCallback< HTMLElement >,
	ReturnType< typeof useFocusOutside > & Pick< HTMLElement, 'tabIndex' >
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
function useDialog( options: DialogOptions ): useDialogReturn {
	const currentOptions = useRef< DialogOptions | undefined >();
	useEffect( () => {
		currentOptions.current = options;
	}, Object.values( options ) );

	const closeByOutsideInteraction = useCallback(
		( event: React.FocusEvent | FocusEvent ) => {
			// This unstable prop is here only to manage backward compatibility
			// for the Popover component otherwise, the onClose should be enough.
			if ( currentOptions.current?.__unstableOnClose ) {
				currentOptions.current.__unstableOnClose(
					'focus-outside',
					event
				);
			} else if ( currentOptions.current?.onClose ) {
				currentOptions.current.onClose();
			}
		},
		[]
	);

	const constrainedTabbingRef = useConstrainedTabbing();
	const focusOnMountRef = useFocusOnMount( options.focusOnMount );
	const focusReturnRef = useFocusReturn();
	const focusOutsideProps = useFocusOutside( closeByOutsideInteraction );
	const closeOnEscapeRef = useCallback( ( node: HTMLElement ) => {
		if ( ! node ) {
			return;
		}

		node.addEventListener( 'keydown', ( event: KeyboardEvent ) => {
			// Close on escape.
			if (
				event.keyCode === ESCAPE &&
				! event.defaultPrevented &&
				currentOptions.current?.onClose
			) {
				event.preventDefault();
				currentOptions.current.onClose();
			}
		} );
	}, [] );
	const state = useRef< {
		ref?: HTMLElement;
		doc?: Document;
		obstructOutsidePointer: ( event: MouseEvent ) => void;
	} >();
	const obstructOutsidePointerRef = useCallback(
		( node: HTMLElement ) => {
			if ( ! node && state.current ) {
				const { doc, obstructOutsidePointer } = state.current;
				doc!.removeEventListener( 'mousedown', obstructOutsidePointer, {
					capture: true,
				} );
				state.current = undefined;
				return;
			}

			if ( ! state.current )
				state.current = {
					obstructOutsidePointer: ( event: MouseEvent ) => {
						const { target } = event;
						if (
							target instanceof Node &&
							! node.contains( target )
						) {
							closeByOutsideInteraction( event );
							event.preventDefault();
							event.stopImmediatePropagation();
							target.addEventListener(
								'click',
								( e ) => {
									e.preventDefault();
									e.stopImmediatePropagation();
								},
								{ once: true, capture: true }
							);
						}
					},
				};

			if ( node.ownerDocument.defaultView ) {
				state.current.ref = node;
				state.current.doc = node.ownerDocument;
				state.current.doc.addEventListener(
					'mousedown',
					state.current.obstructOutsidePointer,
					{ capture: true }
				);
			}
		},
		[ closeByOutsideInteraction ]
	);

	return [
		useMergeRefs( [
			options.focusOnMount !== false ? constrainedTabbingRef : null,
			options.focusOnMount !== false ? focusReturnRef : null,
			options.focusOnMount !== false ? focusOnMountRef : null,
			options.focusOnMount !== false ? obstructOutsidePointerRef : null,
			closeOnEscapeRef,
		] ),
		{
			...focusOutsideProps,
			tabIndex: -1,
		},
	];
}

export default useDialog;
