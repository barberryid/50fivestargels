# 50FiveStarGels — Project Brief (V1, revised)

*A tool-led endurance-fuelling site for runners and HYROX athletes. The calculator that shows whether you should **buy gels, make your own mix, or use both** — for marathon, half marathon, HYROX and long training.*

---

## 1. Positioning

**Homepage hook:**
> **Stop overpaying for race fuel.**
> Compare gels by cost per gram of carbohydrate, calculate your own DIY race mix, and generate a personalised AI fuelling prompt for marathon, half marathon, HYROX and long training.

**The core user question** is not "what's the best gel?" (that market is saturated by Runner's World, Cyclingnews, etc., and a new domain won't outrank them in year one). It's: *"What's the cheapest reliable way to hit my carbohydrate, sodium and caffeine targets for this race or training block?"* The site answers that with tooling people bookmark and share, not with another roundup.

**Editorial stance:** practical, evidence-informed, cost-conscious. Simple enough for amateurs, accurate enough for serious runners. Commercial gels are useful for race day; many athletes save real money making simple maltodextrin/fructose/sodium mixes for training. Every DIY formula is a *training-tested starting point* — never medical advice, never a race-day experiment.

**Brand family:** sister site to 50FiveStarHotels, under the 50FiveStar umbrella. Visible product name: **Race Fuel Cost Calculator**.

**Project type:** portfolio / learning build. Ship the calculator first; add the prompt generator, then guides, then the commercial dataset. Do not build a big SEO page tree on a brand-new domain up front.

---

## 2. The three differentiators (do not lose these)

The DIY-calculator space already has competent players (beetrootpro, nickwalker.us, theinstant.cc, dualfuel.uk). V1 wins by combining three things none of them do together:

1. **Money, made concrete** — cost per gram of carbohydrate *and* a **training-block savings estimate** ("what this costs you over 12 weeks"). This is the emotional hook that turns an abstract metric into a reason to share the site.
2. **The buy/make/both decision** — the calculator directly compares DIY mixes against commercial gels, instead of only spitting out a recipe.
3. **An honest gut-load warning** — a concentration guardrail (see §4) presented as an *estimate*, not a lab reading. This is the credibility feature serious runners notice; the honesty about its limits is what keeps it credible.

---

## 3. The fuelling science to hard-code

### Carbohydrate targets (finer than a single wide band)
| Use case | Default target | Advanced note |
|---|---:|---|
| Under 60 min | 0–20 g/h | Usually not needed unless fasted or back-to-back sessions |
| 60–120 min | 30–45 g/h | Half marathon — depends on speed and tolerance |
| 120–150 min | 45–60 g/h | Useful bridge zone |
| 150+ min | 60–90 g/h | Marathon default |
| Gut-trained, long events | 90–120 g/h | Advanced only — build up in training |

Rationale: a 65-minute HYROX and a 2:25 half marathon should not get the same default. The literature supports ~30–60 g/h for moderate-duration work and 60–90 g/h for longer events, with glucose:fructose mixes enabling the higher intakes.

### Carbohydrate ratio (glucose : fructose)
- **Simple / default: 2:1** maltodextrin:fructose — gentler on an untrained gut, less sickly-sweet.
- **Advanced / high-carb: ~1:0.8 (1.25:1)** — modern high-performance ratio; unlocks 90 g/h+ because glucose and fructose use separate intestinal transporters (SGLT1 vs GLUT5). Label it "gut-trained — build up to this in training."

### Sodium
- Working range **400–900 mg/h**; higher end for heavy sweaters and hot/indoor-warm venues.
- Sodium citrate (gentler taste) or table salt.

### Caffeine — kept out of the default
- Guidance only: **3–6 mg/kg** bodyweight, ~30–60 min before, tested in training. Never a casual caffeine-powder recipe in the calculator. Warning-only advanced note.

---

## 4. The gut-load / concentration guardrail (renamed, softened, honest)

**Do not call this "osmolality."** Exact osmolality can't be computed cleanly from consumer ingredients — maltodextrin varies by DE value / polymer length, sodium citrate dissociation isn't intuitive, and real mixing volumes vary. Calling it a lab measurement would be a false-precision claim.

**Call it:** *Estimated gut-load* or *Concentration warning*.

**Copy to use:**
> This is an estimate, not a lab osmolality test. The calculator uses carbohydrate concentration, ingredient type and sodium level to flag whether your mix is likely to behave like a normal drink, a concentrated syrup, or a gel that should be chased with water.

**Traffic light:**
- **Green — drink mix:** dilute / near-isotonic; drink normally.
- **Amber — concentrated:** sip gradually; test carefully.
- **Red — gel/syrup territory:** chase with plain water.

