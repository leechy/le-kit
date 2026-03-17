/**
 * Custom Elements Manifest Analyzer configuration for le-kit
 *
 * This runs alongside Stencil's docs-json to produce the CEM standard format.
 * CEM is consumed by VS Code, Storybook, and other tooling.
 *
 * @see https://custom-elements-manifest.open-wc.org/
 */
export default {
  /** Globs to analyze */
  globs: ['src/components/**/*.tsx'],

  /** Globs to exclude */
  exclude: ['**/*.spec.tsx', '**/*.e2e.tsx', '**/test/**'],

  /** Output directory for custom-elements.json */
  outdir: './src/assets',

  /** Enable Stencil.js support */
  // Note: The --stencil flag enables the Stencil plugin automatically

  /** Additional plugins can be added here */
  plugins: [],
};
