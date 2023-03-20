/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useSetting,
	getCustomValueFromPreset,
	getSpacingPresetCssVar,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	ResizableBox,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
} from '@wordpress/components';
import { useState, useEffect, useMemo, useRef } from '@wordpress/element';
import { View } from '@wordpress/primitives';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SpacerControls from './controls';
import { MIN_SPACER_SIZE } from './constants';

const ResizableSpacer = ( {
	orientation,
	onResizeStart,
	onResize,
	onResizeStop,
	isSelected,
	isResizing,
	setIsResizing,
	...props
} ) => {
	const getCurrentSize = ( elt ) => {
		return orientation === 'horizontal'
			? elt.clientWidth
			: elt.clientHeight;
	};

	return (
		<ResizableBox
			className={ classnames( 'block-library-spacer__resize-container', {
				'resize-horizontal': orientation === 'horizontal',
				'is-resizing': isResizing,
				'is-selected': isSelected,
			} ) }
			onResizeStart={ ( _event, _direction, elt ) => {
				const nextVal = getCurrentSize( elt );
				onResizeStart( nextVal );
				onResize( nextVal );
			} }
			onResize={ ( _event, _direction, elt ) => {
				onResize( getCurrentSize( elt ) );
				if ( ! isResizing ) {
					setIsResizing( true );
				}
			} }
			onResizeStop={ ( _event, _direction, elt ) => {
				onResizeStop( getCurrentSize( elt ) );
				setIsResizing( false );
			} }
			__experimentalShowTooltip={ true }
			__experimentalTooltipProps={ {
				axis: orientation === 'horizontal' ? 'x' : 'y',
				position: 'corner',
				isVisible: isResizing,
			} }
			showHandle={ isSelected }
			{ ...props }
		/>
	);
};

