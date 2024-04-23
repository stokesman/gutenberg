/**
 * External dependencies
 */
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { createPortal, useReducer } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useFocusExit from '../';

const bodyRefReducer = ( held, node ) => node?.contentDocument.body;

const IFrame = ( { title, children } ) => {
	const [ body, setBody ] = useReducer( bodyRefReducer );
	return (
		<>
			<iframe
				// Sets tabindex because otherwise jsdom won't allow tabbing to iframes.
				tabIndex={ 0 }
				ref={ setBody }
				title={ title }
			/>
			{ body && createPortal( children, body ) }
		</>
	);
};

const FocusExiter = ( { onFocusExit } ) => (
	<>
		<main ref={ useFocusExit( onFocusExit ) }>
			<input type="text" />
			<button>Button inside the wrapper</button>
			<IFrame title="test-iframe">
				<button>Inside the iframe</button>
			</IFrame>
		</main>
		<button>Button outside the wrapper</button>
	</>
);

const WindowedFocusExiter = ( { onFocusExit } ) => {
	return (
		<div>
			{ /* Serves as the main window to allow testing focus exiting the document */ }
			<IFrame title="main-win">
				<FocusExiter onFocusExit={ onFocusExit } />
			</IFrame>
			<button>Button of separate window</button>
		</div>
	);
};

describe( 'useFocusExit', () => {
	it( 'should not call handler while tabbing through elements until focus moves outside the component', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render( <FocusExiter onFocusExit={ mockOnFocusOutside } /> );

		// Tab through the interactive elements inside the wrapper,
		// causing multiple focus/blur events.
		await user.tab();
		// console.log( '-- - - - -', mainWin.contentDocument.body );
		expect( screen.getByRole( 'textbox' ) ).toHaveFocus();

		await user.tab();
		expect(
			screen.getByRole( 'button', {
				name: 'Button inside the wrapper',
			} )
		).toHaveFocus();

		await user.tab();
		expect( screen.getByTitle( 'test-iframe' ) ).toHaveFocus();
		expect( mockOnFocusOutside ).not.toHaveBeenCalled();

		await user.tab();
		expect(
			screen.getByRole( 'button', {
				name: 'Button outside the wrapper',
			} )
		).toHaveFocus();
		expect( mockOnFocusOutside ).toHaveBeenCalled();
	} );

	it( 'should not call handler if focus transitions via click to button', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render( <FocusExiter onFocusExit={ mockOnFocusOutside } /> );

		// Click the input and the button, causing multiple focus/blur events.
		await user.click( screen.getByRole( 'textbox' ) );
		await user.click(
			screen.getByRole( 'button', { name: 'Button inside the wrapper' } )
		);

		expect( mockOnFocusOutside ).not.toHaveBeenCalled();
	} );

	it( 'should not call the handler when clicking in and out of an iframe', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render( <FocusExiter onFocusExit={ mockOnFocusOutside } /> );

		await user.click( screen.getByRole( 'textbox' ) );
		const iframe = screen.getByTitle( 'test-iframe' );
		await user.click(
			within( iframe.contentDocument.body ).getByRole( 'button', {
				name: 'Inside the iframe',
			} )
		);
		await user.click( screen.getByRole( 'textbox' ) );

		expect( mockOnFocusOutside ).not.toHaveBeenCalled();
	} );

	it( 'should call handler if focus exits the boundary element', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render( <FocusExiter onFocusExit={ mockOnFocusOutside } /> );

		// Click and focus button inside the wrapper
		await user.click(
			screen.getByRole( 'button', { name: 'Button inside the wrapper' } )
		);

		expect( mockOnFocusOutside ).not.toHaveBeenCalled();

		// Click and focus button outside the wrapper
		await user.click(
			screen.getByRole( 'button', { name: 'Button outside the wrapper' } )
		);

		expect( mockOnFocusOutside ).toHaveBeenCalled();
	} );

	it( 'should call handler when focus exits either directly from an iframe or after having focused an iframe', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();
		const stepOne = async () => {
			// Focus within container first
			await user.click( screen.getByRole( 'textbox' ) );
			// Click and focus button inside the iframe inside the wrapper.
			const iframe = screen.getByTitle( 'test-iframe' );
			await user.click(
				within( iframe.contentDocument.body ).getByRole( 'button', {
					name: 'Inside the iframe',
				} )
			);
		};

		render( <FocusExiter onFocusExit={ mockOnFocusOutside } /> );

		await stepOne();

		expect( mockOnFocusOutside ).not.toHaveBeenCalled();

		// Click and focus button outside the wrapper.
		await user.click(
			screen.getByRole( 'button', { name: 'Button outside the wrapper' } )
		);

		expect( mockOnFocusOutside ).toHaveBeenCalled();

		await stepOne();
		await user.click( screen.getByRole( 'textbox' ) );

		// Click and focus button outside the wrapper.
		await user.click(
			screen.getByRole( 'button', { name: 'Button outside the wrapper' } )
		);

		expect( mockOnFocusOutside ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should not call handler when a blur occurs from loss of document focus', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render( <WindowedFocusExiter onFocusExit={ mockOnFocusOutside } /> );
		const mainWin = screen.getByTitle( 'main-win' );
		const inMainWin = within( mainWin.contentDocument.body );

		const buttonInside = inMainWin.getByRole( 'button', {
			name: 'Button inside the wrapper',
		} );
		// Click and focus the inside textbox.
		await user.click( buttonInside );
		expect( buttonInside ).toHaveFocus();

		// Click and focus a button outside the window.
		const buttonBeyond = screen.getByRole( 'button', {
			name: 'Button of separate window',
		} );
		await user.click( buttonBeyond );
		expect( buttonBeyond ).toHaveFocus();
		expect( mockOnFocusOutside ).not.toHaveBeenCalled();
	} );

	it( 'should cancel check when unmounting while queued', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		const { unmount } = render(
			<FocusExiter onFocusExit={ mockOnFocusOutside } />
		);

		// Click and focus button inside the wrapper.
		const button = screen.getByRole( 'button', {
			name: 'Button inside the wrapper',
		} );
		await user.click( button );

		// Simulate a blur event and the wrapper unmounting while the blur event
		// handler is queued
		button.blur();
		unmount();

		expect( mockOnFocusOutside ).not.toHaveBeenCalled();
	} );
} );
