/**
 * WordPress dependencies
 */
import { useRef, useEffect, useCallback } from '@wordpress/element';

/**
 * @callback FocusReturnHandler
 * @param {Element?} [origin]   The element to which focus would return.
 * @param {boolean}  [isReturn] Whether it was determined that focus should return.
 */

/**
 * Remembers the focused element on mount and returns focus to it on unmount.
 *
 * @param {FocusReturnHandler} [handler] Allows customizing the hook’s behavior when unmounting. If the callback has
 *                                       one parameter it is called only if focus is expected to return. If it has a
 *                                       second parameter it is called unconditionally and the second argument
 *                                       indicates whether focus was expected to return.
 * @return {import('react').RefCallback<HTMLElement>} Element Ref.
 *
 * @example
 * ```js
 * import { useFocusReturn } from '@wordpress/compose';
 *
 * const WithFocusReturn = () => {
 *     const ref = useFocusReturn()
 *     return (
 *         <div ref={ ref }>
 *             <Button />
 *             <Button />
 *         </div>
 *     );
 * }
 * ```
 */
function useFocusReturn( handler ) {
	/** @type {import('react').MutableRefObject<null | HTMLElement>} */
	const ref = useRef( null );
	/** @type {import('react').MutableRefObject<null | Element>} */
	const focusedBeforeMount = useRef( null );
	const refHandler = useRef( handler );
	useEffect( () => {
		refHandler.current = handler;
	}, [ handler ] );

	return useCallback( ( node ) => {
		if ( node ) {
			// Set ref to be used when unmounting.
			ref.current = node;

			// Only set when the node mounts.
			if ( focusedBeforeMount.current ) {
				return;
			}

			focusedBeforeMount.current = node.ownerDocument.activeElement;
		} else if ( focusedBeforeMount.current ) {
			const isFocused = ref.current?.contains(
				ref.current?.ownerDocument.activeElement
			);

			if ( ref.current?.isConnected && ! isFocused ) {
				// Only calls the handler if it expects two arguments.
				if ( refHandler.current && refHandler.current.length === 2 )
					refHandler.current?.( focusedBeforeMount.current, false );
				return;
			}

			// Defer to the component's own explicit focus return behavior, if
			// specified. This allows for support that the `onFocusReturn`
			// decides to allow the default behavior to occur under some
			// conditions.
			if ( refHandler.current ) {
				// Sends the expected number of args for backward compatibility.
				if ( refHandler.current.length === 2 )
					refHandler.current( focusedBeforeMount.current, true );
				else refHandler.current();
			} else {
				/** @type {null | HTMLElement} */ (
					focusedBeforeMount.current
				)?.focus();
			}
		}
	}, [] );
}

export default useFocusReturn;
