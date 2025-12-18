# le-segmented-control

A segmented control component with iOS-style toggle buttons.

Perfect for toggling between a small set of related options, like view modes,
sorting options, or filter states. Features a smooth sliding indicator animation.

## Features

- **Sliding indicator**: Animated indicator follows selection
- **Three sizes**: sm, md, lg
- **Full keyboard navigation**: Arrow keys, Home, End
- **ARIA compliant**: Uses radiogroup/radio roles
- **Icon support**: Optional start and end icons
- **Full width mode**: Segments stretch to fill container

## Usage

### Basic

```html
<le-segmented-control id="viewMode"></le-segmented-control>

<script>
  const control = document.getElementById('viewMode');
  control.options = [
    { label: 'List', value: 'list' },
    { label: 'Grid', value: 'grid' },
    { label: 'Board', value: 'board' },
  ];
  control.value = 'list';

  control.addEventListener('leChange', e => {
    console.log('Selected:', e.detail.value);
  });
</script>
```

### With Icons

```html
<le-segmented-control id="iconControl"></le-segmented-control>

<script>
  document.getElementById('iconControl').options = [
    { label: 'List', value: 'list', iconStart: '📋' },
    { label: 'Grid', value: 'grid', iconStart: '⊞' },
    { label: 'Calendar', value: 'calendar', iconStart: '📅' },
  ];
</script>
```

### Size Variants

```html
<!-- Small -->
<le-segmented-control size="sm"></le-segmented-control>

<!-- Medium (default) -->
<le-segmented-control size="md"></le-segmented-control>

<!-- Large -->
<le-segmented-control size="lg"></le-segmented-control>
```

### Full Width

```html
<le-segmented-control full-width></le-segmented-control>
```

### Disabled Options

```html
<le-segmented-control id="partialDisabled"></le-segmented-control>

<script>
  document.getElementById('partialDisabled').options = [
    { label: 'Free', value: 'free' },
    { label: 'Pro', value: 'pro' },
    { label: 'Enterprise', value: 'enterprise', disabled: true },
  ];
</script>
```

## Properties

| Property    | Type                   | Default | Description               |
| ----------- | ---------------------- | ------- | ------------------------- |
| `options`   | `LeOption[]`           | `[]`    | Array of options          |
| `value`     | `string \| number`     | —       | Currently selected value  |
| `size`      | `'sm' \| 'md' \| 'lg'` | `md`    | Control size              |
| `fullWidth` | `boolean`              | `false` | Stretch to fill container |
| `disabled`  | `boolean`              | `false` | Disable entire control    |

## Events

| Event      | Detail              | Description                 |
| ---------- | ------------------- | --------------------------- |
| `leChange` | `{ value, option }` | Emitted on selection change |

## CSS Custom Properties

| Property                           | Default                    | Description             |
| ---------------------------------- | -------------------------- | ----------------------- |
| `--le-segmented-bg`                | `var(--le-surface-subtle)` | Control background      |
| `--le-segmented-indicator-bg`      | `var(--le-surface)`        | Indicator background    |
| `--le-segmented-indicator-shadow`  | `var(--le-shadow-sm)`      | Indicator shadow        |
| `--le-segmented-padding`           | `var(--le-spacing-1)`      | Padding around segments |
| `--le-segmented-gap`               | `var(--le-spacing-1)`      | Gap between segments    |
| `--le-segmented-radius`            | `var(--le-radius-lg)`      | Border radius           |
| `--le-segmented-text-color`        | `var(--le-text-secondary)` | Inactive text color     |
| `--le-segmented-text-color-active` | `var(--le-text-primary)`   | Active text color       |

## CSS Parts

| Part             | Description                |
| ---------------- | -------------------------- |
| `container`      | The main container         |
| `segment`        | Individual segment buttons |
| `segment-active` | The active segment         |
| `indicator`      | The sliding indicator      |

## Keyboard Navigation

| Key           | Action            |
| ------------- | ----------------- |
| `Arrow Left`  | Select previous   |
| `Arrow Right` | Select next       |
| `Home`        | Select first      |
| `End`         | Select last       |
| `Enter/Space` | Confirm selection |

## Accessibility

- Uses `role="radiogroup"` on container
- Uses `role="radio"` on segments
- `aria-checked` indicates selection state
- `aria-disabled` for disabled segments
- Roving tabindex for keyboard navigation
