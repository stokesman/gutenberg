/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * @typedef {import('react').SyntheticEvent} SyntheticEvent
 */

/**
 * @callback EventCallback
 * @param {FocusEvent} event input related event.
 */

/**
 * @typedef {import('react').MutableRefObject<HTMLElement | undefined>} FocusOutsideRef
 */

/**
 * @typedef {{
 *  (evt: FocusEvent & {target: HTMLElement}): void;
 * }} FocusOutsideFocusEventListener
 */

/**
 * @typedef {'focusin'} Focusin
 * @typedef { Document & {
 *  addEventListener: (type: Focusin, listener: FocusOutsideFocusEventListener, options?: boolean | EventListenerOptions) => void;
 *  removeEventListener: (type: Focusin, listener: FocusOutsideFocusEventListener, options?: boolean | EventListenerOptions) => void;
 * }} OverridenDocument
 */

/**
 * A react hook that triggers a callback when focus moves outside the element
 * the ref is bound to.
 *
 * @param {EventCallback} onFocusOutside A callback triggered when focus moves outside
 *                                       the element the ref is bound to.
 *
 * @return {FocusOutsideRef} An ref to bind on an element to detect when focus moves
 *                           outside that element.
 */
export default function useFocusOutside( onFocusOutside ) {
	/** @type {FocusOutsideRef} */
	const ref = useRef();

	/** @type {(event: FocusEvent & {target: HTMLElement}) => void} */
	function handleFocusOutside( event ) {
		if ( ! ref.current?.contains( event.target ) ) onFocusOutside( event );
	}

	useEffect( () => {
		/** @type {OverridenDocument | undefined} */
		const doc = ref.current?.ownerDocument;
		doc?.addEventListener( 'focusin', handleFocusOutside );
		return () => {
			doc?.removeEventListener( 'focusin', handleFocusOutside );
		};
	} );

	return ref;
}
