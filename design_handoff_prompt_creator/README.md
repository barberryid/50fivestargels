# Handoff: AI Race Fuel Prompt Generator — redesign

## Overview
A usability redesign of the prompt generator at `/ai-race-fuel-prompt-generator/`. The tool lets a runner answer a short questionnaire (goal, event, body stats, preferences) and copy a live-generated prompt into Claude / ChatGPT. The redesign's core change: the prompt lives in a **sticky right-hand panel** so it — and the Copy button — stay visible while the user changes answers, instead of sitting below the fold.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype showing intended look and behaviour, not production code to copy directly. Your task is to **recreate this design in the target codebase** — the Astro + Tailwind site (sibling of `50fivestarhotels`) — using its established patterns. The Tailwind config should already map the brand tokens (`clay`, `forest`, `gold`, `cream`, `sand`, `tag-bg`, `ink`, `muted`, `clay-text`; `font-display` / `font-serif` / `font-ui`); build against those, not raw hex. The interactive logic is small enough for a single vanilla `<script>` or a small island component.

- `AI Race Fuel Prompt Creator.dc.html` — the prototype (template + logic in one file). The `<x-dc>` template body shows exact markup/inline styles; the `class Component` script contains the full prompt-building logic to port verbatim.
- `_ds/…/tokens/*.css`, `styles.css` — the design tokens the prototype reads.

## Fidelity
**High-fidelity.** Colours, type, spacing, radii, shadows and copy are final. Recreate pixel-perfectly using the codebase's Tailwind token classes.

## Screen: Prompt generator page

### Page frame
- Page background: cream `#fdfaf3`; text ink `#15201d`; UI font Inter.
- Content: max-width `1280px`, centred, padding `56px clamp(16px,4vw,48px) 96px`.
- Header (max-width 680px, column, gap 16px):
  - Eyebrow: "AI RACE FUEL · PROMPT GENERATOR" — Inter 800, 12px, letter-spacing 0.18em, uppercase, clay-text `#8d3f1f`.
  - H1: "Build your fuelling prompt" — Playfair Display 600, `clamp(34px,4.5vw,52px)`, line-height 1.05, letter-spacing −0.025em.
  - Sub: Source Serif 4, 18px, line-height 1.7, muted `#5c6762`.
- Main grid: `grid-template-columns: minmax(0,1fr) 420px; gap: 48px; align-items: start`. (Add a single-column stack under ~1024px — prompt panel moves below the form; not in the prototype.)
- Footer note under the grid: 48px top margin, 20px top padding, 1px sand `#ddd6c4` top border, Source Serif 14px muted: "Whatever your AI suggests is a starting point to test in training — never race on something new."

### Left column — form (column, gap 44px)
Each step section has a header: eyebrow (Inter 800, 12px, 0.18em tracking, uppercase, `#8d3f1f`) + optional helper line (Source Serif 15px, muted), with `border-bottom: 1px solid #ddd6c4; padding-bottom: 12px`.

**Step 1 · What should the AI do?** — helper: "Pick one task. The prompt is rebuilt around it."
- Grid: `repeat(auto-fill, minmax(240px,1fr))`, gap 12px. Six goal cards (real `<button>`s, `aria-pressed`):
  1. Find gels I can buy in my country — "Current availability and prices where you live, ranked by cost per gram of carb."
  2. Compare commercial gels vs DIY — "An honest buy/make/both comparison for your training and racing."
  3. Build my marathon fuelling plan — "Carb loading, race morning, per-hour intake and contingencies."
  4. Build my HYROX fuelling plan — "Pre-race-first plan — most races need little or nothing mid-race."
  5. Troubleshoot stomach problems — "Work through GI issues with your fuelling, step by step."
  6. Create my race-day checklist — "A T-3h-to-finish fuelling checklist you can print."
- Card: column, gap 8px, text-align left, padding `16px 18px`, radius 14px.
  - Unselected: `1px solid #ddd6c4`, white bg, shadow `0 2px 8px rgba(21,32,29,0.05)`.
  - Selected: `1.5px solid #b85832`, tag-bg `#f5f0e6`, shadow `0 6px 18px rgba(21,32,29,0.10)`.
  - Title row: Inter 700 15px ink + a radio dot top-right (16px circle, white fill; unselected `1.5px solid #cdc4ad`; selected `5px solid #b85832` — reads as a filled radio).
  - Description: Source Serif 14px, line-height 1.55, muted.
  - Transition 160ms ease on border/shadow/background.

**Step 2 · You and your event** — helper: "Picking an event fills in a sensible duration — adjust anything."
- Event chips (wrap, gap 8px): Half marathon / Marathon / HYROX / Long training run / Custom. Pill buttons: padding `9px 16px`, radius 999px, Inter 600 13.5px. Unselected: white bg, sand border, ink text. Selected: clay `#b85832` bg + border, cream text. Selecting an event sets duration: half 105, marathon 240, HYROX 90, long run 120; Custom leaves it unchanged.
- Field grid: `repeat(auto-fill, minmax(190px,1fr))`, gap 16px.
  - Field label: Inter 800, 11px, 0.14em tracking, uppercase, muted; gap 7px above control.
  - Inputs/selects: padding `11px 14px`, `1px solid #ddd6c4`, radius 10px, white bg, Source Serif 16px ink. Focus: 2px clay outline, offset 1px.
  - Number inputs have an absolutely-positioned unit suffix inside the field, right 14px, 12px muted: "min", "kg" (or "lb"), "g/h".
  - Fields: Expected duration (number, 20–1440, default 240) · Bodyweight (number, 30–180, default 70) · Target carbs (number, 20–130 step 5, default 60) · Sweat level (select: "Low — barely salty" / "Medium" / "High — salt-crusted kit", default Medium).

