# Component page with an interactive playground — design

**Status:** agreed in conversation 2026-11-13, pilot on `<le-button>`.
**Branch:** `feat/docs-site`.

## Why

The docs site (`apps/docs`, Astro) becomes the main sandbox for le-kit instead of
`packages/core/src/index.html` or Storybook (see `docs/component-principles.md` §8). Component pages
today are hand-written per component (28 of 53), and hand-written prop lists already drift from the
code (`le-button` page lists 3 `variant` values, the code has 5).

We redesign **one** page — `<le-button>` — into what every component page should become, and only
then replicate it. `le-button` is chosen because it has simple anatomy and many props (a good test for
generated controls), and whatever the page exposes feeds the button fixes we need anyway.
`le-toolbar` is the second page, to stress-test the template.

## Goals

- A visitor sees quickly what the component is and why it is cool (overview).
- A visitor can play with the live component: pick a recipe, change props, change theme and width,
  copy the resulting code.
- API reference generated from the component metadata — never hand-typed.
- A roadmap of the component, kept out of the way of people who came to use it right now.
- Deep links to tabs, props and recipes.

## Non-goals (for now)

- Editable code with live re-rendering (wanted later, with proper highlighting; the first version
  shows read-only code).
- Replicating the template to other components (after the pilot is approved).
- Blueprints pages, the "used in blueprints" block content (only a placeholder slot in the layout).
- Technical traits (floating, form-associated…) on the page — they are for the LLM docs, not people.
- LLM-facing docs.

## Anti-goals

- Building the whole page in one go. It is built in layers, each shown and approved (principles §7).
- Hand-written prop documentation that can drift from the code.

## Page anatomy (decided)

```
<le-button>
One line on what it is for
[ Hero: several buttons in different themes/states ]   [ When to use / when not ]
─────────────────────────────────────────────────────────
 Playground | API | Roadmap
─────────────────────────────────────────────────────────
 Playground tab:
 ┌ recipes ┐ ┌──────── stage (le-preview-frame) ────────┐
 │ Default │ │                [ ✎ Edit ]                │
 │ ▸ Icon  │ └──────────────────────────────────────────┘
 │ …       │ ┌ controls ───────────┐ ┌ code (read-only) ─┐
 └─────────┘ │ variant ▾ size ▾ …  │ │ <le-button …>     │
             │ theme ▾             │ │                   │
             └─────────────────────┘ └───────────────────┘
             one or two lines about the selected recipe
```

- **Overview** (always visible): tag name, one-line purpose, hero example, "when to use / when not".
- **Tabs:** Playground (default), API, Roadmap.
- **Recipes in a column on the left** of the Playground (decided over chips above the stage).

## URLs (decided)

One page per component; tabs are driven by the hash; any anchor inside a tab opens that tab.

- `/components/le-button` → Playground.
- `#api`, `#roadmap` → that tab.
- `#@variant` → API tab, scrolled to the `variant` prop. This keeps the existing `#@prop` anchor format,
  so old links (e.g. from blog posts) keep working.
- `#recipe-with-icon` → Playground with that recipe selected.
- Switching tabs or recipes updates the hash (`history.replaceState`), so the address is always
  shareable.
- All tab contents are rendered into the HTML (hidden, not lazy), so search engines and in-page
  anchors see them.

## Recipes

A recipe is a named, typical use of the component: a set of prop values + slot content, optionally
with surrounding context (e.g. "in a toolbar" wraps the button in `le-toolbar`). Selecting a recipe
sets the controls to its values; the visitor can keep tweaking from there. Each recipe has one or two
lines on when it fits.

- **Storage (Claude's call):** a data file next to the component in one shape for all components,
  read by the docs site at build time, so recipes can later also feed the LLM docs.
- **First recipes** come from what already exists: the current hand-written `le-button` page and
  `index.html` examples. Later ones come from blueprints and from feedback.

## Page content source (Claude's call)

- **One generic template** for all component pages, fed by a per-component content file that lives
  next to the component (overview line, hero, when to use / when not, recipes, control list). The
  exact file format is left to the builder; it must not be picked up by the Stencil build.
- The pilot page **sits next to** the existing `ComponentsPage` layout; the other 27 hand-written pages
  stay untouched until the template is approved.
- Existing prose on the `le-button` page is not lost: "behaves like a native button, submits forms"
  and similar go into the overview or recipe notes; the `onclick` example becomes a recipe.

## Controls (Claude's call)

Generated from the Stencil docs metadata the site already uses (`le-kit/dist/docs.json`, as in
`ApiTable.astro`):

- string-literal union → select; boolean → switch; number → number input; string → text input;
- **which props get controls is an explicit list in the component's content file**, not inferred from
  types: `le-button` has many wiring props (`action`, `bind-list`, `visibility`, `group-shape`,
  `collapse*`, `motion-preset`…) that belong in the API tab but would only confuse the playground.
  `packages/core` is not changed for this;
- icon props (`icon-start`, `icon-end`, `icon-only`, typed `string | Node`) get a text input for the
  icon name; an icon picker is a later improvement;
- **width:** the stage is a `le-preview-frame`;
- **theme:** a switcher that applies to the stage only — themes are scoped with `[theme="…"]` on any
  element (verified). The stage starts from the site's current theme.
- **appearance (decided):** a second switcher next to the theme — `default | ios | android` (radius,
  density), independent of the theme. It shows the adaptive story on every component page and makes
  every theme × platform combination easy to check.

## Code panel

Read-only, highlighted, with a copy button; reflects current control values (only non-default
attributes) and slot content. Editable code is a later layer.

## API tab

Generated: properties (name/attribute, type, default, description), events, slots, CSS custom
properties, CSS parts. Each property has the `#@prop` anchor. Builds on `ApiTable.astro`.

## Roadmap tab

Bulleted text: wanted / in discussion / planned / rejected (with a reason). Illustrations welcome later.
Source format to be agreed when this tab is built (candidate: the same per-component data file or a
markdown file next to the component; consolidates `IDEAS.md` and plans like `le-list-plan.md`).

## Build order (layers, each shown before the next)

1. **Skeleton:** overview + tabs with hash routing + stage with one hard-coded recipe.
2. **Recipes column** from the data file, selection + `#recipe-…` links.
3. **Generated controls** + read-only code panel.
4. **Theme and appearance switchers, width** on the stage.
5. **API tab** generated, `#@prop` anchors.
6. **Roadmap tab.**
7. Polish, mobile layout of the playground (no room for a side column on phones).

Each layer is checked by Claude in the browser (desktop and phone width, themes) before it is shown.

## Left to the builder

Component structure inside Astro (one generic `ComponentPage` layout vs. per-page composition),
styling of the playground, how controls render (le-kit's own inputs are preferred — dogfooding).
