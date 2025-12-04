# Le-Kit Development Context

> This file helps GitHub Copilot maintain context across sessions.
> Share this file content when starting a new chat.

## Project Overview

**le-kit** is a Stencil.js web component library with:
- **Themeable components** via CSS custom properties
- **Mode system**: `default` (production) and `admin` (CMS editing)
- **Mode inheritance** traverses shadow DOM boundaries

## Key Components

### `le-component` (internal wrapper)
- **Purpose**: Wraps other components to provide admin-mode editing UI
- **Location**: `src/components/le-component/`
- **Features**:
  - Shows component name header + settings popover in admin mode
  - Property editor loads metadata from `/custom-elements.json`
  - Only loads metadata when entering admin mode (performance)
  - Finds host element via `getRootNode()` shadow DOM traversal

### `le-slot` (slot placeholder)
- **Purpose**: Manages slot content editing in admin mode
- **Location**: `src/components/le-slot/`
- **Key Props**:
  - `type`: `'slot'` | `'text'` | `'textarea'` - editing mode
  - `tag`: HTML tag to create if slot is empty (e.g., `'h3'`, `'p'`)
  - `name`: slot name to match
- **How it works**:
  - Uses `slot.assignedNodes({ flatten: true })` to read slotted content
  - Edits `slottedElement.innerHTML` directly
  - Creates new elements with `tag` prop when slot is empty
  - `isUpdating` flag prevents slotchange loops

### `le-card`
- **Location**: `src/components/le-card/`
- Uses `<le-component>` as root in render()
- Header slot: `type="text" tag="h3"`
- Content slot: `type="textarea" tag="p"`
- Footer slot: dropzone for buttons/links

### `le-popover`
- **Location**: `src/components/le-popover/`
- Sets `mode="default"` to create mode boundary for children
- Auto-positioning with viewport overflow detection

## Architecture Patterns

### Mode Traversal (Shadow DOM aware)
```typescript
// In src/global/app.ts - getMode()
// Traverses up DOM, crossing shadow boundaries via getRootNode()
```

### Slot Content Flow
```
User light DOM → le-card's <slot> → le-slot's light DOM → le-slot's internal <slot>
                                                          ↓
                                               assignedNodes({ flatten: true })
```

### Component Structure
```tsx
// Components use le-component as root:
render() {
  return (
    <le-component component="le-card" hostClass={classes}>
      <div class="card">
        <le-slot name="header" type="text" tag="h3">
          <slot name="header"></slot>
        </le-slot>
        ...
      </div>
    </le-component>
  );
}
```

## Important Files

- `src/global/app.ts` - Mode/theme system, `getMode()` with shadow DOM traversal
- `src/utils/utils.ts` - `observeModeChanges()`, `classnames()`
- `stencil.config.ts` - Copies `custom-elements.json` to www folder
- `package.json` - `prestart` script generates `custom-elements.json`

## Current State (Dec 4, 2025)

### Completed Features
- ✅ `le-component` wrapper with property editor popover
- ✅ Mode boundary support (popover forces default mode for children)
- ✅ Shadow DOM traversal for mode inheritance
- ✅ Slot content editing via `assignedNodes()`
- ✅ Auto-create elements when slot is empty (`tag` prop)
- ✅ `custom-elements.json` auto-generated in prestart

### Next Steps / Ideas
- [ ] Popover/editor UI design improvements
- [ ] Add new components inside slots (component picker)
- [ ] Drag & drop reordering in slot dropzones
- [ ] Better handling of footer slot (buttons)

## Commands

```bash
npm start        # Dev server (runs prestart → generates manifest)
npm run build    # Production build
npm run analyze  # Generate custom-elements.json manually
```

## Tips for Copilot

1. Components use shadow DOM (`shadow: true` in @Component)
2. CSS selectors: `:host > le-component.variant-X .card` pattern
3. Mode inheritance stops at elements with explicit `mode` attribute
4. `le-slot` has TWO slot layers - be careful with named vs unnamed slots
