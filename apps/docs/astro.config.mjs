// @ts-check
import { defineConfig } from 'astro/config';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'plastic',
      wrap: true,
    },
  },
  vite: {
    plugins: [
      viteStaticCopy({
        targets: [
          {
            // Copy the runtime bundle to the public path used by the docs site.
            src: '../../packages/core/dist/le-kit/*',
            dest: 'le-kit/le-kit',
          },
          {
            // Components use getAssetPath() which resolves relative to le-kit.esm.js,
            // so assets must live beside the copied runtime bundle.
            src: '../../packages/core/dist/components/assets/*',
            dest: 'le-kit/le-kit/assets',
          },
          {
            // Ensure metadata manifest is always available for admin editing UI.
            src: '../../packages/core/src/assets/custom-elements.json',
            dest: 'le-kit/le-kit/assets',
          },
        ],
      }),
    ],
  },
  experimental: {
    chromeDevtoolsWorkspace: true,
  },
});
