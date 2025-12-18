# le-tab-bar

A presentational tab bar component without panels.

Use this for navigation or routing scenarios where you manage the content
externally based on selection events. For tabs with built-in panel management,
use `le-tabs` instead.

## Features

- **Three variants**: underline, pills, minimal
- **Full keyboard navigation**: Arrow keys, Home, End
- **ARIA compliant**: Proper roles and attributes
- **No panel management**: Just emits events for external handling
- **Router-friendly**: Designed for SPA navigation patterns

## Usage

### Basic

```html
<le-tab-bar id="navTabs"></le-tab-bar>

<script>
  const tabs = document.getElementById('navTabs');
  tabs.tabs = [
    { label: 'Dashboard', value: '/dashboard' },
    { label: 'Users', value: '/users' },
    { label: 'Settings', value: '/settings' },
  ];
  tabs.selected = '/dashboard';

  tabs.addEventListener('leTabChange', e => {
    // Handle navigation
    router.navigate(e.detail.value);
  });
</script>
```

### With Icons

```html
<le-tab-bar id="iconNav">
  <!-- Tab bar renders only buttons, content managed externally -->
</le-tab-bar>

<script>
  document.getElementById('iconNav').tabs = [
    { label: 'Home', value: 'home', iconStart: '🏠' },
    { label: 'Search', value: 'search', iconStart: '🔍' },
    { label: 'Profile', value: 'profile', iconStart: '👤' },
  ];
</script>
```

### Variants

```html
<!-- Underline (default) -->
<le-tab-bar variant="underline"></le-tab-bar>

<!-- Pills -->
<le-tab-bar variant="pills"></le-tab-bar>

<!-- Minimal (no background, no border) -->
<le-tab-bar variant="minimal" bordered="false"></le-tab-bar>
```

## Properties

| Property    | Type                                  | Default     | Description                |
| ----------- | ------------------------------------- | ----------- | -------------------------- |
| `tabs`      | `LeOption[]`                          | `[]`        | Array of tab options       |
| `selected`  | `string \| number`                    | First tab   | Value of the selected tab  |
| `variant`   | `'underline' \| 'pills' \| 'minimal'` | `underline` | Visual style variant       |
| `fullWidth` | `boolean`                             | `false`     | Stretch tabs to fill width |
| `size`      | `'sm' \| 'md' \| 'lg'`                | `md`        | Tab size                   |
| `bordered`  | `boolean`                             | `true`      | Show border below tab bar  |

## Events

| Event         | Detail              | Description                  |
| ------------- | ------------------- | ---------------------------- |
| `leTabChange` | `{ value, option }` | Emitted when tab is selected |

## CSS Custom Properties

| Property                         | Default                    | Description            |
| -------------------------------- | -------------------------- | ---------------------- |
| `--le-tab-bar-border-color`      | `var(--le-border-color)`   | Border color           |
| `--le-tab-bar-gap`               | `var(--le-spacing-1)`      | Gap between tabs       |
| `--le-tab-bar-indicator-color`   | `var(--le-color-primary)`  | Active indicator color |
| `--le-tab-bar-padding-x`         | `var(--le-spacing-4)`      | Horizontal padding     |
| `--le-tab-bar-padding-y`         | `var(--le-spacing-3)`      | Vertical padding       |
| `--le-tab-bar-text-color`        | `var(--le-text-secondary)` | Inactive text color    |
| `--le-tab-bar-text-color-active` | `var(--le-color-primary)`  | Active text color      |

## CSS Parts

| Part         | Description                     |
| ------------ | ------------------------------- |
| `tablist`    | The tab button container        |
| `tab`        | Individual tab buttons          |
| `tab-active` | The currently active tab button |

## Keyboard Navigation

| Key           | Action             |
| ------------- | ------------------ |
| `Arrow Left`  | Focus previous tab |
| `Arrow Right` | Focus next tab     |
| `Home`        | Focus first tab    |
| `End`         | Focus last tab     |
| `Enter/Space` | Select focused tab |
