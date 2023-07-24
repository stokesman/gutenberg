/**
 * WordPress dependencies
 */
import { table } from '@wordpress/icons';
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
			icon: table,
			edit,
			save,
			example: {
				innerBlocks: [
					{
						name: 'core/cellblock-cell',
						attributes: {},
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: {
									content: 'Sample paragraph content…',
								},
							},
						],
					},
					{
						name: 'core/cellblock-cell',
						attributes: {},
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: {
									content: 'Sample paragraph content…',
								},
							},
						],
					},
				],
			},
		},
	} );
