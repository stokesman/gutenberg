/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type {
	ChangeEvent,
	CSSProperties,
	ReactNode,
	MutableRefObject,
} from 'react';
import type { useDrag } from 'react-use-gesture';

/**
 * Internal dependencies
 */
import type { ActionDispatchers } from './reducer/actions';
import type { StateReducer } from './reducer/state';
import type { FlexProps } from '../flex/types';
import type { WordPressComponentProps } from '../ui/context';

export type LabelPosition = 'top' | 'bottom' | 'side' | 'edge';

export type DragDirection = 'n' | 's' | 'e' | 'w';

export type DragProps = Parameters< Parameters< typeof useDrag >[ 0 ] >[ 0 ];

interface BaseProps {
	__unstableInputWidth?: CSSProperties[ 'width' ];
	hideLabelFromVision?: boolean;
	isFocused: boolean;
	labelPosition?: LabelPosition;
	size?: 'default' | 'small';
}

export interface InputFieldProps extends BaseProps {
	actions: ActionDispatchers;
	dragDirection?: DragDirection;
	dragThreshold?: number;
	isDirty: boolean;
	isDragging: boolean;
	isDragEnabled?: boolean;
	isPressEnterToChange?: boolean;
	value?: string;
	onDragEnd?: ( dragProps: DragProps ) => void;
	onDragStart?: ( dragProps: DragProps ) => void;
	onDrag?: ( dragProps: DragProps ) => void;
	onValidate?: ( nextValue: string ) => void;
	wasDirtyOnBlur: MutableRefObject< boolean >;
}

export interface InputBaseProps extends BaseProps, FlexProps {
	children: ReactNode;
	prefix?: ReactNode;
	suffix?: ReactNode;
	disabled?: boolean;
	className?: string;
	id?: string;
	label?: ReactNode;
}

export interface InputControlProps
	extends Omit< InputBaseProps, 'children' | 'isFocused' >,
		/**
		 * The `prefix` prop in `WordPressComponentProps< InputFieldProps, 'input', false >` comes from the
		 * `HTMLInputAttributes` and clashes with the one from `InputBaseProps`. So we have to omit it from
		 * `WordPressComponentProps< InputFieldProps, 'input', false >` in order that `InputBaseProps[ 'prefix' ]`
		 * be the only prefix prop. Otherwise it tries to do a union of the two prefix properties and you end up
		 * with an unresolvable type.
		 *
		 * The other omissions from InputFieldProps are provided internally.
		 */
		Omit<
			WordPressComponentProps< InputFieldProps, 'input', false >,
			| 'actions'
			| 'isDirty'
			| 'isDragging'
			| 'isFocused'
			| 'onChange'
			| 'prefix'
			| 'wasDirtyOnBlur'
		> {
	onChange?: (
		nextValue: string | undefined,
		extra: { event: ChangeEvent< HTMLInputElement > }
	) => void;
	__unstableStateReducer?: StateReducer;
}

export interface InputControlLabelProps {
	children: ReactNode;
	hideLabelFromVision?: BaseProps[ 'hideLabelFromVision' ];
	labelPosition?: BaseProps[ 'labelPosition' ];
	size?: BaseProps[ 'size' ];
}
