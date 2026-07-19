import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';

// Live on Cloudflare Pages since 2026-07-02; custom domain since 2026-07-04.
export default defineConfig({
  site: 'https://50fivestargels.com',
  output: 'static',
  integrations: [react(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare(),
});