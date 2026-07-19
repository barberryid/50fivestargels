# 50FiveStarGels — Project References

Quick-reference sheet for this project, mirroring the conventions of
`../50fivestarhotels`. Values marked `[TODO: ...]` do not exist yet — fill
them in as each piece of account-level setup is completed.

## Active project folder

- Windows: `C:\Users\Gary\OneDrive\All Steviafinca data\Gary\50fivestargels`
- Git Bash: `/c/Users/Gary/OneDrive/All Steviafinca data/Gary/50fivestargels`

## Software stack

- **Astro 7** — static output (`output: 'static'`), sitemap integration
- **Tailwind CSS v4** — via `@tailwindcss/vite` plugin; theme tokens live in
  `src/styles/global.css` under `@theme` (no tailwind.config file)
- **React 19** — islands only; the Race Fuel Cost Calculator is the sole
  island (`client:load`), everything else is static
- **TypeScript** — `astro/tsconfigs/strict`
- Node + npm, Git + Git Bash, GitHub, Cloudflare Pages

## Websites

- Primary / canonical / root: https://50fivestargels.com (live since 2026-07-04)
- Secondary / redirecting version: https://www.50fivestargels.com
- Cloudflare Pages URL: https://50fivestargels.pages.dev (live since 2026-07-02)
- GitHub repo: https://github.com/barberryid/50fivestargels
- Sister site (conventions source): https://50fivestarhotels.com

## Build & dev commands (Git Bash)

    cd "/c/Users/Gary/OneDrive/All Steviafinca data/Gary/50fivestargels"
    npm run dev        # local dev server on http://localhost:4321/
    npm run build      # production build into dist/
    npm run preview    # serve the production build locally

## Publish workflow

    git status
    git add -A
    git commit -m "Describe the change"
    git push

Pushing to main triggers a Cloudflare Pages deploy automatically once the
Pages project is connected. (confirmed 2026-07-02)

## Key file paths

- Homepage: `src/pages/index.astro`
- Gel Maker DIY page (canonical slug `/gel-maker-diy/`, formerly `/running-gel-cost-calculator/`): `src/pages/gel-maker-diy.astro`
- Recovery Formula DIY page (canonical slug `/recovery-formula-diy/`, formerly `/recovery-drink-builder/`): `src/pages/recovery-formula-diy.astro`
- Electrolyte Formula DIY page (canonical slug `/electrolyte-formula-diy/`, formerly `/diy-electrolyte-drink/`): `src/pages/electrolyte-formula-diy.astro`
- Old-slug 301 redirects: `public/_redirects`
- Calculator React island: `src/components/calculator/RaceFuelCalculator.tsx`
- Calculator maths (pure functions): `src/lib/fuelMath.ts`
- Prompt generator page (canonical slug /ai-race-fuel-prompt-generator/): `src/pages/ai-race-fuel-prompt-generator.astro`
- Prompt generator React island: `src/components/promptgen/PromptGenerator.tsx`
- Prompt assembly (pure functions): `src/lib/promptBuilder.ts`
- Starter assumptions & default prices: `src/data/defaults.ts`
- Commercial gel dataset (phase 2, powers calculator mode 3): `src/data/gels.ts`
- Guides: `src/pages/marathon-gel-guide.astro`, `src/pages/hyrox-gel-guide.astro`
- About / Disclaimer: `src/pages/about.astro`, `src/pages/disclaimer.astro`
- Default OG/social image: `public/images/social/default-og.png`
- Layouts: `src/layouts/BaseLayout.astro`
- Site chrome: `src/components/Header.astro`, `src/components/Footer.astro`
- SEO: `src/components/SeoHead.astro`, `src/lib/seo.ts` (SITE_URL placeholder — update with the real domain)
- Theme / global styles: `src/styles/global.css`
- Favicon: `public/favicon.svg`

## Source / research / scripts / images folders

Mirroring the hotels project's convention — none created yet:

- `research/` — [TODO: create when research material accumulates]
- `scripts/` — [TODO: create when helper scripts are needed]
- `public/images/` — [TODO: create when the site gets imagery]

## GitHub

- Repo: https://github.com/barberryid/50fivestargels
- Remote: `origin` (HTTPS)
- Production branch: `main`

## Cloudflare Pages

- Project: 50fivestargels — live at https://50fivestargels.pages.dev
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Custom domain: 50fivestargels.com (connected 2026-07-04; www redirects to root)

## Project brief

- `50FiveStarGels-Project-Brief.md` (project root) — V1 scope, fuelling
  science, safety framing, phased build order.
