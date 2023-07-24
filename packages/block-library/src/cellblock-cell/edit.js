/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

const allowedBlocks = [
	'core/paragraph',
	'core/list',
	'core/image',
	'core/buttons',
	'core/code',
	'core/verse',
];

export default function EditCell() {
	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		allowedBlocks,
	} );
	return <td { ...innerBlocksProps } />;
}
