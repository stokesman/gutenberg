/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'keyboard shortcut help modal', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'opens from the options menu, closes with its close button and returns focus', async ( {
		page,
	} ) => {
		await page
			.locator( 'role=region[name="Editor top bar"]' )
			.locator( '[aria-label="Options"]' )
			.click();
		const menuItem = page.locator( 'role=menuitem', {
			hasText: /^Keyboard shortcuts/i,
		} );
		const dialog = page.locator( 'role=dialog[name="Keyboard shortcuts"]' );

		await menuItem.click();
		await expect( dialog ).toBeVisible();

		await page.locator( 'role=button[name="Close"]' ).click();
		await expect( dialog ).toBeHidden();
		await expect( menuItem ).toBeFocused();
	} );

	test( 'toggles open/closed using the keyboard shortcut (access+h)', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.pressKeys( 'access+h' );
		const dialog = page.locator( 'role=dialog[name="Keyboard shortcuts"]' );
		await expect( dialog ).toBeVisible();

		await pageUtils.pressKeys( 'access+h' );
		await expect( dialog ).toBeHidden();
	} );

	const iterations = 1000;
	const secondsPerIteration = 0.025
	test.only( 'doesn’t bug out', async ( {
		page,
		pageUtils,
	} ) => {
		test.setTimeout( 1000 * 60 * secondsPerIteration * iterations )
		const wpWrap = page.locator( '#wpwrap' );
		const editorTopBar = page.locator( 'role=region[name="Editor top bar"]' );
		const optionsButton = editorTopBar.locator( '[aria-label="Options"]' );

		const menuItem = page.locator( 'role=menuitem', {
			hasText: /^Keyboard shortcuts/i,
		} );
		const dialog = page.locator( 'role=dialog[name="Keyboard shortcuts"]' );

		for ( let i = 0; i < iterations; i++ ) {
			await optionsButton.click();
			await menuItem.click();
			await expect( dialog ).toBeVisible();
			await expect( wpWrap ).toHaveAttribute( 'inert', '' );

			await page.locator( 'role=button[name="Close"]' ).click();
			await expect( dialog ).toBeHidden();
			await expect( wpWrap ).not.toHaveAttribute( 'inert', '' );
			await expect( menuItem ).toBeFocused();

			await editorTopBar.focus();
			await expect( editorTopBar ).toBeFocused();
		}
	} );
} );
