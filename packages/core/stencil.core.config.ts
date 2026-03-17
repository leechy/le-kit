import { Config } from '@stencil/core';
import { config as baseConfig } from './stencil.config';

export const config: Config = {
  ...baseConfig,
  namespace: 'le-kit', // Keep same namespace so components have same tags
  tsconfig: 'tsconfig.core.json',
  srcDir: 'src-core',
  globalScript: 'src-core/global/app.ts',
  globalStyle: 'src-core/themes/index.css',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: './loader',
      dir: 'dist-core',
      empty: true,
    },
    {
      type: 'dist-custom-elements',
      dir: 'dist-core/components',
      copy: [
        { src: 'themes', dest: 'dist-core/components/themes' },
        {
          src: '../src/assets/custom-elements.json',
          dest: 'dist-core/components/assets/custom-elements.json'
        },
      ],
    },
    // We can add other targets if needed, but dist is the main one for imports
  ],
  // Disable service worker and other www stuff if inherited
  // We override outputTargets completely so www is gone unless we add it
};
