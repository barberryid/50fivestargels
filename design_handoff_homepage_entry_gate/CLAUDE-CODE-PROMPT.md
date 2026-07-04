# Kickoff prompt for Claude Code (Sonnet 5)

Paste the following into Claude Code from the repo root (`C:\Users\Gary\code\50fivestargels`), with this handoff folder unzipped somewhere accessible (e.g. `design_handoff_homepage_entry_gate/` inside the repo):

---

Begin work. Read `design_handoff_homepage_entry_gate/README.md` in full — it is the source of truth for this task.

Implement the redesigned homepage + entry gate from that handoff in this Astro 7 / Tailwind v4 / React 19 codebase:

1. Add the design tokens from the README to `@theme` in `src/styles/global.css`, and load Bayon + Inter (self-host or Google Fonts) per repo conventions.
2. Rebuild `src/pages/index.astro` to match `50FiveStarGels Home v3.dc.html` (open it in a browser to see live behavior): entry gate overlay → hero with split headline + clickable bouncing trainers → statement band → teal CTA → three pastel cards → red "coming next" → black footer. Copy, colors, sizes, and animations are specified exactly in the README.
3. Keep the site static: implement the entry gate as a minimal vanilla `<script>` (or a tiny React island if you judge it cleaner). Persist "already entered" in sessionStorage so the gate shows once per session.
4. Copy `assets/trainers.png` and `assets/logo-star.svg` into `public/images/` and reference them from there.
5. Update `src/components/Header.astro` / `Footer.astro` if the new nav/footer should be shared across pages; otherwise scope to the homepage and note the decision.
6. Verify with `npm run dev`, then `npm run build`. Do not deploy — leave the commit for review.

Constraints: no new dependencies unless essential; follow existing repo patterns; keep the calculator page untouched.
