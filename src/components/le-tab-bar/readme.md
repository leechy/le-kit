# le-tab-bar



<!-- Auto Generated Below -->


## Overview

A presentational tab bar component without panels.

Use this for navigation/routing scenarios where you manage the content
externally based on the selection events. For tabs with built-in panels,
use `le-tabs` instead.

## Properties

| Property     | Attribute     | Description                                          | Type                             | Default     |
| ------------ | ------------- | ---------------------------------------------------- | -------------------------------- | ----------- |
| `bordered`   | `bordered`    | Whether to show a border below the tab bar.          | `boolean`                        | `true`      |
| `fullWidth`  | `full-width`  | Whether tabs should stretch to fill available width. | `boolean`                        | `true`      |
| `position`   | `position`    | Position of the tab bar.                             | `"bottom" \| "top"`              | `'top'`     |
| `selected`   | `selected`    | The value of the currently selected tab.             | `number \| string`               | `undefined` |
| `showLabels` | `show-labels` | Whether to show labels in icon-only mode.            | `boolean`                        | `false`     |
| `size`       | `size`        | Size of the tabs.                                    | `"large" \| "medium" \| "small"` | `'medium'`  |
| `tabs`       | --            | Array of tab options defining the tabs to display.   | `LeOption[]`                     | `[]`        |


## Events

| Event         | Description                            | Type                                |
| ------------- | -------------------------------------- | ----------------------------------- |
| `leTabChange` | Emitted when the selected tab changes. | `CustomEvent<LeOptionSelectDetail>` |


## Shadow Parts

| Part        | Description |
| ----------- | ----------- |
| `"tablist"` |             |


## Dependencies

### Depends on

- [le-component](../le-component)
- [le-slot](../le-slot)
- [le-tab](../le-tab)

### Graph
```mermaid
graph TD;
  le-tab-bar --> le-component
  le-tab-bar --> le-slot
  le-tab-bar --> le-tab
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
  style le-tab-bar fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
