const LIVE_REGION_ARIA_ROLES = new Set( [
	'alert',
	'status',
	'log',
	'marquee',
	'timer',
] );

let hiddenElements: Element[] = [],
	isHidden = false;

/**
 * Hides all elements in the body element from screen-readers except
 * the provided element and elements that should not be hidden from
 * screen-readers.
 *
 * The reason we do this is because `aria-modal="true"` currently is bugged
 * in Safari, and support is spotty in other browsers overall. In the future
 * we should consider removing these helper functions in favor of
 * `aria-modal="true"`.
 *
 * @param {HTMLDivElement} unhiddenElement The element that should not be hidden.
 */
export function hideApp( unhiddenElement?: HTMLDivElement ) {
	if ( isHidden ) {
		return;
	}
	const elements = Array.from( document.body.children );
	elements.forEach( ( element ) => {
		if ( element === unhiddenElement ) {
			return;
		}
		if ( elementShouldBeHidden( element ) ) {
			element.setAttribute( 'inert', '' );
			hiddenElements.push( element );
		}
	} );
	isHidden = true;
}

/**
 * Determines if the passed element should not be hidden from screen readers.
 *
 * @param {HTMLElement} element The element that should be checked.
 *
 * @return {boolean} Whether the element should not be hidden from screen-readers.
 */
export function elementShouldBeHidden( element: Element ) {
	const role = element.getAttribute( 'role' );
	return ! (
		element.tagName === 'SCRIPT' ||
		element.hasAttribute( 'inert' ) ||
		element.hasAttribute( 'aria-live' ) ||
		( role && LIVE_REGION_ARIA_ROLES.has( role ) )
	);
}

/**
 * Makes all elements in the body that have been hidden by `hideApp`
 * visible again to screen-readers.
 */
export function showApp() {
	if ( ! isHidden ) {
		return;
	}
	hiddenElements.forEach( ( element ) => {
		element.removeAttribute( 'inert' );
	} );
	hiddenElements = [];
	isHidden = false;

	// Hacks around a Chromium bug where it fails to restore a region to the
	// accesibility tree after an ancestor had the `inert` attribute removed.
	// The bug seems like a varaation of this: https://crbug.com/1354313
	// This workaround doesn't have to be a custom property. It also seems to
	// not have to be done each time `showApp` is invoked but it's inexpensive
	// and ensures some other code didn't remove it.
	document
		.querySelectorAll< HTMLElement >( '[role=region]' )
		.forEach( ( region ) => region.style.setProperty( '--∞', '8' ) );
}
