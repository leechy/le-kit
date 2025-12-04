# le-popover

A popover component for displaying floating content. Used internally by `le-slot` for property editing and component selection.

**Note:** This component always renders in default mode, regardless of the global mode setting. This prevents recursive admin UI when used inside `le-slot`.

## Usage

```html
<!-- Basic popover with default trigger -->
<le-popover popover-title="Settings">
  <p>Popover content goes here</p>
</le-popover>

<!-- With custom trigger -->
<le-popover popover-title="Options" position="bottom" align="end">
  <button slot="trigger">Open Menu</button>
  <ul>
    <li>Option 1</li>
    <li>Option 2</li>
  </ul>
</le-popover>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the popover is open |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'auto'` | `'bottom'` | Position relative to trigger |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Alignment of the popover |
| `popover-title` | `string` | - | Optional title in header |
| `show-close` | `boolean` | `true` | Show close button |
| `close-on-click-outside` | `boolean` | `true` | Close when clicking outside |
| `close-on-escape` | `boolean` | `true` | Close on Escape key |
| `offset` | `number` | `8` | Offset from trigger (px) |

## Methods

| Method | Description |
|--------|-------------|
| `show()` | Opens the popover |
| `hide()` | Closes the popover |
| `toggle()` | Toggles the popover |

## Events

| Event | Description |
|-------|-------------|
| `lePopoverOpen` | Emitted when popover opens |
| `lePopoverClose` | Emitted when popover closes |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Content inside the popover body |
| `trigger` | Custom trigger element |
