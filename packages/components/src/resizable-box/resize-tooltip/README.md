# ResizeTooltip

ResizeTooltip displays dimensions. It’s positioned relative to its container.

## Usage

```jsx
import { useState } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';

const Example = () => {
	const [ size, setSize ] = useState();
	const observeSize = useRefEffect( ( node ) => {
		const observer = new ResizeObserver(
			( [ { borderBoxSize: [ { inlineSize, blockSize } ] } ] ) => {
				setSize( [ inlineSize, blockSize ] );
			}
		)
		observer.observe( node );
		return () => observer.disconnect();
	}, [] )
	return (
		<div ref={ observeSize } style={ { position: 'relative' } }>
			<ResizeTooltip size={ size } />
			...
		</div>
	);
};
```

### Positions

`<ResizeTooltip />` has two positions;

-   `bottom` (Default)
-   `corner`

##### `bottom`

The `bottom` position (default) renders the dimensions label at the bottom-center of the (parent) element.

##### `corner`

The `corner` position renders the dimensions label in the top-right corner of the (parent) element. For this position to work, be sure that the parent element containing `<ResizeTooltip />` is styled to create a block formatting context. Most commonly done by setting the `position` style property to `relative|absolute|fixed|sticky`.

## Props

### axis

Limits the label to render corresponding to the axis. By default, the label will automatically render based on both `x` and `y` changes.

-   Type: `String`
-   Required: No
-   Values: `x` | `y`

### fadeTimeout

Duration (in `ms`) before the label transitions out after resize event. Applicable only if `isVisible` is unset.

-   Type: `Number`
-   Required: No
-   Default: `180`

### isVisible

Determines whether or not the label is shown.

-   Type: `Boolean`
-   Required: No
-   Default: `undefined`

### labelRef

Callback [Ref](https://reactjs.org/docs/forwarding-refs.html) for the label element.

-   Type: `Function`
-   Required: No

### position

The position for the label.

-   Type: `String`
-   Required: No
-   Default: `corner`
-   Values: `bottom` | `corner`

### showPx

Renders a `px` unit suffix after the width or height value in the label. Not applicable when position is `corner`

-   Type: `Boolean`
-   Required: No
-   Default: `true`

### zIndex

The `z-index` style property for the label.

-   Type: `Number`
-   Required: No
-   Default: `1000`
