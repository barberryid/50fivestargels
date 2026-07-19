# Handoff: 50FiveStarGels — Entry Gate + Homepage Redesign

## Overview
A playful redesign of the 50FiveStarGels homepage inspired by dontboardme.com: a full-screen **entry gate** where the visitor must bounce an energy-gel packet 5 times to enter (with a skip link), which slides up to reveal the **homepage** — an oversized split-headline hero around a central trainers graphic, followed by statement, CTA, feature-card, coming-next, and footer sections.

Two visual directions were designed; **V3 is the one to implement**:
- `50FiveStarGels Home v3.dc.html` — **FINAL. Implement this.** dontboardme-style palette & type (Bayon display, red/cream/pastels).
- `50FiveStarGels Home v2.dc.html` — earlier direction (50 Difficult Places editorial palette, Anton). Reference only.
- `50FiveStarGels Home.dc.html` — first draft. Ignore.

## About the Design Files
The `.dc.html` files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate this design in the target codebase**: the Astro 7 + Tailwind CSS v4 + React 19 project at `C:\Users\Gary\OneDrive\All Steviafinca data\Gary\50fivestargels` (GitHub: `barberryid/50fivestargels`, deploys to https://50fivestargels.pages.dev). Follow that repo's conventions: static Astro pages, React islands only where interactivity demands it, theme tokens in `src/styles/global.css` under `@theme`, layouts in `src/layouts/BaseLayout.astro`, chrome in `src/components/Header.astro` / `Footer.astro`.

Suggested implementation shape:
- Entry gate: a small React island (`client:load`) or plain vanilla `<script>` in `index.astro` — it's one counter + CSS animations; a full island is optional.
- Everything else: static Astro markup with Tailwind utilities.

## Fidelity
**High-fidelity.** Colors, type, spacing, copy, and interactions are final. Recreate pixel-faithfully using Tailwind utilities mapped to the tokens below. The trainers image (`assets/trainers.png`) is final art; the gel-packet SVG in the gate is final art (inline SVG, copy it as-is).

## Design Tokens (add to `@theme` in `src/styles/global.css`)
```css
--color-cream: #F3F3E9;        /* page background */
--color-cream-alt: #F6F6ED;    /* alt section bg + gel packet body */
--color-brand-red: #E33529;    /* headlines, nav, buttons, accents */
--color-brand-teal: #2B6786;   /* CTA section bg, secondary accent, skip link */
--color-ink: #000000;          /* body text, line art, footer bg */
/* pastel fills — backgrounds only, never text */
--color-tint-pink: #F4CED3;    /* statement section, card 1 */
--color-tint-lavender: #EAD9EC;/* card 2 */
--color-tint-sky: #AFD8FB;     /* card 3 */
--font-display: "Bayon", sans-serif;   /* free, Google Fonts */
--font-body: "Inter", sans-serif;      /* free substitute for Neue Montreal */
```

Type rules:
- Display (Bayon): always UPPERCASE, `letter-spacing: -0.02em`, `line-height: 0.78–0.85`, red `#E33529` (or cream on dark sections, black on pastel cards).
- Body (Inter 500): sentence case, black; small labels uppercase w/ `+0.04em` tracking.
- Buttons: Inter 500, uppercase, 14–15px, solid red pill (`border-radius: 9999px`), cream text; hover → black bg.

## Screens / Views

### 1. Entry gate (full-screen overlay, z-60, bg cream #F3F3E9)
- Top-left logo lockup: `logo-star.svg` 34px + "50FIVE / STAR / GELS" stacked, Bayon 17px, red, line-height 0.95.
- Giant split headline, red Bayon, `clamp(72px, 14.5vw, 270px)`, line-height 0.78, above the graphic (z-3, `pointer-events: none`):
  - Left (2vw, vertically ~48%): "BOUNCE / THE GEL"
  - Right (2vw, ~54%, right-aligned): "TO GET / IN!"
- Center: clickable gel-packet SVG (`min(28vw, 42vh, 300px)` wide) with blurred black ellipse shadow beneath. Idle animation: gentle float ±16px, 1.7s ease-in-out infinite. On click: squash-and-stretch bounce keyframe, 620ms `cubic-bezier(0.34, 1.3, 0.5, 1)` (two mirrored variants alternate so consecutive clicks re-trigger).
- Bottom center: counter line (Bayon 26px red) — "5 BOUNCES TO GET IN" → "4 TO GO" … then "FUELLED. IN YOU GO." (teal). Below it a rotating quip (Inter 14px, 60% black):
  1. "It wants to be bounced. They all do."
  2. "That's one. Carbs loading…"
  3. "Good pop. Isotonic, even."
  4. "Your glycogen stores thank you."
  5. "One more and you're through the tape."
- Skip link: "IN A HURRY? SKIP THE WARM-UP →" — Inter 13px 600, uppercase, teal, underlined.
- Exit: after 5th bounce (650ms delay) or skip, the whole gate translates `translateY(-100%)` over 700ms `cubic-bezier(0.65, 0, 0.35, 1)`, then unmounts. Gate shows only on first load per the prototype; consider sessionStorage so returning visitors in the same session skip it.

### 2. Hero (min-height 100vh, cream)
- Nav (absolute top): logo lockup left; center links "CALCULATOR / WHAT YOU GET / COMING NEXT" (Bayon 19px red, hover black); right red pill button "OPEN CALCULATOR" → `/running-gel-cost-calculator/`.
- Split headline (same spec as gate, `clamp(80px, 16vw, 300px)`, z-3, pointer-events none): left "THE / RIGHT / GEL", right "CHANGES / THE RACE!".
- Center: `trainers.png` (`min(46vw, 56vh, 580px)` wide, `mix-blend-mode: multiply` to sit on cream), clickable → same bounce animation as the gate gel; blurred shadow ellipse beneath.
- Bottom-left: "FREE · NO SIGN-UP · RESULTS SHAREABLE BY LINK" (Inter 13px, 65% black, uppercase).
- Bottom-right: "SCROLL ↓" (Bayon 17px teal).

### 3. Statement band (bg blush #F4CED3)
Centered "RACE FUEL, / PRICED HONESTLY." — Bayon red, `clamp(38px, 5.2vw, 84px)`, generous vertical padding `clamp(72px, 10vw, 140px)`.

### 4. CTA section (bg teal #2B6786, id `calculator`)
Two-column grid (1.4fr/1fr, 48px gap): left "STOP OVERPAYING FOR RACE FUEL." (Bayon cream, `clamp(42px, 5vw, 80px)`); right paragraph (Inter cream): "Compare gels by cost per gram of carbohydrate and calculate your own DIY race mix for marathon, half marathon, HYROX and long training — with editable prices that work in any currency." + red pill "OPEN THE CALCULATOR →" (hover: black bg, -2px lift).

### 5. What you get (bg #F6F6ED, id `what-you-get`)
- Heading "WHAT / YOU GET" — Bayon red `clamp(56px, 9vw, 150px)`.
- 3 cards, `repeat(auto-fit, minmax(280px, 1fr))`, 24px gap, radius 24px, padding 40/32px, hover lift -6px:
  1. Pink #F4CED3 — "MONEY, MADE CONCRETE" — "Cost per gram of carbohydrate, plus what a 12-week training block really costs you in gels versus DIY mix."
  2. Lavender #EAD9EC — "BUY, MAKE — OR BOTH" — "DIY mixes compared directly against commercial gels, instead of only spitting out a recipe."
  3. Sky #AFD8FB — "AN HONEST GUT-LOAD ESTIMATE" — "A concentration warning presented as an estimate, not a lab reading — with clear guidance on what to sip and what to chase with water."
- Each card: 52px red circle numeral (Bayon 24 cream), title Bayon 34px black, body Inter 15px black.

### 6. Coming next (bg red #E33529, id `coming-next`)
- "COMING / NEXT" — Bayon cream, same scale as §5.
- Three cream pills (Bayon 21px red text): "AI FUELLING PROMPT GENERATOR", "MARATHON & HYROX FUELLING GUIDES", "COMMERCIAL GEL COMPARISON".
- Paragraph (Inter, cream 90%): "Same rule as the calculator: numbers you can check, estimates labelled as estimates, and nothing that reads like a brochure."

### 7. Footer (bg black)
Logo + "50FIVESTARGELS" (Bayon cream) left; right: "© 2026 · Prices are estimates — check them against your own shop." (Inter 13px, cream 70%).

## Interactions & Behavior
- All layout containers: `max-width: 1280px`, gutter `clamp(1rem, 4vw, 3rem)`.
- Hover transitions 160–180ms ease. No entrance animations on content.
- Gate state machine: `bounces` (int), `entered` (bool), `unmounted` (bool). Bounce click ignored once entered.
- Anchor links in nav scroll to section ids.

## State Management
Entry-gate only: bounce count, entered flag, unmount-after-transition (750ms timeout). Everything else static.

## Assets
- `assets/trainers.png` — hero trainers illustration (user-supplied, final). PNG on white; use `mix-blend-mode: multiply` on cream.
- `assets/logo-star.svg` — brand star mark.
- Gel-packet SVG — inline in the v3 file (gate section); copy verbatim.
- Fonts: Bayon + Inter from Google Fonts (both free). Note: the reference site uses Neue Montreal (paid) for body; Inter is the sanctioned substitute unless a license is bought.

## Files
- `50FiveStarGels Home v3.dc.html` — FINAL design (implement this)
- `50FiveStarGels Home v2.dc.html` — earlier art direction, reference only
- `dontboardme-palette-brief.md` — palette/type extraction the V3 design is built on
- `assets/trainers.png`, `assets/logo-star.svg`
- `CLAUDE-CODE-PROMPT.md` — paste-ready kickoff prompt
