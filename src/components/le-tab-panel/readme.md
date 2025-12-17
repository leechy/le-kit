# le-tab-panel

A tab panel component used as a child of `le-tabs`.

Each `le-tab-panel` defines both the tab button label and the panel content.
The parent `le-tabs` component automatically reads these panels and creates
the tab interface.

## Features

- **Declarative**: Define tabs directly in HTML
- **Lazy rendering**: Option to render content only when tab is active
- **Dynamic**: Add/remove panels dynamically
- **Icon support**: Start and end icons on tab buttons

## Usage

### Basic

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
<le-tabs>
  <le-tab-panel label="Dashboard" value="dashboard" icon-start="📊">
    Dashboard content
  </le-tab-panel>
  <le-tab-panel label="Users" value="users" icon-start="👥"> Users content </le-tab-panel>
</le-tabs>
```

### Lazy Rendering

```html
<le-tabs>
  <le-tab-panel label="Quick" value="quick"> This renders immediately </le-tab-panel>
  <le-tab-panel label="Heavy" value="heavy" lazy>
    This only renders when first activated
  </le-tab-panel>
</le-tabs>
```

### Disabled Tab

```html
<le-tabs>
  <le-tab-panel label="Active" value="active"> Accessible content </le-tab-panel>
  <le-tab-panel label="Disabled" value="disabled" disabled> Cannot access this </le-tab-panel>
</le-tabs>
```

## Properties

| Property    | Type      | Default | Description                              |
| ----------- | --------- | ------- | ---------------------------------------- |
| `label`     | `string`  | —       | Tab button label (required)              |
| `value`     | `string`  | label   | Unique identifier for this tab           |
| `iconStart` | `string`  | —       | Icon at start of tab button              |
| `iconEnd`   | `string`  | —       | Icon at end of tab button                |
| `disabled`  | `boolean` | `false` | Whether tab is disabled                  |
| `lazy`      | `boolean` | `false` | Render content only when first activated |

## Lazy Rendering Behavior

When `lazy` is `false` (default):

- Content is always in the DOM
- Hidden panels use `display: none`
- State is preserved when switching tabs

When `lazy` is `true`:

- Content is not rendered until tab is first activated
- Once rendered, content stays in DOM (preserves state)
- Good for heavy content that may not be viewed
