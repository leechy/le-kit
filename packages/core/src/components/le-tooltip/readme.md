# le-tooltip



<!-- Auto Generated Below -->


## Properties

| Property    | Attribute    | Description                                                                    | Type                                               | Default     |
| ----------- | ------------ | ------------------------------------------------------------------------------ | -------------------------------------------------- | ----------- |
| `align`     | `align`      | Alignment along the cross axis for the chosen placement.                       | `"center" \| "end" \| "start"`                     | `'center'`  |
| `disabled`  | `disabled`   | Disable tooltip interactions and visibility.                                   | `boolean`                                          | `false`     |
| `hideDelay` | `hide-delay` | Delay in milliseconds before hiding the tooltip after leaving trigger/content. | `number`                                           | `160`       |
| `maxWidth`  | `max-width`  | Max width of the tooltip box.                                                  | `string`                                           | `'280px'`   |
| `mode`      | `mode`       | The mode of Le Kit.                                                            | `string`                                           | `'default'` |
| `offset`    | `offset`     | Distance in pixels between trigger and tooltip.                                | `number`                                           | `8`         |
| `open`      | `open`       | Controls whether the tooltip is open.                                          | `boolean`                                          | `false`     |
| `placement` | `placement`  | Preferred tooltip placement relative to trigger.                               | `"auto" \| "bottom" \| "left" \| "right" \| "top"` | `'auto'`    |
| `showDelay` | `show-delay` | Delay in milliseconds before showing the tooltip.                              | `number`                                           | `500`       |
| `text`      | `text`       | Tooltip text shown when no custom content slot is provided.                    | `string`                                           | `''`        |
| `variant`   | `variant`    | Visual variant of tooltip.                                                     | `"danger" \| "default" \| "success"`               | `'default'` |


## Events

| Event            | Description                      | Type                |
| ---------------- | -------------------------------- | ------------------- |
| `leTooltipClose` | Emitted when the tooltip closes. | `CustomEvent<void>` |
| `leTooltipOpen`  | Emitted when the tooltip opens.  | `CustomEvent<void>` |


## Methods

### `hide() => Promise<void>`

Hides the tooltip.

#### Returns

Type: `Promise<void>`



### `show() => Promise<void>`

Shows the tooltip.

#### Returns

Type: `Promise<void>`



### `toggle() => Promise<void>`

Toggles the tooltip.

#### Returns

Type: `Promise<void>`



### `updatePosition() => Promise<void>`

Updates tooltip position manually.

#### Returns

Type: `Promise<void>`




## Shadow Parts

| Part        | Description |
| ----------- | ----------- |
| `"content"` |             |
| `"trigger"` |             |


## Dependencies

### Used by

 - [le-button](../le-button)

### Depends on

- [le-component](../le-component)

### Graph
```mermaid
graph TD;
  le-tooltip --> le-component
  le-component --> le-button
  le-component --> le-select
  le-component --> le-checkbox
  le-component --> le-string-input
  le-component --> le-popover
  le-component --> le-popup
  le-button --> le-tooltip
  le-slot --> le-popover
  le-slot --> le-button
  le-slot --> le-string-input
  le-string-input --> le-component
  le-string-input --> le-button
  le-string-input --> le-icon
  le-string-input --> le-slot
  le-select --> le-component
  le-select --> le-dropdown-base
  le-select --> le-button
  le-dropdown-base --> le-popover
  le-checkbox --> le-component
  le-checkbox --> le-slot
  le-popup --> le-slot
  le-popup --> le-button
  le-popup --> le-component
  style le-tooltip fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
