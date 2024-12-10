/**
 * WordPress dependencies
 */
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import {
	forwardRef,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode, ForwardedRef, CSSProperties } from 'react';
import type { Vector2 } from '@use-gesture/react';

/**
 * Internal dependencies
 */
import type { Constrainer, ResizableHookHandler, Specializer } from './hook';
import type {
	Direction,
	ImperativeHandle,
	ResizeCallback,
	ResizableProps,
	Size,
} from './types';
import useResizableBox from './hook';
import ResizeTooltip from './resize-tooltip';
import { clamp } from '../utils/math';
import { parseQuantityAndUnitFromRawValue } from '../unit-control';
import { InputControlSuffixWrapperWithClickThrough } from '../select-control/styles/select-control-styles';

const HANDLE_CLASS_NAME = 'components-resizable-box__handle';
const SIDE_HANDLE_CLASS_NAME = 'components-resizable-box__side-handle';
const CORNER_HANDLE_CLASS_NAME = 'components-resizable-box__corner-handle';

const HANDLE_CLASSES = {
	top: clsx(
		HANDLE_CLASS_NAME,
		SIDE_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-top'
	),
	right: clsx(
		HANDLE_CLASS_NAME,
		SIDE_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-right'
	),
	bottom: clsx(
		HANDLE_CLASS_NAME,
		SIDE_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-bottom'
	),
	left: clsx(
		HANDLE_CLASS_NAME,
		SIDE_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-left'
	),
	topLeft: clsx(
		HANDLE_CLASS_NAME,
		CORNER_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-top',
		'components-resizable-box__handle-left'
	),
	topRight: clsx(
		HANDLE_CLASS_NAME,
		CORNER_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-top',
		'components-resizable-box__handle-right'
	),
	bottomRight: clsx(
		HANDLE_CLASS_NAME,
		CORNER_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-bottom',
		'components-resizable-box__handle-right'
	),
	bottomLeft: clsx(
		HANDLE_CLASS_NAME,
		CORNER_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-bottom',
		'components-resizable-box__handle-left'
	),
};
const HANDLE_KEYS = Object.keys( HANDLE_CLASSES ) as Direction[];

const BASE_STYLE: CSSProperties = {
	position: 'relative',
	userSelect: 'auto',
	width: 'auto',
	height: 'auto',
	boxSizing: 'border-box',
	flexShrink: 0,
};

const BASE_HANDLE_STYLE: CSSProperties = {
	position: 'absolute',
	userSelect: 'none',
	// Ensures the drag gesture works for touch devices (as opposed to
	// scrolling when there’s overflow).
	touchAction: 'none',
};
const BLOCK_SIDE_HANDLE_STYLE: CSSProperties = {
	width: '100%',
	height: '10px',
	top: '0px',
	left: '0px',
	cursor: 'row-resize',
};
const INLINE_SIDE_HANDLE_STYLE: CSSProperties = {
	width: '10px',
	height: '100%',
	top: '0px',
	left: '0px',
	cursor: 'col-resize',
};

const CORNER_HANDLE_STYLE: CSSProperties = {
	width: '20px',
	height: '20px',
	position: 'absolute',
};

// These are the resize handle styles from `re-resizable`.
const RERESIZABLE_HANDLE_STYLES: { [ key: string ]: CSSProperties } = {
	top: {
		...BLOCK_SIDE_HANDLE_STYLE,
		top: '-5px',
	},
	right: {
		...INLINE_SIDE_HANDLE_STYLE,
		left: undefined,
		right: '-5px',
	},
	bottom: {
		...BLOCK_SIDE_HANDLE_STYLE,
		top: undefined,
		bottom: '-5px',
	},
	left: {
		...INLINE_SIDE_HANDLE_STYLE,
		left: '-5px',
	},
	topRight: {
		...CORNER_HANDLE_STYLE,
		right: '-10px',
		top: '-10px',
		cursor: 'ne-resize',
	},
	bottomRight: {
		...CORNER_HANDLE_STYLE,
		right: '-10px',
		bottom: '-10px',
		cursor: 'se-resize',
	},
	bottomLeft: {
		...CORNER_HANDLE_STYLE,
		left: '-10px',
		bottom: '-10px',
		cursor: 'sw-resize',
	},
	topLeft: {
		...CORNER_HANDLE_STYLE,
		left: '-10px',
		top: '-10px',
		cursor: 'nw-resize',
	},
};

