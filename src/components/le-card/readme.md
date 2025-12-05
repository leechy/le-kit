# le-card



<!-- Auto Generated Below -->


## Overview

A flexible card component with header, content, and footer slots.

The card uses le-slot wrappers for each slot area. In admin mode,
le-slot shows placeholders for CMS editing. In default mode,
le-slot acts as a transparent passthrough.

## Properties

| Property      | Attribute     | Description                                 | Type                                    | Default     |
| ------------- | ------------- | ------------------------------------------- | --------------------------------------- | ----------- |
| `interactive` | `interactive` | Whether the card is interactive (clickable) | `boolean`                               | `false`     |
| `variant`     | `variant`     | Card variant style                          | `"default" \| "elevated" \| "outlined"` | `'default'` |


## Slots

| Slot       | Description                          |
| ---------- | ------------------------------------ |
|            | Default slot for main card content   |
| `"footer"` | Card footer content (buttons, links) |
| `"header"` | Card header content (title, actions) |


## Shadow Parts

| Part        | Description |
| ----------- | ----------- |
| `"card"`    |             |
| `"content"` |             |
| `"footer"`  |             |
| `"header"`  |             |


## Dependencies

### Depends on

- [le-component](../le-component)
- [le-slot](../le-slot)

### Graph
```mermaid
graph TD;
  le-card --> le-component
  le-card --> le-slot
  le-component --> le-popover
  le-component --> le-button
  le-popover --> le-button
  le-popover --> le-component
  le-popover --> le-slot
  le-button --> le-component
  le-button --> le-slot
  le-slot --> le-popover
  le-slot --> le-button
  style le-card fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
