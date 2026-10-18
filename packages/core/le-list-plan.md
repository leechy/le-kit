# `<le-list>` — Remaining Work Plan

What is left to finish `<le-list>`. Earlier stages (nested rows, separators, column visibility/reorder, sorting, drag-and-drop row reordering with `maxReorderDepth`, actions system) are described in the git history and component readme.

---

## 0. Close the actions stage

The actions system (`LeListAction`, `utils/action-bus.ts`, `item-context-menu`, `type: 'actions'` column, `<le-button action>` / `<le-toolbar bind-list>`, navigation separators).

- [x] Manual check in the dev server: context menu, actions column with overflow, toolbar/button binding with two lists, `action` vs `href`/`onclick` precedence.
  - Fixed: actions column clicks changed row selection and swallowed the overflow menu click.
  - Fixed: toolbar and multi-selection context menu actions ran on the first selected row only.
  - Fixed: a button bound to several lists triggered the action in all of them, not only the one it reflects.
  - Actions column is right-aligned by default; `selectionMode` docs now match the code, plus `'any'`.
- [x] `npm run build` (bundle + CEM manifest).
- [x] Commit.

---

## 1. Card layout (narrow containers / mobile)

- [ ] `layout: 'auto' | 'table' | 'cards'` prop. `auto` switches by the list's own width via `@container` (`:host` already has `container-type: inline-size`); breakpoint as a CSS variable.
- [ ] Column role in a card: e.g. `LeColumn.card: 'title' | 'subtitle' | 'meta' | 'badge' | 'media' | 'hidden'`, with a sensible default when not set (first column → title, rest → meta).
- [ ] No table header in cards: sorting and column visibility move to a menu (button above the list or the bound toolbar).
- [ ] Hierarchy: nested cards with indent and expand/collapse, same as table rows.
  - Groundwork for drill-down: a mode where items with children only show a chevron that hints there is something inside (emitting an event), without navigating. Real drill-down is a layout/navigation/routing concern — see `IDEAS.md`.
- [ ] Selection, keyboard navigation, drag-and-drop reordering (via handle) and actions (overflow `…`) work in cards.
- [ ] Empty state and loading state (see §4) in cards.

---

## 2. View Transitions between layouts

- [ ] **Prototype first**: confirm how `view-transition-name` behaves inside shadow DOM and whether element-scoped transitions (`element.startViewTransition`) are usable in the target browsers. Decide the approach based on that.
- [ ] Table ↔ cards: each row gets `view-transition-name` from its `id`, so a row morphs into its card.
- [ ] Fallback: no animation where unsupported; respect `prefers-reduced-motion`.
- [ ] Reuse for sorting, row reorder drop and expand/collapse, if cheap once the mechanism is in place.

---

## 3. Swipe actions (cards)

- [ ] Separate component (working name `<le-swipe-actions>`), usable outside the list; `<le-list>` uses it in card layout.
- [ ] Actions come from `LeListAction` with a new field, e.g. `swipe: 'start' | 'end'`.
- [ ] Full swipe past a threshold triggers the primary action (e.g. delete), partial swipe reveals buttons.
- [ ] Resolve conflicts: vertical scroll, drag-and-drop reorder, `touch-action`, RTL (start/end instead of left/right).

---

## 4. Loading states

- [ ] `loading` prop with a skeleton (table rows and cards).
- [ ] Lazy children: `hasChildren` on an item without `children`, an event on expand so the app can load them, a per-row loading indicator.

---

## 5. Wide tables

- [ ] Sticky header.
- [ ] Horizontal scroll with a pinned first column.
- [ ] Column resizing through `--le-list-grid-template` (the grid layout was designed with this in mind), with an event to persist widths.

---

## 6. Large data sets

- [ ] Virtualization. Interacts with drag-and-drop, View Transitions and nested rows — decide the approach before starting.
- [ ] Dragging several selected rows at once.

---

## 7. Documentation

- [ ] Docs page in `apps/docs` with demos of all modes.
- [ ] Regenerate `readme.md`, update `LLM_CONTEXT.md`.
