/**
 * External dependencies
 */
import type { FocusEvent, FocusEventHandler, MutableRefObject } from 'react';

type Handlers = {
	onBlur?: FocusEventHandler;
	onFocus?: FocusEventHandler;
};

/**
 * Allows handling focus events within a tree with multiple focusable children
 * as as single focusable entity.
 *
 * @param  handlers         Handlers for focus and blur events.
 * @param  handlers.onFocus Focus event handler.
 * @param  handlers.onBlur  Blur event handler.
 * @param  ref              Element that contains all focusable children.
 */
export function useCompositeFocus(
	{ onBlur: blurHandler, onFocus: focusHandler }: Handlers,
	ref: MutableRefObject< HTMLElement | null >
): Handlers {
	return {
		onBlur: blurHandler ? makeHandler( ref, blurHandler ) : blurHandler,
		onFocus: focusHandler ? makeHandler( ref, focusHandler ) : focusHandler,
	};
}

const makeHandler = (
	ref: MutableRefObject< HTMLElement | null >,
	handler: FocusEventHandler
) => ( event: FocusEvent ) => {
	if ( ! ref.current?.contains( event.relatedTarget ) ) {
		handler?.( event );
	}
};
