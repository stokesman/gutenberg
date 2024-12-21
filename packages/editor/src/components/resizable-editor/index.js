/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ResizeHandle from './resize-handle';
import { unlock } from '../../lock-unlock';

/** @type {import('../../../../components/src/resizable-box/hook.ts').default} */
const useResizableBox = unlock( componentsPrivateApis ).useResizableBox;

function ResizableEditor( { className, enableResizing, height, children } ) {
	const [ setResizable, bindResizeHandle ] = useResizableBox( {
		specializer: ( { from: [ fromWidth ], difference: [ xDiff ] } ) => {
			// The movement is doubled before adding it to the width to maintain
			// the resize handles’ position relative to the pointer.
			return { size: [ xDiff * 2 + fromWidth ] };
		},
	} );
	return (
		<div
			className={ clsx( 'editor-resizable-editor', className, {
				'is-resizable': enableResizing,
			} ) }
			ref={ setResizable }
			style={ {
				width: '100%',
				height: enableResizing && height ? height : '100%',
				minWidth: 300,
				maxWidth: '100%',
				maxHeight: '100%',
			} }
		>
			<ResizeHandle side="start" binder={ bindResizeHandle } />
			{ children }
			<ResizeHandle side="end" binder={ bindResizeHandle } />
		</div>
	);
}

export default ResizableEditor;
