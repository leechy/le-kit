import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'le-kit',
  globalScript: 'src/global/app.ts',
  globalStyle: 'src/themes/index.css',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
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
      ],
    },
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
