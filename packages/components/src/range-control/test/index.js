/**
 * External dependencies
 */
import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RangeControl from '../';

const setupUser = () =>
	userEvent.setup( {
		advanceTimers: jest.advanceTimersByTime,
	} );

const getRangeInput = ( container ) =>
	container.querySelector( 'input[type="range"]' );
const getNumberInput = ( container ) =>
	container.querySelector( 'input[type="number"]' );
const getResetButton = ( container ) =>
	container.querySelector( '.components-range-control__reset' );

function ControlledRangeControl( props ) {
	const [ value, setValue ] = useState( props.value );
	const onChange = ( v ) => {
		setValue( v );
		props.onChange?.( v );
	};
	return <RangeControl { ...props } onChange={ onChange } value={ value } />;
}

describe.each( [
	[ 'uncontrolled', RangeControl ],
	[ 'controlled', ControlledRangeControl ],
] )( 'RangeControl %s', ( ...modeAndComponent ) => {
	const [ , Component ] = modeAndComponent;

	describe( '#render()', () => {
		it( 'should trigger change callback with numeric value', async () => {
			const user = setupUser();
			const onChange = jest.fn();

			const { container, getByText } = render(
				<Component label="❤" onChange={ onChange } />
			);

			const rangeInput = getRangeInput( container );
			const numberInput = getNumberInput( container );

			await user.click( getByText( '❤' ) );
			fireEvent.change( rangeInput, { target: { value: '5' } } );

			await user.clear( numberInput );
			await user.type( numberInput, '10' );

			expect( onChange ).toHaveBeenCalledWith( 5 );
			expect( onChange ).toHaveBeenCalledWith( 1 );
			expect( onChange ).toHaveBeenCalledWith( 10 );
		} );

		it( 'should render with icons', () => {
			const { container } = render(
				<Component beforeIcon="format-image" afterIcon="format-video" />
			);

			const beforeIcon = container.querySelector(
				'.dashicons-format-image'
			);
			const afterIcon = container.querySelector(
				'.dashicons-format-image'
			);

			expect( beforeIcon ).toBeTruthy();
			expect( afterIcon ).toBeTruthy();
		} );
	} );

	describe( 'validation', () => {
		it( 'should not apply values lower than minimum', async () => {
			const user = setupUser();
			const onChange = jest.fn();
			const { container } = render(
				<Component min={ 11 } onChange={ onChange } />
			);
			const numberInput = getNumberInput( container );

			await user.type( numberInput, '10' );

			expect( onChange ).toHaveBeenLastCalledWith( 11 );
		} );

		it( 'should not apply values greater than maximum', async () => {
			const user = setupUser();
			const onChange = jest.fn();
			const { container } = render(
				<Component max={ 20 } onChange={ onChange } />
			);
			const numberInput = getNumberInput( container );

			await user.type( numberInput, '21' );

			expect( onChange ).toHaveBeenLastCalledWith( 20 );
		} );

		it( 'should not call onChange if new value is invalid', async () => {
			const user = setupUser();
			const onChange = jest.fn();
			const { container } = render(
				<Component onChange={ onChange } min={ 10 } max={ 20 } />
			);
			const numberInput = getNumberInput( container );

			await user.type( numberInput, '15e' );

			expect( onChange ).toHaveBeenLastCalledWith( 15 );
		} );

		it( 'should keep invalid values in number input until loss of focus', async () => {
			const user = setupUser();
			const onChange = jest.fn();
			const { container } = render(
				<Component onChange={ onChange } min={ -1 } max={ 1 } />
			);
			const rangeInput = getRangeInput( container );
			const numberInput = getNumberInput( container );

			await user.type( numberInput, '-1.1' );
			expect( numberInput.value ).toBe( '-1.1' );
			expect( rangeInput.value ).toBe( '-1' );

			await user.click( document.body );
			expect( onChange ).toHaveBeenLastCalledWith( -1 );
			expect( numberInput.value ).toBe( '-1' );
		} );

		it( 'should constrain value to zero if that is the max', async () => {
			const user = setupUser();
			const onChange = jest.fn();
			const { container } = render(
				<Component min={ -100 } max={ 0 } onChange={ onChange } />
			);
			const numberInput = getNumberInput( container );

			await user.type( numberInput, '1' );

			expect( onChange ).toHaveBeenCalledWith( 0 );
		} );

		it( 'should constrain value when both min and max are negative', async () => {
			const user = setupUser();
			const onChange = jest.fn();
			const { container } = render(
				<Component min={ -100 } max={ -50 } onChange={ onChange } />
			);
			const numberInput = getNumberInput( container );

			await user.type( numberInput, '-101' );
			expect( onChange ).toHaveBeenLastCalledWith( -100 );
			onChange.mockClear();

			await user.clear( numberInput );
			await user.type( numberInput, '-49' );
			expect( onChange ).toHaveBeenLastCalledWith( -50 );
		} );

		it( 'should take into account the step starting from min', async () => {
			const user = setupUser();
			const onChange = jest.fn();
			const { container } = render(
				<Component onChange={ onChange } min={ 0.1 } step={ 0.125 } />
			);
			const rangeInput = getRangeInput( container );
			const numberInput = getNumberInput( container );

			await user.type( numberInput, '0.125' );

			expect( onChange ).toHaveBeenLastCalledWith( 0.125 );
			expect( rangeInput.value ).toBe( '0.125' );

			onChange.mockClear();
			await user.clear( numberInput );
			await user.type( numberInput, '0.225' );

			expect( onChange ).toHaveBeenLastCalledWith( 0.225 );
			expect( rangeInput.value ).toBe( '0.225' );
		} );
	} );

	describe( 'initialPosition / value', () => {
		it( 'should render initial rendered value of 50% of min/max, if no initialPosition or value is defined', () => {
			const { container } = render( <Component min={ 0 } max={ 10 } /> );

			const rangeInput = getRangeInput( container );

			expect( rangeInput.value ).toBe( '5' );
		} );

		it( 'should render initialPosition if no value is provided', () => {
			const { container } = render(
				<Component initialPosition={ 50 } />
			);

			const rangeInput = getRangeInput( container );

			expect( rangeInput.value ).toBe( '50' );
		} );

		it( 'should render value instead of initialPosition is provided', () => {
			const { container } = render(
				<Component initialPosition={ 50 } value={ 10 } />
			);

			const rangeInput = getRangeInput( container );

			expect( rangeInput.value ).toBe( '10' );
		} );
	} );

	describe( 'input field', () => {
		it( 'should render an input field by default', () => {
			const { container } = render( <Component /> );

			const numberInput = getNumberInput( container );

			expect( numberInput ).toBeTruthy();
		} );

		it( 'should not render an input field, if disabled', () => {
			const { container } = render(
				<Component withInputField={ false } />
			);

			const numberInput = getNumberInput( container );

			expect( numberInput ).toBeFalsy();
		} );

		it( 'should render a zero value into input range and field', () => {
			const { container } = render( <Component value={ 0 } /> );

			const rangeInput = getRangeInput( container );
			const numberInput = getNumberInput( container );

			expect( rangeInput.value ).toBe( '0' );
			expect( numberInput.value ).toBe( '0' );
		} );

		it( 'should update both field and range on change', async () => {
			const user = setupUser();
			const { container } = render( <Component /> );
			const rangeInput = getRangeInput( container );
			const numberInput = getNumberInput( container );

			rangeInput.focus();
			fireEvent.change( rangeInput, { target: { value: 13 } } );

			expect( rangeInput.value ).toBe( '13' );
			expect( numberInput.value ).toBe( '13' );

			await user.clear( numberInput );
			await user.type( numberInput, '7' );

			expect( rangeInput.value ).toBe( '7' );
			expect( numberInput.value ).toBe( '7' );
		} );
	} );

	describe( 'reset', () => {
		it.concurrent.each( [
			[
				'initialPosition if it is defined',
				{ initialPosition: '21' },
				[ '21', undefined ],
			],
			[
				'resetFallbackValue if it is defined',
				{ resetFallbackValue: '34' },
				[ '34', 34 ],
			],
			[
				'resetFallbackValue if both it and initialPosition are defined',
				{ initialPosition: '21', resetFallbackValue: '34' },
				[ '34', 34 ],
			],
		] )( 'should reset to %s', async ( ...all ) => {
			const [ , propsForReset, [ expectedValue, expectedChange ] ] = all;
			const user = setupUser();
			const spy = jest.fn();
			const { container } = render(
				<Component
					allowReset={ true }
					onChange={ spy }
					{ ...propsForReset }
				/>
			);
			const resetButton = getResetButton( container );
			const rangeInput = getRangeInput( container );
			const numberInput = getNumberInput( container );

			await user.type( numberInput, '89' );
			await user.click( resetButton );

			expect( rangeInput.value ).toBe( expectedValue );
			expect( numberInput.value ).toBe( expectedValue );
			expect( spy ).toHaveBeenCalledWith( expectedChange );
		} );

		it( 'should reset to a 50% of min/max value, if no initialPosition or value is defined', async () => {
			const user = setupUser();
			const { container } = render(
				<Component
					initialPosition={ undefined }
					min={ 0 }
					max={ 100 }
					allowReset={ true }
					resetFallbackValue={ undefined }
				/>
			);
			const resetButton = getResetButton( container );
			const rangeInput = getRangeInput( container );
			const numberInput = getNumberInput( container );

			await user.type( numberInput, '89' );
			await user.click( resetButton );

			expect( rangeInput.value ).toBe( '50' );
			expect( numberInput.value ).toBe( '' );
		} );
	} );
} );
