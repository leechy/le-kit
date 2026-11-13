# Component Page with Playground — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `<le-button>` docs page as the template for all component pages: overview + Playground / API / Roadmap tabs with hash routing, fed by a content file next to the component.

**Architecture:** Page content lives in `packages/core/src/components/<tag>/<tag>.page.md` (YAML frontmatter for structured data, markdown body for prose) and is loaded by an Astro content collection. A generic `ComponentPageBody.astro` renders it inside the existing `ComponentsPage` layout (side navigation stays). Tabs use le-kit's own `le-tabs` / `le-tab-panel` (all panels in the light DOM, so anchors and search see them); a small client script maps the URL hash to a tab.

**Tech Stack:** Astro 6 content layer (`glob` loader), le-kit web components, Node 22 built-in test runner with `--experimental-strip-types` (no new dependencies).

**Spec:** `docs/superpowers/specs/2026-11-13-component-page-design.md`

## How this plan is executed

**Layers, not a straight run.** The user approves each layer in the browser before the next one starts (principles §7). Layer 1 is detailed below; layers 2–7 are an outline and get detailed — and possibly changed — after the previous layer's review. Do not start a layer before the previous one is approved.

## Global Constraints

- The other 27 hand-written component pages and `ComponentsPage.astro` behavior stay unchanged.
- No new npm dependencies in layer 1.
- The content file must not be picked up by the Stencil build (`.md` is not).
- Existing `#@prop` anchor format is kept (`#@variant`).
- `<le-list>` is not published in the docs (paused).
- Docs and code comments in English; no AI attribution lines in commits.
- Before showing a layer: Claude checks it in the browser at desktop width and phone width (375px), light and dark site theme.

## Review Focus

1. **Encoded hash** — `#%40variant` (browsers may encode `@`) must behave like `#@variant`.
2. **Unknown hash** — `#recipe-nope` or `#whatever` must not break the page; falls back to Playground.
3. **Hash changes while on the page** (clicking an in-page link to `#@size`) must switch tabs, not only on load.
4. **Tab switching must not spam history** — `replaceState`, so Back leaves the page instead of cycling tabs.
5. **Page before le-kit hydrates** — overview text is server-rendered and readable without JS.

---

## Layer 1 — Skeleton: overview, tabs with hash routing, stage with one recipe

### Task 1: Hash parsing (pure logic, tested)

**Files:**
- Create: `apps/docs/src/lib/page-hash.ts`
- Test: `apps/docs/src/lib/page-hash.test.ts`
- Modify: `apps/docs/package.json` — add script `"test": "node --experimental-strip-types --test src/lib/"`

**Interfaces:**
- Produces:
  ```ts
  export type PageTab = 'playground' | 'api' | 'roadmap';
  export type HashTarget =
    | { kind: 'tab'; tab: PageTab }
    | { kind: 'recipe'; id: string }
    | { kind: 'anchor'; id: string }
    | { kind: 'none' };
  export function parseHash(hash: string): HashTarget;
  export function hashForTab(tab: PageTab): string; // 'playground' → '' ; others → '#api' / '#roadmap'
  ```

- [ ] **Step 1: Write the failing tests** (`node:test` + `node:assert/strict`)

  - `parseHash('')` and `parseHash('#')` → `{ kind: 'none' }`
  - `parseHash('#api')` → `{ kind: 'tab', tab: 'api' }`; same for `#roadmap`, `#playground`
  - `parseHash('#recipe-with-icon')` → `{ kind: 'recipe', id: 'with-icon' }`
  - `parseHash('#recipe-')` → `{ kind: 'none' }`
  - `parseHash('#@variant')` → `{ kind: 'anchor', id: '@variant' }`
  - `parseHash('#%40variant')` → `{ kind: 'anchor', id: '@variant' }` (Review Focus 1)
  - `parseHash('#usage')` → `{ kind: 'anchor', id: 'usage' }`
  - `hashForTab('playground')` → `''`; `hashForTab('api')` → `'#api'`

- [ ] **Step 2: Run, expect FAIL** — `npm test -w docs` → fails, module not found.
- [ ] **Step 3: Implement** `parseHash` / `hashForTab` in `page-hash.ts` (`decodeURIComponent` on the part after `#`, guarded with try/catch → `none` on malformed input).
- [ ] **Step 4: Run, expect PASS** — `npm test -w docs`.
- [ ] **Step 5: Commit** — `Add hash parsing for component page tabs`.

### Task 2: Content file and collection

**Files:**
- Create: `packages/core/src/components/le-button/le-button.page.md`
- Modify: `apps/docs/src/content.config.ts` — add `componentPages` collection

**Interfaces:**
- Produces collection `componentPages`, entry id = tag (`le-button`), schema:
  ```ts
  {
    tag: string;                 // 'le-button'
    tagline: string;             // one line on what it is for
    hero: string;                // HTML snippet for the hero area
    whenToUse: string[];         // bullets
    whenNotToUse: string[];      // bullets
    recipes: { id: string; title: string; note: string; html: string }[];
  }
  ```
  The markdown body is free prose rendered under the overview (where existing page prose like "behaves like a native button, submits forms" goes).
- Loader: `glob({ pattern: '*/*.page.md', base: '../../packages/core/src/components' })`, `generateId` → the tag.

- [ ] **Step 1: Write `le-button.page.md`.** Content moved from the current `pages/components/le-button.astro`, nothing lost. At least one recipe `default` (`<le-button>Click me</le-button>`) and one `with-onclick` from the existing `onclick` example. `whenToUse` / `whenNotToUse` — Claude drafts, flagged for the user's review.
- [ ] **Step 2: Add the collection** to `content.config.ts`.
- [ ] **Step 3: Verify** — `npm run build -w docs` succeeds; a typo in the frontmatter (temporarily remove `tagline`) fails the build with a schema error; restore.
- [ ] **Step 4: Commit** — `Add le-button page content file and componentPages collection`.

