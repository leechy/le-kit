# le-bar



<!-- Auto Generated Below -->


## Overview

A flexible bar component that handles overflow gracefully.

Items are slotted children. The bar measures which items fit on the first
row and handles overflow according to the `overflow` prop.

## Properties

| Property          | Attribute           | Description                                                                                                                                                                                                                                                                  | Type                                          | Default   |
| ----------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------- |
| `alignItems`      | `align-items`       | Alignment of items within the bar (maps to justify-content).                                                                                                                                                                                                                 | `"center" \| "end" \| "start" \| "stretch"`   | `'start'` |
| `arrows`          | `arrows`            | Show scroll arrows when overflow is "scroll".                                                                                                                                                                                                                                | `boolean`                                     | `false`   |
| `disablePopover`  | `disable-popover`   | Disable the internal overflow popover. When true, the bar still detects overflow and hides items, but doesn't render its own popover. Use this when providing custom overflow handling via the leBarOverflowChange event.                                                    | `boolean`                                     | `false`   |
| `minVisibleItems` | `min-visible-items` | Minimum number of visible items required when using "more" overflow mode. If fewer items would be visible, the bar falls back to hamburger mode. Only applies when overflow is "more".                                                                                       | `number`                                      | `0`       |
| `overflow`        | `overflow`          | Overflow behavior when items don't fit on one row. - `more`: Overflow items appear in a "more" dropdown - `scroll`: Items scroll horizontally with optional arrows - `hamburger`: All items go into a hamburger menu if any overflow - `wrap`: Items wrap to additional rows | `"hamburger" \| "more" \| "scroll" \| "wrap"` | `'more'`  |
| `showAllMenu`     | `show-all-menu`     | Show an "all items" menu button. - `false`: Don't show - `true` or `'end'`: Show at end - `'start'`: Show at start                                                                                                                                                           | `"end" \| "start" \| boolean`                 | `false`   |


## Events

| Event                 | Description                          | Type                                     |
| --------------------- | ------------------------------------ | ---------------------------------------- |
| `leBarOverflowChange` | Emitted when overflow state changes. | `CustomEvent<LeBarOverflowChangeDetail>` |


## Methods

### `recalculate() => Promise<void>`

Force recalculation of overflow state.

#### Returns

Type: `Promise<void>`




## Slots

| Slot            | Description                                        |
| --------------- | -------------------------------------------------- |
|                 | Bar items (children will be measured for overflow) |
| `"all-menu"`    | Custom "show all" menu button                      |
| `"end-arrow"`   | Custom right scroll arrow                          |
| `"hamburger"`   | Custom hamburger button content                    |
| `"more"`        | Custom "more" button content                       |
| `"start-arrow"` | Custom left scroll arrow                           |


## Shadow Parts

| Part                 | Description |
| -------------------- | ----------- |
| `"all-menu-button"`  |             |
| `"arrow-end"`        |             |
| `"arrow-start"`      |             |
| `"container"`        |             |
| `"hamburger-button"` |             |
| `"more-button"`      |             |
| `"trigger"`          |             |


## Dependencies

### Used by

 - [le-navigation](../le-navigation)

### Depends on

- [le-icon](../le-icon)
- [le-overflow-menu](../le-overflow-menu)

### Graph
```mermaid
graph TD;
  le-bar --> le-icon
  le-bar --> le-overflow-menu
  le-overflow-menu --> le-navigation
  le-overflow-menu --> le-popover
  le-overflow-menu --> le-button
  le-overflow-menu --> le-icon
  le-navigation --> le-bar
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
  le-button --> le-visibility
  le-button --> le-component
  le-button --> le-slot
  le-slot --> le-popover
  le-slot --> le-button
  le-slot --> le-string-input
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
  style le-bar fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
