/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	Path,
	Rect,
	ResizableBox,
	SVG,
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
import { arrowDown, arrowUp, chevronDown, chevronUp } from '@wordpress/icons';
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
 * @typedef { RefEffect< HTMLBodyElement | HTMLDivElement > | null } EffectScrollSync
 */
/**
 * @typedef MetaBoxesMainProps
 * @property { boolean } isLegacy True when the editor canvas is not in an iframe.
 */

/** @type {ForwardRef< EffectScrollSync, MetaBoxesMainProps>} */
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
			// Sub-pixel container heights are possible - e.g. 2x screens and Firefox -
			// thus getComputedStyle is used for precision and to avoid a rounded max
			// constraint that may create overflow/clipping in an ancestor.
			const fullHeight = window.getComputedStyle( container ).height;
			let nextMax = parseFloat( fullHeight );
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
	const getRenderValues = useEvent( () => ( {
		isOpen,
		openHeight,
		min,
		isAutoResize,
	} ) );
	// Sets the height to 'auto' when not resizable (isShort) and to the
	// preferred height when resizable.
	useEffect( () => {
		const fresh = getRenderValues();
		if ( ! fresh.isAutoResize ) {
			// Tests for `min` having a value to skip the first render.
			if ( fresh.min !== undefined && metaBoxesMainRef.current ) {
				const usedOpenHeight = isShort ? 'auto' : fresh.openHeight;
				const usedHeight = fresh.isOpen ? usedOpenHeight : fresh.min;
				applyHeight( usedHeight, false, true );
			}
		}
	}, [ isShort ] );

	const linerRef = useRef();
	const [ jumpTargetIsCanvas, setJumpTargetIsCanvas ] = useState( false );
	/** @type { EffectScrollSync } */
	const effectScrollSync = useRefEffect(
		( canvas ) => {
			if ( ! isAutoResize ) {
				return;
			}
			const iframe = canvas.ownerDocument.defaultView.frameElement;
			if ( ! iframe ) {
				return;
			}
			const pane = metaBoxesMainRef.current.resizable;
			const interfaceContent = pane.closest(
				'.interface-interface-skeleton__content'
			);
			const canvasHtml = canvas.parentElement;
			let skipSyncScroll = false;
			let skipSyncScrollOut = false;
			const syncScroll = () => {
				if ( skipSyncScroll ) {
					skipSyncScroll = false;
					return;
				}
				skipSyncScrollOut = true;
				canvasHtml.scrollTop =
					-noticesHeight + interfaceContent.scrollTop;
			};
			interfaceContent.addEventListener( 'scroll', syncScroll, {
				passive: true,
			} );
			const syncScrollOut = () => {
				if ( skipSyncScrollOut ) {
					skipSyncScrollOut = false;
					return;
				}
				skipSyncScroll = true;
				interfaceContent.scrollTop =
					/** @todo dunno if this is right… */
					noticesHeight + canvasHtml.scrollTop;
			};
			const canvasDocument = canvas.ownerDocument;
			canvasDocument.addEventListener( 'scroll', syncScrollOut );

			const noticeLists = interfaceContent.querySelectorAll(
				':scope > .components-notice-list'
			);
			let noticesHeight = 0;
			const noticesSpySize = new window.ResizeObserver( () => {
				noticesHeight = 0;
				for ( const element of noticeLists ) {
					noticesHeight += element.offsetHeight;
				}
			} );
			for ( const element of noticeLists ) {
				noticesSpySize.observe( element );
			}

			const scrollRegionIntoView = ( { target } ) => {
				const { offsetTop, offsetHeight } = pane.previousElementSibling;
				const { scrollTop } = interfaceContent;
				// The top of the pane might seem like it would equal the height of the
				// canvas and it does excepting when notices are present. That's why
				// the top is calculated here instead of reusing the canvas height.
				const topOfPane = offsetTop + offsetHeight;
				const viewHeight =
					interfaceContent.offsetHeight -
					handleRef.current.offsetHeight;
				if ( target === interfaceContent ) {
					let nextTop = scrollTop;
					// Scrolls up if the pane is obscuring the canvas.
					if ( scrollTop > topOfPane - viewHeight ) {
						nextTop = topOfPane - viewHeight;
						interfaceContent.scrollTop = nextTop;
					}
					// Puts the region focus ring in view.
					interfaceContent.style.setProperty(
						'--wp-edit-post-content-region-top',
						`${ nextTop }px`
					);
				} else if (
					scrollTop < topOfPane && // The pane isn’t already maximally in view.
					! handleRef.current.contains( target ) // Target isn’t in the handle.
				) {
					interfaceContent.scrollTop = topOfPane;
					// Jumps farther if needed. It's possible for focus to enter somewhere in the
					// pane content without it first being in view. For example, moving a meta box
					// from the side location by clicking its order button wouldn't land in view.
					if ( linerRef.current.contains( target ) ) {
						target.scrollIntoView();
					}
				}
			};
			interfaceContent.addEventListener( 'focus', scrollRegionIntoView );
			pane.addEventListener( 'focusin', scrollRegionIntoView );

			let canvasHeight = 0;
			const canvasSizeSpy = new window.ResizeObserver( ( [ entry ] ) => {
				[ { blockSize: canvasHeight } ] = entry.borderBoxSize;
				interfaceContent.style.setProperty(
					'--wp-edit-post-canvas-height',
					canvasHeight
				);
			} );
			canvasSizeSpy.observe( canvasHtml );

			const linerSizeSpy = new window.ResizeObserver( ( [ entry ] ) => {
				const [ { blockSize } ] = entry.borderBoxSize;
				pane.style.bottom = `-${ blockSize }px`;
				interfaceContent.style.setProperty(
					'--wp-edit-post-meta-boxes-main-content-height',
					`${ blockSize }px`
				);
			} );
			linerSizeSpy.observe( linerRef.current );

			const jumpDirectorSpy = new window.IntersectionObserver(
				( [ { isIntersecting } ] ) => {
					setJumpTargetIsCanvas( isIntersecting );
				},
				{ root: interfaceContent, rootMargin: '0px 0px -50% 0px' }
			);
			jumpDirectorSpy.observe( pane );

			return () => {
				interfaceContent.removeEventListener( 'scroll', syncScroll );
				canvasDocument.removeEventListener( 'scroll', syncScrollOut );
				noticesSpySize.disconnect();
				interfaceContent.removeEventListener(
					'focus',
					scrollRegionIntoView
				);
				pane.removeEventListener( 'focusin', scrollRegionIntoView );
				canvasSizeSpy.disconnect();
				linerSizeSpy.disconnect();
				jumpDirectorSpy.disconnect();
				pane.style.bottom = '';
				interfaceContent.style.removeProperty(
					'--wp-edit-post-canvas-height'
				);
				interfaceContent.style.removeProperty(
					'--wp-edit-post-meta-boxes-main-content-height'
				);
				interfaceContent.style.removeProperty(
					'--wp-edit-post-content-region-top'
				);
			};
		},
		[ isAutoResize ]
	);
	useImperativeHandle(
		ref,
		() => ( ! hasAnyVisible || isLegacy ? null : effectScrollSync ),
		[ effectScrollSync, hasAnyVisible, isLegacy ]
	);

	const handleRef = useRef();
	/** @type { RefEffect< HTMLElement > } */
	const effectHandle = useRefEffect( ( node ) => {
		handleRef.current = node.parentElement;
		const wrapper = node.parentElement.parentElement;
		const className = 'edit-post-meta-boxes-main__presenter-wrapper';
		wrapper.classList.add( className );
		return () => {
			handleRef.current = null;
			wrapper.classList.remove( className );
		};
	}, [] );

	if ( ! hasAnyVisible ) {
		return;
	}

	const contents = (
		<div
			// The class name 'edit-post-layout__metaboxes' is retained because some plugins use it.
			className="edit-post-layout__metaboxes edit-post-meta-boxes-main__liner"
			hidden={ ! isLegacy && ! isAutoResize && ! isOpen }
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

	const splitOrUnifyIcon = (
		<SVG
			width="24"
			height="24"
			viewBox="0 0 24 24"
			style={ {
				stroke: 'currentColor',
				strokeWidth: 1.5,
				fill: 'none',
			} }
		>
			{ isAutoResize ? (
				<>
					<Path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
					<Path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
					<Path d="M2 12h20" />
				</>
			) : (
				<>
					<Rect width="18" height="18" x="3" y="3" rx="2" />
					<Path d="M6 17H18" />
				</>
			) }
		</SVG>
	);

	const autoResizeSwitch = (
		<Button
			label={ isAutoResize ? __( 'Split view' ) : __( 'Unify view' ) }
			size="small"
			icon={ splitOrUnifyIcon }
			onClick={ () =>
				setPreference(
					'core/edit-post',
					'metaBoxesMainIsAutoResize',
					! isAutoResize
				)
			}
			// Avoids pointer capture from the resize handle. This allows
			// canceling clicks by dragging off the button.
			onPointerDown={ ( event ) => event.stopPropagation() }
			// Prevents resizes - the button is inside the resize handle.
			onMouseDown={ ( event ) => event.stopPropagation() }
			onTouchStart={ ( event ) => event.stopPropagation() }
		/>
	);

	const jumpButton = (
		<Button
			label={
				jumpTargetIsCanvas
					? __( 'Jump back up' )
					: __( 'Jump to meta boxes' )
			}
			icon={ jumpTargetIsCanvas ? arrowUp : arrowDown }
			size="small"
			variant="tertiary"
			onClick={ ( { currentTarget } ) => {
				const pane = metaBoxesMainRef.current.resizable;
				let to;
				if ( jumpTargetIsCanvas ) {
					to = currentTarget.dataset.lastCanvasScrollTop || 0;
				} else {
					currentTarget.dataset.lastCanvasScrollTop =
						pane.parentElement.scrollTop;
					const { offsetTop, offsetHeight } =
						pane.previousElementSibling;
					to = offsetTop + offsetHeight;
				}
				pane.parentElement.scrollTop = to;
			} }
			// Avoids pointer capture from the resize handle. This allows
			// canceling clicks by dragging off the button.
			onPointerDown={ ( event ) => event.stopPropagation() }
			// Prevents resizes - the button is inside the resize handle.
			onMouseDown={ ( event ) => event.stopPropagation() }
			onTouchStart={ ( event ) => event.stopPropagation() }
		/>
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
					{ isAutoResize ? (
						<>
							{ paneLabel }
							{ jumpButton }
							<meta ref={ effectHandle } />
						</>
					) : (
						<>
							{ toggle }
							{ separator }
						</>
					) }
					{ autoResizeSwitch }
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
		<>
			{ isAutoResize && (
				<div
					style={ {
						flex: '0 0 calc(1px * var(--wp-edit-post-canvas-height) - 100cqb)',
						marginBlockStart:
							'calc(-1 * var(--wp-edit-post-meta-boxes-main-content-height))',
					} }
				/>
			) }
			<ResizableBox aria-label={ paneLabel } { ...paneProps }>
				<meta ref={ effectSizeConstraints } />
				{ contents }
			</ResizableBox>
		</>
	);
} );

MetaBoxesMain.displayName = 'MetaBoxesMain';

export default MetaBoxesMain;
