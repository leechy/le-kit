# le-slot



<!-- Auto Generated Below -->


## Overview

Slot placeholder component for admin/CMS mode.

This component renders a visual placeholder for slots when in admin mode,
allowing CMS systems to show available drop zones for content or inline editing.

In non-admin mode, this component renders nothing and acts as a passthrough.

## Properties

| Property            | Attribute            | Description                                                                                                                                                                | Type                             | Default     |
| ------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ----------- |
| `allowedComponents` | `allowed-components` | Comma-separated list of allowed component tags for this slot. Used by CMS to filter available components.                                                                  | `string`                         | `undefined` |
| `description`       | `description`        | Description of what content this slot accepts. Shown in admin mode to guide content editors.                                                                               | `string`                         | `undefined` |
| `label`             | `label`              | Label to display in admin mode. If not provided, the slot name will be used.                                                                                               | `string`                         | `undefined` |
| `multiple`          | `multiple`           | Whether multiple components can be dropped in this slot.                                                                                                                   | `boolean`                        | `true`      |
| `name`              | `name`               | The name of the slot this placeholder represents. Should match the slot name in the parent component.                                                                      | `string`                         | `''`        |
| `placeholder`       | `placeholder`        | Placeholder text for text/textarea inputs in admin mode.                                                                                                                   | `string`                         | `undefined` |
| `required`          | `required`           | Whether this slot is required to have content.                                                                                                                             | `boolean`                        | `false`     |
| `slotStyle`         | `slot-style`         | CSS styles for the slot dropzone container. Useful for layouts - e.g., "flex-direction: row" for horizontal stacks. Only applies in admin mode for type="slot".            | `string`                         | `undefined` |
| `tag`               | `tag`                | The HTML tag to create when there's no slotted element. Used with type="text" or type="textarea" to auto-create elements.                                                  | `string`                         | `undefined` |
| `type`              | `type`               | The type of slot content. - `slot`: Default, shows a dropzone for components (default) - `text`: Shows a single-line text input - `textarea`: Shows a multi-line text area | `"slot" \| "text" \| "textarea"` | `'slot'`    |


## Events

| Event          | Description                                                                                                 | Type                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `leSlotChange` | Emitted when text content changes in admin mode. The event detail contains the new text value and validity. | `CustomEvent<{ name: string; value: string; isValid: boolean; }>` |


## Slots

| Slot | Description                                          |
| ---- | ---------------------------------------------------- |
|      | Default slot for placeholder content or drop zone UI |


## Dependencies

### Used by

 - [le-box](../le-box)
 - [le-button](../le-button)
 - [le-card](../le-card)
 - [le-checkbox](../le-checkbox)
 - [le-number-input](../le-number-input)
 - [le-popup](../le-popup)
 - [le-stack](../le-stack)
 - [le-string-input](../le-string-input)
 - [le-tab](../le-tab)
 - [le-tab-bar](../le-tab-bar)
 - [le-tab-panel](../le-tab-panel)
 - [le-tabs](../le-tabs)
 - [le-tag](../le-tag)
 - [le-web-page-header](../le-web-page-header)

### Depends on

- [le-popover](../le-popover)
- [le-button](../le-button)
- [le-string-input](../le-string-input)

### Graph
```mermaid
graph TD;
  le-slot --> le-popover
  le-slot --> le-button
  le-slot --> le-string-input
  le-button --> le-slot
  le-component --> le-button
  le-component --> le-select
  le-component --> le-checkbox
  le-component --> le-string-input
  le-component --> le-popover
  le-component --> le-popup
  le-select --> le-component
  le-select --> le-dropdown-base
  le-select --> le-button
  le-select --> le-string-input
  le-dropdown-base --> le-popover
  le-string-input --> le-slot
  le-checkbox --> le-slot
  le-popup --> le-slot
  le-box --> le-slot
  le-card --> le-slot
  le-number-input --> le-slot
  le-stack --> le-slot
  le-tab --> le-slot
  le-tab-bar --> le-slot
  le-tab-panel --> le-slot
  le-tabs --> le-slot
  le-tag --> le-slot
  le-web-page-header --> le-slot
  style le-slot fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
