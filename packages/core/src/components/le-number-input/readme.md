# le-number-input



<!-- Auto Generated Below -->


## Overview

A number input component with validation, keyboard controls, and custom spinners.

## Properties

| Property       | Attribute       | Description                                   | Type                  | Default     |
| -------------- | --------------- | --------------------------------------------- | --------------------- | ----------- |
| `disabled`     | `disabled`      | Whether the input is disabled                 | `boolean`             | `false`     |
| `externalId`   | `external-id`   | External ID for linking with external systems | `string \| undefined` | `undefined` |
| `iconStart`    | `icon-start`    | Icon for the start icon                       | `string \| undefined` | `undefined` |
| `label`        | `label`         | Label for the input                           | `string \| undefined` | `undefined` |
| `max`          | `max`           | Maximum allowed value                         | `number \| undefined` | `undefined` |
| `min`          | `min`           | Minimum allowed value                         | `number \| undefined` | `undefined` |
| `name`         | `name`          | The name of the input                         | `string \| undefined` | `undefined` |
| `placeholder`  | `placeholder`   | Placeholder text                              | `string \| undefined` | `undefined` |
| `readonly`     | `readonly`      | Whether the input is read-only                | `boolean`             | `false`     |
| `required`     | `required`      | Whether the input is required                 | `boolean`             | `false`     |
| `showSpinners` | `show-spinners` | Whether to show the spinner controls          | `boolean`             | `true`      |
| `step`         | `step`          | Step value for increment/decrement            | `number`              | `1`         |
| `value`        | `value`         | The value of the input                        | `number \| undefined` | `undefined` |


## Events

| Event      | Description                                              | Type                                                                                                                            |
| ---------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `leChange` | Emitted when the value changes (on blur or Enter)        | `CustomEvent<{ value?: number \| undefined; name?: string \| undefined; externalId?: string \| undefined; isValid: boolean; }>` |
| `leInput`  | Emitted when the input value changes (on keystroke/spin) | `CustomEvent<{ value?: number \| undefined; name?: string \| undefined; externalId?: string \| undefined; isValid: boolean; }>` |


## Slots

| Slot            | Description                                           |
| --------------- | ----------------------------------------------------- |
|                 | The label text for the input                          |
| `"description"` | Additional description text displayed below the input |
| `"icon-start"`  | Icon to display at the start of the input             |


## Dependencies

### Depends on

- [le-component](../le-component)
- [le-button](../le-button)
- [le-slot](../le-slot)

### Graph
```mermaid
graph TD;
  le-number-input --> le-component
  le-number-input --> le-button
  le-number-input --> le-slot
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
  style le-number-input fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