**The maltodextrin point (surface it):** maltodextrin is a glucose polymer, so it delivers a lot of carbohydrate with fewer osmotically-active particles and less sweetness than a sugar-only mix. That's why a maltodextrin-heavy mix can carry more carb at a lower "gut cost" — but the tool presents this as an approximation, not a guarantee.

---

## 5. The HYROX angle (honest — it builds trust)

Credible HYROX sources converge: most races run 60–90 minutes, and under ~75 minutes athletes generally don't need mid-race gels — the win is pre-race carb loading and the race-morning routine. Mid-race gels are *optional* and can trigger GI issues because heart rate spikes repeatedly across stations.

**HYROX calculator mode outputs by expected finish time:**
- **Sub-60 min:** pre-race fuelling only; no mid-race gel by default.
- **60–75 min:** optional pre-start gel or carb drink; mid-race usually optional.
- **75–100 min:** one gel / carb-drink strategy during the runs.
- **100+ min:** treat like endurance-race fuelling.

Plus the race-day timeline: T-3h high-carb low-fibre meal, T-1h carb snack, T-30min top-up (+ optional caffeine 3–6 mg/kg if tolerated), fluids 400–700 ml/h and sodium 400–900 mg/h for heavy sweaters in warm venues. Being the site that tells HYROX athletes "you may not need to buy anything mid-race" is exactly the posture that makes people trust the marathon advice.

---

## 6. V1 scope — phased

### V1.0 — Calculator only (build this first)
- Homepage
- **Race Fuel Cost Calculator** (see §7)
- Cost-per-carb explainer
- Disclaimer
- About

### V1.1 — Prompt generator
- Questionnaire → copy-paste prompt, with prompt templates by sport (see §8)

### V1.2 — Guide pages
- Marathon / half-marathon fuelling
- HYROX fuelling (the pre-race-first plan above)

### Phase 2 — Commercial dataset (support feature, not the initial build)
See §9. Lights up calculator "mode 3" and later roundups.

---

## 7. Race Fuel Cost Calculator (the hero)

**Modes:**
1. **DIY bottle mix**
2. **DIY soft-flask syrup**
3. **Commercial gel comparison** *(requires the §9 dataset — designed in now, activated in phase 2)*

**Inputs:** race type preset (half / full / HYROX / long training) or custom duration; bodyweight; sweat level (low/med/high); carb ratio (Simple 2:1 / Advanced 1:0.8); container; optional carbs/hour override.

**Per-serving outputs:**
- Exact grams: maltodextrin, fructose, salt or sodium citrate, water
- Carbs/hour delivered + total carbs
- **Cost per gram of carbohydrate** (editable ingredient prices → works in any country/currency)
- **Estimated gut-load traffic light** (§4)
- Grams first; teaspoons as convenience; "buy a cheap kitchen scale" nudge

**Training-block savings output (the killer feature):**
```
Your fuelling target:            60 g carbs/hour
Fuelled sessions per week:       2
Average fuelled duration:        90 minutes
Training block:                  12 weeks

Commercial gels estimate:        €___
DIY mix estimate:                €___
Estimated saving:                €___
```

**Three trust blocks under every result:**
1. **Why this formula?** — plain-language note on maltodextrin, fructose, sodium, water.
2. **What could go wrong?** — GI upset, too concentrated, too much sodium, caffeine sensitivity, not enough water.
3. **How to test it** — start at a lower carb target, try it on easy long runs, log stomach comfort, build up. Never new on race day.

**"Commercial gels still have a role" panel (keeps the site from sounding anti-gel):**
- *DIY is best for:* regular training, long runs, cost control, bottle-based fuelling, custom sodium/carb targets.
- *Commercial gels are best for:* race-day convenience, travel, aid-station simplicity, measured caffeine, known texture/tolerance, no mixing.

**URL-shareable results:** encode inputs in query params so a result can be sent to someone, e.g.
```
/running-gel-cost-calculator/?sport=marathon&duration=240&carbs=60&ratio=2-1&bottle=500
```
Better than localStorage for V1 and better for portfolio/sharing.

---

## 8. AI Prompt Generator (a visible product, not a footnote)

Questionnaire (sport, duration, weight, target carbs/hr, sweat, sensitive stomach, caffeine, country, budget, commercial-vs-DIY, container) → copy-paste prompt. Surface it as several prompt types:

1. Find gels I can buy in my country
2. Compare commercial gels vs DIY
3. Build my marathon fuelling plan
4. Build my HYROX fuelling plan
5. Troubleshoot stomach problems
6. Create my race-day checklist

