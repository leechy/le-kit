## Sprint Board: Stencil Component Testing

## Scope and Priority

1. le-button (added as phase accelerator)
2. le-string-input
3. le-code-input
4. le-select
5. le-bar
6. le-side-panel

## Current Status

Last updated: April 1, 2026. Sprint 0 complete. Sprint 1 spec tier complete.

Completed files:

- packages/core/src/utils/test-helpers.ts — shared helpers (mockMutationObserver, mockResizeObserver, shadowQuery, shadowQueryAll, captureEvent, eventDetail)
- packages/core/src/components/le-button/le-button.spec.tsx — 7 passing spec tests
- packages/core/src/components/le-string-input/le-string-input.spec.tsx — 7 passing spec tests

Total: 21 tests passing (incl. utils.spec.ts), 0 failing.

## Sprint 0 (Kickoff, 1-2 days) ✅

Goal: establish deterministic test foundation and start component coverage immediately.

1. [x] Create shared testing helpers for shadow queries, event capture, and mode setup.
2. [x] Add reusable observer mocks (MutationObserver, ResizeObserver) for spec reliability.
3. [x] Start le-button spec tests and validate deterministic local run.
4. [ ] Define timing and viewport policy for e2e and visual tests.

Exit criteria

1. [x] At least one component has stable spec coverage with repeated local passes.

## Sprint 1 (Week 1) — spec tier complete, e2e + visual pending

Goal: lock down foundational interactions and admin-related regressions.

le-button

1. [x] Spec: host classes (variant/color/size), icon-only mode, anchor mode, click emission, disabled guard.
2. [ ] E2E: keyboard activation, disabled interaction block, link mode behavior.
3. [ ] Visual: baseline matrix for key variants and states.

le-string-input

1. [x] Spec: leInput vs leChange timing, clearable behavior, slot presence logic.
2. [x] Spec: admin-mode integration regression checks.
3. [ ] E2E: focus/blur and keyboard commit paths.
4. [ ] Visual: label/input/description token-driven states.

Exit criteria

1. [x] le-button + le-string-input specs are stable and green.
2. [ ] e2e paths stable for both components.

## Sprint 2 (Week 2)

Goal: advanced text editing and keyboard workflows.

le-code-input

1. [ ] Spec: paste distribution across boxes.
2. [ ] Spec: selection behavior and cursor movement.
3. [ ] Spec: auto-advance, backspace navigation, value truncation.
4. [ ] E2E: realistic typing and paste sequences.
5. [ ] Visual: focus/error states.

le-select

1. [ ] Spec: value synchronization and disabled handling.
2. [ ] Spec: declarative vs prop-driven option source behavior.
3. [ ] E2E: keyboard matrix (ArrowUp, ArrowDown, Home, End, Enter, Escape).
4. [ ] E2E: popover dependency behavior.
5. [ ] Visual: trigger/menu hover/selected/disabled states.

Exit criteria

1. keyboard-heavy components pass repeatedly without flake.

## Sprint 3 (Week 3)

Goal: observer-driven overflow behavior.

le-bar

1. [ ] Spec: overflow modes (more, scroll, hamburger, wrap).
2. [ ] Spec: overflow event payload assertions.
3. [ ] Spec: mutation-triggered recalculation behavior.
4. [ ] E2E: deterministic resize transitions and submenu behavior.
5. [ ] Visual: wrapped vs overflow layouts at breakpoints.

Exit criteria

1. resize-driven behavior is deterministic on repeated runs.

## Sprint 4 (Week 4)

Goal: persistence and responsive panel behavior.

le-side-panel

1. [ ] Spec: breakpoint parsing, open/collapsed transitions.
2. [ ] Spec: width persistence semantics and event payloads.
3. [ ] E2E: drag-resize lifecycle and localStorage restore.
4. [ ] E2E: narrow/wide transitions and overlay interactions.
5. [ ] Visual: narrow/wide layout, backdrop, resize handle.

Exit criteria

1. persistence and resizing behavior pass reliably locally and in CI.

## Parallel Stabilization Track

1. [ ] Keep CI non-blocking while suite stabilizes.
2. [ ] Publish artifacts for failing e2e/visual jobs.
3. [ ] Track flaky tests weekly by failure category.
4. [ ] Define promotion criteria to required checks (pass streak + low flake threshold).

## Immediate Next Steps

**Sprint 1 finish line** (pick up from here next session):

1. [ ] le-button e2e: keyboard activation and disabled interaction block.
2. [ ] le-string-input e2e: focus/blur and keyboard commit paths.

**Then Sprint 2:** 3. [ ] le-code-input spec: paste distribution, selection, auto-advance, backspace, truncation. 4. [ ] le-select spec: value sync, option source mode, open/close events, disabled.