### Task 3: Page body with overview, tabs and stage

**Files:**
- Create: `apps/docs/src/components/component-page/ComponentPageBody.astro`
- Create: `apps/docs/src/components/component-page/Stage.astro`
- Create: `apps/docs/src/components/component-page/tabs-client.ts` (client script)
- Modify: `apps/docs/src/pages/components/le-button.astro` — replace hand-written body with `<ComponentsPage title="le-button"><ComponentPageBody tag="le-button" /></ComponentsPage>`

**Interfaces:**
- Consumes: `parseHash`, `hashForTab`, `PageTab` (Task 1); `componentPages` entry (Task 2); `ApiTable.astro` (existing, `tag` prop).
- `ComponentPageBody` props: `{ tag: string }`.
- `Stage` props: `{ html: string }` — renders `<le-preview-frame>` containing the HTML.
- Tab panels: `<le-tabs>` with `<le-tab-panel value="playground|api|roadmap">`.

- [ ] **Step 1: Overview** — `<h1>&lt;le-button&gt;</h1>`, tagline, hero (`set:html`), when / when-not lists, rendered markdown body. Server-rendered (Review Focus 5).
- [ ] **Step 2: Tabs** — Playground (Stage with the `default` recipe, recipe note under it), API (`<ApiTable tag={tag} />` as placeholder for layer 5), Roadmap ("Coming soon" placeholder).
- [ ] **Step 3: Client script** — on load and on `hashchange` (Review Focus 3): `parseHash(location.hash)`:
  - `tab` → select it; `recipe` → select Playground (recipe selection itself comes in layer 2);
  - `anchor` → find element by id; if inside a `le-tab-panel`, select that panel's tab, then scroll to it; if not found → Playground (Review Focus 2);
  - on `leTabChange` → `history.replaceState(null, '', hashForTab(tab) || location.pathname)` (Review Focus 4).
- [ ] **Step 4: Verify in browser** (dev server via `.claude/launch.json`):
  - `/components/le-button` → Playground selected, button rendered in a preview frame;
  - `/components/le-button#api` → API tab; `#@variant` → API tab scrolled to `variant`; `#%40variant` same;
  - `#nope` → Playground, no console errors;
  - clicking tabs updates the URL; Back leaves the page;
  - 375px width: nothing overflows horizontally; dark site theme readable.
- [ ] **Step 5: Commit** — `Rebuild le-button docs page on the component page template`.
- [ ] **Step 6: Show the user** — screenshots (desktop, phone) and the live page; wait for approval of layer 1.

---

## Layer 1 review feedback (user, 2026-11-13)

- Hero buttons in a column, not a row, to balance the six "when to use" bullets.

## Layer 2 — Recipes column

### Task 4: Hero direction (layer 1 feedback)

**Files:** `apps/docs/src/content.config.ts`, `ComponentPageBody.astro`, `le-button.page.md`

- [ ] Add optional `heroDirection: 'row' | 'column'` (default `row`) to the schema; `le-button.page.md` sets `column`.
- [ ] `.hero` uses it as `flex-direction`; under 720px (single-column overview) it is always a wrapping row.
- [ ] Verify in browser: column on desktop, row at 375px. Commit `Stack le-button hero vertically`.

### Task 5: Recipe list and switching

**Files:**
- Modify: `apps/docs/src/lib/page-hash.ts`, `page-hash.test.ts` — add `hashForRecipe`
- Modify: `apps/docs/src/components/component-page/ComponentPageBody.astro`, `Stage.astro`, `tabs-client.ts`

**Interfaces:**
- Produces: `hashForRecipe(id: string, isFirst: boolean): string` — `''` for the first recipe (clean URL), else `#recipe-<id>`.
- Recipe list: one `<le-button variant="clear" full-width align="start" data-recipe="<id>">` per recipe (dogfooding le-button on its own page), `selected` on the active one.
- Every recipe's markup is server-rendered into `<template data-recipe-template="<id>">`; the stage content and the note are swapped from it on selection.

- [ ] **Test first:** `hashForRecipe('default', true)` → `''`; `hashForRecipe('with-icon', false)` → `'#recipe-with-icon'`. Run → FAIL; implement; run → PASS.
- [ ] Playground layout: recipes column (~200px) left, stage + note right; under 720px the list stacks above the stage and wraps.
- [ ] Selecting a recipe: swaps stage content and note, moves `selected`, `replaceState` with `hashForRecipe` (no history entries).
- [ ] `#recipe-<id>` on load / `hashchange` selects Playground and that recipe; unknown id → first recipe.
- [ ] Verify in browser: all 13 recipes render; `#recipe-icon-only` on load; clicking updates URL; Back leaves the page; 375px no horizontal scroll.
- [ ] Commit `Add recipes column to the component playground`.

## Layers 3–7 — outline (detailed after the previous layer is approved)

- **Layer 3 — Controls + code:** `controls: string[]` added to the content file schema; controls generated from `le-kit/dist/docs.json` (union → `le-select`, boolean → `le-checkbox`, number → `le-number-input`, string → `le-string-input`; icon props → text input); read-only highlighted code with a copy button, only non-default attributes.
- **Layer 4 — Theme, appearance, width:** `[theme="…"]` and appearance (`default | ios | android`) switchers scoped to the stage, starting from the site's theme; width via `le-preview-frame`.
- **Layer 5 — API tab:** generated tables with `#@prop` anchors on every property.
- **Layer 6 — Roadmap tab:** source format agreed first (consolidating `IDEAS.md`), then rendered.
- **Layer 7 — Polish and mobile layout** of the playground (recipes column collapses on phones).
