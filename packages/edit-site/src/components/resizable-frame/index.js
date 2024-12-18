/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import {
	Tooltip,
	__unstableMotion as motion,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import {
	useInstanceId,
	useMergeRefs,
	useReducedMotion,
} from '@wordpress/compose';
import { __, isRTL } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { addQueryArgs } from '@wordpress/url';

/** @type {import('../../../../components/src/resizable-box/hook.ts').default} */
const useResizableBox = unlock( componentsPrivateApis ).useResizableBox;
const { useLocation, useHistory } = unlock( routerPrivateApis );

// The minimum width of the frame (in px) while resizing.
const FRAME_MIN_WIDTH = 320;
// The reference width of the frame (in px) used to calculate the aspect ratio.
const FRAME_REFERENCE_WIDTH = 1300;
// 9 : 19.5 is the target aspect ratio enforced (when possible) while resizing.
const FRAME_TARGET_ASPECT_RATIO = 9 / 19.5;
// The minimum distance (in px) between the frame resize handle and the
// viewport's edge. If the frame is resized to be closer to the viewport's edge
// than this distance, then "canvas mode" will be enabled.
const SNAP_TO_EDIT_CANVAS_MODE_THRESHOLD = 200;
// Default size for the `frameSize` state.
const INITIAL_FRAME_SIZE = { width: '100%', height: '100%' };

function calculateNewHeight( width, initialAspectRatio ) {
	const lerp = ( a, b, amount ) => {
		return a + ( b - a ) * amount;
	};

	// Calculate the intermediate aspect ratio based on the current width.
	const lerpFactor =
		1 -
		Math.max(
			0,
			Math.min(
				1,
				( width - FRAME_MIN_WIDTH ) /
					( FRAME_REFERENCE_WIDTH - FRAME_MIN_WIDTH )
			)
		);

	// Calculate the height based on the intermediate aspect ratio
	// ensuring the frame arrives at the target aspect ratio.
	const intermediateAspectRatio = lerp(
		initialAspectRatio,
		FRAME_TARGET_ASPECT_RATIO,
		lerpFactor
	);

	return width / intermediateAspectRatio;
}

function ResizableFrame( {
	isFullWidth,
	isOversized,
	setIsOversized,
	isReady,
	children,
	/** The default (unresized) width/height availalbe in the parent. */
	defaultSize,
	innerContentStyle,
} ) {
	const history = useHistory();
	const { path, query } = useLocation();
	const { canvas = 'view' } = query;
	const disableMotion = useReducedMotion();
	const [ frameHeight, setFrameHeight ] = useState(
		INITIAL_FRAME_SIZE.height
	);
	const [ maxOversizeWidth, setMaxOversizeWidth ] = useState();
	const [ isResizing, setIsResizing ] = useState( false );
	const [ shouldShowHandle, setShouldShowHandle ] = useState( false );

	const frameRef = useRef( null );
	const resizableHandleHelpId = useInstanceId(
		ResizableFrame,
		'edit-site-resizable-frame-handle-help'
	);
	const defaultAspectRatio = defaultSize.width / defaultSize.height;
	const isBlockTheme = useSelect( ( select ) => {
		const { getCurrentTheme } = select( coreStore );
		return getCurrentTheme()?.is_block_theme;
	}, [] );

	const [ setResizable, bindResizableHandle ] = useResizableBox( {
		specializer: ( { difference: [ xDiff ], from: [ fromWidth ] } ) => {
			const undersizeRange = ( defaultSize.width - fromWidth ) / 2;
			const [ resizeRatio, xDiffBase ] =
				xDiff > undersizeRange ? [ 1, undersizeRange ] : [ 2, 0 ];
			const newWidth = Math.max(
				fromWidth + xDiffBase + xDiff * resizeRatio,
				FRAME_MIN_WIDTH
			);
			const newHeight = calculateNewHeight(
				newWidth,
				defaultAspectRatio
			);
			const exceedsDefaultWidth = newWidth > defaultSize.width;
			setIsOversized( exceedsDefaultWidth );
			return {
				size: [ newWidth, newHeight ],
				styleSize: [
					undefined,
					exceedsDefaultWidth ? '100%' : undefined,
				],
			};
		},
		onResizeStart: () => {
			setIsResizing( true );
			const { documentElement } = frameRef.current.ownerDocument;
			setMaxOversizeWidth(
				documentElement.offsetWidth - 32 // 32 accounts for canvas “padding”.
			);
		},
		onResizeStop: ( { size: [ width, height ] } ) => {
			setIsResizing( false );
			setFrameHeight( height );

			if ( width <= defaultSize.width ) {
				return;
			}

			const remainingWidth = maxOversizeWidth - width;

			if (
				remainingWidth > SNAP_TO_EDIT_CANVAS_MODE_THRESHOLD ||
				! isBlockTheme
			) {
				// Reset the initial aspect ratio if the frame is resized slightly
				// above the sidebar but not far enough to trigger full screen.
				Object.assign( frameRef.current.style, INITIAL_FRAME_SIZE );
				setFrameHeight( INITIAL_FRAME_SIZE.height );
			} else {
				// Trigger full screen if the frame is resized far enough to the left.
				history.navigate(
					addQueryArgs( path, {
						canvas: 'edit',
					} ),
					{
						transition: 'canvas-mode-edit-transition',
					}
				);
			}
		},
	} );

	const frameAnimationVariants = {
		default: {
			flexGrow: 0,
			height: [ frameHeight ],
		},
		fullWidth: {
			flexGrow: 1,
			height: '100%',
		},
	};

	const resizeHandleVariants = {
		hidden: {
			opacity: 0,
			x: 0,
		},
		visible: {
			opacity: 1,
			// Account for the handle's width.
			x: isRTL() ? 14 : -14,
		},
		active: {
			opacity: 1,
			// Account for the handle's width.
			x: isRTL() ? 14 : -14,
			scaleY: 1.3,
		},
	};

	// Resizing will be disabled until the editor content is loaded.
	const handle = isReady && canvas === 'view' && (
		<>
			<Tooltip text={ __( 'Drag to resize' ) }>
				{ /* Disable reason: role="separator" does in fact support aria-valuenow */ }
				{ /* eslint-disable-next-line jsx-a11y/role-supports-aria-props */ }
				<motion.button
					key="handle"
					role="separator"
					aria-orientation="vertical"
					className="edit-site-resizable-frame__handle"
					variants={ resizeHandleVariants }
					animate={ shouldShowHandle ? 'visible' : 'hidden' }
					aria-label={ __( 'Drag to resize' ) }
					aria-describedby={ resizableHandleHelpId }
					aria-valuenow={ frameRef.current?.offsetWidth || undefined }
					aria-valuemin={ FRAME_MIN_WIDTH }
					aria-valuemax={ defaultSize.width }
					initial="hidden"
					exit="hidden"
					whileFocus="active"
					whileHover="active"
					{ ...bindResizableHandle( isRTL() ? 'right' : 'left' ) }
				/>
			</Tooltip>
			<div hidden id={ resizableHandleHelpId }>
				{ __(
					'Use left and right arrow keys to resize the canvas. Hold shift to resize in larger increments.'
				) }
			</div>
		</>
	);

	return (
		<motion.div
			ref={ useMergeRefs( [ frameRef, setResizable ] ) }
			initial={ false }
			variants={ frameAnimationVariants }
			animate={ isFullWidth ? 'fullWidth' : 'default' }
			onAnimationComplete={ ( definition ) => {
				if ( definition === 'fullWidth' ) {
					setIsOversized( false );
					Object.assign( frameRef.current.style, INITIAL_FRAME_SIZE );
					setFrameHeight( INITIAL_FRAME_SIZE.height );
				}
			} }
			whileHover={
				canvas === 'view'
					? {
							scale: 1.005,
							transition: {
								duration: disableMotion ? 0 : 0.5,
								ease: 'easeOut',
							},
					  }
					: {}
			}
			transition={ { type: 'tween', duration: 0.5 } }
			onFocus={ () => setShouldShowHandle( true ) }
			onBlur={ () => setShouldShowHandle( false ) }
			onMouseOver={ () => setShouldShowHandle( true ) }
			onMouseOut={ () => setShouldShowHandle( false ) }
			className="edit-site-resizable-frame__inner"
			style={ {
				...INITIAL_FRAME_SIZE,
				minWidth: FRAME_MIN_WIDTH,
				maxWidth: isResizing || isOversized ? maxOversizeWidth : '100%',
			} }
		>
			{ handle }
			<div
				className="edit-site-resizable-frame__inner-content"
				style={ innerContentStyle }
			>
				{ children }
			</div>
		</motion.div>
	);
}

export default ResizableFrame;
