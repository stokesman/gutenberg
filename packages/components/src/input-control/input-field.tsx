/**
 * External dependencies
 */
import { noop } from 'lodash';
import { useDrag } from 'react-use-gesture';
// eslint-disable-next-line no-restricted-imports
import type {
	SyntheticEvent,
	ChangeEvent,
	KeyboardEvent,
	PointerEvent,
	FocusEvent,
	Ref,
} from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { UP, DOWN, ENTER } from '@wordpress/keycodes';
/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../ui/context';
import { useDragCursor } from './utils';
import { Input } from './styles/input-control-styles';
import { isValueEmpty } from '../utils/values';
import type { InputFieldProps } from './types';

function InputField(
	{
		actions,
		disabled = false,
		dragDirection = 'n',
		dragThreshold = 10,
		id,
		isDirty,
		isDragEnabled,
		isDragging,
		isFocused,
		isPressEnterToChange,
		onBlur = noop,
		onDrag = noop,
		onDragEnd = noop,
		onDragStart = noop,
		onFocus = noop,
		onKeyDown = noop,
		onValidate = noop,
		size = 'default',
		value,
		type,
		...props
	}: WordPressComponentProps< InputFieldProps, 'input', false >,
	ref: Ref< HTMLInputElement >
) {
	const {
		change,
		commit,
		drag,
		dragEnd,
		dragStart,
		invalidate,
		pressDown,
		pressEnter,
		pressUp,
		reset,
		update,
	} = actions;

	const dragCursor = useDragCursor( isDragging, dragDirection );

	const handleOnBlur = ( event: FocusEvent< HTMLInputElement > ) => {
		onBlur( event );
		update( { isFocused: false } );

		/**
		 * If isPressEnterToChange is set, this commits the value to
		 * the onChange callback.
		 */
		if ( isPressEnterToChange && isDirty ) {
			if ( ! isValueEmpty( value ) ) {
				handleOnCommit( event );
			} else {
				reset( undefined, event );
			}
		}
	};

	const handleOnFocus = ( event: FocusEvent< HTMLInputElement > ) => {
		onFocus( event );
		update( { isFocused: true, initialValue: value } );
	};

	const handleOnChange = ( event: ChangeEvent< HTMLInputElement > ) => {
		const nextValue = event.target.value;
		change( nextValue, event );
	};

	const handleOnCommit = ( event: SyntheticEvent< HTMLInputElement > ) => {
		const nextValue = event.currentTarget.value;

		try {
			onValidate( nextValue );
			commit( nextValue, event );
		} catch ( err ) {
			invalidate( err, event );
		}
	};

	const handleOnKeyDown = ( event: KeyboardEvent< HTMLInputElement > ) => {
		const { keyCode } = event;
		onKeyDown( event );

		switch ( keyCode ) {
			case UP:
				pressUp( event );
				break;

			case DOWN:
				pressDown( event );
				break;

			case ENTER:
				pressEnter( event );

				if ( isPressEnterToChange ) {
					event.preventDefault();
					handleOnCommit( event );
				}
				break;
		}
	};

	const dragGestureProps = useDrag< PointerEvent< HTMLInputElement > >(
		( dragProps ) => {
			const { distance, dragging, event } = dragProps;
			// The event is persisted to prevent errors in components using this
			// to check if a modifier key was held while dragging.
			event.persist();

			if ( ! distance ) return;
			event.stopPropagation();

			/**
			 * Quick return if no longer dragging.
			 * This prevents unnecessary value calculations.
			 */
			if ( ! dragging ) {
				onDragEnd( dragProps );
				dragEnd( dragProps );
				return;
			}

			onDrag( dragProps );
			drag( dragProps );

			if ( ! isDragging ) {
				onDragStart( dragProps );
				dragStart( dragProps );
			}
		},
		{
			threshold: dragThreshold,
			enabled: isDragEnabled,
		}
	);

	const dragProps = isDragEnabled ? dragGestureProps() : {};

	return (
		<Input
			{ ...props }
			{ ...dragProps }
			className="components-input-control__input"
			disabled={ disabled }
			dragCursor={ dragCursor }
			isDragging={ isDragging }
			id={ id }
			onBlur={ handleOnBlur }
			onChange={ handleOnChange }
			onFocus={ handleOnFocus }
			onKeyDown={ handleOnKeyDown }
			ref={ ref }
			inputSize={ size }
			value={ value }
			type={ type }
		/>
	);
}

const ForwardedComponent = forwardRef( InputField );

export default ForwardedComponent;