**Structured instructions baked into the generated prompt:**
```
Search current availability and prices in [country].
Rank products by price per gram of carbohydrate.
Show carbs, sodium, caffeine, serving size, and cost per 60g carbs.
Separate race-day convenience from training-cost value.
Include DIY alternatives using maltodextrin, fructose and sodium citrate.
Do not recommend caffeine powder recipes.
Treat all plans as starting points to test in training.
```

This is the freshness mechanism: your site's data stays timeless while the user's AI fetches current, country-aware prices — no price-maintenance treadmill.

---

## 9. Commercial dataset (phase 2 spec)

Start with **20–30 products** (≈10 USA, 10 UK, 10 EU/Schengen). Per product:
```
Brand · Product · Carbs/serving · Sodium · Caffeine · Serving size
Typical price · Cost per 30g / 60g / 90g carbs · Region availability · Last checked
```
**Do not rank "best overall."** Rank by use case: cheapest race-day gel · best high-carb option · best caffeine-free · best soft-flask alternative · best sensitive-stomach candidate · best widely available. Static JSON/TS, no database.

---

## 10. Tech (matches your confirmed stack)

**Stack:** GitHub + Git Bash · **Astro** · **Cloudflare Pages** · **Tailwind CSS v4** — same workflow as 50FiveStarHotels.

**Architecture:** Astro static pages for SEO + speed, with **React islands** only where interactivity is needed (the calculator and the prompt generator). Everything else is static.
```
Astro (static pages, SEO)
 ├─ React island: Race Fuel Cost Calculator
 ├─ React island: AI Prompt Generator
 ├─ Tailwind CSS v4
 ├─ static defaults.ts (starter assumptions, ingredient price defaults)
 └─ Cloudflare Pages (no backend in V1)
```
- No database. Editable ingredient-price fields + a small static `defaults.ts`.
- New repo/folder alongside the hotels project; same Cloudflare Pages deploy flow.

---

## 11. Site structure (V1) — one canonical calculator, not five

Avoid keyword-cannibalising near-duplicate calculator URLs. Use **one** calculator page (best-intent slug) with mode/preset switches and URL params; marathon/HYROX are *presets on that page*, not separate ranking targets.
```
/                                  Homepage — "Stop overpaying for race fuel"
/running-gel-cost-calculator/      Hero: Race Fuel Cost Calculator (modes + presets via params)
/ai-race-fuel-prompt-generator/    Questionnaire → prompt
/marathon-gel-guide/               Marathon + half fuelling
/hyrox-gel-guide/                  HYROX pre-race-first plan
/commercial-gels-vs-diy-race-mix/  The buy/make/both explainer
/about/                            Light personal story
/disclaimer/                       Safety + medical caveats
```
Primary SEO target: **`/running-gel-cost-calculator/`** — captures the unique value better than "DIY gel calculator."

---

## 12. Safety & responsibility (non-negotiable)

- Caffeine stays out of the default calculator (warning-only; 3–6 mg/kg note; "test in training").
- Every recipe = **training-tested starting point**: start lower, test in training, adjust for gut comfort and weather, never new on race day.
- Brief practical medical caveats: diabetes / glucose control, kidney disease / high BP / sodium restriction, caffeine sensitivity or heart-rhythm issues, GI distress, heat-illness risk, allergies/intolerances.
- **Language:** use "best for…", "good starting point", "cheapest per gram of carb", "popular high-carb option", "available in…". Avoid "scientifically proven best", "optimal", "guaranteed", "no stomach problems".

---

## 13. Personal angle (light)

Mostly tool-like and neutral; story lives on About and low on the homepage.
> "I built this because I was going through a lot of gels in HYROX and endurance training and wanted a clearer, cheaper way to compare commercial gels with DIY carb mixes."

---

## 14. Portfolio goals (what this build demonstrates)

Interactive calculator design · applied sports-science logic · cost-comparison UX · prompt-generation UX · SEO-friendly static architecture (Astro islands) · responsible health-advice framing · clean data modelling. These make the project valuable even before traffic arrives.

---

## 15. Build order

1. **Race Fuel Cost Calculator** (React island): DIY modes, cost-per-carb, training-block savings, gut-load traffic light, three trust blocks, URL-shareable params.
2. **AI Prompt Generator** (React island): questionnaire → six prompt templates → copy to clipboard.
3. Homepage wrapper ("Stop overpaying for race fuel") with two boxes.
4. Marathon/half + HYROX guide pages.
5. About + Disclaimer.
6. *Phase 2:* commercial dataset → activate calculator mode 3 → use-case roundups.