**Step 3 · Your preferences**
- Same field grid: Country (text, placeholder "e.g. Ireland") · Budget (select: Budget-focused / Balanced / Price is no object) · Commercial vs DIY (select: Open to both / Commercial products only / DIY : homemade only) · Fuel carrier (select: Bottles (drink mix) / Gels in pockets / belt / Hydration vest / Whatever the course hands out).
- Conditional hint under Country, shown only when goal = "Find gels" AND country is empty: Source Serif 13px in `#8d3f1f` — "Needed for local availability and prices — the AI can only rank what you can buy."
- Toggle chips row (same pill style as event chips, act as toggles with `aria-pressed`): "Sensitive stomach", "I use caffeine". Both default off.

### Right column — sticky prompt panel
- `position: sticky; top: 24px`. White card, `1px solid #ddd6c4`, radius 16px, shadow `0 10px 30px rgba(21,32,29,0.08)`, `overflow: hidden`.
- Header row (padding `18px 20px`, sand bottom border): eyebrow "YOUR PROMPT" (clay-text) left; right, a live indicator — 7px forest `#1f4c3b` dot + "Updates live" in Inter 600 12px forest.
- Prompt body: `<pre>` on tag-bg `#f5f0e6`, padding 20px, monospace stack (`'SF Mono', ui-monospace, Menlo, Consolas`), 12.5px, line-height 1.65, colour `#283531`, `white-space: pre-wrap`, `max-height: 56vh`, scrollable.
- Footer (padding `18px 20px`, sand top border, column gap 10px):
  - Full-width primary button — clay bg, cream text, radius 10px (the site's standard primary button). Label "Copy prompt"; after copying shows "Copied — paste it into your AI" for 2s.
  - Centred caption: Source Serif 13px muted — "{N} words · paste into Claude, ChatGPT or any assistant".

## Interactions & Behavior
- Every control change rebuilds the prompt immediately (pure function of state) and resets the copied flag.
- Copy: `navigator.clipboard.writeText`, with a hidden-textarea `execCommand('copy')` fallback; success sets copied state, auto-reverts after 2000ms.
- Hovers: 160ms ease transitions; cards lift shadow; primary button darkens to `#a64c29`.
- No entrance animations, no parallax.
- Goal cards and toggle chips are `<button>` elements with `aria-pressed` — keyboard accessible by default.

## State Management
State: `goal` ("find" | "compare" | "marathonPlan" | "hyroxPlan" | "troubleshoot" | "checklist", default "find"), `event` (default "marathon"), `duration` (240), `bodyweight` (70), `carbs` (60), `sweat` ("low"|"medium"|"high", default "medium"), `country` (""), `budget` ("budget"|"balanced"|"premium"), `diy` ("both"|"commercial"|"diy"), `carrier` ("bottles"|"gels"|"vest"|"course"), `sensitiveStomach` (false), `caffeine` (false), `copied` (false).

### Prompt template
Port `buildPrompt()` from the prototype's `class Component` script verbatim. Structure:
1. **Goal-specific intro** — one block per goal ("Find energy gels and carbohydrate drink mixes I can actually buy in {country} right now." + an "I want:" bullet list; see the script for all six).
2. **Profile block** — "My profile:" with sport/event (~duration min), bodyweight, target carbs g/hour, sweat level with sodium target (low ~400 / medium ~650 / high ~900 mg/hour), sensitive stomach, caffeine, country (falls back to "my country"), budget, commercial-vs-DIY preference, fuel carrier.
3. **Closing line** — "Be specific and honest. Name real products and real prices where relevant. If something in my profile is a bad idea, say so."

## Design Tokens
Colours: cream `#fdfaf3`, ink `#15201d`, body `#283531`, muted `#5c6762`, clay `#b85832` (hover `#a64c29`), clay-text `#8d3f1f`, forest `#1f4c3b`, sand `#ddd6c4`, border-strong `#cdc4ad`, tag-bg `#f5f0e6`. Full sets in `_ds/…/tokens/`.
Type: Playfair Display 600 (display), Source Serif 4 (reading/values), Inter (UI/labels/eyebrows).
Radii: 999px pills · 16px panel · 14px goal cards · 10px inputs/buttons.
Shadows: card `0 2px 8px rgba(21,32,29,0.05)` · raised `0 6px 18px rgba(21,32,29,0.10)` · panel `0 10px 30px rgba(21,32,29,0.08)`.
Motion: 160ms ease on background/border/shadow only.

## Assets
None — no images or icon fonts. The only glyph-like element is the 7px forest "live" dot (a styled span).

## Files
- `AI Race Fuel Prompt Creator.dc.html` — full prototype: markup with exact inline styles + the state/prompt logic.
- `_ds/50-difficult-places-design-system-4bbe86f8-1038-4e4f-a14c-6179651cdec6/` — token CSS (`tokens/colors.css`, `typography.css`, `spacing.css`, `fonts.css`), `styles.css`, and the component bundle the prototype loads.
