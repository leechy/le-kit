# le-kit component principles

What matters when we design, build and check a component — and what to look at first.
This is a working document: it records decisions we have agreed on and the questions still open.

---

## 1. A component must earn its place

We create a new component only when using it makes later work noticeably easier — when it gives
something plain HTML and CSS do not.

A component earns its place if it carries at least one of:

- **behavior or state** that would otherwise be rewritten every time (expand/collapse, selection, gestures);
- **accessibility** (keyboard, ARIA, focus management);
- **motion** — correct animation and transitions;
- **adaptation** to theme, platform and screen size.

Pure layout (flex/grid) is deliberately not on this list.

**The test:** when someone — a person or an AI — assembles an interface, do they reach for the
component on their own, without being reminded? If they get by without it, it is not needed.

- **Negative example:** `le-stack` / `le-box` were meant to arrange components like HStack/VStack in
  SwiftUI or Flutter. Inside `le-toolbar` nobody (neither people nor any AI assistant) thought of using
  them to lay out buttons — CSS already does it. They are to be removed or rethought.
- **Positive example:** `le-collapse` does one thing — show/hide content of any size with the right
  animation — and is naturally reused in `le-navigation` and `le-list`.

## 2. Groups are by purpose

Components are grouped by **what they are for** — the way a developer thinks when building a screen
("I have content / controls, where do I put them?"), not by technical traits. The groups are also the
sections of the catalog and the docs site.

| Group | Purpose | Current components |
|---|---|---|
| **Controls** | Change the state of the app | button, button-group, segmented-control, context-menu, overflow-menu, toolbar, *future* `le-menu` |
| **Layout** | Put content and controls into places: columns, panels, things that slide out, pop up or collapse | popover, popup, side-panel, tooltip, collapse, bento-grid, bento-tile, header, header-placeholder, bar (?), stack/box (?) , *future* scaffold |
| **Navigation** | Move between places and show where you are | navigation, tabs / tab-bar / tab / tab-panel, breadcrumbs, current-heading, list (between navigation and content) |
| **Content** | Present information | card, empty, list, text, tag, *future* hero blocks, carousels, scroll-animated blocks |
| **Input** | Enter information | string-input, number-input, code-input, checkbox, select, combobox, multiselect, dropdown-base |
| **Icons & assets** | Visual assets | icon |
| **System** | Mechanics other components are built on | kit, component, slot, visibility, swipe, drag-handle, preview-frame, actions-sequence |

**System components are not "internal".** They are not hidden or forbidden to library users; they are
documented with examples like everything else.

Menus and navigation are separate entities: navigation moves between places, a menu triggers actions.

## 3. Technical traits define requirements

Requirements come from **traits**, not from groups. Components in one group can have different traits,
and the same trait appears across groups. A component's checklist = its group's purpose + the
requirements of each trait it has. Initial list:

- **floating** — rendered above everything else (top layer), so it is never clipped by a parent's
  `overflow: hidden`; anchored to a trigger; closes on Esc and outside click; manages focus; may change
  form on phones (e.g. popover → bottom sheet). *popover, popup, tooltip, context-menu, dropdowns.*
- **form-associated** — has a label, validation, takes part in `<form>` submission. *All inputs, checkbox,
  segmented-control.*
- **container-responsive** — rearranges itself by the width of its parent, not the viewport.
  *toolbar, bar, bento-grid, list, side-panel.*
- **keyboard-navigable** — arrows, Home/End, roving focus. *list, tabs, navigation, menus.*

Traits also tell what a playground page needs: a floating component needs a stand with scrolling and
`overflow: hidden`; a container-responsive one needs `le-preview-frame`.

## 4. Variant or a new component

The number of props is not the criterion. **The difference in nature is.**

A new component is needed when at least one of these changes:

- **role and ARIA** — a toggle button (`aria-pressed`) is still a variant; a split button (button + menu)
  is a separate component;
- **value model** — what the component holds and emits;
- **behavior** — most of the code would branch on `if (variant === …)`.

If only appearance or internal arrangement changes, it is a variant, expressed through a few
**enum props**, not a pile of boolean flags.

- **Example — button label below the icon:** same role, same states, same toolbar behavior; only the
  internal layout changes → one enum prop (e.g. `label-placement="end | bottom"`), not ten props.
  Collapsing to icon-only in a toolbar stays inside the button as well.
- **Example — inputs:** HTML's `<input type>` is often cited as how *not* to do it: `date` and
  `password` have different value models and validation, and half the attributes make sense for one
  type only. That is why `string-input`, `number-input` and `code-input` are separate. Consistency
  between them comes from a shared base and shared tokens, not from one tag.

