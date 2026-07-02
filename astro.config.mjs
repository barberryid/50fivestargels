import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// TODO: replace `site` with the custom domain once one is chosen and
// connected in Cloudflare Pages. Until then this is the default
// *.pages.dev URL a Pages project named "50fivestargels" will get —
// confirm it after creating the project.
export default defineConfig({
  site: 'https://50fivestargels.pages.dev',
  output: 'static',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
