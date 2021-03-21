/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { href, linkTarget, rel, text, textAlign } = attributes;

	if ( ! text || ! href ) {
		return null;
	}

	const className = classnames( {
		[ `has-text-align-${ textAlign }` ]: textAlign,
	} );

	return (
		<div { ...useBlockProps.save( { className } ) }>
			<RichText.Content
				href={ href }
				rel={ rel }
				tagName="a"
				target={ linkTarget }
				value={ text }
			/>
		</div>
	);
}
