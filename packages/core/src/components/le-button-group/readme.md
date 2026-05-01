# le-button-group



<!-- Auto Generated Below -->


## Overview

Groups multiple `le-button` elements and optionally collapses low-priority actions
into an overflow "more" menu.

## Properties

| Property        | Attribute        | Description                                                                                                                                                                                                                            | Type                                       | Default     |
| --------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------- |
| `collapse`      | `collapse`       | Collapse mode.  - `true`: show only the top-priority button - positive number: show top N buttons - `0`: show only the more button - negative number: hide abs(N) lowest-priority buttons  Non-integers are rounded with `Math.round`. | `boolean \| number \| string \| undefined` | `undefined` |
| `overflowIcons` | `overflow-icons` | When true, icons from collapsed buttons are shown in the overflow navigation list.                                                                                                                                                     | `boolean`                                  | `false`     |


## Events

| Event              | Description | Type                           |
| ------------------ | ----------- | ------------------------------ |
| `leOverflowSelect` |             | `CustomEvent<{ id: string; }>` |


## Slots

| Slot     | Description                                         |
| -------- | --------------------------------------------------- |
|          | Group button elements (`le-button` children)        |
| `"more"` | Custom icon/content for the overflow trigger button |


## Shadow Parts

| Part      | Description |
| --------- | ----------- |
| `"group"` |             |


## Dependencies

### Depends on

- [le-component](../le-component)
- [le-overflow-menu](../le-overflow-menu)

### Graph
```mermaid
graph TD;
  le-button-group --> le-component
  le-button-group --> le-overflow-menu
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
  le-string-input --> le-component
  le-string-input --> le-button
  le-string-input --> le-icon
  le-string-input --> le-slot
  le-select --> le-component
  le-select --> le-dropdown-base
  le-select --> le-button
  le-dropdown-base --> le-popover
  le-checkbox --> le-component
  le-checkbox --> le-slot
  le-popup --> le-slot
  le-popup --> le-button
  le-popup --> le-component
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
  le-collapse --> le-component
  le-bar --> le-icon
  le-bar --> le-overflow-menu
  style le-button-group fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
