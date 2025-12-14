import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'le-kit',
  globalScript: 'src/global/app.ts',
  globalStyle: 'src/themes/index.css',
  outputTargets: [
    // Main distribution with lazy loading (includes all components)
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      copy: [
        { src: '../custom-elements.json', dest: 'assets/custom-elements.json' },
      ],
    },
    // Custom elements - all components (admin build)
    {
      type: 'dist-custom-elements',
      dir: 'dist/components',
      customElementsExportBehavior: 'single-export-module',
      externalRuntime: true,
      includeGlobalScripts: true,
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'docs-json',
      file: 'dist/docs.json',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
      copy: [
        { src: 'global' },
        { src: 'themes', dest: 'build/themes' },
        { src: '../custom-elements.json', dest: 'custom-elements.json' },
        { src: '../custom-elements.json', dest: 'build/assets/custom-elements.json' },
      ],
    },
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
