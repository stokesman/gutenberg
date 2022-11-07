/**
 * External dependencies
 */
import classnames from 'classnames';
import type { ForwardedRef, KeyboardEvent } from 'react';

/**
 * WordPress dependencies
 */
import {
	createPortal,
	useEffect,
	useRef,
	forwardRef,
} from '@wordpress/element';
import {
	useInstanceId,
	useFocusReturn,
	useFocusOnMount,
	__experimentalUseFocusOutside as useFocusOutside,
	useConstrainedTabbing,
	useMergeRefs,
	useRefEffect,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import * as ariaHelper from './aria-helper';
import Button from '../button';
import StyleProvider from '../style-provider';
import type { ModalProps } from './types';

// Used to count the number of open modals.
let openModalCount = 0;

function UnforwardedModal(
	props: ModalProps,
	forwardedRef: ForwardedRef< HTMLDivElement >
) {
	const {
		bodyOpenClassName = 'modal-open',
		role = 'dialog',
		title = null,
		focusOnMount = true,
		shouldCloseOnEsc = true,
		shouldCloseOnClickOutside = true,
		isDismissible = true,
		/* Accessibility. */
		aria = {
			labelledby: undefined,
			describedby: undefined,
		},
		onRequestClose,
		icon,
		closeButtonLabel,
		children,
		style,
		overlayClassName,
		className,
		contentLabel,
		onKeyDown,
		isFullScreen = false,
		__experimentalHideHeader = false,
	} = props;

	const ref = useRef< HTMLDivElement >();
	const instanceId = useInstanceId( Modal );
	const headingId = title
		? `components-modal-header-${ instanceId }`
		: aria.labelledby;
	const focusOnMountRef = useFocusOnMount( focusOnMount );
	const constrainedTabbingRef = useConstrainedTabbing();
	const focusReturnRef = useFocusReturn();
	const focusOutsideProps = useFocusOutside( onRequestClose );

	useEffect( () => {
		openModalCount++;

		if ( openModalCount === 1 ) {
			ariaHelper.hideApp( ref.current );
			document.body.classList.add( bodyOpenClassName );
		}

		return () => {
			openModalCount--;

			if ( openModalCount === 0 ) {
				document.body.classList.remove( bodyOpenClassName );
				ariaHelper.showApp();
			}
		};
	}, [ bodyOpenClassName ] );

	// Toggles class to denote whether the content element has scrolled.
	const refContentObserver = useRefEffect< HTMLDivElement >( ( node ) => {
		const doc = node.ownerDocument;
		const topMarker = doc.createElement( 'div' );
		node.prepend( topMarker );
		const observer = new IntersectionObserver(
			( [ { isIntersecting: isAtTop } ] ) =>
				node.classList.toggle( 'has-scrolled-content', ! isAtTop ),
			{ root: node }
		);
		observer.observe( topMarker );
		return () => observer.disconnect();
	}, [] );

	function handleEscapeKeyDown( event: KeyboardEvent< HTMLDivElement > ) {
		if (
			shouldCloseOnEsc &&
			event.code === 'Escape' &&
			! event.defaultPrevented
		) {
			event.preventDefault();
			if ( onRequestClose ) {
				onRequestClose( event );
			}
		}
	}

	return createPortal(
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			ref={ useMergeRefs( [ ref, forwardedRef ] ) }
			className={ classnames(
				'components-modal__screen-overlay',
				overlayClassName
			) }
			onKeyDown={ handleEscapeKeyDown }
		>
			<StyleProvider document={ document }>
				<div
					className={ classnames(
						'components-modal__frame',
						className,
						{
							'is-full-screen': isFullScreen,
						}
					) }
					style={ style }
					ref={ useMergeRefs( [
						constrainedTabbingRef,
						focusReturnRef,
						focusOnMountRef,
					] ) }
					role={ role }
					aria-label={ contentLabel }
					aria-labelledby={ contentLabel ? undefined : headingId }
					aria-describedby={ aria.describedby }
					tabIndex={ -1 }
					{ ...( shouldCloseOnClickOutside
						? focusOutsideProps
						: {} ) }
					onKeyDown={ onKeyDown }
				>
					<div
						className={ classnames( 'components-modal__content', {
							'hide-header': __experimentalHideHeader,
						} ) }
						role="document"
						ref={ refContentObserver }
					>
						{ ! __experimentalHideHeader && (
							<div className="components-modal__header">
								<div className="components-modal__header-heading-container">
									{ icon && (
										<span
											className="components-modal__icon-container"
											aria-hidden
										>
											{ icon }
										</span>
									) }
									{ title && (
										<h1
											id={ headingId }
											className="components-modal__header-heading"
										>
											{ title }
										</h1>
									) }
								</div>
								{ isDismissible && (
									<Button
										onClick={ onRequestClose }
										icon={ close }
										label={
											closeButtonLabel ||
											__( 'Close dialog' )
										}
									/>
								) }
							</div>
						) }
						{ children }
					</div>
				</div>
			</StyleProvider>
		</div>,
		document.body
	);
}

/**
 * Modals give users information and choices related to a task they’re trying to
 * accomplish. They can contain critical information, require decisions, or
 * involve multiple tasks.
 *
 * ```jsx
 * import { Button, Modal } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyModal = () => {
 *   const [ isOpen, setOpen ] = useState( false );
 *   const openModal = () => setOpen( true );
 *   const closeModal = () => setOpen( false );
 *
 *   return (
 *     <>
 *       <Button variant="secondary" onClick={ openModal }>
 *         Open Modal
 *       </Button>
 *       { isOpen && (
 *         <Modal title="This is my modal" onRequestClose={ closeModal }>
 *           <Button variant="secondary" onClick={ closeModal }>
 *             My custom close button
 *           </Button>
 *         </Modal>
 *       ) }
 *     </>
 *   );
 * };
 * ```
 */
export const Modal = forwardRef( UnforwardedModal );

export default Modal;
