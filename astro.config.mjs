import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: process.env.ATLAS_SITE || 'https://jlsp124.github.io',
  base: process.env.ATLAS_BASE || '/atlas',
  output: 'static',
  trailingSlash: 'always',
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: { ssr: { noExternal: ['katex'] } },
});
