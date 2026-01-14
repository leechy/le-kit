# le-side-panel-toggle



<!-- Auto Generated Below -->


## Properties

| Property    | Attribute    | Description                                         | Type                                                                       | Default     |
| ----------- | ------------ | --------------------------------------------------- | -------------------------------------------------------------------------- | ----------- |
| `action`    | `action`     | Action to emit. Default toggles the panel.          | `"close" \| "open" \| "toggle"`                                            | `'toggle'`  |
| `align`     | `align`      |                                                     | `"center" \| "end" \| "space-between" \| "start"`                          | `'center'`  |
| `color`     | `color`      |                                                     | `"danger" \| "info" \| "primary" \| "secondary" \| "success" \| "warning"` | `'primary'` |
| `disabled`  | `disabled`   | Disables the toggle.                                | `boolean`                                                                  | `false`     |
| `fullWidth` | `full-width` |                                                     | `boolean`                                                                  | `false`     |
| `href`      | `href`       |                                                     | `string`                                                                   | `undefined` |
| `iconEnd`   | `icon-end`   |                                                     | `Node \| string`                                                           | `undefined` |
| `iconOnly`  | `icon-only`  |                                                     | `Node \| string`                                                           | `undefined` |
| `iconStart` | `icon-start` |                                                     | `Node \| string`                                                           | `undefined` |
| `mode`      | `mode`       |                                                     | `"admin" \| "default"`                                                     | `undefined` |
| `panelId`   | `panel-id`   | Optional id used to target a specific panel.        | `string`                                                                   | `undefined` |
| `selected`  | `selected`   |                                                     | `boolean`                                                                  | `false`     |
| `shortcut`  | `shortcut`   | Optional keyboard shortcut like `Mod+B` or `Alt+N`. | `string`                                                                   | `undefined` |
| `size`      | `size`       |                                                     | `"large" \| "medium" \| "small"`                                           | `'medium'`  |
| `target`    | `target`     |                                                     | `string`                                                                   | `undefined` |
| `type`      | `type`       |                                                     | `"button" \| "reset" \| "submit"`                                          | `'button'`  |
| `variant`   | `variant`    |                                                     | `"clear" \| "outlined" \| "solid" \| "system"`                             | `'solid'`   |


## Events

| Event                      | Description | Type                                                                  |
| -------------------------- | ----------- | --------------------------------------------------------------------- |
| `leSidePanelRequestToggle` |             | `CustomEvent<{ panelId?: string; action: LeSidePanelToggleAction; }>` |


## Dependencies

### Used by

 - [le-side-panel](../le-side-panel)

### Depends on

- [le-button](../le-button)

### Graph
```mermaid
graph TD;
  le-side-panel-toggle --> le-button
  le-button --> le-component
  le-button --> le-slot
  le-component --> le-button
  le-component --> le-select
  le-component --> le-checkbox
  le-component --> le-string-input
  le-component --> le-popover
  le-component --> le-popup
  le-select --> le-component
  le-select --> le-dropdown-base
  le-select --> le-button
  le-select --> le-string-input
  le-dropdown-base --> le-popover
  le-string-input --> le-component
  le-string-input --> le-slot
  le-slot --> le-popover
  le-slot --> le-button
  le-slot --> le-string-input
  le-checkbox --> le-component
  le-checkbox --> le-slot
  le-popup --> le-slot
  le-popup --> le-button
  le-popup --> le-component
  le-side-panel --> le-side-panel-toggle
  style le-side-panel-toggle fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
