/**
 * Internal dependencies
 */
import getComputedStyle from './get-computed-style';

/**
 * @typedef Options
 * @property {string=}  direction Direction of scrollable container to search for ('vertical', 'horizontal', 'all').
 *                                Defaults to 'vertical'.
 * @property {boolean=} strict    Whether to return void instead of the document when no scrollable container was found.
 */

/**
 * Given a DOM node, finds the closest scrollable container node or the node
 * itself, if scrollable.
 *
 * @param {Element | null}                 node    Node from which to start.
 * @param {Options['direction'] | Options} options Options for how to proceed.
 * @return {Element | undefined} Scrollable container node, if found.
 */
export default function getScrollContainer(
	node,
	options = { direction: 'vertical' }
) {
	if ( ! node ) {
		return undefined;
	}
	const { direction, strict } =
		typeof options === 'object' ? options : { direction: options };

	if ( direction === 'vertical' || direction === 'all' ) {
		// Scrollable if scrollable height exceeds displayed...
		if ( node.scrollHeight > node.clientHeight ) {
			// ...except when overflow is defined to be hidden or visible
			const { overflowY } = getComputedStyle( node );

			if ( /(auto|scroll)/.test( overflowY ) ) {
				return node;
			}
		}
	}

	if ( direction === 'horizontal' || direction === 'all' ) {
		// Scrollable if scrollable width exceeds displayed...
		if ( node.scrollWidth > node.clientWidth ) {
			// ...except when overflow is defined to be hidden or visible
			const { overflowX } = getComputedStyle( node );

			if ( /(auto|scroll)/.test( overflowX ) ) {
				return node;
			}
		}
	}

	if ( node.ownerDocument === node.parentNode ) {
		return strict ? undefined : node;
	}

	// Continue traversing.
	return getScrollContainer( /** @type {Element} */ ( node.parentNode ), {
		direction,
		strict,
	} );
}
