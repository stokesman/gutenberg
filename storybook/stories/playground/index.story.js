/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
// Disable reason: these are WordPress dependencies but the lint rule thinks they’re external.
// eslint-disable-next-line @wordpress/dependency-group
import componentsStyles from '!!raw-loader!@wordpress/components/build-style/style.css';
import blockEditorContentStyles from '!!raw-loader!@wordpress/block-editor/build-style/content.css';
import blocksStyles from '!!raw-loader!@wordpress/block-library/build-style/style.css';
import blocksEditorStyles from '!!raw-loader!@wordpress/block-library/build-style/editor.css';

/**
 * Internal dependencies
 */
import EditorFullPage from './fullpage';
import EditorBox from './box';
import EditorWithUndoRedo from './with-undo-redo';
import EditorZoomOut from './zoom-out';
import { editorStyles } from './editor-styles';

//Base styles for the content within the block canvas iframe.
const contentStyles = [
	{ css: componentsStyles },
	{ css: blockEditorContentStyles },
	{ css: blocksStyles },
	{ css: blocksEditorStyles },
	...editorStyles,
];

registerCoreBlocks();

export default {
	title: 'Playground/Block Editor',
	parameters: {
		sourceLink: 'storybook/stories/playground',
	},
};

const render = ( Editor, className, args ) => {
	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={ className }
			onKeyDown={ ( event ) => event.stopPropagation() }
		>
			<Editor contentStyles={ contentStyles } { ...args } />
		</div>
	);
};

export const Default = {
	render: render.bind( null, EditorFullPage, 'playground' ),
	parameters: {
		sourceLink: 'storybook/stories/playground/fullpage/index.js',
	},
};

export const Box = {
	render: render.bind( null, EditorBox, 'editor-box' ),
	parameters: {
		sourceLink: 'storybook/stories/playground/box/index.js',
	},
};

export const UndoRedo = {
	render: render.bind( null, EditorWithUndoRedo, 'editor-with-undo-redo' ),
	parameters: {
		sourceLink: 'storybook/stories/playground/with-undo-redo/index.js',
	},
};

export const ZoomOut = {
	render: render.bind( null, EditorZoomOut, 'editor-zoom-out' ),
	parameters: {
		sourceLink: 'storybook/stories/playground/zoom-out/index.js',
	},
	argTypes: {
		zoomLevel: { control: { type: 'range', min: 10, max: 100, step: 5 } },
	},
};
