/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { InspectorControls } from '../components';

function LightboxControl( { blockAttributes, config, update } ) {
	const blockHasLink =
		typeof blockAttributes?.linkDestination !== 'undefined' &&
		blockAttributes?.linkDestination !== 'none';
	const helpText = blockHasLink
		? __( 'The lightbox behavior is disabled for linked images.' )
		: '';

	return (
		<SelectControl
			label={ __( 'Animation' ) }
			value={ config.animation || '' }
			options={ [
				{
					value: 'zoom',
					label: __( 'Zoom' ),
				},
				{
					value: 'fade',
					label: __( 'Fade' ),
				},
			] }
			onChange={ ( value ) => update( { animation: value } ) }
			help={ helpText }
			hideCancelButton={ false }
			size="__unstable-large"
			disabled={ blockHasLink }
		/>
	);
}

function OverlinkControl( { config, update } ) {
	return (
		<SelectControl
			label={ __( 'Link' ) }
			value={ config.linkSelector || '' }
			options={ [
				{
					value: 'first',
					label: __( 'First link' ),
				},
				{
					value: 'last',
					label: __( 'Last link' ),
				},
			] }
			onChange={ ( value ) => update( { linkSelector: value } ) }
			hideCancelButton={ false }
			size="__unstable-large"
		/>
	);
}

function BehaviorsControl( {
	blockAttributes,
	blockName,
	onChangeBehavior,
	setAttributes,
} ) {
	const { behaviors: blockBehaviors } = blockAttributes;
	const { settings } = useSelect(
		( select ) => {
			const { getSettings } = select( blockEditorStore );
			return {
				settings:
					getSettings()?.__experimentalFeatures?.blocks?.[ blockName ]
						?.behaviors || {},
			};
		},
		[ blockName ]
	);

	const defaultBehaviors = {
		default: {
			value: 'default',
			label: __( 'Default' ),
		},
		noBehaviors: {
			value: '',
			label: __( 'No behaviors' ),
		},
	};
	const behaviorsOptions = Object.entries( settings )
		// Filter out behaviors that are disabled.
		.filter(
			( [ behaviorName, behaviorValue ] ) =>
				hasBlockSupport( blockName, `behaviors.${ behaviorName }` ) &&
				behaviorValue
		)
		.map( ( [ behaviorName ] ) => ( {
			value: behaviorName,
			// Capitalize the first letter of the behavior name.
			label: `${ behaviorName.charAt( 0 ).toUpperCase() }${ behaviorName
				.slice( 1 )
				.toLowerCase() }`,
		} ) );
	const options = [
		...Object.values( defaultBehaviors ),
		...behaviorsOptions,
	];

	const { behaviors, behaviorsValue } = useMemo( () => {
		const mergedBehaviors = {
			...( blockBehaviors || {} ),
		};

		let value = '';
		if ( blockBehaviors === undefined ) {
			value = 'default';
		} else {
			value = Object.keys( blockBehaviors ).find(
				( key ) => blockBehaviors[ key ].enabled
			);
		}
		return {
			behaviors: mergedBehaviors,
			behaviorsValue: value,
		};
	}, [ blockBehaviors ] );

	// If every behavior is disabled, do not show the behaviors inspector control.
	if ( behaviorsOptions.length === 0 ) {
		return null;
	}

	const Behavior = { lightbox: LightboxControl, overlink: OverlinkControl }[
		behaviorsValue
	];

	return (
		<InspectorControls group="advanced">
			<div>
				<SelectControl
					label={ __( 'Behaviors' ) }
					// At the moment we are only supporting one behavior (Lightbox)
					value={ behaviorsValue }
					options={ options }
					onChange={ onChangeBehavior }
					hideCancelButton={ true }
					size="__unstable-large"
				/>
				{ Behavior && (
					<Behavior
						blockAttributes={ blockAttributes }
						config={ behaviors[ behaviorsValue ] }
						update={ ( valuesMap ) => {
							setAttributes( {
								behaviors: {
									[ behaviorsValue ]: {
										...blockBehaviors[ behaviorsValue ],
										...valuesMap,
									},
								},
							} );
						} }
					/>
				) }
			</div>
		</InspectorControls>
	);
}

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning behaviors to blocks if behaviors are enabled in the theme.json.
 *
 * @param {WPComponent} BlockEdit Original component.
 *
 * @return {WPComponent} Wrapped component.
 */
export const withBehaviors = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const blockEdit = <BlockEdit key="edit" { ...props } />;
		// Only add behaviors to blocks with support.
		if ( ! hasBlockSupport( props.name, 'behaviors' ) ) {
			return blockEdit;
		}
		return (
			<>
				{ blockEdit }
				<BehaviorsControl
					blockAttributes={ props.attributes }
					blockName={ props.name }
					onChangeBehavior={ ( nextValue ) => {
						if ( nextValue === 'default' ) {
							props.setAttributes( {
								behaviors: undefined,
							} );
						}
						// Enables the given behavior and saves its default in attributes.
						else if ( nextValue === 'lightbox' ) {
							props.setAttributes( {
								behaviors: {
									lightbox: {
										enabled: true,
										animation: 'zoom',
									},
								},
							} );
						} else if ( nextValue === 'overlink' ) {
							props.setAttributes( {
								behaviors: {
									overlink: {
										enabled: true,
										linkSelector: 'first',
									},
								},
							} );
						}
					} }
					setAttributes={ props.setAttributes }
				/>
			</>
		);
	};
}, 'withBehaviors' );

addFilter(
	'editor.BlockEdit',
	'core/behaviors/with-inspector-control',
	withBehaviors
);
