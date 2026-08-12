# le-empty



<!-- Auto Generated Below -->


## Overview

An empty state component inspired by SwiftUI ContentUnavailableView.
Used for displaying empty lists, search results, or unavailable states.

## Properties

| Property      | Attribute      | Description                                  | Type                  | Default     |
| ------------- | -------------- | -------------------------------------------- | --------------------- | ----------- |
| `actionLabel` | `action-label` | Label for optional action button.            | `string \| undefined` | `undefined` |
| `icon`        | `icon`         | Optional icon name, URL, or emoji character. | `string \| undefined` | `undefined` |
| `label`       | `label`        | Main label text for the empty state.         | `string \| undefined` | `undefined` |
| `message`     | `message`      | Secondary descriptive message.               | `string \| undefined` | `undefined` |


## Events

| Event      | Description                                | Type                      |
| ---------- | ------------------------------------------ | ------------------------- |
| `leAction` | Emitted when the action button is clicked. | `CustomEvent<MouseEvent>` |


## Slots

| Slot        | Description                          |
| ----------- | ------------------------------------ |
|             | Default slot for custom body content |
| `"action"`  | Custom action buttons slot           |
| `"icon"`    | Custom icon slot                     |
| `"label"`   | Custom label/title slot              |
| `"message"` | Custom message/description slot      |


## Shadow Parts

| Part               | Description |
| ------------------ | ----------- |
| `"action-button"`  |             |
| `"icon-container"` |             |
| `"label"`          |             |


## Dependencies

### Used by

 - [le-list](../le-list)

### Depends on

- [le-icon](../le-icon)
- [le-button](../le-button)

### Graph
```mermaid
graph TD;
  le-empty --> le-icon
  le-empty --> le-button
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
  le-component --> le-button
  le-component --> le-select
  le-component --> le-checkbox
  le-component --> le-string-input
  le-component --> le-popover
  le-component --> le-popup
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
  le-tooltip --> le-component
  le-list --> le-empty
  style le-empty fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
