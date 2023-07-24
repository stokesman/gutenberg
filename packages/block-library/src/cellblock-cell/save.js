/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function SaveCell() {
	const { className, ...blockProps } = useBlockProps.save();
	return <td { ...useInnerBlocksProps.save( blockProps ) } />;
}
