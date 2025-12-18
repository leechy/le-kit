# le-segmented-control



<!-- Auto Generated Below -->


## Overview

A segmented control component (iOS-style toggle buttons).

Perfect for toggling between a small set of related options.

## Properties

| Property    | Attribute    | Description                                 | Type                                          | Default     |
| ----------- | ------------ | ------------------------------------------- | --------------------------------------------- | ----------- |
| `disabled`  | `disabled`   | Whether the control is disabled.            | `boolean`                                     | `false`     |
| `fullWidth` | `full-width` | Whether the control should take full width. | `boolean`                                     | `false`     |
| `options`   | --           | Array of options for the segmented control. | `LeOption[]`                                  | `[]`        |
| `overflow`  | `overflow`   | Scroll behavior for overflowing tabs.       | `"auto" \| "hidden" \| "scroll" \| "visible"` | `'auto'`    |
| `size`      | `size`       | Size of the control.                        | `"large" \| "medium" \| "small"`              | `'medium'`  |
| `value`     | `value`      | The value of the currently selected option. | `number \| string`                            | `undefined` |


## Events

| Event      | Description                         | Type                                |
| ---------- | ----------------------------------- | ----------------------------------- |
| `leChange` | Emitted when the selection changes. | `CustomEvent<LeOptionSelectDetail>` |


## Shadow Parts

| Part          | Description |
| ------------- | ----------- |
| `"container"` |             |


## Dependencies

### Depends on

- [le-component](../le-component)
- [le-tab](../le-tab)

### Graph
```mermaid
graph TD;
  le-segmented-control --> le-component
  le-segmented-control --> le-tab
  le-component --> le-button
  le-component --> le-select
  le-component --> le-checkbox
  le-component --> le-string-input
  le-component --> le-popover
  le-component --> le-popup
  le-button --> le-component
  le-button --> le-slot
  le-slot --> le-popover
  le-slot --> le-button
  le-slot --> le-string-input
  le-string-input --> le-component
  le-string-input --> le-slot
  le-select --> le-component
  le-select --> le-dropdown-base
  le-select --> le-button
  le-select --> le-string-input
  le-dropdown-base --> le-popover
  le-checkbox --> le-component
  le-checkbox --> le-slot
  le-popup --> le-slot
  le-popup --> le-button
  le-popup --> le-component
  le-tab --> le-component
  le-tab --> le-slot
  style le-segmented-control fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
