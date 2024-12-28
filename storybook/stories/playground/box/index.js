/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	BlockEditorProvider,
	BlockCanvas,
	BlockToolbar,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import './style.css';

export default function EditorBox( { contentStyles } ) {
	const [ blocks, updateBlocks ] = useState( [] );
	return (
		<BlockEditorProvider
			value={ blocks }
			onInput={ updateBlocks }
			onChange={ updateBlocks }
			settings={ {
				hasFixedToolbar: true,
			} }
		>
			<BlockToolbar hideDragHandle />
			<BlockCanvas height="500px" styles={ contentStyles } />
		</BlockEditorProvider>
	);
}