// Removes some inline styles in the drag handles.
const HANDLE_STYLES_OVERRIDES = {
	width: undefined,
	height: undefined,
	top: undefined,
	right: undefined,
	bottom: undefined,
	left: undefined,
};
const DEFAULT_HANDLE_STYLES = {
	top: HANDLE_STYLES_OVERRIDES,
	right: HANDLE_STYLES_OVERRIDES,
	bottom: HANDLE_STYLES_OVERRIDES,
	left: HANDLE_STYLES_OVERRIDES,
	topLeft: HANDLE_STYLES_OVERRIDES,
	topRight: HANDLE_STYLES_OVERRIDES,
	bottomRight: HANDLE_STYLES_OVERRIDES,
	bottomLeft: HANDLE_STYLES_OVERRIDES,
};

const DEFAULT_GRID_WIDTH = 1;
const DEFAULT_GRID_HEIGHT = 1;

type ResizableBoxProps = ResizableProps & {
	debug?: boolean;
	children: ReactNode;
	showHandle?: boolean;
	__experimentalShowTooltip?: boolean;
	__experimentalTooltipProps?: Parameters< typeof ResizeTooltip >[ 0 ];
};

type UnitMeasure = { unit: string; pixelsPerUnit: number };
type SizeUnitMeasurements = { width?: UnitMeasure; height?: UnitMeasure };

const getAspectRatioBoundSize = (
	ratio: number,
	newWidth: number,
	newHeight: number,
	extraHeight = 0,
	extraWidth = 0,
	bounds: [ number[], number[] ]
) => {
	const [ [ minWidth, minHeight ], [ maxWidth, maxHeight ] ] = bounds;
	const extraMinWidth = ( minHeight - extraHeight ) * ratio + extraWidth;
	const extraMaxWidth = ( maxHeight - extraHeight ) * ratio + extraWidth;
	const extraMinHeight = ( minWidth - extraWidth ) / ratio + extraHeight;
	const extraMaxHeight = ( maxWidth - extraWidth ) / ratio + extraHeight;
	const lockedMinWidth = Math.max( minWidth, extraMinWidth );
	const lockedMaxWidth = Math.min( maxWidth, extraMaxWidth );
	const lockedMinHeight = Math.max( minHeight, extraMinHeight );
	const lockedMaxHeight = Math.min( maxHeight, extraMaxHeight );
	newWidth = clamp( newWidth, lockedMinWidth, lockedMaxWidth );
	newHeight = clamp( newHeight, lockedMinHeight, lockedMaxHeight );
	return [ newWidth, newHeight ];
};

// TODO: this might better be inlined into `getMaxFromBounds`.
const getRectsForBounds = (
	target: HTMLElement,
	bounds: ResizableProps[ 'bounds' ],
	scale: number
) => {
	const adjustedScale = 1 / scale;
	let boundsRect;
	if ( bounds ) {
		if ( bounds !== 'window' ) {
			if ( bounds === 'parent' ) {
				bounds = target.parentElement || target.ownerDocument.body;
			}
			const { left, top } = bounds.getBoundingClientRect();
			boundsRect = new DOMRect(
				left * adjustedScale,
				top * adjustedScale,
				bounds.offsetWidth,
				bounds.offsetHeight
			);
		} else if ( target.ownerDocument.defaultView ) {
			const { innerWidth, innerHeight } =
				target.ownerDocument.defaultView;
			boundsRect = new DOMRect( 0, 0, innerWidth, innerHeight );
		}
	}
	const { left, top, width, height } = target.getBoundingClientRect();
	const selfRect = new DOMRect(
		left * adjustedScale,
		top * adjustedScale,
		width * adjustedScale,
		height * adjustedScale
	);
	return { bounds: boundsRect || new DOMRect(), self: selfRect };
};

