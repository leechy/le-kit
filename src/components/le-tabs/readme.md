# le-tabs

A flexible tabs component for organizing content into tabbed panels.

## Features

- **Two modes**: Declarative (`<le-tab-panel>` children) or programmatic (`tabs` prop)
- **Three variants**: underline (default), pills, enclosed
- **Two orientations**: horizontal, vertical
- **Full keyboard navigation**: Arrow keys, Home, End
- **ARIA compliant**: Proper roles and attributes
- **Lazy rendering**: Optional - render panel content only when first activated
- **Dynamic tabs**: Add/remove tabs dynamically
- **Icon support**: Start and end icons on tabs

## Usage

### Declarative Mode (Recommended)

Use `<le-tab-panel>` children to define tabs directly in HTML:

```html
<le-tabs>
  <le-tab-panel label="Home" value="home">
    <h3>Home</h3>
    <p>Welcome to the home panel.</p>
  </le-tab-panel>
  <le-tab-panel label="Profile" value="profile">
    <h3>Profile</h3>
    <p>Your profile information.</p>
  </le-tab-panel>
  <le-tab-panel label="Settings" value="settings">
    <h3>Settings</h3>
    <p>Configure your settings.</p>
  </le-tab-panel>
</le-tabs>
```

### With Icons

```html
<le-tabs variant="pills">
  <le-tab-panel label="Dashboard" value="dashboard" icon-start="📊">
    Dashboard content
  </le-tab-panel>
  <le-tab-panel label="Users" value="users" icon-start="👥"> Users content </le-tab-panel>
</le-tabs>
```

### Lazy Rendering

Use `lazy` attribute to render panel content only when first activated:

```html
<le-tabs>
  <le-tab-panel label="Quick" value="quick"> This renders immediately </le-tab-panel>
  <le-tab-panel label="Heavy" value="heavy" lazy>
    This only renders when first activated (saves resources)
  </le-tab-panel>
</le-tabs>
```

### Disabled Tab

```html
<le-tabs>
  <le-tab-panel label="Active" value="active">Content</le-tab-panel>
  <le-tab-panel label="Disabled" value="disabled" disabled>Cannot access</le-tab-panel>
</le-tabs>
```

### Variants

```html
<!-- Underline (default) -->
<le-tabs variant="underline">...</le-tabs>

<!-- Pills -->
<le-tabs variant="pills">...</le-tabs>

<!-- Enclosed -->
<le-tabs variant="enclosed">...</le-tabs>
```

### Vertical Orientation

```html
<le-tabs orientation="vertical">
  <le-tab-panel label="General" value="general">General settings</le-tab-panel>
  <le-tab-panel label="Security" value="security">Security options</le-tab-panel>
</le-tabs>
```

### Programmatic Mode

For dynamic tabs or framework integration, use the `tabs` prop with named slots:

```html
<le-tabs id="myTabs">
  <div slot="panel-home">Home content</div>
  <div slot="panel-profile">Profile content</div>
</le-tabs>

<script>
  document.getElementById('myTabs').tabs = [
    { label: 'Home', value: 'home', iconStart: '🏠' },
    { label: 'Profile', value: 'profile', iconStart: '👤' },
  ];
</script>
```

### Controlled Selection

```html
<le-tabs id="controlled" selected="settings"> ... </le-tabs>

<script>
  const tabs = document.getElementById('controlled');
  tabs.addEventListener('leTabChange', e => {
    console.log('Selected:', e.detail.value);
  });
</script>
```

## Properties

| Property      | Type                                   | Default      | Description                |
| ------------- | -------------------------------------- | ------------ | -------------------------- |
| `tabs`        | `LeOption[]`                           | `[]`         | Array of tab options       |
| `selected`    | `string \| number`                     | First tab    | Value of the selected tab  |
| `orientation` | `'horizontal' \| 'vertical'`           | `horizontal` | Tab orientation            |
| `variant`     | `'underline' \| 'pills' \| 'enclosed'` | `underline`  | Visual style variant       |
| `fullWidth`   | `boolean`                              | `false`      | Stretch tabs to fill width |
| `size`        | `'sm' \| 'md' \| 'lg'`                 | `md`         | Tab size                   |

## Events

| Event         | Detail              | Description                        |
| ------------- | ------------------- | ---------------------------------- |
| `leTabChange` | `{ value, option }` | Emitted when tab selection changes |

## CSS Custom Properties

| Property                      | Default                    | Description                |
| ----------------------------- | -------------------------- | -------------------------- |
| `--le-tabs-border-color`      | `var(--le-border-color)`   | Border color for tab list  |
| `--le-tabs-gap`               | `var(--le-spacing-1)`      | Gap between tabs           |
| `--le-tabs-indicator-color`   | `var(--le-color-primary)`  | Active tab indicator color |
| `--le-tabs-padding-x`         | `var(--le-spacing-4)`      | Horizontal padding         |
| `--le-tabs-padding-y`         | `var(--le-spacing-3)`      | Vertical padding           |
| `--le-tabs-panel-padding`     | `var(--le-spacing-4)`      | Panel content padding      |
| `--le-tabs-text-color`        | `var(--le-text-secondary)` | Inactive tab text color    |
| `--le-tabs-text-color-active` | `var(--le-color-primary)`  | Active tab text color      |

## CSS Parts

| Part         | Description                          |
| ------------ | ------------------------------------ |
| `tablist`    | The tab button container             |
| `tab`        | Individual tab buttons               |
| `tab-active` | The currently active tab button      |
| `indicator`  | Active indicator (underline variant) |
| `panels`     | Container for all panels             |
| `panel`      | Individual panel containers          |

## Keyboard Navigation

| Key           | Action                          |
| ------------- | ------------------------------- |
| `Arrow Left`  | Focus previous tab (horizontal) |
| `Arrow Right` | Focus next tab (horizontal)     |
| `Arrow Up`    | Focus previous tab (vertical)   |
| `Arrow Down`  | Focus next tab (vertical)       |
| `Home`        | Focus first tab                 |
| `End`         | Focus last tab                  |
| `Enter/Space` | Select focused tab              |
