/**
 * WordPress dependencies
 */
import { useRef, useEffect, useCallback } from '@wordpress/element';
import { focus } from '@wordpress/dom';

/** @typedef {(tabbables: HTMLElement[]) => HTMLElement | undefined} FocusOnMountCallback */
/** @typedef {boolean | 'firstElement' | FocusOnMountCallback} FocusOnMount */

/**
 * Hook used to focus the first tabbable element on mount.
 *
 * @param {FocusOnMount} focusOnMount Determines if focus is moved and to where. Defaults to `"firstElement"` and
 *                                    focuses the first tabbable element within. If `true`, focuses the element the
 *                                    ref is attached to. If `false`, does nothing. If a function, focuses the element
 *                                    returned by the function.
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
export default function useFocusOnMount( focusOnMount = 'firstElement' ) {
	/** @type {import('react').MutableRefObject<typeof focusOnMount>} */
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
		const currentFocusOnMount = focusOnMountRef.current;
		if ( ! node || currentFocusOnMount === false ) {
			return;
		}

		if ( node.contains( node.ownerDocument?.activeElement ?? null ) ) {
			return;
		}

		if ( currentFocusOnMount === true ) {
			return setFocus( node );
		}

		timerId.current = setTimeout( () => {
			const tabbables = /** @type {HTMLElement[]} */ (
				focus.tabbable.find( node )
			);
			const candidate =
				currentFocusOnMount === 'firstElement'
					? tabbables[ 0 ]
					: currentFocusOnMount( tabbables );

			if ( candidate ) setFocus( candidate );
		}, 0 );
	}, [] );
}
