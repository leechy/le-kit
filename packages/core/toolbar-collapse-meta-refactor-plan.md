# Universal Toolbar Collapse Meta Refactor Plan

## Branch: feat/toolbar-collapse-meta-universal

## Goal

Refactor the toolbar and toolbar participant components to use a universal collapse meta interface for overflow/collapse handling, supporting all current and future toolbar children.

## Naming

- Interface: `LeCollapseMeta`
- Method: `getCollapseMeta()`

## Collapse Modes

- `item`: Simple show/hide (e.g., button, group with collapse attribute)
- `stepping`: Multiple discrete widths (e.g., button-group, tabs, buttons with/without labels)
- `variable`: Flexible width between min/max, can shrink/grow, fully collapse if below min (e.g., select, input)

## Interface (Draft)

```ts
export interface LeCollapseMeta {
  kind: 'item' | 'stepping' | 'variable';
  /** For stepping/variable: supported collapse values (e.g., [3,2,1] for button-group stages) */
  collapseValues?: string[];
  /** For variable: min/max width in px (optional) */
  minWidth?: number;
  maxWidth?: number;
  /** True if the component manages its own <le-visibility> or equivalent */
  managesVisibility?: boolean;
  /** Optionally, overflow menu representation */
  overflowOption?: LeOption;
}
```

## Method (Draft)

```ts
getCollapseMeta(): Promise<LeCollapseMeta>;
```

## Fallback

If a component does not implement `getCollapseMeta`, treat as `{ kind: 'item' }`.

## Steps

1. Define `LeCollapseMeta` in `types/toolbar.ts` (or similar shared types file).
2. Update `le-toolbar` to query `getCollapseMeta()` on each child (with fallback).
3. Update `le-button-group` and other relevant components to implement `getCollapseMeta()`.
4. Refactor collapse/overflow logic in `le-toolbar` to use the new interface.
5. Update/add tests and docs as needed.

## Notes

- This enables future extensibility for new collapse/overflow behaviors.
- Overflow menu representation for non-standard components can be handled via `overflowOption`.
- The interface can be extended as needed for more advanced scenarios.
