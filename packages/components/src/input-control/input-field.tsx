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
	MouseEvent,
} from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useRef } from '@wordpress/element';
import { UP, DOWN, ENTER } from '@wordpress/keycodes';
/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../ui/context';
import { useDragCursor } from './utils';
import { Input } from './styles/input-control-styles';
import { useInputControlStateReducer } from './reducer/reducer';
import { isValueEmpty } from '../utils/values';
import { useUpdateEffect } from '../utils';
import type { InputFieldProps } from './types';

function InputField(
	{
		disabled = false,
		dragDirection = 'n',
		dragThreshold = 10,
		id,
		isDragEnabled = false,
		isFocused,
		isPressEnterToChange = false,
		onBlur = noop,
		onChange = noop,
		onDrag = noop,
		onDragEnd = noop,
		onDragStart = noop,
		onFocus = noop,
		onKeyDown = noop,
		onValidate = noop,
		size = 'default',
		setIsFocused,
		stateReducer = ( state: any ) => state,
		value: valueProp,
		type,
		...props
	}: WordPressComponentProps< InputFieldProps, 'input', false >,
	ref: Ref< HTMLInputElement >
) {
	const {
		// State
		state,
		// Actions
		change,
		commit,
		drag,
		dragEnd,
		dragStart,
		invalidate,
		pressEnter,
		reset,
		step,
		update,
	} = useInputControlStateReducer( stateReducer, {
		isDragEnabled,
		value: valueProp,
		isPressEnterToChange,
	} );

	const { _event, value, isDragging, isDirty } = state;
	const wasDirtyOnBlur = useRef( false );

	const dragCursor = useDragCursor( isDragging, dragDirection );

	/*
	 * Handles synchronization of external and internal value state.
	 * If not focused and did not hold a dirty value[1] on blur
	 * updates the value from the props. Otherwise if not holding
	 * a dirty value[1] propagates the value and event through onChange.
	 * [1] value is only made dirty if isPressEnterToChange is true
	 */
	useUpdateEffect( () => {
		if ( valueProp === value ) {
			return;
		}
		if ( ! isFocused && ! wasDirtyOnBlur.current ) {
			update( valueProp, _event as SyntheticEvent );
		} else if ( ! isDirty ) {
			onChange( value, {
				event: _event as ChangeEvent< HTMLInputElement >,
			} );
			wasDirtyOnBlur.current = false;
		}
	}, [ value, isDirty, isFocused, valueProp ] );

	const handleOnBlur = ( event: FocusEvent< HTMLInputElement > ) => {
		onBlur( event );
		setIsFocused?.( false );

		/**
		 * If isPressEnterToChange is set, this commits the value to
		 * the onChange callback.
		 */
		if ( isPressEnterToChange && isDirty ) {
			wasDirtyOnBlur.current = true;
			if ( ! isValueEmpty( value ) ) {
				handleOnCommit( event );
			} else {
				reset( valueProp, event );
			}
		}
	};

	const handleOnFocus = ( event: FocusEvent< HTMLInputElement > ) => {
		onFocus( event );
		setIsFocused?.( true );
	};

	const handleOnChange = ( event: ChangeEvent< HTMLInputElement > ) => {
		const nextValue = parseFloat( event.target.value );
		// Condition can only be true for type="number" inputs
		if ( isPrimaryWithShiftHeld.current ) {
			const diff = nextValue - parseFloat( value );
			step( Math.sign( diff ), true, event );
			return;
		}
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
		const { keyCode, shiftKey } = event;
		onKeyDown( event );

		switch ( keyCode ) {
			case UP:
			// falls through
			case DOWN:
				if ( type === 'number' ) {
					step( keyCode === UP ? 1 : -1, shiftKey, event );
					event.preventDefault();
				}
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

	const isPrimaryWithShiftHeld = useRef( false );
	let onMouseDown;
	let onMouseUp;
	if ( type === 'number' ) {
		const testPrimaryWithShiftHeld = ( { button, shiftKey } ) =>
			button === 0 && shiftKey;

		onMouseDown = ( event: MouseEvent< HTMLInputElement > ) => {
			props.onMouseDown?.( event );
			const { currentTarget } = event;
			/*
			 * Works around the odd UA (e.g. Firefox) that does not focus
			 * inputs of type=number when their spinner arrows are pressed.
			 */
			if ( currentTarget !== currentTarget.ownerDocument.activeElement ) {
				event.currentTarget.focus();
			}

			isPrimaryWithShiftHeld.current = testPrimaryWithShiftHeld( event );
		};

		onMouseUp = ( event: MouseEvent< HTMLInputElement > ) => {
			isPrimaryWithShiftHeld.current = testPrimaryWithShiftHeld( event );
		};
	}

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
			onMouseDown={ onMouseDown }
			onMouseUp={ onMouseUp }
			ref={ ref }
			inputSize={ size }
			value={ value }
			type={ type }
		/>
	);
}

const ForwardedComponent = forwardRef( InputField );

export default ForwardedComponent;