const isBoundsByDirectionApplicable = ( direction: Direction ) =>
	/(left|top)/i.test( direction );

const getMaxFromBounds = (
	target: HTMLElement,
	bounds: ResizableProps[ 'bounds' ],
	direction: Direction,
	treatBoundsSanely: ResizableProps[ 'boundsByDirection' ],
	scale: number,
	maxWidth: number,
	maxHeight: number
) => {
	const widthByDirection =
		treatBoundsSanely && isBoundsByDirectionApplicable( direction );
	const heightByDirection =
		treatBoundsSanely && isBoundsByDirectionApplicable( direction );
	const { bounds: boundsRect, self: selfRect } = getRectsForBounds(
		target,
		bounds,
		scale
	);
	let boundWidth;
	let boundHeight;
	if ( bounds === 'window' ) {
		boundWidth = widthByDirection
			? selfRect.right
			: boundsRect.width - selfRect.left;
		boundHeight = heightByDirection
			? selfRect.bottom
			: boundsRect.height - selfRect.top;
	} else if ( bounds ) {
		boundWidth = widthByDirection
			? selfRect.right - boundsRect.left
			: boundsRect.width + ( boundsRect.left - selfRect.left );
		boundHeight = heightByDirection
			? selfRect.bottom - boundsRect.top
			: boundsRect.height + ( boundsRect.top - selfRect.top );
	}
	// Uses `maxWidth` or `maxHeight` if smaller than the derived boundWidth or
	// boundHeight. TODO: check if this is necessary; it seems it may not be as
	// `maxWidth` and `maxHeight` should be applied as styles and thereby limit
	// the resize already.
	if ( boundWidth && Number.isFinite( boundWidth ) ) {
		maxWidth = maxWidth < boundWidth ? maxWidth : boundWidth;
	}
	if ( boundHeight && Number.isFinite( boundHeight ) ) {
		maxHeight = maxHeight < boundHeight ? maxHeight : boundHeight;
	}
	return [ maxWidth, maxHeight ] as Vector2;
};

const findClosestSnap = (
	n: number,
	snapArray: number[],
	snapGap: number = 0
): number => {
	const closestGapIndex = snapArray.reduce(
		( prev, curr, index ) =>
			Math.abs( curr - n ) < Math.abs( snapArray[ prev ] - n )
				? index
				: prev,
		0
	);
	const gap = Math.abs( snapArray[ closestGapIndex ] - n );
	return snapGap === 0 || gap < snapGap ? snapArray[ closestGapIndex ] : n;
};

const roundBy = ( value: number, size: number ): number =>
	Math.round( value / size ) * size;

const makeStyleRestorer = (
	element: HTMLElement,
	...propertyList: ( keyof CSSProperties )[]
) => {
	const entries: [ keyof CSSProperties, string ][] = [];
	for ( const property of propertyList ) {
		entries.push( [ property, element.style[ property ] ] );
	}
	return () => {
		for ( const [ property, value ] of entries ) {
			element.style[ property ] = value;
		}
	};
};

const hasNonPixelUnit = ( value: string ) => {
	return value.endsWith( 'px' ) ? false : /\D$/.test( value );
};

/**
 * Gets number of pixels for CSS `min-width`/`min-height` or `max-width`/`max-height`.
 * I.e. it converts string values like '5em' and '10%' to number (of pixels).
 */
