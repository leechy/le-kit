# le-overflow-menu



<!-- Auto Generated Below -->


## Properties

| Property           | Attribute            | Description                                | Type                                     | Default                 |
| ------------------ | -------------------- | ------------------------------------------ | ---------------------------------------- | ----------------------- |
| `align`            | `align`              | Popover alignment relative to trigger.     | `"center" \| "end" \| "start"`           | `'end'`                 |
| `disabled`         | `disabled`           | Disables trigger interactions.             | `boolean`                                | `false`                 |
| `icon`             | `icon`               | Fallback icon name for trigger.            | `string`                                 | `'ellipsis-horizontal'` |
| `items`            | `items`              | List of menu items represented as options. | `LeOption[] \| string`                   | `[]`                    |
| `minWidth`         | `min-width`          | Minimum popover width.                     | `string`                                 | `'160px'`               |
| `offset`           | `offset`             | Popover offset in px.                      | `number`                                 | `8`                     |
| `open`             | `open`               | Whether the menu popover is open.          | `boolean`                                | `false`                 |
| `position`         | `position`           | Popover position.                          | `"bottom" \| "left" \| "right" \| "top"` | `'bottom'`              |
| `triggerAriaLabel` | `trigger-aria-label` | Aria label for fallback trigger button.    | `string`                                 | `'Open menu'`           |
| `triggerPart`      | `trigger-part`       | Part name for fallback trigger button.     | `string`                                 | `'trigger-button'`      |


## Events

| Event                      | Description | Type                                          |
| -------------------------- | ----------- | --------------------------------------------- |
| `leOverflowMenuClose`      |             | `CustomEvent<void>`                           |
| `leOverflowMenuItemSelect` |             | `CustomEvent<LeOverflowMenuItemSelectDetail>` |


## Methods

### `hide() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `navigate(key: "ArrowDown" | "ArrowUp" | "Enter") => Promise<void>`



#### Parameters

| Name  | Type                                  | Description |
| ----- | ------------------------------------- | ----------- |
| `key` | `"ArrowDown" \| "ArrowUp" \| "Enter"` |             |

#### Returns

Type: `Promise<void>`



### `show() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `toggle() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Shadow Parts

| Part        | Description |
| ----------- | ----------- |
| `"trigger"` |             |


## Dependencies

### Used by

 - [le-bar](../le-bar)
 - [le-button-group](../le-button-group)
 - [le-toolbar](../le-toolbar)

### Depends on

- [le-navigation](../le-navigation)
- [le-popover](../le-popover)
- [le-button](../le-button)
- [le-icon](../le-icon)

### Graph
```mermaid
graph TD;
  le-overflow-menu --> le-navigation
  le-overflow-menu --> le-popover
  le-overflow-menu --> le-button
  le-overflow-menu --> le-icon
  le-navigation --> le-icon
  le-navigation --> le-string-input
  le-navigation --> le-collapse
  le-navigation --> le-popover
  le-navigation --> le-bar
  le-string-input --> le-button
  le-string-input --> le-icon
  le-button --> le-icon
  le-button --> le-visibility
  le-button --> le-tooltip
  le-bar --> le-overflow-menu
  le-button-group --> le-overflow-menu
  le-toolbar --> le-overflow-menu
  style le-overflow-menu fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
