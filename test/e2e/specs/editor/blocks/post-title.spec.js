/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post Title block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Can edit the post title', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/post-title' } );

		// Change the title from the block.
		await editor.canvas
			.locator( 'role=document[name="Block: Title"i]' )
			.type( 'Just tweaking the post title' );

		// Save the post draft, reload and assert the post’s title changed.
		await page.click( 'role=button[name="Save draft"i]' );
		await page.waitForSelector(
			'role=button[name="Dismiss this notice"i]'
		);
		await page.reload();
		await expect(
			page
				.frameLocator( '[name=editor-canvas]' )
				.locator( 'role=textbox[name="Add title"i]' )
		).toHaveText( 'Just tweaking the post title' );
	} );
} );