const getPixelMinMax = (
	element: HTMLElement,
	maxHeight: string | number,
	maxWidth: string | number,
	minHeight: string | number,
	minWidth: string | number
): [ Vector2, Vector2 ] => {
	const valueList = [ maxHeight, maxWidth, minHeight, minWidth ];
	const { defaultView } = element.ownerDocument;
	if ( ! defaultView ) {
		return [
			[ 0, 0 ],
			[ Infinity, Infinity ],
		];
	}
	const restoreStyles = makeStyleRestorer( element, 'height', 'width' );
	const measureProperties = [ 'height', 'width', 'height', 'width' ] as const;
	const measuredValueList = [];
	for ( const index in valueList ) {
		const value = valueList[ index ];
		if ( typeof value === 'string' && hasNonPixelUnit( value ) ) {
			const measureProperty = measureProperties[ index ];
			element.style[ measureProperty ] = value;
			const pixelValue = parseFloat(
				defaultView.getComputedStyle( element )[ measureProperty ]
			);
			measuredValueList[ parseInt( index ) ] = pixelValue;
		}
	}
	restoreStyles();
	// Falls back to argument’s value where no DOM measure was made in which
	// case it’s either a number or a string with 'px' unit. parseFloat is used
	// for either because it doesn’t seem worthwhile to test the type again.
	const [
		pixelMaxHeight = parseFloat( maxHeight as string ),
		pixelMaxWidth = parseFloat( maxWidth as string ),
		pixelMinHeight = parseFloat( minHeight as string ),
		pixelMinWidth = parseFloat( minWidth as string ),
	] = measuredValueList;
	return [
		[ pixelMinWidth, pixelMinHeight ],
		[ pixelMaxWidth, pixelMaxHeight ],
	];
};

// TODO: maybe it’s worthwhile to optimize for when the unit is the same in
// both dimensions as only one measurement should need to be made.
const getUnitMeasures = ( size: Partial< Size >, element: HTMLElement ) => {
	const specifics: SizeUnitMeasurements = {};
	const { defaultView } = element.ownerDocument;
	if ( ! defaultView ) {
		return specifics;
	}
	const restoreStyles = makeStyleRestorer( element, 'height', 'width' );
	for ( const [ dimensionKey, value ] of Object.entries( size ) as [
		'width' | 'height',
		string | false,
	][] ) {
		if ( typeof value !== 'string' || ! hasNonPixelUnit( value ) ) {
			continue;
		}
		const [ usedValue, usedUnit ] =
			parseQuantityAndUnitFromRawValue( value );
		if ( usedUnit !== undefined && usedValue !== undefined ) {
			// Setting dimensions to 100 is seemingly unnecessary but may be worthwhile for
			// greater precision of `pixelsPerUnit`.
			element.style[ dimensionKey ] = `100${ usedUnit }`;
			const computedDimension = parseFloat(
				defaultView.getComputedStyle( element )[ dimensionKey ]
			);
			specifics[ dimensionKey ] = {
				unit: usedUnit,
				pixelsPerUnit: computedDimension / 100,
			};
			console.log( dimensionKey, 'with units', {
				computedDimension,
				...specifics[ dimensionKey ],
			} );
		}
	}
	restoreStyles();
	return specifics;
};

const setStyleSize = ( node: HTMLElement, nextSize: Partial< Size > ) => {
	const { height = false, width = false } = nextSize;
	if ( width !== false ) {
		node.style.width = typeof width === 'number' ? `${ width }px` : width;
	}
	if ( height !== false ) {
		node.style.height =
			typeof height === 'number' ? `${ height }px` : height;
	}
};

const useDidChange = ( ...dependencies: unknown[] ) => {
	let didChange = false;
	useMemo( () => void ( didChange = true ), dependencies );
	return didChange;
};

