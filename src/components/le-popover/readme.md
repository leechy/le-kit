# le-popover



<!-- Auto Generated Below -->


## Overview

A popover component for displaying floating content.

This component is used internally by le-slot for property editing
and component selection. It always renders in default mode regardless
of the global mode setting.

## Properties

| Property              | Attribute                | Description                                              | Type                                               | Default     |
| --------------------- | ------------------------ | -------------------------------------------------------- | -------------------------------------------------- | ----------- |
| `align`               | `align`                  | Alignment of the popover                                 | `"center" \| "end" \| "start"`                     | `'start'`   |
| `closeOnClickOutside` | `close-on-click-outside` | Whether clicking outside closes the popover              | `boolean`                                          | `true`      |
| `closeOnEscape`       | `close-on-escape`        | Whether pressing Escape closes the popover               | `boolean`                                          | `true`      |
| `mode`                | `mode`                   | Mode of the popover should be 'default' for internal use | `"admin" \| "default"`                             | `undefined` |
| `offset`              | `offset`                 | Offset from the trigger element (in pixels)              | `number`                                           | `8`         |
| `open`                | `open`                   | Whether the popover is currently open                    | `boolean`                                          | `false`     |
| `popoverTitle`        | `popover-title`          | Optional title for the popover header                    | `string`                                           | `undefined` |
| `position`            | `position`               | Position of the popover relative to its trigger          | `"auto" \| "bottom" \| "left" \| "right" \| "top"` | `'bottom'`  |
| `showClose`           | `show-close`             | Whether to show a close button in the header             | `boolean`                                          | `true`      |


## Events

| Event            | Description                     | Type                |
| ---------------- | ------------------------------- | ------------------- |
| `lePopoverClose` | Emitted when the popover closes | `CustomEvent<void>` |
| `lePopoverOpen`  | Emitted when the popover opens  | `CustomEvent<void>` |


## Methods

### `hide() => Promise<void>`

Closes the popover

#### Returns

Type: `Promise<void>`



### `show() => Promise<void>`

Opens the popover

#### Returns

Type: `Promise<void>`



### `toggle() => Promise<void>`

Toggles the popover

#### Returns

Type: `Promise<void>`




## Slots

| Slot        | Description                                  |
| ----------- | -------------------------------------------- |
|             | Content to display inside the popover        |
| `"trigger"` | Element that triggers the popover (optional) |


## Dependencies

### Used by

 - [le-component](../le-component)
 - [le-slot](../le-slot)

### Depends on

- [le-component](../le-component)
- [le-slot](../le-slot)
- [le-button](../le-button)

### Graph
```mermaid
graph TD;
  le-popover --> le-component
  le-popover --> le-slot
  le-popover --> le-button
  le-component --> le-popover
  le-button --> le-component
  le-button --> le-slot
  le-slot --> le-popover
  style le-popover fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
