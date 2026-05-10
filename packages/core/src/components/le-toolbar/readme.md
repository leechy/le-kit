# le-toolbar



<!-- Auto Generated Below -->


## Overview

A priority-aware, overflow-safe toolbar component.

Items are slotted light-DOM children. Each item may carry a
`priority` attribute (lower = more important). When there
isn't enough space, lower-priority items move to an overflow menu.

Collapsible `le-button-group` children are asked to reduce their own
footprint first before their contents are overflowed entirely.

## Properties

| Property         | Attribute         | Description                                                                                                                                                                | Type                                        | Default                                             |
| ---------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| `alignItems`     | `align-items`     | Alignment of items along the main axis.                                                                                                                                    | `"center" \| "end" \| "start" \| "stretch"` | `'start'`                                           |
| `disablePopover` | `disable-popover` | Disable the built-in overflow popover. The toolbar will still compute overflow state and emit events, but won't render its own menu. Useful for custom overflow handling.  | `boolean`                                   | `false`                                             |
| `itemGap`        | `item-gap`        | Spacing between top-level toolbar items. Accepts any valid CSS length (e.g. `8px`, `0.5rem`, `var(--le-spacing-2)`).                                                       | `string`                                    | `'var(--le-toolbar-gap, var(--le-spacing-1, 4px))'` |
| `items`          | --                | Optional declarative items input.  The current implementation is slot-driven, but when this prop changes we still invalidate the slotted-items cache and recompute layout. | `unknown`                                   | `undefined`                                         |
| `overflowIcon`   | `overflow-icon`   | Icon for the overflow trigger button when no custom slot content is provided.                                                                                              | `string`                                    | `'ellipsis-horizontal'`                             |
| `overflowLabel`  | `overflow-label`  | Accessible label for the overflow trigger button.                                                                                                                          | `string`                                    | `'More'`                                            |


## Events

| Event                     | Description                              | Type                                         |
| ------------------------- | ---------------------------------------- | -------------------------------------------- |
| `leToolbarOverflowChange` | Emitted when the overflow state changes. | `CustomEvent<LeToolbarOverflowChangeDetail>` |


## Methods

### `recalculate() => Promise<void>`

Force a layout recalculation.

#### Returns

Type: `Promise<void>`




## Slots

| Slot                 | Description                                    |
| -------------------- | ---------------------------------------------- |
|                      | Toolbar items                                  |
| `"overflow-trigger"` | Custom content for the overflow trigger button |


## Shadow Parts

| Part                 | Description |
| -------------------- | ----------- |
| `"container"`        |             |
| `"overflow-trigger"` |             |


## Dependencies

### Depends on

- [le-icon](../le-icon)
- [le-overflow-menu](../le-overflow-menu)

### Graph
```mermaid
graph TD;
  le-toolbar --> le-icon
  le-toolbar --> le-overflow-menu
  le-overflow-menu --> le-navigation
  le-overflow-menu --> le-popover
  le-overflow-menu --> le-button
  le-overflow-menu --> le-icon
  le-navigation --> le-string-input
  le-navigation --> le-icon
  le-navigation --> le-collapse
  le-navigation --> le-popover
  le-navigation --> le-bar
  le-navigation --> le-component
  le-string-input --> le-component
  le-string-input --> le-button
  le-string-input --> le-icon
  le-string-input --> le-slot
  le-component --> le-button
  le-component --> le-select
  le-component --> le-checkbox
  le-component --> le-string-input
  le-component --> le-popover
  le-component --> le-popup
  le-button --> le-icon
  le-button --> le-slot
  le-button --> le-visibility
  le-button --> le-component
  le-button --> le-tooltip
  le-slot --> le-popover
  le-slot --> le-button
  le-slot --> le-string-input
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
  le-collapse --> le-component
  le-bar --> le-icon
  le-bar --> le-overflow-menu
  style le-toolbar fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
