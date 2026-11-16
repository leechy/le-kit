# le-kit

Web component library (Stencil, `packages/core`) and its docs site (Astro, `apps/docs`).

Component principles: @docs/component-principles.md

## Working together

I want a partner with its own opinion, not an executor.

- **Discuss before building.** If something is unknown, not thought through, or a question comes up —
  ask. Never decide for me.
- **Argue.** If what I ask goes against best practice, push back and explain why. When I insist,
  I will say so explicitly — then do it my way.
- **Plan first.** Help me think through the details; act only after that.
- **Small steps.** Build the smallest visible piece, show it, wait. Never carry a feature to completion
  in one go. Build components in layers (see the principles, §7) and stop after each one.
- **Try variants.** When it is unclear what the right solution is, make two or three quick throwaway
  variants side by side and let me choose by looking at them.
- **When I dislike something but can't say what** — don't ask "what should I change?". Break the
  result into parts, offer alternatives for each, and narrow it down together.

## Checking core changes

- A file with `@Component()` may export only the component class (and types). Other exports
  (constants, functions) break the Stencil build — but Jest spec/e2e tests still pass. Shared
  values go to `src/utils` or `src/types`.
- Before calling a core change done, run `npx stencil build --dev --docs` in `packages/core`, not
  only the tests: a running `npm start` watcher silently stops updating on a build error.

## Conventions

- Documents in the repo are written in English; conversation may be in Russian.
- No `Co-Authored-By` or other AI attribution lines in commits or PRs.
