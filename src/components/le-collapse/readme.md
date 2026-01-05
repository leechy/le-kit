# le-collapse



<!-- Auto Generated Below -->


## Overview

Animated show/hide wrapper.

Supports height collapse (auto->0) and/or fading.
Can optionally listen to the nearest `le-header` shrink events.

## Properties

| Property                 | Attribute                   | Description                                                                                                                                  | Type      | Default |
| ------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- |
| `closed`                 | `closed`                    | Since Stencil boolean props default to `false` when the attribute is missing. instead of `open` defaulting to `true`, using a `closed` prop. | `boolean` | `false` |
| `collapseOnHeaderShrink` | `collapse-on-header-shrink` | If true, collapse/expand based on the nearest header shrink event.                                                                           | `boolean` | `false` |
| `noFading`               | `no-fading`                 | Stop fading the content when collapsing/expanding.                                                                                           | `boolean` | `false` |
| `scrollDown`             | `scroll-down`               | Whether the content should scroll down from the top when open.                                                                               | `boolean` | `false` |


## Slots

| Slot | Description        |
| ---- | ------------------ |
|      | Content to animate |


## Shadow Parts

| Part       | Description |
| ---------- | ----------- |
| `"region"` |             |


## Dependencies

### Used by

 - [le-navigation](../le-navigation)

### Depends on

- [le-component](../le-component)

### Graph
```mermaid
graph TD;
  le-collapse --> le-component
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
  le-navigation --> le-collapse
  style le-collapse fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
