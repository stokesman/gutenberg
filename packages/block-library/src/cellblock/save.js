/**
 * WordPress dependencies
 */
import { serializeBlock } from '@wordpress/blocks';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import {
	Children,
	cloneElement,
	renderToString,
	RawHTML,
} from '@wordpress/element';

export default function SaveCellblock( { attributes: { columns } } ) {
	const { children, innerBlocksProps } = useInnerBlocksProps.save(
		undefined,
		{
			wrapInner: ( serialized ) => {
				console.log('wrap inner', serialized);
				const rowList = [];
				serialized.forEach( ( child, index ) => {
					let row;
					if ( index % columns === 0 ) {
						row = [];
						rowList.push( row );
					}
					row.push( child );
				} );
				return rowList.map( ( r ) => `<tr>${ r.join( '\n\n' ) }</tr>` );
			},
		}
	);
	// if ( children?.type === RawHTML ) return children;
	// const [ firstChild ] = children ?? [];
	// console.log( Children.count(children), 'Save cellblock', firstChild );
	// const saveChild = firstChild?.clientId
	// 	? ( child, index ) => {
	// 			const childMarkup = (
	// 				<RawHTML key={ index }>
	// 					{ serializeBlock( child, { isInnerBlocks: true } ) }
	// 				</RawHTML>
	// 			);
	// 			console.log(index, 'child with id ', childMarkup)
	// 	  }
	// 	: ( child, index ) =>
	// 			cloneElement( child, { key: index, ...child.props } );

	// const rowList = [];
	// let row;
	// Children.forEach( children, ( child, index ) => {
	// 	if ( index % columns === 0 ) {
	// 		row = [];
	// 		rowList.push( row );
	// 	}
	// 	row.push( saveChild( child, index ) );
	// } );
	// console.log( Children.count( children ), 'eached ', rowList );
	const output = (
		<table { ...useBlockProps.save( innerBlocksProps ) }>
			<tbody>{ children }</tbody>
		</table>
	);
	console.log( 'output', renderToString( output ) );
	return output;
}
