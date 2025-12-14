# Le-Kit Roadmap

> Development plans for upcoming features. Each section includes steps and open questions.

## Table of Contents

1. [Admin/Non-Admin Build Separation](#1-adminnon-admin-build-separation)
2. [Dropdown Components](#2-dropdown-components)
3. [Emoji Picker](#3-emoji-picker)
4. [Tabs Components](#4-tabs-components)
5. [Rich Text Editor](#5-rich-text-editor)
6. [Shared Types](#shared-types)

---

## 1. Admin/Non-Admin Build Separation

**Status**: 🔄 **Paused** — Initial implementation had issues, needs rethinking.

**Goal**: Create two distribution packages - a lightweight "production" build excluding admin components (`le-component`, `le-slot`) and a full "admin" build.

> **Note**: The initial implementation (branch `feature/core-admin-builds`) attempted to transform component code at build time to strip admin wrappers. This approach had issues with Stencil's chunking and module dependencies. A different approach is needed — possibly using Stencil's native conditional compilation or a Rollup plugin.

### Approach

Use multiple entry points with `dist-custom-elements` output target and conditional exports in `package.json`.

### Previous Attempt (preserved in `feature/core-admin-builds` branch)

- `scripts/build-targets.mjs` - generated entry files
- `scripts/bundle-targets.mjs` - post-build transformer
- Transformed `h("le-component", ...)` → `h(Host, ...)`
- Transformed `h("le-slot", ..., slot)` → `slot`

### Steps

- [ ] **1.1** Research alternative approaches:
  - Stencil's `@Build.isDev` / custom build flags
  - Rollup plugin for conditional compilation
  - Separate Stencil builds with different configs
  
- [ ] **1.2** Implement new approach

- [ ] **1.3** Add framework output targets:
  - Install: `@stencil/react-output-target`
  - Install: `@stencil/vue-output-target`
  - Install: `@stencil/angular-output-target`
  - Configure in `stencil.config.ts`

### Usage (future)

```typescript
// Production build (no admin UI) - smaller bundle
import { defineCustomElements } from 'le-kit/core';
defineCustomElements();

// Admin/CMS build (with admin UI)
import { defineCustomElements } from 'le-kit/admin';
defineCustomElements();

// Or use lazy-loading (all components, auto-registered)
import 'le-kit';
```

### Open Questions

| Question                                                                         | Recommendation                         | Decision          |
| -------------------------------------------------------------------------------- | -------------------------------------- | ----------------- |
| Should core components fail silently or render without admin UI?                 | Render content normally, skip admin UI |                   |
| Include React/Vue/Angular in this release or defer?                              | Include React, defer others            |                   |
| Separate npm packages (`le-kit`, `le-kit-admin`) or single package with exports? | Single package with exports            | ✅ Single package |

---

## 2. Dropdown Components

**Goal**: Create `le-select`, `le-combobox`, `le-multiselect`, and `le-tag` components with shared dropdown logic.

### Components

| Component          | Description                                   |
| ------------------ | --------------------------------------------- |
| `le-dropdown-base` | Internal base component wrapping `le-popover` |
| `le-tag`           | Dismissible tag with optional icon            |
| `le-select`        | Single-select dropdown (native-like)          |
| `le-combobox`      | Searchable single-select with text input      |
| `le-multiselect`   | Multi-select with checkboxes and tags         |

### Steps

- [ ] **2.1** Define shared `LeOption` interface in `src/types/options.ts` (see [Shared Types](#shared-types))

- [ ] **2.2** Create `le-dropdown-base` internal component:

  - Wraps `le-popover` for positioning
  - Renders option list from `LeOption[]`
  - Handles keyboard navigation (↑↓, Enter, Escape, Home/End)
  - Supports option filtering via callback
  - Handles nested options rendering (children)
  - Emits: `leOptionSelect`, `leDropdownOpen`, `leDropdownClose`

- [ ] **2.3** Create `le-tag` component:

  - Props: `label`, `icon`, `dismissible`, `disabled`, `size`
  - Emits: `leDismiss`
  - Styling: pill shape, optional close button

- [ ] **2.4** Create `le-select` component:

  - Props: `options`, `value`, `placeholder`, `disabled`, `required`, `name`
  - Single selection mode
  - Display selected option label in trigger
  - Emits: `leChange` with `{ value, option }`

- [ ] **2.5** Create `le-combobox` component:

  - Extends select with text input trigger
  - Props: additional `allowCustom`, `minSearchLength`
  - Filters options as user types
  - Optionally allows custom values not in options

- [ ] **2.6** Create `le-multiselect` component:
  - Multiple selection with checkboxes
  - Display selected as `le-tag` components
  - Props: additional `maxSelections`, `showSelectAll`
  - Emits: `leChange` with `{ values, options }`

### Open Questions

| Question                                 | Recommendation                         | Decision |
| ---------------------------------------- | -------------------------------------- | -------- |
| Support nested options (children) in v1? | Defer to v2                            |          |
| Virtual scrolling for large lists?       | Add later if needed                    |          |
| Async option loading?                    | Props only for v1, async in v2         |          |
| Option groups vs nested children?        | Use `group` property for flat grouping |          |

---

## 3. Emoji Picker

**Goal**: Create a categorized, searchable emoji picker with grid layout.

### Steps

- [ ] **3.1** Create emoji dataset in `src/data/emojis.ts`:

  - Structure: `{ emoji, label, keywords, category }`
  - Categories: Smileys, People, Animals, Food, Travel, Activities, Objects, Symbols, Flags
  - ~1,800 common emojis (curated subset of Unicode 15)

- [ ] **3.2** Create `le-emoji-picker` component:

  - Uses `le-popover` for dropdown
  - Grid layout (8-10 emojis per row)
  - Props: `open`, `trigger` (slot), `recentCount`
  - Emits: `leEmojiSelect` with `{ emoji, label }`

- [ ] **3.3** Add category navigation:

  - Tab-like buttons for each category
  - Scroll to category on click
  - Highlight active category on scroll

- [ ] **3.4** Implement search:

  - Text input at top
  - Filter by label and keywords
  - Show "no results" state

- [ ] **3.5** Add "Recently Used" section:
  - Store in localStorage
  - Show at top of picker
  - Configurable count (default: 20)

### Open Questions

| Question                                              | Recommendation              | Decision |
| ----------------------------------------------------- | --------------------------- | -------- |
| Include full Unicode 15 (~3,600) or curated (~1,800)? | Curated common set          |          |
| Skin tone modifier support?                           | Add in v2                   |          |
| Extract tabs to `le-tabs` now or later?               | Build inline, extract later |          |
| Lazy load emoji data?                                 | Yes, dynamic import         |          |

---

## 4. Tabs Components

**Goal**: Create flexible tab components for various use cases.

### Components

| Component              | Description                 |
| ---------------------- | --------------------------- |
| `le-tabs`              | Core tabs with panels       |
| `le-tab-bar`           | Just tab buttons, no panels |
| `le-segmented-control` | iOS-style toggle buttons    |

### Steps

- [ ] **4.1** Create `le-tabs` core component:

  - Props: `tabs` (LeOption[]), `selected`, `orientation` (horizontal/vertical)
  - Keyboard: Arrow keys, Home/End, focus management
  - Slots: `<div slot="panel-{value}">` for each tab's content
  - Emits: `leTabChange` with `{ value, tab }`

- [ ] **4.2** Support two content modes:

  - **Slotted panels**: Content in named slots, component handles show/hide
  - **External content**: No slots, consumer handles display based on `leTabChange`

- [ ] **4.3** Create `le-tab-bar` presentational component:

  - Just the tab buttons row
  - For navigation/routing scenarios
  - Props: `tabs`, `selected`, `fullWidth`

- [ ] **4.4** Create `le-segmented-control` variant:

  - Pill/button style
  - Sliding indicator animation
  - Props: `options`, `value`, `size`

- [ ] **4.5** Future variants (defer):
  - `le-bottom-nav` - Mobile bottom navigation with icons
  - `le-scrollable-tabs` - Horizontal scroll with overflow

### Open Questions

| Question                                  | Recommendation               | Decision |
| ----------------------------------------- | ---------------------------- | -------- |
| Keep hidden panels in DOM or lazy render? | Keep in DOM, CSS hide        |          |
| Slide transitions between panels?         | Optional via `animated` prop |          |
| Scrollable tabs overflow handling?        | Scroll with fade indicators  |          |
| Use LeOption for tab definition?          | Yes, reuse shared type       |          |

---

## 5. Rich Text Editor

**Goal**: Build a Notion-style block-based editor with command palette and HTML/Markdown output.

### Architecture

```
le-rich-text-editor
├── le-editor-block (per block)
│   ├── drag handle
│   ├── contenteditable region
│   └── block type menu
├── le-block-menu (command palette)
└── le-format-toolbar (inline formatting, floating)
```

### Steps

- [ ] **5.1** Define block architecture in `src/types/blocks.ts`:

  ```typescript
  interface LeBlock {
    id: string;
    type: BlockType;
    content: string; // HTML content
    attributes?: Record<string, any>;
  }

  type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet-list' | 'numbered-list' | 'quote' | 'code' | 'divider';
  ```

- [ ] **5.2** Create block type registry:

  - Map of `BlockType` → renderer config
  - Each config: `{ tag, className, placeholder, transformable }`
  - Allow registering custom block types

- [ ] **5.3** Create `le-editor-block` internal component:

  - Contenteditable region with block-specific rendering
  - Block controls: drag handle, type indicator, delete button
  - Handle Enter (new block), Backspace (merge/delete), arrow keys (navigate)

- [ ] **5.4** Create `le-block-menu` command palette:

  - Uses `le-popover` + `LeOption` interface
  - Triggered by `/` key at start of block
  - Filter options as user types
  - Insert/transform block on selection

- [ ] **5.5** Build `le-rich-text-editor` container:

  - Manages `LeBlock[]` state
  - Props: `value` (initial HTML), `placeholder`, `readonly`
  - Methods: `getHtml()`, `getMarkdown()`, `getBlocks()`
  - Emits: `leChange`, `leBlockAdd`, `leBlockRemove`

- [ ] **5.6** Add `le-format-toolbar` floating toolbar:

  - Appears on text selection
  - Bold, italic, underline, strikethrough
  - Link insertion
  - Uses `execCommand` for v1

- [ ] **5.7** Implement serialization:
  - `getHtml()`: Convert blocks to semantic HTML
  - `getMarkdown()`: Convert blocks to Markdown
  - `setHtml()`: Parse HTML into blocks

### Block Types for v1

| Type          | Tag            | Features                |
| ------------- | -------------- | ----------------------- |
| paragraph     | `<p>`          | Default block           |
| heading1      | `<h1>`         |                         |
| heading2      | `<h2>`         |                         |
| heading3      | `<h3>`         |                         |
| bullet-list   | `<ul><li>`     | Auto-continue on Enter  |
| numbered-list | `<ol><li>`     | Auto-continue, renumber |
| quote         | `<blockquote>` |                         |
| code          | `<pre><code>`  | Preserve whitespace     |
| divider       | `<hr>`         | Non-editable            |

### Open Questions

| Question                          | Recommendation              | Decision |
| --------------------------------- | --------------------------- | -------- |
| Inline formatting implementation? | `execCommand` for v1        |          |
| Image/embed blocks in v1?         | Defer to v2                 |          |
| Undo/redo implementation?         | Native contenteditable undo |          |
| Collaborative editing support?    | Defer, but design for it    |          |
| Block nesting (lists in quotes)?  | Defer to v2                 |          |

---

## Shared Types

### LeOption Interface

Universal option type used across select, combobox, tabs, menus, and command palettes.

**File**: `src/types/options.ts`

```typescript
export interface LeOption {
  // Identity
  id?: string; // Unique identifier (auto-generated if missing)
  label: string; // Display text (required)
  value?: string | number; // Selection value (defaults to label)

  // State
  disabled?: boolean;
  selected?: boolean; // For multiselect, menus
  checked?: boolean; // For checkbox/radio menus

  // Visual
  iconStart?: string; // URL, icon name, or emoji
  iconEnd?: string;
  description?: string; // Secondary text line

  // Structure
  children?: LeOption[]; // Nested options or sub-items
  group?: string; // Group label for flat categorization
  separator?: 'before' | 'after'; // Visual separator line

  // Extensibility
  data?: Record<string, any>; // Custom data passthrough
}
```

### LeBlock Interface

Block type for rich text editor.

**File**: `src/types/blocks.ts`

```typescript
export type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet-list' | 'numbered-list' | 'quote' | 'code' | 'divider';

export interface LeBlock {
  id: string;
  type: BlockType;
  content: string; // HTML content of the block
  attributes?: {
    level?: number; // For headings
    language?: string; // For code blocks
    [key: string]: any;
  };
}

export interface BlockTypeConfig {
  type: BlockType;
  label: string;
  icon?: string;
  tag: string;
  className?: string;
  placeholder?: string;
  editable?: boolean; // false for divider
}
```

---

## Implementation Order

Recommended sequence based on dependencies:

```
Phase 1: Foundation
├── 1.1-1.4 Build separation
└── Shared types (LeOption, LeBlock)

Phase 2: Dropdowns
├── le-tag
├── le-dropdown-base
├── le-select
├── le-combobox
└── le-multiselect

Phase 3: Tabs & Emoji
├── le-tabs
├── le-tab-bar
├── le-segmented-control
└── le-emoji-picker

Phase 4: Rich Text
├── le-editor-block
├── le-block-menu
├── le-format-toolbar
└── le-rich-text-editor

Phase 5: Framework Targets
└── 1.5 React/Vue/Angular outputs
```
