# Ideas & Backlog

A backlog of ideas, feature explorations, and UX enhancements to investigate and implement later.

---

## `<le-toolbar>`

### 1. Dedicated "Always in More Menu" Slot / Items

- **Concept**: Provide a slot or attribute for items that should _always_ appear in the "More actions" menu/overflow dropdown, regardless of whether there is enough viewport space available in the main toolbar.
- **Considerations**:
  - Evaluate how this interacts or combines with `slot="more"`.
  - API ergonomics (e.g. `slot="more-menu"` / `slot="overflow"` or a dedicated item property).

---

## `<le-menu>`

### 1. Create a new `le-menu` component to replace the `le-navigation orientation="vertical"` component.

- **Concept**: Since there is too much additional features in `le-navigation` that are related only to vertical menus, we should create a new component `le-menu` with all the menu-related features, like reordering and badges, and leave `le-navigation` with the basic features for the horizontal menu.
- **Considerations**
  - Should we have vertical navigation after all?
  - Do we need to keep some of the vertical-only features

### 2. Nested popover submenus

- **Concept**: Currently, the subitems are drawn as a normal items with some indent. We could instead show them as a separate popovers attached to the parent item, like in the OS menus.
- **Considerations**
  - This could be much more space-efficient for deeply nested menus.
  - Should we turn this option as a prop for the whole menu/navigation or per item basis, or both?

---

## `<le-button>`

### 1. Vertical centering of emoji icons

- **Concept**: Emoji used as icons (`icon-start="🏠"`, `icon-only="⚙️"`) still sit slightly off the vertical center — less than a pixel at medium size, more noticeable at some sizes. Named icons (`le-icon`) and letters are centered.
- **Considerations**:
  - The cause is the emoji font's metrics: the glyph is not centered in its line box. `transform: scale()` used to magnify it; sizing via `font-size` (since `9c840e8`) made it much smaller but not zero.
  - Options to try: `text-box: trim-both cap alphabetic` / `ex` on the emoji wrapper, a small per-platform offset token, or rendering emoji through `le-icon` (an SVG `<text>` with `dominant-baseline: central`).
  - DOM measurements can't see glyph ink — verify visually (e.g. a 4× `zoom` on a row of buttons).

---

## `<le-select>`

### 1. Accessible label (`aria-label` / `aria-labelledby`)

- **Concept**: The select has no way to get an accessible name: no `label` prop, and `aria-label` / `aria-labelledby` on the host are not forwarded to the trigger button inside the shadow DOM, so screen readers announce it without a name.
- **Considerations**:
  - Forward `aria-label` and `aria-labelledby` from the host to the trigger (and the listbox), or add a `label` prop — or both, consistent with the other inputs.
  - Found on the docs playground, where a visible "Recipes:" text sits next to the select but is not connected to it.

---

## Layout

### 1. Drill-down navigation for hierarchical data

- **Concept**: On narrow screens, tapping an item with children (in `<le-list>` cards, `<le-menu>`, etc.) opens the next level as a new view with a "back" control, like in mobile apps.
- **Considerations**:
  - This is not a single-component feature: it involves the page layout, navigation (back/title) and routing (URL per level, browser back button).
  - `<le-list>` currently only renders a chevron on such items and emits an event — the real drill-down should be built on top of that.
