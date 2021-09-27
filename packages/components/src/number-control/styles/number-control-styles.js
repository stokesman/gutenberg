// @ts-nocheck
/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import { InputControlElement } from '../../input-control';

const styleHiddenHTMLArrows = css`
	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none !important;
		margin: 0 !important;
	}

	input[type='number'] {
		-moz-appearance: textfield;
	}
`;

const htmlArrowStyles = ( { hideHTMLArrows } ) =>
	hideHTMLArrows ? styleHiddenHTMLArrows : '';

const dragStyles = ( { isDragging, dragCursor, hideHTMLArrows } ) => {
	let activeDragArrowStyles;
	let activeDragCursorStyles;

	// While dragging, hide spin arrows if not hidden by hideHTMLArrows prop.
	if ( ! hideHTMLArrows && isDragging ) {
		activeDragArrowStyles = styleHiddenHTMLArrows;
	}

	// While dragging, if a drag cursor is specified style the cursor to it.
	if ( isDragging && dragCursor ) {
		activeDragCursorStyles = css`
			input[type='number']:active {
				cursor: ${ dragCursor };
				user-select: none;
			}
		`;
	}

	return css`
		${ activeDragArrowStyles }
		${ activeDragCursorStyles }
	`;
};

export const NumberControlElement = styled( InputControlElement )`
	${ dragStyles }
	${ htmlArrowStyles };
`;
