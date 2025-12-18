# le-text



<!-- Auto Generated Below -->


## Overview

A text component with rich text editing capabilities in admin mode.

`le-text` renders semantic text elements (headings, paragraphs, code, quotes)
and provides a Notion-like rich text editor in admin mode with formatting
toolbar for bold, italic, links, and paragraph type selection.

## Properties

| Property   | Attribute   | Description                                                        | Type                                                                                             | Default     |
| ---------- | ----------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ----------- |
| `align`    | `align`     | Text alignment                                                     | `"center" \| "justify" \| "left" \| "right"`                                                     | `'left'`    |
| `color`    | `color`     | Text color (CSS value or theme token)                              | `string`                                                                                         | `undefined` |
| `maxLines` | `max-lines` | Maximum number of lines before truncating (requires truncate=true) | `number`                                                                                         | `undefined` |
| `truncate` | `truncate`  | Whether the text should truncate with ellipsis                     | `boolean`                                                                                        | `false`     |
| `variant`  | `variant`   | The semantic variant/type of text element                          | `"code" \| "h1" \| "h2" \| "h3" \| "h4" \| "h5" \| "h6" \| "label" \| "p" \| "quote" \| "small"` | `'p'`       |


## Slots

| Slot | Description                   |
| ---- | ----------------------------- |
|      | Default slot for text content |


## Shadow Parts

| Part     | Description |
| -------- | ----------- |
| `"text"` |             |


## Dependencies

### Depends on

- [le-component](../le-component)

### Graph
```mermaid
graph TD;
  le-text --> le-component
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
  style le-text fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
