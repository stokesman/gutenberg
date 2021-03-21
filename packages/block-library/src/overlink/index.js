/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { overlink as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Overlink', 'block title' ),
	description: __( 'Create a link that overlays its containing block.' ),
	icon,
	keywords: [ __( 'link' ) ],
	example: {
		attributes: {
			text: __( 'Call to Action' ),
		},
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
