/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import {
	BlockCanvas,
	BlockEditorProvider,
	BlockInspector,
} from '@wordpress/block-editor';
import '@wordpress/format-library';

/**
 * Internal dependencies
 */
import styles from './style.lazy.scss';

export default function EditorFullPage( { contentStyles } ) {
	const [ blocks, updateBlocks ] = useState( [] );

	// Ensures that the CSS intended for the playground (especially the style resets)
	// are only loaded for the playground and don't leak into other stories.
	useEffect( () => {
		styles.use();

		return styles.unuse;
	} );

	return (
		<BlockEditorProvider
			value={ blocks }
			onInput={ updateBlocks }
			onChange={ updateBlocks }
		>
			<div className="playground__sidebar">
				<BlockInspector />
			</div>
			<div className="playground__content">
				<BlockCanvas height="100%" styles={ contentStyles } />
			</div>
		</BlockEditorProvider>
	);
}
