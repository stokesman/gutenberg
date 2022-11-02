/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import useFocusOutside from '../';

const IFrame = () => {
	const content =
		'<html><body><button>Inside the iframe</button></body></html>';
	const setContent = ( node ) => {
		if ( node ) node.contentDocument.write( content );
	};

	return <iframe title="test-iframe" ref={ setContent } />;
};

const FocusOutsideComponent = ( { onFocusOutside: callback } ) => (
	<div>
		{ /* Wrapper */ }
		<div { ...useFocusOutside( callback ) }>
			<input type="text" />
			<button>Button inside the wrapper</button>
			<IFrame />
		</div>

		<button>Button outside the wrapper</button>
	</div>
);

describe( 'useFocusOutside', () => {
	it( 'should not call handler while tabbing through elements until focus moves outside the component', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
		);

		// Tab through the interactive elements inside the wrapper,
		// causing multiple focus/blur events.
		await user.tab();
		expect( screen.getByRole( 'textbox' ) ).toHaveFocus();

		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'Button inside the wrapper' } )
		).toHaveFocus();

		expect( mockOnFocusOutside ).not.toHaveBeenCalled();

		await user.tab();
		// Focus should probably be on the button inside the iframe here but
		// jsdom doesn't agree so iframes are covered by other tests.
		expect(
			screen.getByRole( 'button', { name: 'Button outside the wrapper' } )
		).toHaveFocus();

		expect( mockOnFocusOutside ).toHaveBeenCalled();
	} );

	it( 'should not call handler if focus transitions via click to button', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
		);

		// Click the input and the button, causing multiple focus/blur events.
		await user.click( screen.getByRole( 'textbox' ) );
		await user.click(
			screen.getByRole( 'button', { name: 'Button inside the wrapper' } )
		);

		expect( mockOnFocusOutside ).not.toHaveBeenCalled();
	} );

	it( 'should not call the handler when clicking in and out of an iframe within component', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
		);

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

	it( 'should call handler if focus shifts to element outside component', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
		);

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

	it( 'should call handler when focus moves outside either directly from an iframe or after having focused an iframe', async () => {
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

		render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
		);

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

	it( 'should not call handler if focus shifts outside the component when the document does not have focus', async () => {
		// Force document.hasFocus() to return false to simulate the window/document losing focus
		// See https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus.
		const mockedDocumentHasFocus = jest
			.spyOn( document, 'hasFocus' )
			.mockImplementation( () => false );
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
		);

		// Click and focus button inside the wrapper, then click and focus
		// a button outside the wrapper.
		await user.click(
			screen.getByRole( 'button', { name: 'Button inside the wrapper' } )
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Button outside the wrapper' } )
		);

		// The handler is not called thanks to the mocked return value of
		// `document.hasFocus()`
		expect( mockOnFocusOutside ).not.toHaveBeenCalled();

		// Restore the `document.hasFocus()` function to its original implementation.
		mockedDocumentHasFocus.mockRestore();
	} );

	it( 'should cancel check when unmounting while queued', async () => {
		const mockOnFocusOutside = jest.fn();
		const user = userEvent.setup();

		const { unmount } = render(
			<FocusOutsideComponent onFocusOutside={ mockOnFocusOutside } />
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
