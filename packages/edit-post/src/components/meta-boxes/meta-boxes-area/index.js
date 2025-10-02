/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

/**
 * Render metabox area.
 *
 * @param {Object} props          Component props.
 * @param {string} props.location metabox location.
 * @return {Component} The component to be rendered.
 */
function MetaBoxesArea( { location } ) {
	const container = useRef( null );

	useEffect( () => {
		const form = document.querySelector( '.metabox-location-' + location );
		if ( form ) {
			console.log('porting meta box area', location)
			container.current.appendChild( form );
			return () => {
				console.log('returning meta box area', location)
				document.querySelector( '#metaboxes' ).appendChild( form );
			};
		}
	}, [ location ] );

	const isSaving = useSelect( ( select ) => {
		return select( editPostStore ).isSavingMetaBoxes();
	}, [] );

	const classes = clsx( 'edit-post-meta-boxes-area', `is-${ location }`, {
		'is-loading': isSaving,
	} );

	return (
		<div className={ classes }>
			{ isSaving && <Spinner /> }
			<div
				className="edit-post-meta-boxes-area__container"
				ref={ container }
			/>
			<div className="edit-post-meta-boxes-area__clear" />
		</div>
	);
}

export default MetaBoxesArea;
