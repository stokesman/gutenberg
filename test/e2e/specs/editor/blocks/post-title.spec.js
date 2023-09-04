/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post Title block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Can edit the post title', async ( { editor, page } ) => {
		// Insert the block and change the title.
		await editor.insertBlock( { name: 'core/post-title' } );
		await page.keyboard.type( '🥨' );

		// Save the post draft, reload and assert the post’s title changed.
		await page.click( 'role=button[name="Save draft"i]' );
		await page
			.locator( 'role=button[name="Dismiss this notice"i]' )
			.waitFor();
		await page.reload();
		await expect(
			page
				.frameLocator( '[name=editor-canvas]' )
				.locator( 'role=textbox[name="Add title"i]' )
		).toHaveText( '🥨' );
	} );
} );
