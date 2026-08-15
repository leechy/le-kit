# le-list



<!-- Auto Generated Below -->


## Properties

| Property                  | Attribute                    | Description                                                                                                                                                                          | Type                                      | Default     |
| ------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | ----------- |
| `allowClearSort`          | `allow-clear-sort`           | Whether clicking a sorted column header a 3rd time clears sorting back to unsorted. Defaults to true.                                                                                | `boolean`                                 | `true`      |
| `allowColumnReorder`      | `allow-column-reorder`       | Alias for columnReorder.                                                                                                                                                             | `boolean`                                 | `false`     |
| `allowColumnToggle`       | `allow-column-toggle`        | Alias for columnVisibilityToggle.                                                                                                                                                    | `boolean`                                 | `false`     |
| `columnReorder`           | `column-reorder`             | Whether to allow column reordering via right-click header context menu. Defaults to false.                                                                                           | `boolean`                                 | `false`     |
| `columnVisibilityToggle`  | `column-visibility-toggle`   | Whether to enable right-click context menu on table header row to toggle column visibility. Defaults to false.                                                                       | `boolean`                                 | `false`     |
| `columns`                 | `columns`                    | Column configuration for the list table view. Can be an array of `LeColumn` objects or a JSON string. If omitted, columns will be automatically generated from data item properties. | `LeColumn[] \| string`                    | `[]`        |
| `data`                    | `data`                       | Data items to display in the list. Can be an array of `LeOption` objects or a JSON string. If omitted or empty, top-level `<le-item>` child elements will be parsed.                 | `LeOption[] \| string`                    | `[]`        |
| `defaultSortIconPosition` | `default-sort-icon-position` | Default sort icon placement across columns ('start' \| 'end' \| 'none'). If omitted, right-aligned columns default to 'start' and left/center columns default to 'end'.              | `"end" \| "none" \| "start" \| undefined` | `undefined` |
| `emptyIcon`               | `empty-icon`                 | Icon for default empty state (<le-empty>).                                                                                                                                           | `string \| undefined`                     | `undefined` |
| `emptyLabel`              | `empty-label`                | Main label text for default empty state (<le-empty>).                                                                                                                                | `string \| undefined`                     | `undefined` |
| `emptyMessage`            | `empty-message`              | Secondary description text for default empty state (<le-empty>).                                                                                                                     | `string \| undefined`                     | `undefined` |
| `emptyTitle`              | `empty-title`                | Title text for default empty state (<le-empty>).                                                                                                                                     | `string \| undefined`                     | `undefined` |


## Events

| Event                      | Description                                                    | Type                                                                                                                    |
| -------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `leColumnOrderChange`      | Emitted when column order changes via the context menu.        | `CustomEvent<{ columns: LeColumn[]; draggedColumn: LeColumn; targetColumn?: LeColumn \| undefined; }>`                  |
| `leColumnVisibilityChange` | Emitted when column visibility changes via the context menu.   | `CustomEvent<{ columns: LeColumn[]; toggledColumn: LeColumn; hidden: boolean; }>`                                       |
| `leItemToggle`             | Emitted when a hierarchical row item is expanded or collapsed. | `CustomEvent<{ item: LeOption; open: boolean; originalEvent?: MouseEvent \| undefined; }>`                              |
| `leSortChange`             | Emitted when column sorting changes.                           | `CustomEvent<{ key?: string \| undefined; column?: LeColumn \| undefined; direction?: "desc" \| "asc" \| undefined; }>` |


## Shadow Parts

| Part            | Description |
| --------------- | ----------- |
| `"header"`      |             |
| `"header-cell"` |             |


## Dependencies

### Depends on

- [le-icon](../le-icon)
- [le-tag](../le-tag)
- [le-collapse](../le-collapse)
- [le-empty](../le-empty)
- [le-context-menu](../le-context-menu)

### Graph
```mermaid
graph TD;
  le-list --> le-icon
  le-list --> le-tag
  le-list --> le-collapse
  le-list --> le-empty
  le-list --> le-context-menu
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
  le-collapse --> le-component
  le-empty --> le-icon
  le-empty --> le-button
  le-context-menu --> le-popover
  le-context-menu --> le-navigation
  le-navigation --> le-icon
  le-navigation --> le-string-input
  le-navigation --> le-collapse
  le-navigation --> le-popover
  le-navigation --> le-bar
  le-navigation --> le-component
  le-bar --> le-icon
  le-bar --> le-overflow-menu
  le-overflow-menu --> le-navigation
  le-overflow-menu --> le-popover
  le-overflow-menu --> le-button
  le-overflow-menu --> le-icon
  style le-list fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
