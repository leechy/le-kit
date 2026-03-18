// @ts-check
import { defineConfig } from 'astro/config';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [
      viteStaticCopy({
        targets: [
          {
            // Specifically handling the monorepo structure here, 
            // end-users installing via npm will point to node_modules/le-kit/dist/*
            src: '../../packages/core/dist/*',
            dest: 'le-kit'
          },
          {
            // Components use getAssetPath() which resolves to /le-kit/assets/
            src: '../../packages/core/dist/components/assets/*',
            dest: 'le-kit/assets'
          }
        ]
      })
    ]
  }
});
