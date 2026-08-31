# le-component



<!-- Auto Generated Below -->


## Overview

Component wrapper for admin mode editing.

This component is used internally by other components to provide admin-mode
editing capabilities. It wraps the component's rendered output and shows
a settings popover for editing properties.

In default mode, it acts as a simple passthrough (display: contents).
In admin mode, it shows a border, component name header, and settings popover.

The host element is found automatically by traversing up through the shadow DOM.

Usage inside a component's render method:
```tsx
render() {
  return (
    <le-component component="le-card">
      <Host>...</Host>
    </le-component>
  );
}
```

## Properties

| Property                 | Attribute      | Description                                                                                                          | Type                                      | Default     |
| ------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------- |
| `component` _(required)_ | `component`    | The tag name of the component (e.g., 'le-card'). Used to look up property metadata and display the component name.   | `string`                                  | `undefined` |
| `displayName`            | `display-name` | Optional display name for the component. If not provided, the tag name will be formatted as the display name.        | `string \| undefined`                     | `undefined` |
| `hostClass`              | `host-class`   | Classes to apply to the host element. Allows parent components to pass their styling classes.                        | `string \| undefined`                     | `undefined` |
| `hostStyle`              | --             | Inline styles to apply to the host element. Allows parent components to pass dynamic styles (e.g., flex properties). | `undefined \| { [key: string]: string; }` | `undefined` |


## Slots

| Slot | Description                      |
| ---- | -------------------------------- |
|      | The component's rendered content |


## Dependencies

### Depends on

- [le-button](../le-button)
- [le-select](../le-select)
- [le-checkbox](../le-checkbox)
- [le-string-input](../le-string-input)
- [le-popover](../le-popover)
- [le-popup](../le-popup)

### Graph
```mermaid
graph TD;
  le-component --> le-button
  le-component --> le-select
  le-component --> le-checkbox
  le-component --> le-string-input
  le-component --> le-popover
  le-component --> le-popup
  le-button --> le-icon
  le-button --> le-visibility
  le-button --> le-tooltip
  le-select --> le-icon
  le-select --> le-dropdown-base
  le-select --> le-button
  le-dropdown-base --> le-icon
  le-dropdown-base --> le-popover
  le-string-input --> le-button
  le-string-input --> le-icon
  le-popup --> le-button
  style le-component fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
