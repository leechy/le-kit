# le-select



<!-- Auto Generated Below -->


## Overview

A select dropdown component for single selection.

## Properties

| Property      | Attribute      | Description                                  | Type                                 | Default              |
| ------------- | -------------- | -------------------------------------------- | ------------------------------------ | -------------------- |
| `chevron`     | `chevron`      | Custom chevron icon name or text.            | `string \| undefined`                | `undefined`          |
| `disabled`    | `disabled`     | Whether the select is disabled.              | `boolean`                            | `false`              |
| `hideChevron` | `hide-chevron` | Whether to hide the chevron icon completely. | `boolean`                            | `false`              |
| `name`        | `name`         | Name attribute for form submission.          | `string \| undefined`                | `undefined`          |
| `open`        | `open`         | Whether the dropdown is currently open.      | `boolean`                            | `false`              |
| `options`     | `options`      | The options to display in the dropdown.      | `LeOption[] \| string`               | `[]`                 |
| `placeholder` | `placeholder`  | Placeholder text when no option is selected. | `string`                             | `'Select an option'` |
| `required`    | `required`     | Whether selection is required.               | `boolean`                            | `false`              |
| `size`        | `size`         | Size variant of the select.                  | `"large" \| "medium" \| "small"`     | `'medium'`           |
| `value`       | `value`        | The currently selected value.                | `number \| string \| undefined`      | `undefined`          |
| `variant`     | `variant`      | Visual variant of the select.                | `"default" \| "outlined" \| "solid"` | `'default'`          |


## Events

| Event      | Description                              | Type                                |
| ---------- | ---------------------------------------- | ----------------------------------- |
| `leChange` | Emitted when the selected value changes. | `CustomEvent<LeOptionSelectDetail>` |
| `leClose`  | Emitted when the dropdown closes.        | `CustomEvent<void>`                 |
| `leOpen`   | Emitted when the dropdown opens.         | `CustomEvent<void>`                 |


## Methods

### `hideDropdown() => Promise<void>`

Closes the dropdown.

#### Returns

Type: `Promise<void>`



### `showDropdown() => Promise<void>`

Opens the dropdown.

#### Returns

Type: `Promise<void>`




## Slots

| Slot        | Description                                                     |
| ----------- | --------------------------------------------------------------- |
| `"chevron"` | Custom chevron icon to display at the end of the select trigger |


## Dependencies

### Used by

 - [le-component](../le-component)

### Depends on

- [le-icon](../le-icon)
- [le-component](../le-component)
- [le-dropdown-base](../le-dropdown-base)
- [le-button](../le-button)

### Graph
```mermaid
graph TD;
  le-select --> le-icon
  le-select --> le-component
  le-select --> le-dropdown-base
  le-select --> le-button
  le-component --> le-select
  le-button --> le-icon
  le-button --> le-visibility
  le-button --> le-slot
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
  le-checkbox --> le-component
  le-checkbox --> le-slot
  le-popup --> le-slot
  le-popup --> le-button
  le-popup --> le-component
  le-dropdown-base --> le-icon
  le-dropdown-base --> le-popover
  style le-select fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
