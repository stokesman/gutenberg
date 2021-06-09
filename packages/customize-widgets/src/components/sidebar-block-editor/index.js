/**
 * External dependencies
 */
import { defaultTo } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useReducer,
	useRef,
	createPortal,
} from '@wordpress/element';
import {
	BlockList,
	BlockTools,
	BlockSelectionClearer,
	BlockInspector,
	ObserveTyping,
	WritingFlow,
	BlockEditorKeyboardShortcuts,
	__unstableBlockSettingsMenuFirstItem,
} from '@wordpress/block-editor';
import { uploadMedia } from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import BlockInspectorButton from '../block-inspector-button';
import Header from '../header';
import useInserter from '../inserter/use-inserter';
import SidebarEditorProvider from './sidebar-editor-provider';
import { store as customizeWidgetsStore } from '../../store';
import WelcomeGuide from '../welcome-guide';
import KeyboardShortcuts from '../keyboard-shortcuts';

/**
 * Tracks scroll position and returns the number of pixels scrolled upward from
 * the greatest scroll position last reached.
 *
 * @param {HTMLElement} element  The scrolling element to track.
 * @param {?number}     max      The maximum return value.
 *
 * @return {number} The number of pixels scrolled upward.
 */
function useScrollback( element, max = Infinity ) {
	const lastScrollTop = useRef( element.scrollTop );

	const reducer = useCallback( ( scrollback, { target: { scrollTop } } ) => {
		const scrollDiff = scrollTop - lastScrollTop.current;
		lastScrollTop.current = scrollTop;

		// If scrolling upward increases or constrains to max otherwise
		// if not already zero, decreases or constrains to zero.
		if ( scrollDiff < 0 ) {
			scrollback = Math.min( max, scrollback - scrollDiff );
		} else if ( scrollback > 0 ) {
			scrollback = Math.max( 0, scrollback - scrollDiff );
		}
		return scrollback;
	}, [] );
	const [ value, onScroll ] = useReducer( reducer, 0 );

	useEffect( () => {
		const options = { passive: true };
		element.addEventListener( 'scroll', onScroll, options );
		return () => element.removeEventListener( 'scroll', onScroll, options );
	}, [] );

	return value;
}

export default function SidebarBlockEditor( {
	blockEditorSettings,
	activeSidebarControl,
} ) {
	const {
		sidebarAdapter: sidebar,
		inserter,
		inspector,
		sectionInstance: {
			containerParent: [ { parentNode: scrollingContext } ],
			contentContainer: [ { firstElementChild: sectionMeta } ],
		},
	} = activeSidebarControl;
	const [ isInserterOpened, setIsInserterOpened ] = useInserter( inserter );
	const {
		hasUploadPermissions,
		isFixedToolbarActive,
		keepCaretInsideBlock,
		isWelcomeGuideActive,
	} = useSelect( ( select ) => {
		return {
			hasUploadPermissions: defaultTo(
				select( coreStore ).canUser( 'create', 'media' ),
				true
			),
			isFixedToolbarActive: select(
				customizeWidgetsStore
			).__unstableIsFeatureActive( 'fixedToolbar' ),
			keepCaretInsideBlock: select(
				customizeWidgetsStore
			).__unstableIsFeatureActive( 'keepCaretInsideBlock' ),
			isWelcomeGuideActive: select(
				customizeWidgetsStore
			).__unstableIsFeatureActive( 'welcomeGuide' ),
		};
	}, [] );
	const settings = useMemo( () => {
		let mediaUploadBlockEditor;
		if ( hasUploadPermissions ) {
			mediaUploadBlockEditor = ( { onError, ...argumentsObject } ) => {
				uploadMedia( {
					wpAllowedMimeTypes: blockEditorSettings.allowedMimeTypes,
					onError: ( { message } ) => onError( message ),
					...argumentsObject,
				} );
			};
		}

		return {
			...blockEditorSettings,
			__experimentalSetIsInserterOpened: setIsInserterOpened,
			mediaUpload: mediaUploadBlockEditor,
			hasFixedToolbar: isFixedToolbarActive,
			keepCaretInsideBlock,
		};
	}, [
		hasUploadPermissions,
		blockEditorSettings,
		isFixedToolbarActive,
		keepCaretInsideBlock,
	] );

	// The top of the editor header is offset by the Customizer’s section meta
	// which changes according to scroll position and the top of the block
	// toolbars are offset by the header.
	const sectionMetaHeight = sectionMeta.offsetHeight;
	const scrollback = useScrollback( scrollingContext, sectionMetaHeight );
	const [ headerHeight, updateHeaderHeight ] = useReducer(
		( height, { offsetHeight } ) => offsetHeight,
		0
	);
	const headerRef = useRefEffect( updateHeaderHeight, [] );
	const blockToolbarOffset = scrollback + headerHeight;

	// Positions the section meta/header according to scrollback in order to
	// recreate the Customizer’s “sticky” implementation.
	useLayoutEffect( () => {
		sectionMeta.style.top = -sectionMetaHeight + scrollback + 'px';
	}, [ scrollback ] );

	if ( isWelcomeGuideActive ) {
		return <WelcomeGuide sidebar={ sidebar } />;
	}

	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />
			<KeyboardShortcuts.Register />

			<SidebarEditorProvider sidebar={ sidebar } settings={ settings }>
				<BlockEditorKeyboardShortcuts />
				<KeyboardShortcuts
					undo={ sidebar.undo }
					redo={ sidebar.redo }
					save={ sidebar.save }
				/>

				<Header
					ref={ headerRef }
					sidebar={ sidebar }
					inserter={ inserter }
					isInserterOpened={ isInserterOpened }
					setIsInserterOpened={ setIsInserterOpened }
					isFixedToolbarActive={ isFixedToolbarActive }
					stickyTop={ scrollback }
				/>

				<BlockTools
					__experimentalStickyTop={ blockToolbarOffset }
					__experimentalStickier
				>
					<BlockSelectionClearer>
						<WritingFlow>
							<ObserveTyping>
								<BlockList />
							</ObserveTyping>
						</WritingFlow>
					</BlockSelectionClearer>
				</BlockTools>

				{ createPortal(
					// This is a temporary hack to prevent button component inside <BlockInspector>
					// from submitting form when type="button" is not specified.
					<form onSubmit={ ( event ) => event.preventDefault() }>
						<BlockInspector />
					</form>,
					inspector.contentContainer[ 0 ]
				) }
			</SidebarEditorProvider>

			<__unstableBlockSettingsMenuFirstItem>
				{ ( { onClose } ) => (
					<BlockInspectorButton
						inspector={ inspector }
						closeMenu={ onClose }
					/>
				) }
			</__unstableBlockSettingsMenuFirstItem>
		</>
	);
}
