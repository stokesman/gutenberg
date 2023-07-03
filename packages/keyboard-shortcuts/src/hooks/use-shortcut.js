/**
 * WordPress dependencies
 */
import { useContext, useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useShortcutEventMatch from './use-shortcut-event-match';
import { context } from '../context';
import { store } from '../store';

/**
 * Attach a keyboard shortcut handler.
 *
 * @param {string}   name               Shortcut name.
 * @param {Function} callback           Shortcut callback.
 * @param {Object}   options            Shortcut options.
 * @param {boolean}  options.isDisabled Whether to disable to shortut.
 */
export default function useShortcut( name, callback, { isDisabled } = {} ) {
	const shortcuts = useContext( context );
	const isMatch = useShortcutEventMatch();
	const callbackRef = useRef();
	callbackRef.current = callback;

	const isSuppressed = useSelect(
		( select ) => {
			for ( const stub of select( store ).getSuppressions() )
				if ( name.startsWith( stub ) ) return true;

			return false;
		},
		[ name ]
	);

	useEffect( () => {
		if ( isDisabled || isSuppressed ) {
			return;
		}

		function _callback( event ) {
			if ( isMatch( name, event ) ) {
				callbackRef.current( event );
			}
		}

		shortcuts.current.add( _callback );
		return () => {
			shortcuts.current.delete( _callback );
		};
	}, [ name, isDisabled, isSuppressed ] );
}
