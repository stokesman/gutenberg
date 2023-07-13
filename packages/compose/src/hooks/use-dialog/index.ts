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
import useFocusExit from '../use-focus-exit';
import useMergeRefs from '../use-merge-refs';

type DialogOptions = {
	/**
	 * Determines whether focus should be automatically moved to the popover
	 * when it mounts. `false` causes no focus shift, `true` causes the popover
	 * itself to gain focus, and `firstElement` focuses the first focusable
	 * element within the popover.
	 *
	 * @default 'firstElement'
	 */
	focusOnMount?: Parameters< typeof useFocusOnMount >[ 0 ];
	/**
	 * Determines whether tabbing is constrained to within the popover,
	 * preventing keyboard focus from leaving the popover content without
	 * explicit focus elsewhere, or whether the popover remains part of the
	 * wider tab order.
	 * If no value is passed, it will be derived from `focusOnMount`.
	 *
	 * @see focusOnMount
	 * @default `focusOnMount` !== false
	 */
	constrainTabbing?: boolean;
	onClose?: () => void;
	/**
	 * Called when focus exits the element and may return a falsy value to prevent
	 * `onClose` and `__unstableOnClose` from being called.
	 */
	onFocusExit?: ( active: Element ) => unknown;
	/**
	 * Use the `onClose` prop instead.
	 *
	 * @deprecated
	 */
	__unstableOnClose?: (
		type: string | undefined,
		event: SyntheticEvent
	) => void;
};

type useDialogReturn = [
	RefCallback< HTMLElement >,
	Pick< HTMLElement, 'tabIndex' >,
];

export const createSyntheticEvent = < T extends Element, E extends Event >(
	event: E
): React.SyntheticEvent< T, E > => {
	let isDefaultPrevented = false;
	let isPropagationStopped = false;
	const preventDefault = () => {
		isDefaultPrevented = true;
		event.preventDefault();
	};
	const stopPropagation = () => {
		isPropagationStopped = true;
		event.stopPropagation();
	};
	return {
		nativeEvent: event,
		currentTarget: event.currentTarget as EventTarget & T,
		target: event.target as EventTarget & T,
		bubbles: event.bubbles,
		cancelable: event.cancelable,
		defaultPrevented: event.defaultPrevented,
		eventPhase: event.eventPhase,
		isTrusted: event.isTrusted,
		preventDefault,
		isDefaultPrevented: () => isDefaultPrevented,
		stopPropagation,
		isPropagationStopped: () => isPropagationStopped,
		persist: () => {},
		timeStamp: event.timeStamp,
		type: event.type,
	};
};

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
	const { constrainTabbing = options.focusOnMount !== false } = options;
	useEffect( () => {
		currentOptions.current = options;
	}, Object.values( options ) );
	const constrainedTabbingRef = useConstrainedTabbing();
	const focusOnMountRef = useFocusOnMount( options.focusOnMount );
	const focusReturnRef = useFocusReturn();
	const focusExitRef = useFocusExit( ( active ) => {
		const onFocusExit = currentOptions.current?.onFocusExit;
		// Bails when onFocusExit is defined and returns a falsy value.
		if ( onFocusExit && ! onFocusExit( active ) ) return;

		// This unstable prop  is here only to manage backward compatibility
		// for the Popover component otherwise, the onClose should be enough.
		if ( currentOptions.current?.__unstableOnClose ) {
			currentOptions.current.__unstableOnClose(
				'focus-outside',
				createSyntheticEvent(
					new FocusEvent( 'blur', { relatedTarget: active } )
				)
			);
		} else if ( currentOptions.current?.onClose ) {
			currentOptions.current.onClose();
		}
	} );
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

	return [
		useMergeRefs( [
			constrainTabbing ? constrainedTabbingRef : null,
			options.focusOnMount !== false ? focusReturnRef : null,
			options.focusOnMount !== false ? focusOnMountRef : null,
			options.focusOnMount !== false ? focusExitRef : null,
			closeOnEscapeRef,
		] ),
		{ tabIndex: -1 },
	];
}

export default useDialog;