## 5. Consistent API

**The same prop name means the same thing everywhere.** A prop that exists on several components
accepts the same values and leads to the same (or analogous) result on each of them.

**And the other way round:** when we add a prop that does something a prop on another component
already does, we reuse that prop's name and values instead of inventing new ones.

Before adding a prop, look at what other components already have for the same job.

- **Good example — `size`:** `small | medium | large` with `medium` by default on button, select,
  combobox, multiselect, segmented-control, tab, side-panel-toggle, dropdown-base.
- **Positions follow logical directions:** `start | end` rather than `left | right`, so components
  work in RTL without extra props.

**Known inconsistencies today** (to be fixed):

- **`variant`** — button: `solid | filled | outlined | clear | system`; side-panel-toggle: the same
  without `filled`; select: `default | outlined | solid | clear`; card: `default | outlined | elevated`.
- **`position`** — popover, context-menu, overflow-menu use `left | right`; tab uses `start | end`.
- **`mode`** — on most components it is `default | admin` (CMS editing); on `le-visibility` it means
  which dimensions to measure (`width | height | both`). Same name, unrelated meaning.
- **`iconStart` / `iconEnd`** — `string | Node` on button and side-panel-toggle, `string` only on
  string-input, number-input, tab-panel.

## 6. Reuse

1. **Inside components, use our own components.** `le-list` uses `le-collapse` instead of
   `display: none / block`, so expanding looks the same everywhere and a fix in one place fixes all.
2. **Extract repeated mechanics.** When the same mechanic appears in two or more components, it
   becomes a component of its own. Example: `le-visibility`, extracted for `le-button`,
   `le-button-group` and `le-toolbar` (the name is to be changed).
3. **Fix the base, don't work around it.** If a shared component doesn't fit a new case, fix the
   component itself. Example: `le-collapse` dropped `overflow: hidden` in the open state so drag
   handles in `le-navigation` are not clipped. A patch inside the consumer is not allowed.

**Compare mechanics, not results.** Two components that seem to do the same thing may not be
duplicates. `le-collapse` animates content of unknown size through the `display: grid` technique;
`le-visibility` measures a known size where grid is impossible (button groups in a toolbar). Both
show and hide — but they are different tools, and merging them would be a mistake.

## 7. Build in layers

A component is built in layers; each layer is approved before the next one is stacked on it:

1. **anatomy** — what it consists of: parts, slots;
2. **styling and layout API** — how styles and alignment are set;
3. **states**;
4. **behavior** — actions, gestures, keyboard;
5. **motion and polish**.

If a layer doesn't feel right, we don't move on until we have figured out why.
*Lesson from `le-list` cards:* the composition of the card did not feel right yet, but actions were
built on top of it. Once nearly finished, it became hard to say what to change and too costly to
throw away.

## 8. Quality and verification

The main quality gate is **manual checking**, in this order:

1. **Sandbox** — the component on a page; `le-preview-frame` for behavior that depends on container
   width.
2. **Themes** — every theme we have.
3. **Devices** — desktop (mouse, keyboard) and phone (touch).
4. **Together with other components** — the weakest spot today; blueprints are meant to close it.
5. **Docs site** — examples, where more flaws surface.
6. **Real people** — show it to others and listen to what their projects need. (That is how
   `le-number-input` got a stepper with press-and-hold.)

**Unit tests** don't decide whether a component is good — they keep already-accepted behavior
(keyboard, states, events) from breaking when the code changes.

**Sandbox:** the docs site (`apps/docs`) grows into the sandbox — per-component playground pages
(prop controls from `custom-elements.json`, theme switcher, `le-preview-frame`), blueprints, and blog
notes written on the spot. No Storybook. `packages/core/src/index.html` is legacy; new examples go to
the docs site.

---

## Open questions

- **Feedback / status group** — progress (round-progress, scroll-progress), toasts, alerts, badges,
  skeletons: a group of its own, or spread over Content and Layout?
- **`le-stack` / `le-box`** — remove, or rethink for site/app layout (scaffold)?
- **`le-bar`** — where it belongs and how it relates to `le-toolbar`.
- **`le-visibility`** — new name (candidates: `le-presence`, `le-reveal`, `le-size-transition`).
- **`le-collapse`** — content appears later than the space opens for it (bug to fix).
- **Admin / CMS mode** (`le-component`, `le-slot`, `le-text`, `le-card`) — which components must
  support it, and is it a trait?
- **Not yet placed:** `le-turntable`, `le-item`, `le-round-progress`.
- **Should Claude self-check** (sandbox, themes, phone width, screenshots) before each stop-and-show?
