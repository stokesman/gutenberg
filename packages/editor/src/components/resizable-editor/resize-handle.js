/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	VisuallyHidden,
	Tooltip,
	__unstableMotion as motion,
} from '@wordpress/components';

export default function ResizeHandle( { side, binder } ) {
	const resizeHandleVariants = {
		active: {
			opacity: 1,
			scaleY: 1.3,
		},
	};

	const resizableHandleHelpId = `resizable-editor__resize-help-${ side }`;

	const { [ side ]: direction } = isRTL()
		? { start: 'right', end: 'left' }
		: { start: 'left', end: 'right' };

	return (
		<>
			<Tooltip text={ __( 'Drag to resize' ) }>
				<motion.button
					className={ `editor-resizable-editor__resize-handle is-${ side }` }
					aria-label={ __( 'Drag to resize' ) }
					aria-describedby={ resizableHandleHelpId }
					variants={ resizeHandleVariants }
					whileFocus="active"
					whileHover="active"
					whileTap="active"
					key="handle"
					role="separator"
					aria-orientation="vertical"
					{ ...binder( direction ) }
				/>
			</Tooltip>
			<VisuallyHidden id={ resizableHandleHelpId }>
				{ __( 'Use left and right arrow keys to resize the canvas.' ) }
			</VisuallyHidden>
		</>
	);
}
