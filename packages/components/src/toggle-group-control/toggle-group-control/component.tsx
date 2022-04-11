/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { RadioGroup, useRadioState } from 'reakit';
// eslint-disable-next-line no-restricted-imports
import { LayoutGroup } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { useInstanceId, usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../../ui/context';
import { useUpdateEffect, useCx } from '../../utils/hooks';
import { View } from '../../view';
import BaseControl from '../../base-control';
import type { ToggleGroupControlProps } from '../types';
import ToggleGroupControlContext from '../context';
import * as styles from './styles';

const noop = () => {};

function ToggleGroupControl(
	props: WordPressComponentProps< ToggleGroupControlProps, 'input' >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		className,
		isAdaptiveWidth = false,
		isBlock = false,
		label,
		hideLabelFromVision = false,
		help,
		onChange = noop,
		value,
		children,
		...otherProps
	} = useContextSystem( props, 'ToggleGroupControl' );
	const cx = useCx();
	const baseId = useInstanceId(
		ToggleGroupControl,
		'toggle-group-control'
	).toString();
	const radio = useRadioState( {
		baseId,
		state: value,
	} );
	const previousValue = usePrevious( value );

	// Propagate radio.state change.
	useUpdateEffect( () => {
		// Avoid calling onChange if radio state changed
		// from incoming value.
		if ( previousValue !== radio.state ) {
			onChange( radio.state );
		}
	}, [ radio.state ] );

	// Sync incoming value with radio.state.
	useUpdateEffect( () => {
		if ( value !== radio.state ) {
			radio.setState( value );
		}
	}, [ value ] );

	const isMount = useRef( true );
	useEffect( () => void ( isMount.current = false ), [] );

	const staleState = usePrevious( radio.state );

	const classes = useMemo(
		() =>
			cx(
				styles.ToggleGroupControl,
				isBlock && styles.block,
				'medium',
				className
			),
		[ className, cx, isBlock ]
	);
	return (
		<BaseControl help={ help }>
			<ToggleGroupControlContext.Provider
				value={ {
					...radio,
					isBlock: ! isAdaptiveWidth,
					staleState,
					isMount: isMount.current,
				} }
			>
				{ ! hideLabelFromVision && (
					<div>
						<BaseControl.VisualLabel>
							{ label }
						</BaseControl.VisualLabel>
					</div>
				) }
				<RadioGroup
					{ ...radio }
					aria-label={ label }
					as={ View }
					className={ classes }
					{ ...otherProps }
					ref={ forwardedRef }
				>
					<LayoutGroup id={ baseId }>{ children }</LayoutGroup>
				</RadioGroup>
			</ToggleGroupControlContext.Provider>
		</BaseControl>
	);
}

/**
 * `ToggleGroupControl` is a form component that lets users choose options
 * represented in horizontal segments. To render options for this control use
 * `ToggleGroupControlOption` component.
 *
 * Only use this control when you know for sure the labels of items inside won't
 * wrap. For items with longer labels, you can consider a `SelectControl` or a
 * `CustomSelectControl` component instead.
 *
 * @example
 * ```jsx
 * import {
 *   __experimentalToggleGroupControl as ToggleGroupControl,
 *   __experimentalToggleGroupControlOption as ToggleGroupControlOption,
 * } from '@wordpress/components';
 *
 * function Example() {
 *   return (
 *     <ToggleGroupControl label="my label" value="vertical" isBlock>
 *       <ToggleGroupControlOption value="horizontal" label="Horizontal" />
 *       <ToggleGroupControlOption value="vertical" label="Vertical" />
 *     </ToggleGroupControl>
 *   );
 * }
 * ```
 */
const ConnectedToggleGroupControl = contextConnect(
	ToggleGroupControl,
	'ToggleGroupControl'
);

export default ConnectedToggleGroupControl;
