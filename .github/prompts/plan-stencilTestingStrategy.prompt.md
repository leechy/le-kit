## Sprint Board: Stencil Component Testing

## Scope and Priority

1. le-button (added as phase accelerator)
2. le-string-input
3. le-code-input
4. le-select
5. le-bar
6. le-side-panel

## Current Status

Last updated: April 23, 2026.

Sprint status summary:

- Sprint 0 complete.
- Sprint 1 spec complete.
- Sprint 1 keyboard e2e complete and verified for le-button and le-string-input.
- Sprint 1 visual suites verified green after baseline refresh.

Completed files:

- packages/core/src/utils/test-helpers.ts — shared helpers (mockMutationObserver, mockResizeObserver, shadowQuery, shadowQueryAll, captureEvent, eventDetail)
- packages/core/src/components/le-button/le-button.spec.tsx — 7 passing spec tests
- packages/core/src/components/le-string-input/le-string-input.spec.tsx — 7 passing spec tests

Total: 21 tests passing (incl. utils.spec.ts), 0 failing.

- packages/core/src/components/le-button/le-button.e2e.ts — keyboard hardening coverage complete
- packages/core/src/components/le-string-input/le-string-input.e2e.ts — keyboard hardening coverage complete
- packages/core/src/components/le-button/le-button.screenshot.e2e.ts — visual matrix authored
- packages/core/src/components/le-string-input/le-string-input.screenshot.e2e.ts — visual matrix authored

Last green functional run: April 23, 2026. Sprint 0 + Sprint 1 functional (spec + e2e) complete.

Last green visual run: April 23, 2026. Week 1 screenshot suites pass after baseline update.

Latest visual verification (April 23, 2026):

- Commands:
  - `npx stencil test --e2e --screenshot --updateScreenshot --testPathPattern="le-button.screenshot.e2e.ts|le-string-input.screenshot.e2e.ts"`
  - `npx stencil test --e2e --screenshot --testPathPattern="le-button.screenshot.e2e.ts|le-string-input.screenshot.e2e.ts"`
- Result: pass; baselines updated to match locked viewport policy.

E2E notes (carry forward to all suites):

- Keyboard tests must target shadow-DOM native elements via `>>>` selector, not the host element.
- `toHaveReceivedEventDetail` requires exact objects; `undefined` props are dropped during Puppeteer JSON serialization — omit them from expected detail objects.
- In headless Chromium, Enter on a text input fires native `change` (different from real desktop browser behavior).

## Sprint 0 (Kickoff, 1-2 days) ✅

Goal: establish deterministic test foundation and start component coverage immediately.

1. [x] Create shared testing helpers for shadow queries, event capture, and mode setup.
2. [x] Add reusable observer mocks (MutationObserver, ResizeObserver) for spec reliability.
3. [x] Start le-button spec tests and validate deterministic local run.
4. [ ] Define timing and viewport policy for e2e and visual tests.

Exit criteria

1. [x] At least one component has stable spec coverage with repeated local passes.

## Sprint 1 (Week 1) ✅

Goal: lock down foundational interactions and admin-related regressions.

le-button

1. [x] Spec: host classes (variant/color/size), icon-only mode, anchor mode, click emission, disabled guard.
2. [x] E2E: keyboard activation (Enter/Space via inner shadow button), disabled click block, anchor mode, Tab focus and disabled skip.
3. [x] Keyboard matrix (Week 1 target): Enter, Space, Tab focus order, disabled tab-skip.
4. [x] Visual suite authored: baseline matrix for variants/colors/sizes, selected, disabled, icon states, full-width.
5. [x] Visual suite verified green in local env.

le-string-input

1. [x] Spec: leInput vs leChange timing, clearable behavior, slot presence logic.
2. [x] Spec: admin-mode integration regression checks.
3. [x] E2E: leInput on keystrokes, leChange on Tab-blur and Enter, focus delegation to inner input, disabled/readonly forwarding.
4. [x] Keyboard matrix (Week 1 target): keystroke input events, Enter commit, Tab-blur commit, focus delegation.
5. [x] Visual suite authored: label/description, value, clearable, disabled/readonly, icon states.
6. [x] Visual suite verified green in local env.

Exit criteria

1. [x] le-button + le-string-input specs are stable and green.
2. [x] e2e keyboard and interaction paths are stable for both components.
3. [x] visual baselines execute and compare successfully in local and CI-targeted runs.

## Week 1 Hardening Backlog (Keyboard + Visual)

Goal: close the remaining Week 1 quality gates with deterministic keyboard and visual coverage.

1. [x] le-button keyboard: add explicit disabled keyboard activation guard (Enter/Space on inner native button).
2. [x] le-button keyboard: add anchor keyboard activation assertion (Enter on shadow anchor emits host click).
3. [x] le-string-input keyboard: add disabled Tab skip assertion in tab order.
4. [x] le-string-input keyboard: add keyboard clear action coverage for clearable mode.
5. [x] visual policy: lock viewport presets (`sm=320x100`, `md=400x120`, `lg=800x240`) and document them in screenshot suites.
6. [x] visual policy: keep one matrix-style screenshot per component plus targeted single-state snapshots.
7. [x] tooling unblock: install/configure Puppeteer Chrome headless shell for local screenshot execution.
8. [x] rerun Week 1 screenshot suites and update baselines only when intentional visual changes occur.

Definition of done (Week 1 hardening)

1. [x] keyboard matrix for le-button and le-string-input includes negative paths (disabled/readonly).
2. [x] screenshot suites run locally and in CI-targeted runs without infra-related failures.
3. [x] baseline image updates are reviewed and attributable to intentional UI changes.

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

**Sprint 2 (active):**

1. [ ] le-code-input spec: paste distribution, selection, auto-advance, backspace, truncation.
2. [ ] le-code-input e2e: realistic typing and paste sequences.
3. [ ] le-select spec: value sync, option source mode, open/close events, disabled.
4. [ ] le-select e2e: keyboard matrix (ArrowUp, ArrowDown, Home, End, Enter, Escape) and popover behavior.
