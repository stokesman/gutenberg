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
import type { StateReducer, InputState } from './reducer/state';
import type { FlexProps } from '../flex/types';
import type { WordPressComponentProps } from '../ui/context';
import type { InputAction } from './reducer/actions';

export type LabelPosition = 'top' | 'bottom' | 'side' | 'edge';

interface BaseProps {
	__unstableInputWidth?: CSSProperties[ 'width' ];
	hideLabelFromVision?: boolean;
	isFocused?: boolean;
	labelPosition?: LabelPosition;
	size?: 'default' | 'small';
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

type DispatchValueAndEvent = (
	value: string,
	event: SyntheticEvent< HTMLInputElement >
) => void;

export interface InputControlActionDispatchers {
	change: DispatchValueAndEvent;
	commit: (
		value: string,
		onValidate: () => void,
		event: SyntheticEvent< HTMLInputElement >
	) => void;
	dispatch: (
		type: InputAction[ 'type' ],
		payload: InputAction[ 'payload' ],
		event?: SyntheticEvent
	) => void;
	invalidate: DispatchValueAndEvent;
	reset: DispatchValueAndEvent;
	update: ( value: Partial< InputState > ) => void;
}

export interface InputControlProps
	extends Omit< InputBaseProps, 'children' >,
		/**
		 * The `prefix` prop in `WordPressComponentProps< BaseProps, 'input', false >` comes from the
		 * `HTMLInputAttributes` and clashes with the one from `InputBaseProps`. So we have to omit it from
		 * `WordPressComponentProps< BaseProps, 'input', false >` in order that `InputBaseProps[ 'prefix' ]`
		 * be the only prefix prop. Otherwise it tries to do a union of the two prefix properties and you end up
		 * with an unresolvable type.
		 */
		Omit< WordPressComponentProps< BaseProps, 'input', false >, 'prefix' > {
	actions: InputControlActionDispatchers;
}

export interface InputControlHookProps
	extends Omit< InputControlProps, 'isFocused' | 'onChange' | 'actions' > {
	isPressEnterToChange?: boolean;
	onChange?: (
		nextValue: string | undefined,
		extra: { event: ChangeEvent< HTMLInputElement > }
	) => void;
	onValidate?: (
		nextValue: string,
		event?: SyntheticEvent< HTMLInputElement >
	) => void;
	value?: string;
	__unstableStateReducer?: StateReducer;
}

export interface InputControlLabelProps {
	children: ReactNode;
	hideLabelFromVision?: BaseProps[ 'hideLabelFromVision' ];
	labelPosition?: BaseProps[ 'labelPosition' ];
	size?: BaseProps[ 'size' ];
}
