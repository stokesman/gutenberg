/**
 * External dependencies
 */
import type {
	FocusEventHandler,
	FocusEvent as ReactFocusEvent,
	PointerEventHandler,
	RefCallback,
} from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRefEffect from '../use-ref-effect';

/**
 * Input types which are classified as button types, for use in considering
 * whether element is a (focus-normalized) button.
 */
const INPUT_BUTTON_TYPES = [ 'button', 'submit' ];

/**
 * List of HTML button elements subject to focus normalization
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
 */
type FocusNormalizedButton =
	| HTMLButtonElement
	| HTMLLinkElement
	| HTMLInputElement;

/**
 * Returns true if the given element is a button element subject to focus
 * normalization, or false otherwise.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
 *
 * @param eventTarget The target from a mouse or touch event.
 *
 * @return Whether the element is a button element subject to focus normalization.
 */
function isFocusNormalizedButton(
	eventTarget: EventTarget
): eventTarget is FocusNormalizedButton {
	if ( ! ( eventTarget instanceof window.HTMLElement ) ) {
		return false;
	}
	switch ( eventTarget.nodeName ) {
		case 'A':
		case 'BUTTON':
			return true;

		case 'INPUT':
			return INPUT_BUTTON_TYPES.includes(
				( eventTarget as HTMLInputElement ).type
			);
	}

	return false;
}

type UseFocusOutsideReturn = {
	onFocus: FocusEventHandler;
	onPointerDown: PointerEventHandler;
	onPointerUp: PointerEventHandler;
	onBlur: FocusEventHandler;
	ref: RefCallback< Element >;
};

/**
 * A react hook that can be used to check whether focus has moved outside the
 * element the event handlers are bound to.
 *
 * @param onFocusOutside A callback triggered when focus moves outside
 *                       the element the event handlers are bound to.
 *
 * @return An object containing event handlers. Bind the event handlers to a
 * wrapping element element to capture when focus moves outside that element.
 */
export default function useFocusOutside(
	onFocusOutside: ( event: FocusEvent | ReactFocusEvent ) => void
): UseFocusOutsideReturn {
	const currentOnFocusOutside = useRef( onFocusOutside );
	useEffect( () => {
		currentOnFocusOutside.current = onFocusOutside;
	}, [ onFocusOutside ] );

	const preventBlurCheck = useRef( false );

	const ref = useRef< Element >();
	const setRef = useRefEffect< Element >( ( node ) => {
		ref.current = node;
		const { defaultView } = node.ownerDocument;
		if ( ! defaultView ) return;

		const doc = node.ownerDocument;
		const subviewList = node.getElementsByTagName( 'iframe' );
		let hadFocusOnBlur = false;
		const onWindowBlur = () => {
			console.log( 'on window blur' );
			if ( doc.activeElement instanceof HTMLIFrameElement )
				hadFocusOnBlur = Array.from( subviewList ).includes(
					doc.activeElement
				);
		};
		const onWindowFocus = ( event: FocusEvent ) => {
			console.log( 'focus window' );
			if ( hadFocusOnBlur )
				setTimeout( () => {
					if ( ! node.contains( doc.activeElement ) )
						currentOnFocusOutside.current( event );
				} );
		};

		defaultView.addEventListener( 'blur', onWindowBlur );
		defaultView.addEventListener( 'focus', onWindowFocus );
		return () => {
			defaultView.removeEventListener( 'blur', onWindowBlur );
			defaultView.removeEventListener( 'focus', onWindowFocus );
		};
	}, [] );

	const blurCheckTimeoutId = useRef< number | undefined >();

	/**
	 * Cancel a blur check timeout.
	 */
	const cancelBlurCheck = useCallback( () => {
		clearTimeout( blurCheckTimeoutId.current );
	}, [] );

	// Cancel blur checks on unmount.
	useEffect( () => {
		return () => cancelBlurCheck();
	}, [] );

	// Cancel a blur check if the callback or ref is no longer provided.
	useEffect( () => {
		if ( ! onFocusOutside ) {
			cancelBlurCheck();
		}
	}, [ onFocusOutside, cancelBlurCheck ] );

	/**
	 * Handles a mousedown or mouseup event to respectively assign and
	 * unassign a flag for preventing blur check on button elements. Some
	 * browsers, namely Firefox and Safari, do not emit a focus event on
	 * button elements when clicked, while others do. The logic here
	 * intends to normalize this as treating click on buttons as focus.
	 *
	 * @param event
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
	 */
	const normalizeButtonFocus: PointerEventHandler = useCallback(
		( event ) => {
			const { type, target } = event;
			const isInteractionEnd = type === 'pointerup';

			if ( isInteractionEnd ) {
				preventBlurCheck.current = false;
			} else if ( isFocusNormalizedButton( target ) ) {
				preventBlurCheck.current = true;
			}
		},
		[]
	);

	/**
	 * A callback triggered when a blur event occurs on the element the handler
	 * is bound to.
	 *
	 * Calls the `onFocusOutside` callback in an immediate timeout if focus has
	 * move outside the bound element and is still within the document.
	 */
	const queueBlurCheck: FocusEventHandler = useCallback( ( event ) => {
		// Skip blur check if clicking button. See `normalizeButtonFocus`.
		if ( preventBlurCheck.current ) {
			return;
		}

		// The usage of this attribute should be avoided. The only use case
		// would be when we load modals that are not React components and
		// therefore don't exist in the React tree. An example is opening
		// the Media Library modal from another dialog.
		// This attribute should contain a selector of the related target
		// we want to ignore, because we still need to trigger the blur event
		// on all other cases.
		const ignoreForRelatedTarget = event.target.getAttribute(
			'data-unstable-ignore-focus-outside-for-relatedtarget'
		);
		if (
			ignoreForRelatedTarget &&
			event.relatedTarget?.closest( ignoreForRelatedTarget )
		) {
			return;
		}

		const doc = event.target.ownerDocument;
		blurCheckTimeoutId.current = setTimeout( () => {
			console.log( 'blur check ', {
				docNotFocused: ! doc.hasFocus(),
				activeContained: ref.current?.contains( doc.activeElement ),
			} );
			// Bails if document is not focused or if active element is contained.
			if (
				! doc.hasFocus() ||
				ref.current?.contains( doc.activeElement )
			) {
				return;
			}

			if ( 'function' === typeof currentOnFocusOutside.current ) {
				currentOnFocusOutside.current( event );
			}
		}, 0 );
	}, [] );

	return {
		onFocus: cancelBlurCheck,
		onPointerDown: normalizeButtonFocus,
		onPointerUp: normalizeButtonFocus,
		onBlur: queueBlurCheck,
		ref: setRef,
	};
}
