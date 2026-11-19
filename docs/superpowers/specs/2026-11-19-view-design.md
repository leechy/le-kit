# `view` — showing one of several contents — design

**Status:** agreed in conversation 2026-11-18/19; prototype only, nothing in core yet.
**First consumer:** `<le-button>`.
**Prototype:** `apps/docs/src/pages/lab-views.astro` (`/lab-views`), kept as a reference; not part of the docs.

## Why

Many components need to show one of several contents and switch between them with motion:
a button that turns into "Copied" or "Saving…", a block that is loading / empty / failed / filled,
a text that is short or full. Today each such case is hand-made (the docs code block swapped the
button text in JS; the button jumped in width, and the text wrapped mid-animation).

We want **one mechanism with one name**, which components apply in their own way.

## The rule

- A container has `view="<name>"`.
- A child with `view="a b"` (a space-separated list) is shown when the container's view is one of
  them; otherwise it is hidden.
- A child **without** `view` is always shown.
- Switching is a **prop / attribute**: `el.view = 'saving'` or `view="saving"` in markup. It works in
  plain HTML, in any framework, and is visible in the inspector. A method may be added later as
  sugar, never as the only way.

```html
<le-button view="idle">
  <le-icon slot="icon-start" name="save" view="idle"></le-icon>
  <le-spinner slot="icon-start" view="saving"></le-spinner>
  <le-icon slot="icon-start" name="check" view="saved"></le-icon>
  <span view="idle">Save</span>
  <span view="saving">Saving…</span>
  <span view="saved" announce>Saved</span>
</le-button>
```

Views mark **content in the existing slots** — no new `le-button-state` element and no copy of the
button's API per view. A view may change only a part (e.g. only the icon of Play / Pause).

## Name

`view`, not `state`: "state" is already the state bus (`le-side-panel:state`) and a prop of
`le-visibility` with another meaning (§5 of the principles — one name, one meaning). Tabs keep their
own `selected` / `value` (their roles and keyboard handling are their own).

## The container decides how to switch

| Container | Switch | Size |
|---|---|---|
| `le-button` (and other controls) | cross-fade | the largest view: all views share one grid cell (`grid-area: 1 / 1`), inactive ones are `visibility: hidden`. No measuring. When space is short the text wraps the same way in every view, so nothing jumps. |
| blocks (async content, wizard steps, "read more") | collapse | height animates: the leaving view collapses while the next opens, each through the `le-collapse` grid technique. No measuring. |

Found in the prototype: inside `le-button` the label's view wrapper must be a block `grid`, not
`inline-grid` — otherwise the button does not grow with wrapped text.

The same icon in two views (a chevron) is not swapped: it stays one element and may rotate via CSS on
`[view="…"]`.

## Motion

- Tokens `--le-motion-view-duration`, `--le-motion-view-easing`, `--le-motion-view-enter` (transform a
  view comes from), `--le-motion-view-exit` (transform it leaves to), `--le-motion-view-blur`.
  Enter and exit are separate: an entering view starts from the enter point, not from where it left.
- Presets, set with `motion-preset` on any ancestor (`<html>` for the whole page, a block, one
  component): `none` (instant), `fade` (opacity only), `slide` (in from below, out upwards),
  `scale`, `blur`, `spring`.
- **Default: `fade`** — no movement. `none` is instant.
- `prefers-reduced-motion` drops movement, as it already does for `le-visibility`.

## Accessibility and forms

- Hidden views are `visibility: hidden`, so they are out of the accessibility tree; only the current
  view is read.
- `announce` on a view child announces it when it appears (`aria-live="polite"`) — for "Copied",
  "Saved", errors.
- Hidden content in forms must be **inert / disabled**, not only invisible: a hidden `required` field
  still blocks submit, and its value is still sent.
- Disabling a whole form while saving is not a view: use `<fieldset disabled>`.

## Out of scope / separate axes

- **Collapsing a button to its icon in a toolbar** (`collapsible`, `collapse`, `visibility`) is a
  separate axis — space, not content: a "Copied" button can also be collapsed to an icon. It stays
  separate; the two share motion tokens, not the attribute.
- **Skeletons** are not a button feature: a skeleton is the content of a `loading` view of a block.
- **Morphing width** is `view-size="current"` on `le-button` (default `largest`). The button measures
  the label before and after the switch and animates the width; both views keep their resting width
  during the animation and the wrapper clips them, so text never re-wraps mid-animation.
  **Known issue:** when one view wraps to two lines and the other doesn't (a narrow container), the
  height changes in one step — only the width is animated.

## Consumers

1. `le-button` — first.
2. An async content block (loading / empty / error / content).
3. Wizard / stepper steps.
4. "Read more" text — `le-collapse` with a part marked `view="full"`; "closed" is the view without
   that part.

## Open questions

- **Following another element's view** — a toggle and the text it expands had to be switched with
  two calls in the prototype. Likely `view-when="<event>.<field>"`, like `closed-when` on
  `le-collapse` (state bus).
- **Auto-return** for transient views ("Copied" → back after 2 s): a `revert-after` attribute or user
  code.
- **Event** `leViewChange`, including auto-return.
- **`le-collapse` API** with views — how `closed` / `collapsed-size` relate to `view`.
- **Motion preset names** next to the existing `soft | fluid | spring` presets of `le-visibility` —
  one list or two.
- **Rename `state` on `le-visibility`** (§5 conflict).
- **Playground**: a motion-preset switcher on the stage (with the theme / appearance switchers,
  layer 4 of the component page plan), set on the stage, not the whole page.
