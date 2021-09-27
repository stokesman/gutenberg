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

// TODO seems that htmlArrowStyles and defaultArrowStyles should be combined
const htmlArrowStyles = ( { hideHTMLArrows } ) => {
	if ( ! hideHTMLArrows ) return ``;

	return css`
		input[type='number']::-webkit-outer-spin-button,
		input[type='number']::-webkit-inner-spin-button {
			-webkit-appearance: none !important;
			margin: 0 !important;
		}

		input[type='number'] {
			-moz-appearance: textfield;
		}
	`;
};

const dragStyles = ( { isDragging, dragCursor } ) => {
	let defaultArrowStyles;
	let activeDragCursorStyles;

	if ( isDragging ) {
		defaultArrowStyles = css`
			cursor: ${ dragCursor };
			user-select: none;

			input[type='number']::-webkit-outer-spin-button,
			input[type='number']::-webkit-inner-spin-button {
				-webkit-appearance: none !important;
				margin: 0 !important;
			}
		`;
	}

	if ( isDragging && dragCursor ) {
		activeDragCursorStyles = css`
			input[type='number']:active {
				cursor: ${ dragCursor };
			}
		`;
	}

	return css`
		${ defaultArrowStyles }
		${ activeDragCursorStyles }
	`;
};

export const NumberControlElement = styled( InputControlElement )`
	${ dragStyles }
	${ htmlArrowStyles };
`;
