/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store } from '../store';

/**
 * Suppresses keyboard shortcut handlers.
 *
 * @param {string}  nameOrStub Name of shortcut or its namespace to suppress all shortcuts in the namespace.
 * @param {boolean} predicate  Whether to suppress or not.
 *
 * @example
 *
 * ```js
 * useSuppression( 'core/editor', isModalActive );`
 * ```
 */
export default function useSuppression( nameOrStub, predicate ) {
	const { addSuppression, removeSuppression } = useDispatch( store );
	useEffect( () => {
		if ( predicate ) {
			addSuppression( nameOrStub );
			return () => removeSuppression( nameOrStub );
		}
	}, [ nameOrStub, predicate, addSuppression, removeSuppression ] );
}
