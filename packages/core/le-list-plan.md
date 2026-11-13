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

- [x] `layout: 'auto' | 'table' | 'cards'` prop; `auto` switches by the list's own width (ResizeObserver) below `cardBreakpoint` (600px).
- [x] `card` config: lines with `start`/`end` slots of column keys (arrays joined with `separator`), or a `render(item, ctx)` function; `ctx.value(key)` renders a value like its cell. Default card: label as the title, description below.
- [x] `LeColumn.primary`: the line holding it is the card title (unless a line sets `size`); the cell is the row header in the table. Otherwise the 1st of 1–2 lines or the 2nd of 3+ lines is the title.
- [x] Hierarchy: nested cards with indent and expand/collapse.
- [x] Selection, keyboard navigation, context menu and actions (`…` from the actions column) work in cards.
- [ ] No table header in cards: sorting and column visibility need a menu (button above the list or the bound toolbar).
- [ ] Drag-and-drop reordering in cards (disabled for now).
- [ ] Drill-down groundwork: a mode where items with children only show a chevron and emit an event. Real drill-down is a layout/navigation/routing concern — see `IDEAS.md`.
- [ ] Loading state (see §4) in cards.

---

## 2. Animation between layouts

- [x] Values carry `data-le-field="<key>"` in cells and cards (custom render functions mark their own elements the same way).
- [x] `layout-transition` prop: FLIP animation with Web Animations — values move from the old position to the new one; plain text scales uniformly by the font size change, values holding components only move. Reduced motion turns it off; a new switch cancels the running one.
- [x] Compatible with other animated components: only the marked element is animated (never rows), transforms use `composite: 'add'`, opacity is left alone, cell/card `overflow` is lifted while values fly. `le-visibility` now measures the layout size (ResizeObserver box / offsetWidth), so ancestor transforms don't distort its cached width.
- Why not View Transitions: `view-transition-name` is tree-scoped, so only a transition started inside the shadow root sees the names; element-scoped transitions in Chrome 152 were unreliable ("Prepaint layout check failed", "Transition was skipped") and crashed the tab every 6–7 switches.
- [ ] Values present only in one layout appear/disappear without a fade (FLIP cannot animate removed elements).
- [ ] Reuse for sorting, row reorder drop and expand/collapse.

---

## 3. Swipe actions (cards)

Agreed design (2026-10-19):

- **Actions.** Swipes reuse `LeListAction`: `swipe: 'start' | 'end'` puts an action on a side (logical: mirrored in RTL), `fullSwipe: true` marks the one action per side that runs when the card is pulled past the buttons. Without `fullSwipe` on a side, the card stops at its buttons. Deleting is a legitimate full-swipe action — undo/trash is the app's job.
- **Limits.** At most 3 actions per side (2 recommended); extra ones are dropped with a console warning. A side without visible actions has no swipe. `hidden`/`disabled` are evaluated per item, so a read/unread toggle is two actions with opposite `hidden`.
- **Look.** Revealed buttons are full-height, colored by `action.color`, with icon and label; the full-swipe action sits at the outer edge and grows to fill while the card is pulled further.
- **Input.** Swipe = horizontal scrolling, not mouse dragging: touch drag (`touch-action: pan-y` keeps vertical scrolling native) and horizontal `wheel` from trackpads / Magic Mouse. Mouse drag stays selection. Horizontal wheel over swipeable cards is captured (`preventDefault`, `overscroll-behavior-x`) so Chrome's back/forward gesture doesn't fire.
- **Settling.** Released or wheel-idle: back to closed, open on its buttons, or — past the full threshold with a `fullSwipe` action — run it. After an action the card closes; removing the item from data is the app's job. Opening one card closes the previously open one.
- **Component.** The gesture is a standalone `<le-swipe>` wrapping any content; `<le-list>` wraps each card with it in the card layout.
- **Context menu.** In cards with swipe actions the pointer context menu (right click / long press) is off by default; `card.contextMenu: true` turns it back on. `item-context-menu` stays the master switch. ContextMenu key / Shift+F10 on the focused row always opens the menu, so actions stay reachable from the keyboard.
- Platform reference: iOS lets each edge have its own actions, the first one runs on a full swipe (`allowsFullSwipe`); Android's `SwipeToDismissBox` has one action per direction; design systems built on them cap at 3 per side.

- [x] Types: `LeListAction.swipe`, `LeListAction.fullSwipe`, `LeListCardConfig.contextMenu`.
- [x] `<le-swipe>` component: touch + wheel input, open/close/full settle, RTL, one open at a time.
- [x] `<le-list>` cards: wrap with `<le-swipe>`, run actions through `executeAction` on the swiped card only, context menu rules, keyboard menu; touch selects on tap, not on touch start.
- [x] Demo: CRM opportunities with read/unread (start, full) and reject + delete (end, delete full).
- [ ] Check on real devices: iOS/Android touch, macOS trackpad momentum, Chrome back-gesture blocking, RTL.

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