// TODO: Have this only run/effect on resize stop.
const useEffectSizeOnStop = ( size: ResizableProps[ 'size' ], key: string ) => {
	const didSizePropWidthChange = useDidChange( size?.width );
	const didSizePropHeightChange = useDidChange( size?.height );
	// When the component is controlled (the `size` prop is specified) the `size` prop
	// will typically have changed values (at least once the resize has stopped) yet in
	// case they do not change they must still be applied once resizing stops. Otherwise,
	// the “uncontrolled” size from the user resize will persist. If the `size` prop’s
	// values have changed nothing needs to be done because React will apply them.
	const effectSizeOnStop = useRefEffect< HTMLElement >(
		( node ) => {
			if ( ! didSizePropWidthChange || ! didSizePropHeightChange ) {
				const { width = BASE_STYLE.width, height = BASE_STYLE.height } =
					size || {};
				console.log('effect size on stop', width, height )
				setStyleSize( node, { width, height } );
			}
		},
		[ didSizePropWidthChange, didSizePropHeightChange, key ]
	);
	return size ? effectSizeOnStop : null;
};

function UnforwardedResizableBox(
	{
		debug,
		as: TagOrComponent = 'div',
		bounds: propBounds,
		boundsByDirection,
		className,
		children,
		defaultSize,
		enable,
		grid: [ xGrid, yGrid ] = [ DEFAULT_GRID_WIDTH, DEFAULT_GRID_HEIGHT ],
		handleComponent,
		handleStyles = DEFAULT_HANDLE_STYLES,
		handleWrapperClass,
		handleWrapperStyle,
		lockAspectRatio = false,
		lockAspectRatioExtraHeight: extraHeight = 0,
		lockAspectRatioExtraWidth: extraWidth = 0,
		maxHeight,
		maxWidth,
		minHeight = 10,
		minWidth = 10,
		onResize,
		onResizeStart,
		onResizeStop,
		resizeRatio = 1,
		scale = 1,
		showHandle = true,
		__experimentalShowTooltip: showTooltip = false,
		size,
		snap,
		snapGap = 0,
		style,
		__experimentalTooltipProps: tooltipProps = {},
		...props
	}: ResizableBoxProps,
	ref: ForwardedRef< ImperativeHandle >
): JSX.Element {
	const { handleClasses, ...restProps } = props;
	const rootRef = useRef< HTMLElement >();
	useImperativeHandle( ref, () => ( {
		resizable: rootRef.current || null,
		updateSize: ( nextSize: Partial< Size > ) => {
			if ( rootRef.current ) {
				setStyleSize( rootRef.current, nextSize );
			}
		},
	} ) );
	const sizeUnitsRef = useRef< SizeUnitMeasurements >( {} );
	const constrainer: Constrainer = ( target, handleName ) => {
		const [ min, max ] = getPixelMinMax(
			target,
			maxHeight ?? Infinity,
			maxWidth ?? Infinity,
			minHeight,
			minWidth
		);
		const usedMax = propBounds
			? getMaxFromBounds(
					target,
					propBounds,
					handleName,
					boundsByDirection,
					scale,
					...max
			  )
			: max;
		// TODO: There may be a potential optimization if min and max are used to apply
		// styles – /(min|max)-(width|height)/. Maybe clamping in the specializer could
		// be avoided. Likely not worthwhile as it may be more complex given that the
		// applied the styles would need to revert when not resizing because they could
		// be specified with % or other non-pixel units.
		return [ min, usedMax ];
	};
	const specializer: Specializer = ( state ) => {
		let [ xDiff, yDiff ] = state.difference;
		const [ xResizeRatio, yResizeRatio ] = Array.isArray( resizeRatio )
			? resizeRatio
			: [ resizeRatio, resizeRatio ];
		xDiff *= xResizeRatio / scale;
		yDiff *= yResizeRatio / scale;
		const [ fromWidth, fromHeight ] = state.from;
		let newWidth, newHeight, aspectRatio;
		if ( lockAspectRatio ) {
			aspectRatio =
				typeof lockAspectRatio === 'number'
					? lockAspectRatio
					: fromWidth / fromHeight;
			// As the aspect ratio is fixed both width and height can be calculated from
			// either the xDiff or yDiff but either can be 0. yDiff is used unless it’s 0.
			// This is how re-resizable works though it means that corner handles are
			// effectively top/bottom handles i.e. sizing only responds vertically.
			// It would seem nicer UX to use whichever diff is greater but that can feel a
			// bit unpredictable as well. Perhaps there’s a something else that could work
			// better. If not, it may be worth recommending that when using
			// `lockAspectRatio` to only enable handles on sides and not corners.
			if ( yDiff !== 0 ) {
				newHeight = fromHeight + yDiff;
				const coreHeight = newHeight - extraHeight;
				newWidth = coreHeight * aspectRatio + extraWidth;
			} else {
				newWidth = fromWidth + xDiff;
				const coreWidth = newWidth - extraWidth;
				newHeight = coreWidth / aspectRatio + extraHeight;
			}
		} else {
			newWidth = fromWidth + xDiff;
			newHeight = fromHeight + yDiff;
		}
		const [ min, max ] = state.constraints;
		if ( snap && snap.x ) {
			newWidth = findClosestSnap( newWidth, snap.x, snapGap );
		}
		if ( snap && snap.y ) {
			newHeight = findClosestSnap( newHeight, snap.y, snapGap );
		}
		if ( xGrid !== DEFAULT_GRID_WIDTH || yGrid !== DEFAULT_GRID_HEIGHT ) {
			const newGridWidth = roundBy( newWidth, xGrid );
			const newGridHeight = roundBy( newHeight, yGrid );
			const gap = snapGap || 0;
			const w =
				gap === 0 || Math.abs( newGridWidth - newWidth ) <= gap
					? newGridWidth
					: newWidth;
			const h =
				gap === 0 || Math.abs( newGridHeight - newHeight ) <= gap
					? newGridHeight
					: newHeight;
			newWidth = w;
			newHeight = h;
		}
		if ( aspectRatio ) {
			[ newWidth, newHeight ] = getAspectRatioBoundSize(
				aspectRatio,
				newWidth,
				newHeight,
				extraHeight,
				extraWidth,
				[ min, max ]
			);
		} else {
			const [ wMin, hMin ] = min;
			const [ wMax, hMax ] = max;
			newWidth = xDiff !== 0 ? clamp( newWidth, wMin, wMax ) : undefined;
			newHeight =
				yDiff !== 0 ? clamp( newHeight, hMin, hMax ) : undefined;
		}
		// Converts values to unitized strings. Applicable only if `size` or `defaultSize`
		// had a non-pixel unit.
		const sizeUnits = sizeUnitsRef.current;
		let newWidthWithUnit;
		if ( sizeUnits.width !== undefined && newWidth !== undefined ) {
			const { pixelsPerUnit, unit } = sizeUnits.width;
			newWidthWithUnit = `${ newWidth / pixelsPerUnit }${ unit }`;
		}
		let newHeightWithUnit;
		if ( sizeUnits.height !== undefined && newHeight !== undefined ) {
			const { pixelsPerUnit, unit } = sizeUnits.height;
			newHeightWithUnit = `${ newHeight / pixelsPerUnit }${ unit }`;
		}
		return {
			size: [ newWidth, newHeight ],
			styleSize: [ newWidthWithUnit, newHeightWithUnit ],
		};
	};
	// Creates a function to adapt the resize callbacks of the hook to those of
	// ResizableBox as their signatures are different.
	const makeResizeCallbackAdapter: (
		callback?: ResizeCallback
	) => ResizableHookHandler = ( callback ) => ( state ) => {
		const [ fromWidth, fromHeight ] = state.startSize;
		const [ toWidth, toHeight ] = state.size;
		if ( rootRef.current && callback ) {
			callback( state.event, state.handleName, rootRef.current, {
				width: toWidth - fromWidth,
				height: toHeight - fromHeight,
			} );
		}
	};
	const [ userSizeKey, setUserSizeKey ] = useState( '' );
	const adaptedResizeStop = makeResizeCallbackAdapter( onResizeStop );
	const [ resizableRef, bindResizableHandle ] = useResizableBox( {
		constraints: constrainer,
		onResize: makeResizeCallbackAdapter( onResize ),
		onResizeStart: ( state ) => {
			const { handleName, event } = state;
			if ( ! rootRef.current ) {
				return;
			}
			onResizeStart?.( event, handleName, rootRef.current );
			// TODO: this could be a use case for returning a value that the hook
			// keeps in the `memo` along with its own use of that. Then no local
			// ref would be needed. Of course, the hook would also need to include
			// the value in the state passed to specializer since that’s where this
			// is used.
			sizeUnitsRef.current = getUnitMeasures(
				size || defaultSize || {},
				rootRef.current
			);
		},
		onResizeStop: ( state ) => {
			adaptedResizeStop( state );
			const [ toWidth, toHeight ] = state.size;
			// re-resizable sets its internal size state to that of the `size` prop after
			// resizing stops and thereby flushes any state changes made while resizing.
			// This leads to the same effect. The specific value set here isn’t important
			// just whether it differs and therby causes a render.
			setUserSizeKey( `${ toWidth }/${ toHeight }` );
		},
		specializer,
	} );
	const handles = [];
	for ( const key of HANDLE_KEYS ) {
		if ( enable && ! enable[ key ] ) {
			continue;
		}
		const hasCustomHandle = handleComponent && key in handleComponent;
		const customHandleDependentProps = hasCustomHandle
			? { children: handleComponent[ key ] }
			: // The default handle is made focusable to keep focus from moving to an
			  // ancestor and potentially triggering other behaviors.
			  // TODO: consider if putting this on the wrapper of all the handles
			  // would suffice and be better for simplicity.
			  { tabIndex: -1 };
		// The onKeyDown and onKeyUp handlers are destructured only to omit them.
		const { onKeyDown, onKeyUp, ...boundHandlers } =
			bindResizableHandle( key );
		handles.push(
			// Note: these elements are interactive and therefore should have a role or
			// be a semantic element (button). Using a div is for the sake of doing as
			// re-resizable did. Perhaps a button can be used in case there is no
			// custom handle specified but otherwise those may already contain a button.
			<div
				key={ key }
				className={
					// Skips applying classes if handleClasses was specified as a falsy value.
					( 'handleClasses' in props && handleClasses ) ||
					! ( 'handleClasses' in props )
						? clsx( HANDLE_CLASSES[ key ], handleClasses?.[ key ] )
						: undefined
				}
				style={ {
					...BASE_HANDLE_STYLE,
					...RERESIZABLE_HANDLE_STYLES[ key ],
					...handleStyles[ key ],
				} }
				{ ...customHandleDependentProps }
				{ ...boundHandlers }
			/>
		);
	}
	const effectSizeOnStop = useEffectSizeOnStop( size, userSizeKey );
	return (
		<TagOrComponent
			className={ clsx(
				'components-resizable-box__container',
				showHandle && 'has-show-handle',
				className
			) }
			ref={ useMergeRefs( [ rootRef, resizableRef, effectSizeOnStop ] ) }
			style={ {
				...BASE_STYLE,
				...style,
				...( size || defaultSize ),
				maxHeight,
				maxWidth,
				minHeight,
				minWidth,
			} }
			{ ...restProps }
		>
			{ children }
			{ showTooltip && <ResizeTooltip { ...tooltipProps } /> }
			<div className={ handleWrapperClass } style={ handleWrapperStyle }>
				{ handles }
			</div>
		</TagOrComponent>
	);
}

export const ResizableBox = forwardRef( UnforwardedResizableBox );

export default ResizableBox;
