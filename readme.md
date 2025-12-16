# Le-Kit

[![npm version](https://img.shields.io/npm/v/le-kit.svg)](https://www.npmjs.com/package/le-kit)
[![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)](https://stenciljs.com)

A themeable web component library built with Stencil, featuring a dual-mode system for production and CMS editing.

## Features

- 🎨 **Themeable** — CSS custom properties for complete styling control
- 🔧 **Dual Mode** — Production (`default`) and CMS editing (`admin`) modes
- 🌐 **Framework Agnostic** — Works with any framework or vanilla JS
- 🪶 **Lightweight** — Tree-shakeable with minimal runtime overhead

## Installation

```bash
npm install le-kit
```

## Quick Start

### Option 1: Lazy Loading (Recommended)

The easiest way to use Le-Kit. Components are automatically loaded on-demand.

```html
<!-- In your HTML -->
<script type="module">
  import 'le-kit';
</script>

<!-- Include a theme -->
<link rel="stylesheet" href="node_modules/le-kit/dist/themes/default.css" />

<!-- Use components -->
<le-card>
  <span slot="header">Welcome</span>
  <p>Your content here</p>
  <le-button slot="footer">Get Started</le-button>
</le-card>
```

### Option 2: Individual Components (Tree-shakeable)

Import only the components you need for smaller bundle sizes.

```tsx
// Import specific components
import { defineCustomElement as defineCard } from 'le-kit/components/le-card';
import { defineCustomElement as defineButton } from 'le-kit/components/le-button';

// Register them
defineCard();
defineButton();
```

## Theming

Le-Kit ships with several built-in themes.

### Via HTML link

```html
<!-- From node_modules -->
<link rel="stylesheet" href="node_modules/le-kit/dist/themes/base.css" />
<link rel="stylesheet" href="node_modules/le-kit/dist/themes/default.css" />

<!-- Or use a CDN like unpkg -->
<link rel="stylesheet" href="https://unpkg.com/le-kit/dist/themes/base.css" />
<link rel="stylesheet" href="https://unpkg.com/le-kit/dist/themes/default.css" />
```

Available themes: `default`, `dark`, `minimal`, `warm`, `gradient`

### Via JavaScript/CSS import

```tsx
// With a bundler that handles CSS imports
import 'le-kit/dist/themes/base.css';
import 'le-kit/dist/themes/default.css';
```

### Custom Theming

Override CSS custom properties to match your brand:

```css
:root {
  --le-color-primary: #6366f1;
  --le-color-secondary: #8b5cf6;
  --le-radius-md: 12px;
  --le-space-md: 1rem;
}
```

## Components

### Layout

- **`<le-stack>`** — Flexbox layout with gap, alignment, and direction control
- **`<le-box>`** — Flexible container with padding and background options
- **`<le-card>`** — Card container with header, content, and footer slots

### Actions

- **`<le-button>`** — Button with variants (solid, outlined, clear) and colors

### Content

- **`<le-text>`** — Typography component with semantic variants

### Feedback

- **`<le-popup>`** — Toast notifications and alerts

## Usage Examples

### Card with Actions

```html
<le-card variant="elevated">
  <h3 slot="header">Product Name</h3>
  <p>Product description goes here with all the details.</p>
  <le-stack slot="footer" justify="end" gap="8px">
    <le-button variant="outlined">Cancel</le-button>
    <le-button color="primary">Buy Now</le-button>
  </le-stack>
</le-card>
```

### Responsive Stack Layout

```html
<le-stack direction="horizontal" wrap gap="16px" align="stretch">
  <le-box>Item 1</le-box>
  <le-box>Item 2</le-box>
  <le-box>Item 3</le-box>
</le-stack>
```

### Button Variants

```html
<le-button variant="solid" color="primary">Primary</le-button>
<le-button variant="outlined" color="secondary">Secondary</le-button>
<le-button variant="clear" color="danger">Delete</le-button>
```

## Admin Mode

Le-Kit includes a CMS editing mode that enables inline content editing and component configuration. This is useful for building visual editors and CMS interfaces.

```html
<!-- Enable on the entire page -->
<html mode="admin">
  <!-- Or on specific sections -->
  <le-card mode="admin">
    <!-- This card is now editable -->
  </le-card>
</html>
```

In admin mode, components display:

- Inline text editing for content slots
- Settings popovers for component properties
- Drop zones for adding new components

### Admin Mode Configuration

Admin mode requires the `custom-elements.json` manifest file to be served by your application. This file contains component metadata used by the property editors.

1. **Copy the manifest** to your public/static folder:

```bash
cp node_modules/le-kit/custom-elements.json public/custom-elements.json
```

2. **Configure the manifest URL** (optional, if not served at `/custom-elements.json`):

```javascript
import { configureLeki } from 'le-kit';

configureLeki({
  manifestFile: 'custom-elements.json'
});
```

The default `manifestFile` is `custom-elements.json`. Call `configureLeKit()` before any admin-mode components are rendered.

## Browser Support

Le-Kit supports all modern browsers:

- Chrome 79+
- Firefox 70+
- Safari 14+
- Edge 79+

## License

MIT License — see [LICENSE](./LICENSE) for details.

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting a PR.