const SpacerEdit = ( {
	attributes,
	isSelected,
	setAttributes,
	toggleSelection,
	context,
	__unstableParentLayout: parentLayout,
	className,
} ) => {
	const disableCustomSpacingSizes = useSelect( ( select ) => {
		const editorSettings = select( blockEditorStore ).getSettings();
		return editorSettings?.disableCustomSpacingSizes;
	} );
	const { orientation } = context;
	const { orientation: parentOrientation, type } = parentLayout || {};
	// Check if the spacer is inside a flex container.
	const isFlexLayout = type === 'flex';
	// If the spacer is inside a flex container, it should either inherit the orientation
	// of the parent or use the flex default orientation.
	const inheritedOrientation =
		! parentOrientation && isFlexLayout
			? 'horizontal'
			: parentOrientation || orientation;
	const usedOrientation = orientation || inheritedOrientation || 'vertical';

	const { height, width, style: blockStyle = {} } = attributes;

	const { layout = {} } = blockStyle;
	const { selfStretch, flexSize } = layout;

	const spacingSizes = useSetting( 'spacing.spacingSizes' );

	const [ isResizing, setIsResizing ] = useState( false );
	const [ temporaryHeight, setTemporaryHeight ] = useState( null );
	const [ temporaryWidth, setTemporaryWidth ] = useState( null );

	const flowedSize =
		! isFlexLayout && usedOrientation === 'horizontal' ? width : height;
	const [ , parsedUnit ] = parseQuantityAndUnitFromRawValue(
		flexSize || flowedSize
	);

	const refBlockElement = useRef();
	const pxPerUnit = useRef();

	// Calculates the pixels per unit when the unit has changed.
	useEffect( () => {
		if ( parsedUnit === 'px' ) return;

		const blockEl = refBlockElement.current;
		const side = usedOrientation === 'horizontal' ? 'width' : 'height';
		const styleKey = isFlexLayout ? 'flexBasis' : side;
		const styledSize = blockEl.style[ styleKey ];
		// In the interest of precision, before reading the computed height the
		// styled height set to 1 in the current unit.
		blockEl.style[ styleKey ] = `1${ parsedUnit }`;
		let measuredSize;
		if ( parsedUnit === '%' )
			measuredSize = blockEl.getBoundingClientRect()[ side ];
		else
			( { [ styleKey ]: measuredSize } =
				blockEl.ownerDocument.defaultView.getComputedStyle( blockEl ) );
		pxPerUnit.current = parseFloat( measuredSize );
		console.log('-- - - ', { styleKey, styledSize, measuredSize })
		blockEl.style[ styleKey ] = styledSize;
	}, [ parsedUnit, usedOrientation, isFlexLayout ] );

	const onResize = useMemo( () => {
		const setter =
			( orientation || inheritedOrientation ) === 'vertical'
				? setTemporaryWidth
				: setTemporaryHeight;
		return parsedUnit === 'px'
			? ( v ) => setter( v + 'px' )
			: ( sizeValue ) => {
					console.log('setting temporary', sizeValue, pxPerUnit.current, parsedUnit )
					setter( sizeValue / pxPerUnit.current + parsedUnit );
			  };
	}, [ inheritedOrientation, orientation, parsedUnit ] );

	const onResizeStart = () => toggleSelection( false );
	const onResizeStop = () => toggleSelection( true );

	const handleOnVerticalResizeStop = ( newHeight ) => {
		onResizeStop();

		const heightInUnit = `${
			newHeight / ( pxPerUnit.current ?? 1 )
		}${ parsedUnit }`;

		if ( isFlexLayout ) {
			setAttributes( {
				style: {
					...blockStyle,
					layout: {
						...layout,
						flexSize: heightInUnit,
						selfStretch: 'fixed',
					},
				},
			} );
		}

		setAttributes( { height: heightInUnit } );
		setTemporaryHeight( null );
	};

	const handleOnHorizontalResizeStop = ( newWidth ) => {
		onResizeStop();

		const widthInUnit = `${
			newWidth / ( pxPerUnit.current ?? 1 )
		}${ parsedUnit }`;

		if ( isFlexLayout ) {
			setAttributes( {
				style: {
					...blockStyle,
					layout: {
						...layout,
						flexSize: widthInUnit,
						selfStretch: 'fixed',
					},
				},
			} );
		}

		setAttributes( { width: widthInUnit } );
		setTemporaryWidth( null );
	};

	const getHeightForVerticalBlocks = () => {
		if ( isFlexLayout ) {
			return undefined;
		}
		return temporaryHeight || getSpacingPresetCssVar( height ) || undefined;
	};

	const getWidthForHorizontalBlocks = () => {
		if ( isFlexLayout ) {
			return undefined;
		}
		return temporaryWidth || getSpacingPresetCssVar( width ) || undefined;
	};

	const sizeConditionalOnOrientation =
		inheritedOrientation === 'horizontal'
			? temporaryWidth || flexSize
			: temporaryHeight || flexSize;

	const style = {
		height:
			inheritedOrientation === 'horizontal'
				? 24
				: getHeightForVerticalBlocks(),
		width:
			inheritedOrientation === 'horizontal'
				? getWidthForHorizontalBlocks()
				: undefined,
		// In vertical flex containers, the spacer shrinks to nothing without a minimum width.
		minWidth:
			inheritedOrientation === 'vertical' && isFlexLayout
				? 48
				: undefined,
		// Add flex-basis so temporary sizes are respected.
		flexBasis: isFlexLayout ? sizeConditionalOnOrientation : undefined,
		// Remove flex-grow when resizing.
		flexGrow: isFlexLayout && isResizing ? 0 : undefined,
	};

	const resizableBoxWithOrientation = ( blockOrientation ) => {
		if ( blockOrientation === 'horizontal' ) {
			return (
				<ResizableSpacer
					minWidth={ MIN_SPACER_SIZE }
					enable={ {
						top: false,
						right: true,
						bottom: false,
						left: false,
						topRight: false,
						bottomRight: false,
						bottomLeft: false,
						topLeft: false,
					} }
					orientation={ blockOrientation }
					onResizeStart={ onResizeStart }
					onResize={ onResize }
					onResizeStop={ handleOnHorizontalResizeStop }
					isSelected={ isSelected }
					isResizing={ isResizing }
					setIsResizing={ setIsResizing }
				/>
			);
		}

		return (
			<>
				<ResizableSpacer
					minHeight={ MIN_SPACER_SIZE }
					enable={ {
						top: false,
						right: false,
						bottom: true,
						left: false,
						topRight: false,
						bottomRight: false,
						bottomLeft: false,
						topLeft: false,
					} }
					orientation={ blockOrientation }
					onResizeStart={ onResizeStart }
					onResize={ onResize }
					onResizeStop={ handleOnVerticalResizeStop }
					isSelected={ isSelected }
					isResizing={ isResizing }
					setIsResizing={ setIsResizing }
				/>
			</>
		);
	};

	useEffect( () => {
		if (
			isFlexLayout &&
			selfStretch !== 'fill' &&
			selfStretch !== 'fit' &&
			! flexSize
		) {
			if ( inheritedOrientation === 'horizontal' ) {
				// If spacer is moving from a vertical container to a horizontal container,
				// it might not have width but have height instead.
				const newSize =
					getCustomValueFromPreset( width, spacingSizes ) ||
					getCustomValueFromPreset( height, spacingSizes ) ||
					'100px';
				setAttributes( {
					width: '0px',
					style: {
						...blockStyle,
						layout: {
							...layout,
							flexSize: newSize,
							selfStretch: 'fixed',
						},
					},
				} );
			} else {
				const newSize =
					getCustomValueFromPreset( height, spacingSizes ) ||
					getCustomValueFromPreset( width, spacingSizes ) ||
					'100px';
				setAttributes( {
					height: '0px',
					style: {
						...blockStyle,
						layout: {
							...layout,
							flexSize: newSize,
							selfStretch: 'fixed',
						},
					},
				} );
			}
		} else if (
			isFlexLayout &&
			( selfStretch === 'fill' || selfStretch === 'fit' )
		) {
			if ( inheritedOrientation === 'horizontal' ) {
				setAttributes( {
					width: undefined,
				} );
			} else {
				setAttributes( {
					height: undefined,
				} );
			}
		} else if ( ! isFlexLayout && ( selfStretch || flexSize ) ) {
			if ( inheritedOrientation === 'horizontal' ) {
				setAttributes( {
					width: flexSize,
				} );
			} else {
				setAttributes( {
					height: flexSize,
				} );
			}
			setAttributes( {
				style: {
					...blockStyle,
					layout: {
						...layout,
						flexSize: undefined,
						selfStretch: undefined,
					},
				},
			} );
		}
	}, [
		blockStyle,
		flexSize,
		height,
		inheritedOrientation,
		isFlexLayout,
		layout,
		selfStretch,
		setAttributes,
		spacingSizes,
		width,
	] );

	return (
		<>
			<View
				{ ...useBlockProps( {
					style,
					className: classnames( className, {
						'custom-sizes-disabled': disableCustomSpacingSizes,
					} ),
					ref: refBlockElement,
				} ) }
			>
				{ resizableBoxWithOrientation( inheritedOrientation ) }
			</View>
			{ ! isFlexLayout && (
				<SpacerControls
					setAttributes={ setAttributes }
					height={ temporaryHeight || height }
					width={ temporaryWidth || width }
					orientation={ inheritedOrientation }
				/>
			) }
		</>
	);
};

export default SpacerEdit;
