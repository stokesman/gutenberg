/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { Button, Fill } from '@wordpress/components';
import {
	__experimentalUseDialog as useDialog,
	useMergeRefs,
} from '@wordpress/compose';
import { closeSmall } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import Control from './control';
import { useBudgeTopBy } from './utils';

export default function Form( {
	title,
	isVisible,
	id,
	idBase,
	instance,
	isWide,
	onChangeInstance,
	onChangeHasPreview,
	onClose,
} ) {
	const ref = useRef();

	// We only want to remount the control when the instance changes
	// *externally*. For example, if the user performs an undo. To do this, we
	// keep track of changes made to instance by the control itself and then
	// ignore those.
	const outgoingInstances = useRef( new Set() );
	const incomingInstances = useRef( new Set() );

	const { createNotice } = useDispatch( noticesStore );

	useEffect( () => {
		if ( incomingInstances.current.has( instance ) ) {
			incomingInstances.current.delete( instance );
			return;
		}

		const control = new Control( {
			id,
			idBase,
			instance,
			onChangeInstance( nextInstance ) {
				outgoingInstances.current.add( instance );
				incomingInstances.current.add( nextInstance );
				onChangeInstance( nextInstance );
			},
			onChangeHasPreview,
			onError( error ) {
				createNotice(
					'error',
					error?.message ??
						__(
							'An error occured while fetching or updating the widget.'
						)
				);
			},
		} );

		ref.current.appendChild( control.element );

		return () => {
			if ( outgoingInstances.current.has( instance ) ) {
				outgoingInstances.current.delete( instance );
				return;
			}

			control.destroy();
		};
	}, [ id, idBase, instance, onChangeInstance, onChangeHasPreview, isWide ] );

	const formCore = (
		<>
			<header className="wp-block-legacy-widget__edit-form-header">
				<h3 className="wp-block-legacy-widget__edit-form-title">
					{ title }
				</h3>
				{ isWide && (
					<Button
						icon={ closeSmall }
						label={ __( 'Close dialog' ) }
						onClick={ onClose }
					/>
				) }
			</header>
			<div
				className="wp-block-legacy-widget__edit-form-body"
				ref={ ref }
			/>
		</>
	);

	if ( isWide ) {
		return (
			<WideFormDialog isVisible={ isVisible }>
				{ formCore }
			</WideFormDialog>
		);
	}

	return (
		<div
			className="wp-block-legacy-widget__edit-form"
			hidden={ ! isVisible }
		>
			{ formCore }
		</div>
	);
}

function WideFormDialog( { isVisible, children } ) {
	const containerRef = useRef();
	const [ dialogRef, dialogProps ] = useDialog( { focusOnMount: false } );
	const {
		ref: budgeRef,
		resizeObserver,
	} = useBudgeTopBy( containerRef.current, { isEnabled: isVisible } );
	return (
		<div
			ref={ containerRef }
			className={ classnames( 'wp-block-legacy-widget__container', {
				'is-visible': isVisible,
			} ) }
		>
			<Fill name="Popover">
				<div
					className="wp-block-legacy-widget__edit-form is-wide"
					ref={ useMergeRefs( [ dialogRef, budgeRef ] ) }
					{ ...dialogProps }
					hidden={ ! isVisible }
				>
					{ resizeObserver }
					{ children }
				</div>
			</Fill>
		</div>
	);
}
