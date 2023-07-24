/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';

export default function EditCellblock( {
	attributes,
	clientId,
	setAttributes,
} ) {
	const { columns } = attributes;
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps(),
		{
			template: [
				[ 'core/cellblock-cell', {}, [ [ 'core/paragraph' ] ] ],
			],
			allowedBlocks: [ 'core/cellblock-cell' ],
			// Don't render an appender because it triggers a warning about
			// valid DOM nesting. Even utilizing the render prop the result is
			// wrapped in a div.
			renderAppender: false /*( ...all ) => {
				console.log('render appender', ...all);
				return <td><InnerBlocks.ButtonBlockAppender /></td>
			}*/,
			render: ( order, each ) => {
				const rowList = [];
				let row;
				order.forEach( ( childClientId, index ) => {
					if ( index % columns === 0 ) {
						row = [];
						rowList.push( row );
					}
					row.push( each( childClientId ) );
				} );
				return rowList.map( ( r, index ) => (
					<tr key={ index }>{ r }</tr>
				) );
			},
		}
	);
	return (
		<>
			<InspectorControls>
				<NumberControl
					value={ columns }
					onChange={ ( v ) => setAttributes( { columns: v } ) }
					spinControls="custom"
				/>
			</InspectorControls>
			<table { ...innerBlocksProps }>
				<tbody>
					{ children }
					<tr>
						<td colSpan={ columns }>
							<InnerBlocks.ButtonBlockAppender
								clientId={ clientId }
							/>
						</td>
					</tr>
				</tbody>
			</table>
		</>
	);
}
