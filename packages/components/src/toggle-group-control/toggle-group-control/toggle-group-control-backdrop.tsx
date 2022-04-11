/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { useReducedMotion } from 'framer-motion';

/**
 * WordPress dependencies
 */
import {
	useLayoutEffect,
	useReducer,
	useState,
	memo,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ToggleGroupControlBackdropProps } from '../types';
import { useToggleGroupControlContext } from '../context';
import { CONFIG } from '../../utils';
import { AnimatedBackdrop } from './styles';

const TRANSITION_CONFIG = {
	type: 'tween',
	ease: [ 0.25, 0.1, 0.25, 1 ],
	// Transition durations in the config are expressed as a string in milliseconds,
	// while `framer-motion` needs them as integers in seconds.
	duration: parseInt( CONFIG.transitionDurationFast, 10 ) / 1000,
};

const needsLayoutReducer = () => ( {} );

function ToggleGroupControlBackdrop( {
	containerRef,
	containerSizes,
}: ToggleGroupControlBackdropProps ) {
	const shouldReduceMotion = useReducedMotion();
	const { items, state, isBlock } = useToggleGroupControlContext();

	const [ itemSizes, setItemSizes ] = useState<
		| null
		| {
				width: number;
				left: number;
		  }[]
	>( null );
	const [ needsLayout, relayout ] = useReducer( needsLayoutReducer, {} );

	const selectedItemIndex = items.findIndex(
		// All valid children (e.g. extending `ToggleGroupControlOptionBase`)
		// have a `data-value` attribute.
		( item ) =>
			typeof state !== 'undefined' &&
			item.ref.current?.dataset.value === `${ state }`
	);

	// `useLayoutEffect` is necessary because we need to wait for the DOM
	// mutations to take effect before reading the new element's sizes and offsets.
	useLayoutEffect( () => {
		const { current: containerNode } = containerRef;
		if ( ! containerNode ) return;
		const { offsetWidth: containerFullWidth } = containerNode;
		const { width: containerWidth } = containerNode.getBoundingClientRect();
		// If these widths are different then the component is scaled and likely
		// animating. Uses the next animation frame to trigger this hook again.
		if ( Math.round( containerWidth ) !== containerFullWidth ) {
			requestAnimationFrame( relayout );
			return;
		}
		const sizeList = items.map( ( item ) => {
			const size = { left: 0, width: 0 };
			const optionWrapper = item.ref.current?.closest(
				'[data-toggle-group-control-option-wrapper="true"]'
			) as HTMLElement | null;
			if ( ! optionWrapper ) return size;
			const {
				offsetParent,
				ownerDocument: { defaultView },
			} = optionWrapper;
			if ( ! offsetParent || ! defaultView ) return size;
			const { width, left } = optionWrapper.getBoundingClientRect();
			// It's important that the `offsetParent` of each `<Radio>` option is the
			// inner wrapper of `ToggleGroupControl` — which means that in the DOM tree
			// between that wrapper and each `<Radio>` component there can't be any
			// element with `position: relative` or `position: absolute`.
			// See https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetLeft
			const offsetRect = offsetParent.getBoundingClientRect();
			const { borderWidth } = defaultView.getComputedStyle(
				offsetParent
			);
			size.width = width;
			size.left = left - offsetRect.left - parseInt( borderWidth );
			return size;
		} );
		setItemSizes( sizeList );
	}, [ ...Object.values( containerSizes ), items, isBlock, needsLayout ] );

	if ( selectedItemIndex >= 0 && itemSizes ) {
		let motionProps = {};
		if ( ! shouldReduceMotion && itemSizes[ selectedItemIndex ] ) {
			motionProps = {
				transition: TRANSITION_CONFIG,
				initial: false,
				animate: {
					width: itemSizes[ selectedItemIndex ].width,
					x: `${ itemSizes[ selectedItemIndex ].left }px`,
				},
			};
		}
		return <AnimatedBackdrop role="presentation" { ...motionProps } />;
	}
	return null;
}

export default memo( ToggleGroupControlBackdrop );
