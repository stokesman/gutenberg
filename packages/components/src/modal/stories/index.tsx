/**
 * External dependencies
 */
import type { ComponentStory, ComponentMeta } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __experimentalUseFocusOutside as useFocusOutside } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Button from '../../button';
import Modal from '../';
import type { ModalProps } from '../types';

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

const FocusOutsideComponent = ( { onFocusOutside: callback } ) => (
	<div>
		{ /* Wrapper */ }
		<div ref={ useFocusOutside( callback ) }>
			<input type="text" />
			<button>Button inside the wrapper</button>
			<iframe title="test-iframe">
				<button>Inside the iframe</button>
			</iframe>
		</div>

		<button>Button outside the wrapper</button>
	</div>
);

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
		<>
			<Button variant="secondary" onClick={ openModal }>
				Open Modal
			</Button>
			<FocusOutsideComponent
				onFocusOutside={ (e) => console.log( 'w0t!?', e ) }
			/>
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
					<iframe
						title="Example"
						width="300"
						height="200"
						src="https://www.openstreetmap.org/export/embed.html?bbox=-0.004017949104309083%2C51.47612752641776%2C0.00030577182769775396%2C51.478569861898606&layer=mapnik"
					/>
					<Button variant="secondary" onClick={ closeModal }>
						Close Modal
					</Button>
				</Modal>
			) }
		</>
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
