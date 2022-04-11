/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { useReducedMotion } from 'framer-motion';

/**
 * WordPress dependencies
 */
// import { memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
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

export default function ToggleGroupControlBackdrop() {
	const { isMount } = useToggleGroupControlContext();
	let motionProps = {};
	if ( ! useReducedMotion() && ! isMount ) {
		motionProps = {
			layoutId: 'backdrop',
			layout: 'position',
			transition: { layout: TRANSITION_CONFIG },
		};
	}
	return <AnimatedBackdrop role="presentation" { ...motionProps } />;
}

// export default memo( ToggleGroupControlBackdrop );
