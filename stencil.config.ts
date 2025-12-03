import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'le-kit',
  globalScript: 'src/global/app.ts',
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
      copy: [{ src: 'global' }],
    },
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
