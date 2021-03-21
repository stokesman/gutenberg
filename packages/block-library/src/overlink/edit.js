/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useState, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	KeyboardShortcuts,
	TextControl,
	ToolbarButton,
	Popover,
} from '@wordpress/components';
import {
	AlignmentControl,
	BlockControls,
	InspectorAdvancedControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	__experimentalLinkControl as LinkControl,
	Warning,
} from '@wordpress/block-editor';
import { rawShortcut, displayShortcut } from '@wordpress/keycodes';
import { link, linkOff } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';

const { name: blockName } = metadata;

const NEW_TAB_REL = 'noreferrer noopener';

function URLPicker( {
	mayOpen,
	url,
	setAttributes,
	opensInNewTab,
	onToggleOpenInNewTab,
	anchorRef,
} ) {
	const [ isURLPickerOpen, setIsURLPickerOpen ] = useState( false );
	const urlIsSet = !! url;
	const openLinkControl = () => {
		setIsURLPickerOpen( true );
		return false; // prevents default behaviour for event
	};
	const unlinkButton = () => {
		setAttributes( {
			url: undefined,
			linkTarget: undefined,
			rel: undefined,
		} );
		setIsURLPickerOpen( false );
	};
	const linkControl = ( isURLPickerOpen || urlIsSet ) && mayOpen && (
		<Popover
			position="bottom center"
			onClose={ () => setIsURLPickerOpen( false ) }
			anchorRef={ anchorRef?.current }
		>
			<LinkControl
				className="wp-block-navigation-link__inline-link-input"
				value={ { url, opensInNewTab } }
				onChange={ ( {
					url: newHref = '',
					opensInNewTab: newOpensInNewTab,
				} ) => {
					setAttributes( { href: newHref } );

					if ( opensInNewTab !== newOpensInNewTab ) {
						onToggleOpenInNewTab( newOpensInNewTab );
					}
				} }
			/>
		</Popover>
	);
	return (
		<>
			{ ! urlIsSet && (
				<ToolbarButton
					name="link"
					icon={ link }
					title={ __( 'Link' ) }
					shortcut={ displayShortcut.primary( 'k' ) }
					onClick={ openLinkControl }
				/>
			) }
			{ urlIsSet && (
				<ToolbarButton
					name="link"
					icon={ linkOff }
					title={ __( 'Unlink' ) }
					shortcut={ displayShortcut.primaryShift( 'k' ) }
					onClick={ unlinkButton }
					isActive={ true }
				/>
			) }
			{ mayOpen && (
				<KeyboardShortcuts
					bindGlobal
					shortcuts={ {
						[ rawShortcut.primary( 'k' ) ]: openLinkControl,
						[ rawShortcut.primaryShift( 'k' ) ]: unlinkButton,
					} }
				/>
			) }
			{ linkControl }
		</>
	);
}

function OverlinkEdit( props ) {
	const {
		attributes: { href, linkTarget, placeholder, rel, text, textAlign },
		clientId,
		setAttributes,
		isSelected,
		onReplace,
		mergeBlocks,
	} = props;

	const onSetLinkRel = useCallback(
		( value ) => {
			setAttributes( { rel: value } );
		},
		[ setAttributes ]
	);

	const onToggleOpenInNewTab = useCallback(
		( value ) => {
			const newLinkTarget = value ? '_blank' : undefined;

			let updatedRel = rel;
			if ( newLinkTarget && ! rel ) {
				updatedRel = NEW_TAB_REL;
			} else if ( ! newLinkTarget && rel === NEW_TAB_REL ) {
				updatedRel = undefined;
			}

			setAttributes( {
				linkTarget: newLinkTarget,
				rel: updatedRel,
			} );
		},
		[ rel, setAttributes ]
	);

	const setText = ( newText ) => {
		// Remove anchor tags from text content.
		setAttributes( { text: newText.replace( /<\/?a[^>]*>/g, '' ) } );
	};

	const [ isVisualEditMode, isSoleOrFirstOfType ] = useSelect(
		( select ) => {
			const store = select( blockEditorStore );
			const parentList = store.getBlockParents( clientId );
			const parentId = parentList.at( -1 );
			const siblingList = store.getBlocks( parentId );
			const likeSiblingList = siblingList.filter(
				( block ) => block.name === blockName
			);
			return [
				'visual' === store.getBlockMode( clientId ) &&
					! store.isNavigationMode(),
				likeSiblingList[ 0 ].clientId === clientId,
			];
		},
		[ clientId ]
	);

	const ref = useRef();
	const blockProps = useBlockProps( {
		ref,
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	return (
		<>
			<BlockControls group="block">
				<URLPicker
					url={ href }
					setAttributes={ setAttributes }
					mayOpen={ isSelected && isVisualEditMode }
					opensInNewTab={ linkTarget === '_blank' }
					onToggleOpenInNewTab={ onToggleOpenInNewTab }
					anchorRef={ ref }
				/>
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<div { ...blockProps }>
				<RichText
					tagName="a"
					aria-label={ __( 'Link text' ) }
					placeholder={ placeholder || __( 'Add text…' ) }
					value={ text }
					onChange={ ( value ) => setText( value ) }
					onReplace={ onReplace }
					onMerge={ mergeBlocks }
					identifier="text"
					textAlign={ textAlign }
					withoutInteractiveFormatting
				/>
				{ ! isSoleOrFirstOfType && (
					<Warning>
						{ __(
							'Only one Overlink per containing block is recommended.'
						) }
					</Warning>
				) }
			</div>
			<InspectorAdvancedControls>
				<TextControl
					label={ __( 'Link rel' ) }
					value={ rel || '' }
					onChange={ onSetLinkRel }
				/>
			</InspectorAdvancedControls>
		</>
	);
}

export default OverlinkEdit;
