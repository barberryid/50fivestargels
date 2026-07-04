# Design Brief: V2 Color & Type System (sourced from dontboardme.com)

Extracted directly from the live site's computed styles (not guessed from screenshots). Assumption: this feeds a "V2" restyle of the 50FiveStarGels site. Redirect me if the target is something else.

## 1. Color palette

| Role | Hex | RGB | Where it's used on dontboardme.com |
|---|---|---|---|
| Background (primary cream) | `#F3F3E9` | 243,243,233 | Main page/content background |
| Background (secondary cream) | `#F6F6ED` | 246,246,237 | Alt section background |
| Off-white | `#F3F0EF` | 243,240,239 | Card/panel background |
| Brand red (primary accent) | `#E33529` | 227,53,41 | Headlines, nav links, buttons, icon circles |
| Slate teal (secondary accent) | `#2B6786` | 43,103,134 | Secondary headings, alt section accents |
| Teal, lighter | `#5B93B0` | 91,147,176 | Secondary section backgrounds |
| Black | `#000000` | 0,0,0 | Line illustrations, base text |
| Blush pink | `#F4CED3` | 244,206,211 | Decorative section background |
| Pink | `#F0B5BE` | 240,181,190 | Decorative section background |
| Rose | `#F3C3CB` | 243,195,203 | Decorative section background |
| Rose, muted | `#EDE2E2` | 237,226,226 | Decorative section background |
| Pink, deep | `#F6D2D8` | 246,210,216 | Decorative section background |
| Lavender | `#EAD9EC` | 234,217,236 | Decorative section background |
| Purple | `#EACDEF` | 234,205,239 | Decorative section background |
| Purple, deep | `#D8B3DF` | 216,179,223 | Decorative section background |
| Sky blue | `#AFD8FB` | 175,216,251 | Decorative section background |

**Pattern:** one cream base, one dominant red accent, one teal secondary accent, everything else is a rotating set of soft pastel tints used purely as flat background fills behind cards/sections (not on text). Text is always black or brand red; pastels never carry text.

## 2. Typography

Confirmed via `document.fonts` (only two families load on the page):

- **Display / heading font: Bayon** (weight 300 file, renders as a bold ultra-condensed grotesque). Free on Google Fonts. Used for: hero headline, nav labels, section headings, even oversized pull-quote body text. Always uppercase, negative letter-spacing (roughly -2% of font size), tight line-height (~78% of font size).
- **UI / body font: Neue Montreal**, weight 500. Used for: buttons, small paragraph copy, labels. This is a paid font (Pangram Pangram Foundry) — free for personal use only, needs a commercial license for production use. If licensing isn't in place, closest free substitutes: **General Sans** or **Switzer** (both Indian Type Foundry-adjacent, similarly geometric/humanist), or **Inter**.

**Type usage rules observed:**
- Headlines and nav: Bayon, uppercase, red or black.
- Buttons: Neue Montreal (or substitute), medium weight, uppercase, smaller size (~14–15px), on a solid red pill shape (fully rounded, no border-radius on the text element itself — the pill is the button, cream/white text).
- No italics, no serif anywhere.

## 3. Instructions for building V2 with this system

1. **Update Tailwind v4 theme tokens** in `src/styles/global.css` under `@theme`. Add/replace color tokens:
   ```css
   @theme {
     --color-cream: #F3F3E9;
     --color-cream-alt: #F6F6ED;
     --color-brand-red: #E33529;
     --color-brand-teal: #2B6786;
     --color-brand-teal-light: #5B93B0;
     --color-ink: #000000;
     /* pastel accent set — background fills only, never text */
     --color-tint-pink: #F4CED3;
     --color-tint-rose: #F3C3CB;
     --color-tint-lavender: #EAD9EC;
     --color-tint-purple: #EACDEF;
     --color-tint-sky: #AFD8FB;
   }
   ```
2. **Load fonts**: self-host or `@font-face` Bayon (Google Fonts, free) and Neue Montreal (only if licensed — otherwise swap in General Sans/Switzer/Inter as `--font-display: "Bayon", sans-serif;` and `--font-body: "Neue Montreal", sans-serif;`).
3. **Headings (h1–h3, hero copy)**: uppercase, `--font-display`, `letter-spacing: -0.02em`, `line-height: 0.8`, color `--color-brand-red` (primary) or `--color-ink` (secondary emphasis).
4. **Buttons**: fully-rounded pill (`border-radius: 9999px`), solid `--color-brand-red` fill, cream text, `--font-body` medium weight, uppercase, no default browser radius.
5. **Section backgrounds**: alternate between `--color-cream` and one pastel tint per section for visual rhythm — never put body text directly on a pastel tint without checking contrast; keep text black or red.
6. **Illustration style cue**: flat black line-art with a single red detail line as an accent (seen in the hero dog/leash graphic) — if commissioning new graphics for the calculator or guide pages, match this two-tone (black line + one red highlight) treatment rather than full color illustration.
7. **Body copy**: `--font-body`, sentence case (not uppercase), black or dark ink — reserve uppercase treatment for Bayon/display elements only, don't apply it to running paragraph text.

## 4. Open questions before implementation

- Confirm whether Neue Montreal is actually licensed for this project, or whether to standardize on a free substitute from the start.
- Confirm which pages/components should get restyled first (homepage hero, calculator island, or guides) since this is described as a "second version" rather than a full site-wide cutover.
