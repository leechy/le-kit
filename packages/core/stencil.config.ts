import { join } from 'path';
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
        { src: 'themes', dest: 'dist/themes' },
        { src: 'assets', dest: 'dist/components/assets' },
      ],
    },
    {
      type: 'dist-custom-elements',
      dir: 'dist/components',
      externalRuntime: true,
      copy: [
        { src: 'themes', dest: 'dist/themes' },
        { src: 'assets', dest: 'dist/components/assets' },
      ],
    },
    // {
    //   type: 'dist-custom-elements',
    //   dir: 'dist-core/components',
    //   copy: [
    //     { src: '../dist-core', dest: 'dist/core' },
    //   ],
    // },
    // reactOutputTarget({
    //   outDir: 'dist/react/',
    // }),
    // {
    //   type: 'dist-custom-elements',
    //   externalRuntime: false
    // },
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
        { src: 'theming.html' },
        { src: 'global' },
        { src: 'themes', dest: 'build/themes' },
        { src: 'assets', dest: 'build/assets' },
      ],
    },
  ],
  testing: {
    browserHeadless: 'shell',
    screenshotConnector: join(
      __dirname,
      '../../node_modules/@stencil/core/screenshot/local-connector.js',
    ),
    pixelmatchThreshold: 0.1,
    waitBeforeScreenshot: 20,
  },
};
