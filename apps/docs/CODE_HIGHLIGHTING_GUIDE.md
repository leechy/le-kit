# Code Highlighting Setup Guide

## Overview

Your documentation now uses consistent code highlighting across blog posts and component pages using **Shiki**, which is built into Astro 6.0.0.

## How It Works

### Blog Posts (Markdown)

- Uses Astro's automatic markdown processing
- Shiki highlights code blocks in markdown automatically
- Configuration in `astro.config.mjs`

### Component Pages (Astro)

- Uses the `<CodeBlock />` component (new)
- Supports custom language, titles, and formatting
- Located at: `src/components/CodeBlock.astro`

## Using the CodeBlock Component

Import in your .astro file:

```astro
import CodeBlock from "../../components/CodeBlock.astro";
```

Use it like this:

```astro
<CodeBlock
  code={`<le-select placeholder="Select">
  <le-item value="1">Option 1</le-item>
</le-select>`}
  language="html"
  title="example.html"
/>
```

### Props

- **code** (required): The code string to highlight
- **language** (optional): Code language (`html`, `typescript`, `javascript`, `jsx`, `css`, etc.) - defaults to `html`
- **title** (optional): Filename or title shown in header

## Available Languages (Shiki)

- `html`, `xml`
- `javascript`, `typescript`, `jsx`, `tsx`
- `css`, `scss`
- `json`
- `bash`, `shell`, `zsh`
- And 100+ more...

## Customizing Colors

### Change Theme

Edit `astro.config.mjs` and replace the `theme` value:

```javascript
markdown: {
  shikiConfig: {
    theme: "github-light", // Change this
    wrap: true,
  },
},
```

**Popular themes:**

- `github-light`
- `github-dark`
- `dracula`
- `nord`
- `one-dark-pro`
- `vitesse-light`
- `catppuccin-latte`
- `plastic` (current)

### CSS Color Variables

Code highlighting colors are defined in `src/styles/global.css`:

```css
--code-keyword: #d73a49;
--code-string: #032f62;
--code-function: #6f42c1;
--code-variable: #24292e;
--code-comment: #6a737d;
```

The actual color values come from Shiki's selected theme and are baked into the HTML. To override on a per-element basis, update the component CSS.

### Styling the Block Container

Edit `src/components/CodeBlock.astro`:

```css
.code-block {
  /* Border, shadow, radius */
}

.code-block__title {
  /* Header with language/filename */
  background-color: var(--le-color-primary); /* Change color here */
}

.code-block__content {
  /* Code area background */
  background-color: #213553;
}
```

## Switching Entire Blog to Different Theme

1. Edit `astro.config.mjs`:

   ```javascript
   markdown: {
     shikiConfig: {
       theme: "dracula", // Change to any Shiki theme
       wrap: true,
     },
   },
   ```

2. Update `CodeBlock.astro` line 14:

   ```javascript
   const html = await codeToHtml(code, {
     lang: language,
     theme: 'dracula', // Match the config
   });
   ```

3. Rebuild: `npm run build`

## Examples

### TypeScript Component Example

```astro
<CodeBlock
  code={`interface LeSelectProps {
  value?: string;
  disabled?: boolean;
  placeholder?: string;
}`}
  language="typescript"
  title="le-select.ts"
/>
```

### CSS Example

```astro
<CodeBlock
  code={`:host {
  --le-select-background: white;
  --le-select-border: 1px solid #ccc;
}`}
  language="css"
  title="variables.css"
/>
```

## Why This Matters

- **Consistency**: All code blocks use the same highlighting system
- **Accessibility**: Shiki produces semantic HTML that screen readers handle well
- **Performance**: Highlighting happens at build time, not runtime
- **Customization**: Easy to swap themes or adjust colors
- **Maintainability**: Single source of truth for code styling

## Reverting to Manual Highlighting

If you want to remove Shiki and use a JS runtime highlighter instead, install Prism or highlight.js and update the CodeBlock component. Not recommended for performance reasons.

## Troubleshooting

**Code not highlighted?**

- Ensure `language` prop matches a Shiki language name
- Check that the code string is properly escaped
- Rebuild with `npm run build`

**Colors not matching blog?**

- Verify `theme` in both `astro.config.mjs` AND `CodeBlock.astro`
- They must be identical

**Component not found?**

- Check import path is correct: `import CodeBlock from "../../components/CodeBlock.astro";`
- Verify file exists: `apps/docs/src/components/CodeBlock.astro`
