/**
 * WordPress dependencies
 */
import { useStateWithHistory } from '@wordpress/compose';
import {
	BlockEditorProvider,
	BlockCanvas,
	BlockToolbar,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { undo as undoIcon, redo as redoIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './style.css';

export default function EditorWithUndoRedo( { contentStyles } ) {
	const { value, setValue, hasUndo, hasRedo, undo, redo } =
		useStateWithHistory( { blocks: [] } );

	return (
		<BlockEditorProvider
			value={ value.blocks }
			selection={ value.selection }
			onInput={ ( blocks, { selection } ) =>
				setValue( { blocks, selection }, true )
			}
			onChange={ ( blocks, { selection } ) =>
				setValue( { blocks, selection }, false )
			}
			settings={ {
				hasFixedToolbar: true,
			} }
		>
			<div className="editor-with-undo-redo__toolbar">
				<Button
					onClick={ undo }
					disabled={ ! hasUndo }
					accessibleWhenDisabled
					icon={ undoIcon }
					label="Undo"
					size="compact"
				/>
				<Button
					onClick={ redo }
					disabled={ ! hasRedo }
					accessibleWhenDisabled
					icon={ redoIcon }
					label="Redo"
					size="compact"
				/>
				<BlockToolbar hideDragHandle />
			</div>
			<BlockCanvas height="100%" styles={ contentStyles } />
		</BlockEditorProvider>
	);
}
