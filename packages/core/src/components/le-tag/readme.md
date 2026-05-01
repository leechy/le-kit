# le-tag



<!-- Auto Generated Below -->


## Overview

A tag/chip component for displaying labels with optional dismiss functionality.

## Properties

| Property      | Attribute     | Description                                                           | Type                                                                                    | Default     |
| ------------- | ------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------- |
| `color`       | `color`       | The color of the tag.                                                 | `"danger" \| "default" \| "info" \| "primary" \| "secondary" \| "success" \| "warning"` | `'default'` |
| `disabled`    | `disabled`    | Whether the tag is disabled.                                          | `boolean`                                                                               | `false`     |
| `dismissible` | `dismissible` | Whether the tag can be dismissed (shows close button).                | `boolean`                                                                               | `false`     |
| `icon`        | `icon`        | Icon to display before the label. Can be an emoji, URL, or icon name. | `string \| undefined`                                                                   | `undefined` |
| `label`       | `label`       | The text label to display in the tag.                                 | `string \| undefined`                                                                   | `undefined` |
| `mode`        | `mode`        | Mode of the popover should be 'default' for internal use              | `"admin" \| "default" \| undefined`                                                     | `undefined` |
| `size`        | `size`        | The size of the tag.                                                  | `"large" \| "medium" \| "small"`                                                        | `'medium'`  |


## Events

| Event       | Description                                 | Type                |
| ----------- | ------------------------------------------- | ------------------- |
| `leDismiss` | Emitted when the dismiss button is clicked. | `CustomEvent<void>` |


## Slots

| Slot | Description                                            |
| ---- | ------------------------------------------------------ |
|      | Default slot for custom content (overrides label prop) |


## Dependencies

### Used by

 - [le-multiselect](../le-multiselect)

### Depends on

- [le-component](../le-component)
- [le-slot](../le-slot)
- [le-button](../le-button)
- [le-icon](../le-icon)

### Graph
```mermaid
graph TD;
  le-tag --> le-component
  le-tag --> le-slot
  le-tag --> le-button
  le-tag --> le-icon
  le-component --> le-button
  le-component --> le-select
  le-component --> le-checkbox
  le-component --> le-string-input
  le-component --> le-popover
  le-component --> le-popup
  le-button --> le-slot
  le-button --> le-visibility
  le-button --> le-component
  le-button --> le-tooltip
  le-slot --> le-popover
  le-slot --> le-button
  le-slot --> le-string-input
  le-string-input --> le-component
  le-string-input --> le-button
  le-string-input --> le-icon
  le-string-input --> le-slot
  le-tooltip --> le-component
  le-select --> le-component
  le-select --> le-dropdown-base
  le-select --> le-button
  le-dropdown-base --> le-popover
  le-checkbox --> le-component
  le-checkbox --> le-slot
  le-popup --> le-slot
  le-popup --> le-button
  le-popup --> le-component
  le-multiselect --> le-tag
  style le-tag fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
