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
