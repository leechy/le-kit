import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';

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
        { src: 'themes', dest: 'dist/components/themes' },
        {
          src: '../src/assets/custom-elements.json',
          dest: './assets/custom-elements.json',
        },
      ],
    },
    {
      type: 'dist-custom-elements',
      dir: 'dist/components',
      copy: [
        { src: 'themes', dest: 'dist/components/themes' },
        {
          src: '../src/assets/custom-elements.json',
          dest: './assets/custom-elements.json',
        },
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
        { src: 'global' },
        { src: 'themes', dest: 'build/themes' },
        {
          src: '../src/assets/custom-elements.json',
          dest: 'src/components/assets/custom-elements.json',
        },
        {
          src: '../src/assets/custom-elements.json',
          dest: './build/assets/custom-elements.json',
        },
      ],
    },
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
