/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';

const { tabbable } = focus;

/**
 * @typedef FocusExitHookState
 * @property {() => void} [cleanup]           Runs when the element unmounts.
 * @property {number}     queuedTestTimeout   Timeout id.
 * @property {boolean}    skipTestOnFocusOut  Whether the the next test for exit can be skipped.
 * @property {boolean}    retestOnWindowFocus Whether to test for exit when the element’s window regains focus.
 */

/**
 * Triggers a callback when focus exits an element.
 *
 * @template {HTMLElement} T
 * @param {(active: Element) => void} onFocusExit A callback triggered when focus exits.
 *
 * @return {import('react').RefCallback<T>} A ref.
 */
const useFocusExit = ( onFocusExit ) => {
	/** @type {React.MutableRefObject<import('./').FocusExitHookState>} */
	const state = useRef( {
		skipTestOnFocusOut: false,
		queuedTestTimeout: -1,
		retestOnWindowFocus: false,
	} );

	return useCallback(
		( boundary ) => {
			// Cleans up on either unmount or change of callback.
			if ( ! boundary ) return state.current.cleanup?.();

			const doc = boundary.ownerDocument;
			const view = doc.defaultView;
			if ( ! view ) return;

			/** @type {(withRetest?: boolean) => void} */
			const queueExitDetermination = ( withRetest ) => {
				if ( state.current.queuedTestTimeout !== -1 ) return;
				console.log( 'queue focus exit determination' );
				state.current.queuedTestTimeout = setTimeout( () => {
					state.current.queuedTestTimeout = -1;
					const { activeElement } = doc;
					if ( withRetest && ! doc.hasFocus() ) {
						state.current.retestOnWindowFocus = true;
						// Returns early as a minor optimization.
						// if ( ! doc.hasFocus() ) return;
					}
					console.log( 'test active is contained', activeElement );
					if (
						activeElement &&
						! boundary.contains( activeElement )
					) {
						onFocusExit( activeElement );
					}
				} );
			};

			/**
			 * Sets a flag to skip the next check after blur if focus is
			 * headed to an element that's within the boundary.
			 *
			 * @type {(event: KeyboardEvent) => void}
			 */
			const tabHandler = ( { type, key, shiftKey, target } ) => {
				if ( key !== 'Tab' ) return;
				if ( type === 'keydown' && target ) {
					const findMethod = shiftKey ? 'findPrevious' : 'findNext';
					const proximate = tabbable[ findMethod ](
						/** @type {Element} */ ( target )
					);
					state.current.skipTestOnFocusOut =
						!! proximate && boundary.contains( proximate );
				} else {
					state.current.skipTestOnFocusOut = false;
				}
			};

			/** @type {(event: FocusEvent) => void} */
			const boundaryHandler = ( event ) => {
				if ( state.current.skipTestOnFocusOut ) return;

				queueExitDetermination( ! event.relatedTarget );
			};

			/** @type {(event: FocusEvent) => void} */
			const windowFocusHandler = () => {
				// console.log( 'window focus' );
				queueExitDetermination();
			};

			// TODO: Consider delegating events.
			doc.addEventListener( 'keydown', tabHandler );
			doc.addEventListener( 'keyup', tabHandler );
			boundary.addEventListener( 'focusout', boundaryHandler );
			view.addEventListener( 'focus', windowFocusHandler );
			state.current.cleanup = () => {
				clearTimeout( state.current.queuedTestTimeout );
				doc.removeEventListener( 'keydown', tabHandler );
				doc.removeEventListener( 'keyup', tabHandler );
				boundary.removeEventListener( 'focusout', boundaryHandler );
				view.removeEventListener( 'focus', windowFocusHandler );
			};
		},
		[ onFocusExit ]
	);
};

export default useFocusExit;
