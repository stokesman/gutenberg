/**
 * External dependencies
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';
import type { FC, RefCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import InputControl from '../../input-control';
import Modal from '../';
import type { ModalProps } from '../types';
import { Popover } from '../../popover';
import { Provider as SlotFillProvider } from '../../slot-fill';

const meta: ComponentMeta< typeof Modal > = {
	component: Modal,
	title: 'Components/Modal',
	argTypes: {
		children: {
			control: { type: null },
		},
		onKeyDown: {
			control: { type: null },
		},
		focusOnMount: {
			control: { type: 'boolean' },
		},
		role: {
			control: { type: 'text' },
		},
		onRequestClose: {
			action: 'onRequestClose',
		},
	},
	parameters: {
		controls: { expanded: true },
	},
};
export default meta;

const IFrame: FC< {
	title?: string;
	width: number;
	height: number;
	children: ReactNode;
} > = ( { children, ...props } ) => {
	const [ contentBodyNode, setContentBodyNode ] = useState< HTMLElement >();
	const setNode: RefCallback< HTMLIFrameElement > = ( node ) => {
		if ( node ) setContentBodyNode( node.contentWindow?.document.body );
	};
	const portal = contentBodyNode
		? createPortal( children, contentBodyNode )
		: null;

	console.log('PORTAL', portal)
	return (
		<>
			<iframe title="test-iframe" { ...props } ref={ setNode }></iframe>
			{ portal }
		</>
	);
};

const DropPop = () => {
	const [ isVisible, setIsVisible ] = useState( false );
	const toggleVisible = () => {
		setIsVisible( ! isVisible );
	};
	const refButton = useRef();
	return (
		<>
			<Button
				variant="secondary"
				onClick={ toggleVisible }
				ref={ refButton }
			>
				Toggle Popover
			</Button>
			{ isVisible && (
				<Popover
					__unstableSlotName="popover"
					anchor={ refButton.current }
					onFocusOutside={ () => {
						setIsVisible( false );
					} }
				>
					<div style={ { width: '10em', height: '5em' } }>
						<p>We get signal!</p>
						<label>
							Someone set up us the bomb <input type="checkbox" />
						</label>
					</div>
				</Popover>
			) }
		</>
	);
};

const Template: ComponentStory< typeof Modal > = ( {
	onRequestClose,
	...args
} ) => {
	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal: ModalProps[ 'onRequestClose' ] = ( event ) => {
		setOpen( false );
		onRequestClose( event );
	};

	return (
		<SlotFillProvider>
			{ /* @ts-expect-error Slot is not currently typed on Popover */ }
			<Popover.Slot name="popover" />
			<Button variant="secondary" onClick={ openModal }>
				Open Modal
			</Button>
			{ isOpen && (
				<Modal
					onRequestClose={ closeModal }
					style={ { maxWidth: '600px' } }
					{ ...args }
				>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit,
						sed do eiusmod tempor incididunt ut labore et magna
						aliqua. Ut enim ad minim veniam, quis nostrud
						exercitation ullamco laboris nisi ut aliquip ex ea ea
						commodo consequat. Duis aute irure dolor in
						reprehenderit in voluptate velit esse cillum dolore eu
						fugiat nulla pariatur. Excepteur sint occaecat cupidatat
						non proident, sunt in culpa qui officia deserunt mollit
						anim id est laborum.
					</p>

					<InputControl style={ { marginBottom: '20px' } } />

					<DropPop />

					<button>Ciao</button>
					<iframe
						title="Example 1"
						width="300"
						height="200"
						src="https://www.openstreetmap.org/export/embed.html?bbox=-0.004017949104309083%2C51.47612752641776%2C0.00030577182769775396%2C51.478569861898606&layer=mapnik"
					/>

					<IFrame title="Example 2" width={ 300 } height={ 200 }>
						<button>Ciao</button>
						<DropPop />
					</IFrame>

					<Button variant="secondary" onClick={ closeModal }>
						Close Modal
					</Button>
				</Modal>
			) }
		</SlotFillProvider>
	);
};

export const Default: ComponentStory< typeof Modal > = Template.bind( {} );
Default.args = {
	title: 'Title',
};
Default.parameters = {
	docs: {
		source: {
			code: '',
		},
	},
};
