/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type {
	CSSProperties,
	ReactNode,
	ChangeEvent,
	SyntheticEvent,
} from 'react';

/**
 * Internal dependencies
 */
import type { StateReducer } from './reducer/state';
import type { FlexProps } from '../flex/types';
import type { WordPressComponentProps } from '../ui/context';

export type LabelPosition = 'top' | 'bottom' | 'side' | 'edge';

interface BaseProps {
	__unstableInputWidth?: CSSProperties[ 'width' ];
	hideLabelFromVision?: boolean;
	isFocused: boolean;
	labelPosition?: LabelPosition;
	size?: 'default' | 'small';
}

export interface InputFieldProps extends BaseProps {
	isPressEnterToChange?: boolean;
	onChange?: (
		nextValue: string | undefined,
		extra: { event: ChangeEvent< HTMLInputElement > }
	) => void;
	onValidate?: (
		nextValue: string,
		event?: SyntheticEvent< HTMLInputElement >
	) => void;
	stateReducer?: StateReducer;
	value?: string;
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
		 * `isFocused` and `setIsFocused` are managed internally by the InputControl, but the rest of the props
		 * for InputField are passed through.
		 */
		Omit<
			WordPressComponentProps< InputFieldProps, 'input', false >,
			'stateReducer' | 'prefix' | 'isFocused' | 'setIsFocused'
		> {
	__unstableStateReducer?: InputFieldProps[ 'stateReducer' ];
}

export interface InputControlLabelProps {
	children: ReactNode;
	hideLabelFromVision?: BaseProps[ 'hideLabelFromVision' ];
	labelPosition?: BaseProps[ 'labelPosition' ];
	size?: BaseProps[ 'size' ];
}
