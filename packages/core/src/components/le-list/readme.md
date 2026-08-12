# le-list



<!-- Auto Generated Below -->


## Properties

| Property                  | Attribute                    | Description                                                                                                                                                                          | Type                                      | Default     |
| ------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ----------- |
| `allowClearSort`          | `allow-clear-sort`           | Whether clicking a sorted column header a 3rd time clears sorting back to unsorted. Defaults to true.                                                                                | `boolean`                                 | `true`      |
| `columns`                 | `columns`                    | Column configuration for the list table view. Can be an array of `LeColumn` objects or a JSON string. If omitted, columns will be automatically generated from data item properties. | `LeColumn[] \| string`                    | `[]`        |
| `data`                    | `data`                       | Data items to display in the list. Can be an array of `LeOption` objects or a JSON string. If omitted or empty, top-level `<le-item>` child elements will be parsed.                 | `LeOption[] \| string`                    | `[]`        |
| `defaultSortIconPosition` | `default-sort-icon-position` | Default sort icon placement across columns ('start' \| 'end' \| 'none'). If omitted, right-aligned columns default to 'start' and left/center columns default to 'end'.              | `"end" \| "none" \| "start" \| undefined` | `undefined` |
| `emptyIcon`               | `empty-icon`                 | Icon for default empty state (<le-empty>).                                                                                                                                           | `string \| undefined`                     | `undefined` |
| `emptyLabel`              | `empty-label`                | Main label text for default empty state (<le-empty>).                                                                                                                                | `string \| undefined`                     | `undefined` |
| `emptyMessage`            | `empty-message`              | Secondary description text for default empty state (<le-empty>).                                                                                                                     | `string \| undefined`                     | `undefined` |
| `emptyTitle`              | `empty-title`                | Title text for default empty state (<le-empty>).                                                                                                                                     | `string \| undefined`                     | `undefined` |


## Events

| Event          | Description                          | Type                                                                                                                    |
| -------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `leSortChange` | Emitted when column sorting changes. | `CustomEvent<{ key?: string \| undefined; column?: LeColumn \| undefined; direction?: "desc" \| "asc" \| undefined; }>` |


## Shadow Parts

| Part            | Description |
| --------------- | ----------- |
| `"header-cell"` |             |


## Dependencies

### Depends on

- [le-icon](../le-icon)
- [le-tag](../le-tag)
- [le-empty](../le-empty)

### Graph
```mermaid
graph TD;
  le-list --> le-icon
  le-list --> le-tag
  le-list --> le-empty
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
  le-select --> le-icon
  le-select --> le-component
  le-select --> le-dropdown-base
  le-select --> le-button
  le-dropdown-base --> le-icon
  le-dropdown-base --> le-popover
  le-checkbox --> le-component
  le-checkbox --> le-slot
  le-popup --> le-slot
  le-popup --> le-button
  le-popup --> le-component
  le-empty --> le-icon
  le-empty --> le-button
  style le-list fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
