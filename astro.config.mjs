import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// Live on Cloudflare Pages since 2026-07-02.
// TODO: replace `site` with the custom domain once one is chosen and
// connected in the Pages project.
export default defineConfig({
  site: 'https://50fivestargels.pages.dev',
  output: 'static',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
