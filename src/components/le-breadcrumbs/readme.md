# le-breadcrumbs



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute           | Description                                                  | Type                               | Default           |
| ----------------- | ------------------- | ------------------------------------------------------------ | ---------------------------------- | ----------------- |
| `items`           | `items`             | Breadcrumb items (supports JSON string).                     | `LeOption[] \| string`             | `[]`              |
| `label`           | `label`             | Accessible label for the breadcrumbs navigation.             | `string`                           | `'Breadcrumbs'`   |
| `minVisibleItems` | `min-visible-items` | Minimum visible items before collapsing.                     | `number`                           | `2`               |
| `overflowMode`    | `overflow-mode`     | Overflow behavior: collapse (default), wrap, or scroll.      | `"collapse" \| "scroll" \| "wrap"` | `'collapse'`      |
| `separatorIcon`   | `separator-icon`    | Separator icon name (used if no separator slot is provided). | `string`                           | `'chevron-right'` |


## Events

| Event                | Description                                 | Type                                    |
| -------------------- | ------------------------------------------- | --------------------------------------- |
| `leBreadcrumbSelect` | Emitted when a breadcrumb item is selected. | `CustomEvent<LeBreadcrumbSelectDetail>` |


## Dependencies

### Depends on

- [le-icon](../le-icon)
- [le-button](../le-button)
- [le-popover](../le-popover)
- [le-navigation](../le-navigation)

### Graph
```mermaid
graph TD;
  le-breadcrumbs --> le-icon
  le-breadcrumbs --> le-button
  le-breadcrumbs --> le-popover
  le-breadcrumbs --> le-navigation
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
  le-navigation --> le-string-input
  le-navigation --> le-icon
  le-navigation --> le-collapse
  le-navigation --> le-popover
  le-navigation --> le-bar
  le-navigation --> le-component
  le-collapse --> le-component
  le-bar --> le-icon
  le-bar --> le-popover
  style le-breadcrumbs fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
