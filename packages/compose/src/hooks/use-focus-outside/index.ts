/**
 * External dependencies
 */
import type {
	FocusEvent as ReactFocusEvent,
	FocusEventHandler,
	RefCallback,
} from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';

type UseFocusOutsideReturn = {
	onBlur: FocusEventHandler;
	ref: RefCallback< HTMLElement >;
};

/**
 * Triggers a callback when focus leaves an element.
 *
 * @param  onFocusOutside A callback to trigger when focus leaves the
 *                        referenced element.
 *
 * @return Element ref.
 *
 * @todo
 * - Double-check setTimeout is really needed in onWindowFocus.
 * - Add explanatory inline comments
 * - Add @example?
 */
export default function useFocusOutside(
	onFocusOutside: ( event: FocusEvent | ReactFocusEvent< Element > ) => void
): UseFocusOutsideReturn {
	const refOnFocusOutside = useRef( onFocusOutside );
	useEffect( () => {
		refOnFocusOutside.current = onFocusOutside;
	}, [ onFocusOutside ] );

	const refBlurHandler = useRef< FocusEventHandler >( () => {} );

	const ref = useRefEffect< HTMLElement >( ( root ) => {
		const doc = root.ownerDocument;
		if ( ! doc ) return;

		let hasFocusWithin = root.contains( doc.activeElement );

		const subviewList = root.getElementsByTagName( 'iframe' );

		const sendIfOutside = (
			event: FocusEvent | ReactFocusEvent< Element >,
			element: Node | null
		) => {
			console.log('sending if outsieieieieieide', event)
			hasFocusWithin = root.contains( element );
			if ( ! hasFocusWithin ) refOnFocusOutside.current( event );
		};

		refBlurHandler.current = ( event ) => {
			console.log('root focus out', event.relatedTarget, doc.hasFocus())
			if ( event.relatedTarget ) {
				sendIfOutside( event, event.relatedTarget as Element );
			}
			// No related target means focus is moving either up to the closest
			// parent tabbable or into an iframe.
			else {
				// Waits a tick because the active element is not yet settled.
				setTimeout( () => {
					// Skips iframes because window blur will handle those.
					if ( ! ( doc.activeElement instanceof HTMLIFrameElement ) )
						sendIfOutside( event, doc.activeElement );
				} );
			}
		};

		const onWindowBlur = () => {
			console.log('window blur', {hasFocusWithin, docFocus: doc.hasFocus()})
			if (
				doc.hasFocus() &&
				doc.activeElement instanceof HTMLIFrameElement
			) {
				hasFocusWithin = Array.from( subviewList ).includes(
					doc.activeElement
				);
			}
		};

		const onWindowFocus = ( event: FocusEvent ) => {
			console.log( 'srsly! window focus')
			if ( hasFocusWithin )
				setTimeout( () => sendIfOutside( event, doc.activeElement ) );
		};

		doc.defaultView?.addEventListener( 'blur', onWindowBlur );
		doc.defaultView?.addEventListener( 'focus', onWindowFocus );

		return () => {
			doc.defaultView?.removeEventListener( 'blur', onWindowBlur );
			doc.defaultView?.removeEventListener( 'focus', onWindowFocus );
		};
	}, [] );

	return { ref, onBlur: refBlurHandler.current };
}
