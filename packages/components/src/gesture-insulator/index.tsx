/**
 * External dependencies
 */
import styled from '@emotion/styled';
import type { CSSProperties } from 'react';

/**
 * WordPress dependencies
 */
import { createPortal } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';

type GestureInsulatorProps = {
	/** Control the presence. */
	isPresent?: boolean;
	/** CSS cursor to be displayed. */
	cursor: CSSProperties[ 'cursor' ];
	/** Element into which the component renders. Defaults to document body. */
	root?: HTMLElement;
};

const Overlay = styled.div`
	// z-index used by Draggable component. Should be above everything.
	z-index: 1000000000;
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
`;

/**
 * Overlays an element over the entire page. This is useful for interactions
 * such as drags where text selections are to be avoided and the cursor is to
 * be maintained no matter what elements it is over.
 */
// Note to maintainers: In Chromium and Gecko based browsers pointer capturing
// avoids creating text seletions and maintains the cursor style of the element
// set to capture. WebKit-based browsers do neither. It seems likely that WebKit
// will someday do as the others and at that point any gesture utilizing pointer
// capture could do without this component.
export function GestureInsulator( {
	cursor,
	isPresent,
	root,
}: GestureInsulatorProps ) {
	const isExiting = usePrevious( isPresent ) && ! isPresent;
	const style: CSSProperties = { cursor };
	if ( isExiting ) style.display = 'none';
	return isPresent || isExiting
		? createPortal( <Overlay style={ style } />, root ?? document.body )
		: null;
}
