/**
 * WordPress dependencies
 */
import { useRef, useEffect, useCallback } from '@wordpress/element';
import { focus } from '@wordpress/dom';

/** @typedef {import('react').MutableRefObject<HTMLElement|undefined>} RefFallback */

/**
 * Hook used to focus the first tabbable element on mount.
 *
 * @param {boolean | 'firstElement'} focusOnMount  Focus on mount mode.
 * @param {RefFallback}              [refFallback] Ref of fallback element to focus in case 'firstElement' fails.
 * @return {import('react').RefCallback<HTMLElement>} Ref callback.
 *
 * @example
 * ```js
 * import { useFocusOnMount } from '@wordpress/compose';
 *
 * const WithFocusOnMount = () => {
 *     const ref = useFocusOnMount()
 *     return (
 *         <div ref={ ref }>
 *             <Button />
 *             <Button />
 *         </div>
 *     );
 * }
 * ```
 */
export default function useFocusOnMount(
	focusOnMount = 'firstElement',
	refFallback
) {
	const focusOnMountRef = useRef( focusOnMount );

	/**
	 * Sets focus on a DOM element.
	 *
	 * @param {HTMLElement} target The DOM element to set focus to.
	 * @return {void}
	 */
	const setFocus = ( target ) => {
		target.focus( {
			// When focusing newly mounted dialogs,
			// the position of the popover is often not right on the first render
			// This prevents the layout shifts when focusing the dialogs.
			preventScroll: true,
		} );
	};

	/** @type {import('react').MutableRefObject<ReturnType<setTimeout> | undefined>} */
	const timerId = useRef();

	useEffect( () => {
		focusOnMountRef.current = focusOnMount;
	}, [ focusOnMount ] );

	useEffect( () => {
		return () => {
			if ( timerId.current ) {
				clearTimeout( timerId.current );
			}
		};
	}, [] );

	return useCallback( ( node ) => {
		if ( ! node || focusOnMountRef.current === false ) {
			return;
		}

		if ( node.contains( node.ownerDocument?.activeElement ?? null ) ) {
			return;
		}

		if ( focusOnMountRef.current === 'firstElement' ) {
			timerId.current = setTimeout( () => {
				const firstTabbable = /** @type {HTMLElement|undefined} */ (
					focus.tabbable.find( node )[ 0 ] ??
						( refFallback?.current &&
							focus.tabbable.find( refFallback.current )[ 0 ] )
				);

				if ( firstTabbable ) setFocus( firstTabbable );
			}, 0 );

			return;
		}

		setFocus( node );
	}, [] );
	// Omission of refFallback is intentional as it’s meant to be a ref. In case
	// a consumer passes an unstable value leaving it out of dependencies will
	// avoid unnecessary renders/callbacks.
}
