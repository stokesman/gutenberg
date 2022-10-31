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
 */
export default function useFocusOutside(
	onFocusOutside: ( event: FocusEvent ) => void
): RefCallback< HTMLElement > {
	const refOnFocusOutside = useRef( onFocusOutside );
	useEffect( () => {
		refOnFocusOutside.current = onFocusOutside;
	}, [ onFocusOutside ] );

	/**
	 * @todo
	 * - Consider checking for iframes contained in the ref before enabling
	 *   polling. Tradeoff, would have to add mutation observer in case one
	 *   shows up at a later render.
	 */
	const setRef = useRefEffect< HTMLElement >( ( root ) => {
		const doc = root.ownerDocument;
		if ( ! doc ) return;

		let hasFocusWithin = root.contains( doc.activeElement );

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

		const onPoll = () => {
			if ( root.contains( doc.activeElement ) ) {
				hasFocusWithin = true;
				stopPolling( doc, onPoll );
			}
		};

		const onWindowBlur = () => {
			// Starts polling so that if focus returns by way of a sub-window’s
			// content, where it won't trigger a focus event on the owner
			// document, it is noted in order to determine if onFocusOutside
			// should be called.
			startPolling( doc, onPoll );
		};

		const onWindowFocus = ( event: FocusEvent ) => {
			if ( hasFocusWithin )
				setTimeout( () => sendIfOutside( event, doc.activeElement ) );
		};

		if ( ! hasFocusWithin ) startPolling( doc, onPoll );
		doc.defaultView?.addEventListener( 'blur', onWindowBlur );
		doc.defaultView?.addEventListener( 'focus', onWindowFocus );
		root.addEventListener( 'focusout', onFocusOut );

		return () => {
			stopPolling( doc, onPoll );
			doc.defaultView?.removeEventListener( 'blur', onWindowBlur );
			doc.defaultView?.removeEventListener( 'focus', onWindowFocus );
			root.removeEventListener( 'focusout', onFocusOut );
		};
	}, [] );

	return setRef;
}

let pollingId: number | undefined;
const mapDocToCallbackSet = new Map< Document, Set< () => void > >();
const startPolling = ( doc: Document, callback: () => void ) => {
	const callbackSet = mapDocToCallbackSet.get( doc );
	if ( callbackSet ) callbackSet.add( callback );
	else mapDocToCallbackSet.set( doc, new Set( [ callback ] ) );

	if ( pollingId === undefined )
		pollingId = setInterval( () => {
			for ( const set of mapDocToCallbackSet.values() ) {
				for ( const cb of set ) cb();
			}
		}, 144 );
};

const stopPolling = ( doc: Document, callback: () => void ) => {
	const callbackSet = mapDocToCallbackSet.get( doc );
	callbackSet?.delete( callback );
	if ( callbackSet?.size === 0 ) mapDocToCallbackSet.delete( doc );
	if ( mapDocToCallbackSet.size === 0 ) {
		clearInterval( pollingId );
		pollingId = undefined;
	}
};
