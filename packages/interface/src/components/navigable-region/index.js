/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

const NavigableRegion = forwardRef(
	( { children, className, ariaLabel, as: Tag = 'div', ...props }, ref ) => (
		<Tag
			ref={ ref }
			className={ clsx( 'interface-navigable-region', className ) }
			aria-label={ ariaLabel }
			role="region"
			tabIndex="-1"
			{ ...props }
		>
			{ children }
		</Tag>
	)
);
NavigableRegion.displayName = 'NavigableRegion';
export default NavigableRegion;
