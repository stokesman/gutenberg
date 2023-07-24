/**
 * WordPress dependencies
 */
import { blockDefault } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import blockDef from './block.json';

const { name, ...metadata } = blockDef;

export const init = () =>
	initBlock( {
		name,
		metadata,
		settings: {
			icon: blockDefault,
			edit,
			save,
			example: {
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Sample paragraph content…' },
					},
				],
			},
		},
	} );
