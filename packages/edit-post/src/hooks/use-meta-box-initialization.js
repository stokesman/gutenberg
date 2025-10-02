/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { createRoot, forwardRef, useEffect } from '@wordpress/element';
import { arrowUp, chevronUp } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../store';

/**
 * Initializes WordPress `postboxes` script and the logic for saving meta boxes.
 *
 * @param { boolean } enabled
 */
export const useMetaBoxInitialization = ( enabled ) => {
	const isEnabledAndEditorReady = useSelect(
		( select ) =>
			enabled && select( editorStore ).__unstableIsEditorReady(),
		[ enabled ]
	);
	const { initializeMetaBoxes } = useDispatch( editPostStore );
	// The effect has to rerun when the editor is ready because initializeMetaBoxes
	// will noop until then.
	useEffect( () => {
		if ( isEnabledAndEditorReady ) {
			initializeMetaBoxes();
		}
	}, [ isEnabledAndEditorReady, initializeMetaBoxes ] );
	// Replaces the meta box header button icons to match the Gutenberg ones.
	useEffect( () => {
		const metaboxes = document.getElementById( 'metaboxes' );
		// Bails if the effect has ran already (applicable only in development due to StrictMode).
		if ( metaboxes.hasAttribute( 'data-edit-post-icons-replaced' ) ) {
			return;
		}
		metaboxes.setAttribute( 'data-edit-post-icons-replaced', '' );
		const dummy = document.createElement( 'u' );
		const root = createRoot( dummy );
		root.render(
			<Icons
				ref={ ( {
					firstElementChild: arrowUpIcon,
					lastElementChild: chevronUpIcon,
				} ) => {
					const replaceMap = [
						[
							arrowUpIcon,
							document.querySelectorAll(
								'#poststuff :is(.order-higher-indicator, .order-lower-indicator)'
							),
						],
						[
							chevronUpIcon,
							document.querySelectorAll(
								'#poststuff .toggle-indicator'
							),
						],
					];
					for ( const [ icon, targetList ] of replaceMap ) {
						for ( const target of targetList ) {
							const clone = icon.cloneNode( true );
							clone.setAttribute( 'class', target.className );
							target.replaceWith( clone );
						}
					}
				} }
			/>
		);
	}, [] );
};

const Icons = forwardRef( ( _props, ref ) => {
	return (
		<u ref={ ref }>
			<Icon icon={ arrowUp } />
			<Icon icon={ chevronUp } />
		</u>
	);
} );
