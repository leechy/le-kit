# le-combobox



<!-- Auto Generated Below -->


## Overview

A combobox component with searchable dropdown.

Combines a text input with a dropdown list, allowing users to
filter options by typing or select from the list.

## Properties

| Property            | Attribute             | Description                                                                                                            | Type                             | Default               |
| ------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------- | --------------------- |
| `allowCustom`       | `allow-custom`        | Whether to allow custom values not in the options list.                                                                | `boolean`                        | `false`               |
| `autoWidth`         | `auto-width`          | Whether the dropdown width should size automatically to its content rather than matching the trigger width.            | `boolean`                        | `false`               |
| `disabled`          | `disabled`            | Whether the combobox is disabled.                                                                                      | `boolean`                        | `false`               |
| `emptyText`         | `empty-text`          | Text to show when no options match the search.                                                                         | `string`                         | `'No results found'`  |
| `fullWidth`         | `full-width`          | Whether the multiselect should take full width of its container.                                                       | `boolean`                        | `false`               |
| `matchTriggerWidth` | `match-trigger-width` | Whether the dropdown should match the trigger width. Defaults to true. Setting autoWidth=true overrides this to false. | `boolean`                        | `true`                |
| `minSearchLength`   | `min-search-length`   | Minimum characters before showing filtered results.                                                                    | `number`                         | `0`                   |
| `name`              | `name`                | Name attribute for form submission.                                                                                    | `string \| undefined`            | `undefined`           |
| `open`              | `open`                | Whether the dropdown is currently open.                                                                                | `boolean`                        | `false`               |
| `options`           | `options`             | The options to display in the dropdown.                                                                                | `LeOption[] \| string`           | `[]`                  |
| `placeholder`       | `placeholder`         | Placeholder text for the input.                                                                                        | `string`                         | `'Type to search...'` |
| `required`          | `required`            | Whether selection is required.                                                                                         | `boolean`                        | `false`               |
| `size`              | `size`                | Size variant of the combobox.                                                                                          | `"large" \| "medium" \| "small"` | `'medium'`            |
| `value`             | `value`               | The currently selected value.                                                                                          | `number \| string \| undefined`  | `undefined`           |


## Events

| Event      | Description                                               | Type                                |
| ---------- | --------------------------------------------------------- | ----------------------------------- |
| `leChange` | Emitted when the selected value changes.                  | `CustomEvent<LeOptionSelectDetail>` |
| `leClose`  | Emitted when the dropdown closes.                         | `CustomEvent<void>`                 |
| `leInput`  | Emitted when the input value changes (for custom values). | `CustomEvent<{ value: string; }>`   |
| `leOpen`   | Emitted when the dropdown opens.                          | `CustomEvent<void>`                 |


## Methods

### `focusInput() => Promise<void>`

Focuses the input element.

#### Returns

Type: `Promise<void>`



### `hideDropdown() => Promise<void>`

Closes the dropdown.

#### Returns

Type: `Promise<void>`



### `showDropdown() => Promise<void>`

Opens the dropdown.

#### Returns

Type: `Promise<void>`




## Dependencies

### Depends on

- [le-dropdown-base](../le-dropdown-base)
- [le-string-input](../le-string-input)
- [le-icon](../le-icon)

### Graph
```mermaid
graph TD;
  le-combobox --> le-dropdown-base
  le-combobox --> le-string-input
  le-combobox --> le-icon
  le-dropdown-base --> le-icon
  le-dropdown-base --> le-popover
  le-string-input --> le-button
  le-string-input --> le-icon
  le-button --> le-icon
  le-button --> le-visibility
  le-button --> le-tooltip
  style le-combobox fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
