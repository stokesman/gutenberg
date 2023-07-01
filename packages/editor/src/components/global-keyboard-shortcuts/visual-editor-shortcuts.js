/**
 * WordPress dependencies
 */
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SaveShortcut from './save-shortcut';
import { store as editorStore } from '../../store';

const isEventTargetStateless = ( { target } ) =>
	! target.matches(
		'textarea, input:is([type=text],[type=tel],[type=search],[type=number],[type=email])'
	);

function VisualEditorGlobalKeyboardShortcuts() {
	const { redo, undo } = useDispatch( editorStore );

	useShortcut( 'core/editor/undo', ( event ) => {
		if ( isEventTargetStateless( event ) ) {
			undo();
			event.preventDefault();
		}
	} );

	useShortcut( 'core/editor/redo', ( event ) => {
		if ( isEventTargetStateless( event ) ) {
			redo();
			event.preventDefault();
		}
	} );

	return <SaveShortcut />;
}

export default VisualEditorGlobalKeyboardShortcuts;
