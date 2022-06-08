/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { appendSelectors } from './utils';

export default {
	name: 'inline',
	label: __( 'Lineup' ),
	inspectorControls: function InlineLayoutInspectorControls() {
		return null;
	},
	toolBarControls: function DefaultLayoutToolbarControls() {
		return null;
	},
	save: function DefaultLayoutStyle( { selector } ) {
		return (
			<style>{ `
				${ appendSelectors( selector, '> *' ) } {
					display: inline;
				}
			` }</style>
		);
	},
	getOrientation() {
		return 'horizontal';
	},
	getAlignments() {
		return [];
	},
};
