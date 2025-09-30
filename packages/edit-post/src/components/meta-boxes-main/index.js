/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	ResizableBox,
	Tooltip,
	VisuallyHidden,
} from '@wordpress/components';
import { useEvent, useMediaQuery, useRefEffect } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import {
	forwardRef,
	useEffect,
	useId,
	useImperativeHandle,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp, pinSmall } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editPostStore } from '../../store';
import MetaBoxes from '../meta-boxes';

const { NavigableRegion } = unlock( editorPrivateApis );

/**
 * @template T
 * @typedef { ReturnType< typeof useRefEffect< T > >} RefEffect
 */
/**
 * @template T, P
 * @typedef { ReturnType< typeof forwardRef< T, P > >} ForwardRef
 */
/**
 * Ref callback receiving the canvas element to add wheel event handling.
 * @typedef { RefEffect< HTMLBodyElement | HTMLDivElement > } EffectWheelResizing
 */
/**
 * @typedef MetaBoxesMainProps
 * @property { boolean } isLegacy True when the editor canvas is not in an iframe.
 */

/** @type {ForwardRef< EffectWheelResizing, MetaBoxesMainProps>} */
const MetaBoxesMain = forwardRef( ( { isLegacy }, ref ) => {
	const [ isOpen, openHeight, isAutoResize, hasAnyVisible ] = useSelect(
		( select ) => {
			const { get } = select( preferencesStore );
			const { isMetaBoxLocationVisible } = select( editPostStore );
			return [
				get( 'core/edit-post', 'metaBoxesMainIsOpen' ),
				get( 'core/edit-post', 'metaBoxesMainOpenHeight' ),
				get( 'core/edit-post', 'metaBoxesMainIsAutoResize' ),
				isMetaBoxLocationVisible( 'normal' ) ||
					isMetaBoxLocationVisible( 'advanced' ) ||
					isMetaBoxLocationVisible( 'side' ),
			];
		},
		[]
	);
	const { set: setPreference } = useDispatch( preferencesStore );
	const metaBoxesMainRef = useRef();
	const isShort = useMediaQuery( '(max-height: 549px)' );

	const [ { min, max }, setHeightConstraints ] = useState( () => ( {} ) );
	// Keeps the resizable area’s size constraints updated taking into account
	// editor notices. The constraints are also used to derive the value for the
	// aria-valuenow attribute on the separator.
	/** @type { RefEffect< HTMLElement > } */
	const effectSizeConstraints = useRefEffect( ( node ) => {
		const container = node.closest(
			'.interface-interface-skeleton__content'
		);
		if ( ! container ) {
			return;
		}
		const noticeLists = container.querySelectorAll(
			':scope > .components-notice-list'
		);
		const resizeHandle = container.querySelector(
			'.edit-post-meta-boxes-main__presenter'
		);
		const deriveConstraints = () => {
			const fullHeight = container.offsetHeight;
			let nextMax = fullHeight;
			for ( const element of noticeLists ) {
				nextMax -= element.offsetHeight;
			}
			const nextMin = resizeHandle.offsetHeight;
			setHeightConstraints( { min: nextMin, max: nextMax } );
		};
		const observer = new window.ResizeObserver( deriveConstraints );
		observer.observe( container );
		for ( const element of noticeLists ) {
			observer.observe( element );
		}
		return () => observer.disconnect();
	}, [] );

	const resizeDataRef = useRef( {} );
	const separatorRef = useRef();
	const separatorHelpId = useId();

	/**
	 * @param {number|'auto'} [candidateHeight] Height in pixels or 'auto'.
	 * @param {boolean}       isPersistent      Whether to persist the height in preferences.
	 * @param {boolean}       isInstant         Whether to update the height in the DOM.
	 */
	const applyHeight = (
		candidateHeight = 'auto',
		isPersistent,
		isInstant
	) => {
		if ( candidateHeight === 'auto' ) {
			isPersistent = false; // Just in case — “auto” should never persist.
		} else {
			candidateHeight = Math.min( max, Math.max( min, candidateHeight ) );
		}
		if ( isPersistent ) {
			setPreference(
				'core/edit-post',
				'metaBoxesMainOpenHeight',
				candidateHeight
			);
		}
		// Updates aria-valuenow only when not persisting the value because otherwise
		// it's done by the render that persisting the value causes.
		else if ( ! isShort ) {
			separatorRef.current.ariaValueNow =
				getAriaValueNow( candidateHeight );
		}
		if ( isInstant ) {
			metaBoxesMainRef.current.updateSize( {
				height: candidateHeight,
				// Oddly, when the event that triggered this was not from the mouse (e.g. keydown),
				// if `width` is left unspecified a subsequent drag gesture applies a fixed
				// width and the pane fails to widen/narrow with parent width changes from
				// sidebars opening/closing or window resizes.
				width: 'auto',
			} );
		}
	};
	const getRenderValues = useEvent( () => ( { isOpen, openHeight, min } ) );
	// Sets the height to 'auto' when not resizable (isShort) and to the
	// preferred height when resizable.
	useEffect( () => {
		const fresh = getRenderValues();
		// Tests for `min` having a value to skip the first render.
		if ( fresh.min !== undefined && metaBoxesMainRef.current ) {
			const usedOpenHeight = isShort ? 'auto' : fresh.openHeight;
			const usedHeight = fresh.isOpen ? usedOpenHeight : fresh.min;
			applyHeight( usedHeight, false, true );
		}
	}, [ isShort ] );

	const linerRef = useRef();
	const _applyHeight = useEvent( applyHeight );
	/** @type { EffectWheelResizing } */
	const effectWheel = useRefEffect(
		( canvas ) => {
			if ( ! isAutoResize ) {
				return;
			}
			const iframe = canvas.ownerDocument.defaultView.frameElement;
			if ( ! iframe ) {
				return;
			}
			const pane = metaBoxesMainRef.current.resizable;
			let isScrollMaxSticking = false;
			const iframeObserver = new window.ResizeObserver( () => {
				if ( isScrollMaxSticking ) {
					const { scrollingElement } = iframe.contentDocument;
					scrollingElement.scrollTop = scrollingElement.scrollHeight;
					isScrollMaxSticking = false;
				}
			} );
			iframeObserver.observe( iframe );
			/** @param { WheelEvent } event */
			const onWheel = ( event ) => {
				const { deltaY, currentTarget } = event;
				const { offsetHeight: canvasHeight, contentDocument } = iframe;
				const { scrollTop, scrollHeight } =
					contentDocument.scrollingElement;
				const scrollMax = scrollHeight - canvasHeight;
				if ( scrollMax - scrollTop >= 1 ) {
					return;
				}
				if ( pane === currentTarget ) {
					const isPaneScrolled = linerRef.current.scrollTop > 0;
					if ( isPaneScrolled && Math.sign( deltaY ) === -1 ) {
						return;
					}
					// While the canvas has height, prevents scrolling the meta boxes.
					if ( canvasHeight > 0 ) {
						event.preventDefault();
					}
				}
				isScrollMaxSticking = true;
				let fromHeight = metaBoxesMainRef.current.state.height;
				// Reads the height from the DOM in case it's unset.
				if ( fromHeight === 'auto' ) {
					fromHeight = pane.offsetHeight;
				}
				const nextHeight = deltaY + fromHeight;
				const { min: _min, isOpen: _isOpen } = getRenderValues();
				if ( _isOpen && nextHeight <= _min ) {
					persistIsOpen( false );
				} else if ( ! _isOpen && nextHeight > _min ) {
					persistIsOpen( true );
				}
				_applyHeight( nextHeight, false, true );
			};
			const canvasDocument = canvas.ownerDocument;
			canvasDocument.addEventListener( 'wheel', onWheel, {
				passive: true,
			} );
			pane.addEventListener( 'wheel', onWheel, { passive: false } );
			return () => {
				iframeObserver.disconnect();
				canvasDocument.removeEventListener( 'wheel', onWheel );
				pane.removeEventListener( 'wheel', onWheel );
			};
		},
		[ isAutoResize ]
	);
	useImperativeHandle( ref, () => effectWheel, [ effectWheel ] );

	if ( ! hasAnyVisible ) {
		return;
	}

	const contents = (
		<div
			// The class name 'edit-post-layout__metaboxes' is retained because some plugins use it.
			className="edit-post-layout__metaboxes edit-post-meta-boxes-main__liner"
			hidden={ ! isLegacy && ! isOpen }
			ref={ ! isLegacy ? linerRef : null }
		>
			<MetaBoxes location="normal" />
			<MetaBoxes location="advanced" />
		</div>
	);

	if ( isLegacy ) {
		return contents;
	}

	const isAutoHeight = openHeight === undefined;
	const getAriaValueNow = ( height ) =>
		Math.round( ( ( height - min ) / ( max - min ) ) * 100 );
	const usedAriaValueNow =
		max === undefined || isAutoHeight ? 50 : getAriaValueNow( openHeight );

	const persistIsOpen = ( to = ! isOpen ) =>
		setPreference( 'core/edit-post', 'metaBoxesMainIsOpen', to );

	// TODO: Support more/all keyboard interactions from the window splitter pattern:
	// https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
	const onSeparatorKeyDown = ( event ) => {
		const delta = { ArrowUp: 20, ArrowDown: -20 }[ event.key ];
		if ( delta ) {
			const pane = metaBoxesMainRef.current.resizable;
			const fromHeight = isAutoHeight ? pane.offsetHeight : openHeight;
			const nextHeight = delta + fromHeight;
			applyHeight( nextHeight, true, true );
			persistIsOpen( nextHeight > min );
			event.preventDefault();
		}
	};
	const paneLabel = __( 'Meta Boxes' );

	const toggle = (
		<button
			aria-expanded={ isOpen }
			onClick={ ( { detail } ) => {
				const { isToggleInferred } = resizeDataRef.current;
				if ( isShort || ! detail || isToggleInferred ) {
					persistIsOpen();
					const usedOpenHeight = isShort ? 'auto' : openHeight;
					const usedHeight = isOpen ? min : usedOpenHeight;
					applyHeight( usedHeight, false, true );
				}
			} }
			// Prevents resizing in short viewports.
			{ ...( isShort && {
				onMouseDown: ( event ) => event.stopPropagation(),
				onTouchStart: ( event ) => event.stopPropagation(),
			} ) }
		>
			{ paneLabel }
			<Icon icon={ isOpen ? chevronUp : chevronDown } />
		</button>
	);

	const separator = ! isShort && (
		<>
			<Tooltip text={ __( 'Drag to resize' ) }>
				<button // eslint-disable-line jsx-a11y/role-supports-aria-props
					ref={ separatorRef }
					role="separator" // eslint-disable-line jsx-a11y/no-interactive-element-to-noninteractive-role
					aria-valuenow={ usedAriaValueNow }
					aria-label={ __( 'Drag to resize' ) }
					aria-describedby={ separatorHelpId }
					onKeyDown={ onSeparatorKeyDown }
				/>
			</Tooltip>
			<VisuallyHidden id={ separatorHelpId }>
				{ __(
					'Use up and down arrow keys to resize the meta box panel.'
				) }
			</VisuallyHidden>
		</>
	);

	const paneProps = /** @type {Parameters<typeof ResizableBox>[0]} */ ( {
		as: NavigableRegion,
		ref: metaBoxesMainRef,
		className: 'edit-post-meta-boxes-main',
		defaultSize: { height: isOpen ? openHeight : 0 },
		minHeight: min,
		maxHeight: max,
		enable: { top: true },
		handleClasses: { top: 'edit-post-meta-boxes-main__presenter' },
		handleComponent: {
			top: (
				<>
					{ toggle }
					{ separator }
					<Button
						label={ __( 'Disable auto-resizing' ) }
						showTooltip
						size="small"
						icon={ pinSmall }
						onClick={ () =>
							setPreference(
								'core/edit-post',
								'metaBoxesMainIsAutoResize',
								! isAutoResize
							)
						}
						isPressed={ ! isAutoResize }
						// Avoids pointer capture from the resize handle. This allows
						// canceling clicks by dragging off the button.
						onPointerDown={ ( event ) => event.stopPropagation() }
						// Prevents resizes - the button is inside the resize handle.
						onMouseDown={ ( event ) => event.stopPropagation() }
						onTouchStart={ ( event ) => event.stopPropagation() }
					/>
				</>
			),
		},
		// Avoids hiccups while dragging over objects like iframes and ensures that
		// the event to end the drag is captured by the target (resize handle)
		// whether or not it’s under the pointer.
		onPointerDown: ( { pointerId, target } ) => {
			if ( separatorRef.current?.parentElement.contains( target ) ) {
				target.setPointerCapture( pointerId );
			}
		},
		onResizeStart: ( { timeStamp }, direction, elementRef ) => {
			if ( isAutoHeight ) {
				// Sets the starting height to avoid visual jumps in height and
				// aria-valuenow being `NaN` for the first (few) resize events.
				applyHeight( elementRef.offsetHeight, false, true );
			}
			elementRef.classList.add( 'is-resizing' );
			resizeDataRef.current = { timeStamp, maxDelta: 0 };
		},
		onResize: ( event, direction, elementRef, delta ) => {
			const { maxDelta } = resizeDataRef.current;
			const newDelta = Math.abs( delta.height );
			resizeDataRef.current.maxDelta = Math.max( maxDelta, newDelta );
			applyHeight( metaBoxesMainRef.current.state.height );
		},
		onResizeStop: ( event, direction, elementRef ) => {
			elementRef.classList.remove( 'is-resizing' );
			const duration = event.timeStamp - resizeDataRef.current.timeStamp;
			const wasSeparator = event.target === separatorRef.current;
			const { maxDelta } = resizeDataRef.current;
			const isToggleInferred =
				maxDelta < 1 || ( duration < 144 && maxDelta < 5 );
			if ( isShort || ( ! wasSeparator && isToggleInferred ) ) {
				resizeDataRef.current.isToggleInferred = true;
			} else {
				const { height } = metaBoxesMainRef.current.state;
				const nextIsOpen = height > min;
				persistIsOpen( nextIsOpen );
				// Persists height only if still open. This is so that when closed by a drag the
				// prior height can be restored by the toggle button instead of having to drag
				// the pane open again. Also, if already closed, a click on the separator won’t
				// persist the height as the minimum.
				if ( nextIsOpen ) {
					applyHeight( height, true );
				}
			}
		},
	} );

	return (
		<ResizableBox aria-label={ paneLabel } { ...paneProps }>
			<meta ref={ effectSizeConstraints } />
			{ contents }
		</ResizableBox>
	);
} );

MetaBoxesMain.displayName = 'MetaBoxesMain';

export default MetaBoxesMain;
