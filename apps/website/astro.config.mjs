// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://inbound.click',
  trailingSlash: 'never',
  compressHTML: true,
  integrations: [sitemap()],
  vite: {
    clearScreen: false,
  },
});
