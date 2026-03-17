# Le-Kit Monorepo

Welcome to the Le-Kit monorepo! This repository contains the source code for the `le-kit` web component library and its documentation site.

## Workspaces

- **`packages/core`**: The `@stencil/core` web component library. This is the package that gets published to npm as `le-kit`. Read the [Core Package README](./packages/core/README.md) for usage documentation.
- **`apps/docs`**: The documentation website built with Astro.

## Development Setup

Requirements: Node 20+

```bash
# Install dependencies across all workspaces
npm install

# Start the dev server for the docs site (with live reloading)
npm run dev

# Build the entire monorepo
npm run build
```

The component library uses Stencil's custom elements manifest analyzer and a bunch of post-build scripts to generate different distribution targets (`core`, `admin`, `components`). All of this logic lives inside `packages/core`.

## GitHub Copilot Context

If you use GitHub Copilot, it will automatically load `.github/copilot-instructions.md` which contains all the architectural context, component structures, and the mode-traversal logic specific to this library.

## License

MIT License
