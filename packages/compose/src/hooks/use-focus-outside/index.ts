/**
 * External dependencies
 */
import type { RefCallback } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';

/**
 * Triggers a callback when focus leaves an element.
 *
 * @param  onFocusOutside A callback to trigger when focus leaves the
 *                        referenced element.
 *
 * @return Element ref.
 *
 * @todo
 * - Test previous implementation for how it works if the root element is not
 *   tabbable and discover any differences with this one.
 * - Double-check setTimeout is really needed in onWindowFocus.
 * - Add explanatory inline comments
 * - Add @example?
 */
export default function useFocusOutside(
	onFocusOutside: ( event: FocusEvent ) => void
): RefCallback< HTMLElement > {
	const refOnFocusOutside = useRef( onFocusOutside );
	useEffect( () => {
		refOnFocusOutside.current = onFocusOutside;
	}, [ onFocusOutside ] );

	return useRefEffect< HTMLElement >( ( root ) => {
		const doc = root.ownerDocument;
		if ( ! doc ) return;

		let hasFocusWithin = root.contains( doc.activeElement );

		const subviewList = root.getElementsByTagName( 'iframe' );

		const sendIfOutside = ( event: FocusEvent, element: Node | null ) => {
			hasFocusWithin = root.contains( element );
			if ( ! hasFocusWithin ) refOnFocusOutside.current( event );
		};

		const onFocusOut = ( event: FocusEvent ) => {
			if ( event.relatedTarget ) {
				sendIfOutside( event, event.relatedTarget as Element );
			} else if ( doc.hasFocus() ) {
				setTimeout( () => sendIfOutside( event, doc.activeElement ) );
			}
		};

		const onWindowBlur = () => {
			if ( doc.activeElement instanceof HTMLIFrameElement )
				hasFocusWithin = Array.from( subviewList ).includes(
					doc.activeElement
				);
		};

		const onWindowFocus = ( event: FocusEvent ) => {
			if ( hasFocusWithin )
				setTimeout( () => sendIfOutside( event, doc.activeElement ) );
		};

		doc.defaultView?.addEventListener( 'blur', onWindowBlur );
		doc.defaultView?.addEventListener( 'focus', onWindowFocus );
		root.addEventListener( 'focusout', onFocusOut );

		return () => {
			doc.defaultView?.removeEventListener( 'blur', onWindowBlur );
			doc.defaultView?.removeEventListener( 'focus', onWindowFocus );
			root.removeEventListener( 'focusout', onFocusOut );
		};
	}, [] );
}
