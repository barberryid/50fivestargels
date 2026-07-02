// Race Fuel Cost Calculator — the only React island on the site (brief §10).
// All maths lives in src/lib/fuelMath.ts; this file is state + presentation.
import { useEffect, useMemo, useState } from 'react';
import {
  BOTTLE_SIZES_ML,
  DEFAULT_PRICES,
  FLASK_SIZES_ML,
  RATIOS,
  SAVINGS_DEFAULTS,
  SODIUM_BY_SWEAT,
  SODIUM_FORMS,
  SPORT_PRESETS,
  TSP_GRAMS,
  defaultCarbsPerHour,
  type RatioKey,
  type SodiumForm,
  type SportKey,
  type SweatLevel,
} from '../../data/defaults';
import {
  computeRecipe,
  computeSavings,
  round,
  type GutLoadLevel,
  type Prices,
} from '../../lib/fuelMath';

type Mode = 'bottle' | 'syrup';

interface CalcState {
  mode: Mode;
  sport: SportKey;
  durationMin: number;
  weightKg: number;
  sweat: SweatLevel;
  ratio: RatioKey;
  sodiumForm: SodiumForm;
  bottleMl: number;
  flaskMl: number;
  flaskCount: number;
  carbsOverride: number | null;
  sessionsPerWeek: number;
  avgSessionMin: number;
  weeks: number;
  prices: Prices;
}

const INITIAL: CalcState = {
  mode: 'bottle',
  sport: 'marathon',
  durationMin: SPORT_PRESETS.marathon.durationMin,
  weightKg: 70,
  sweat: 'medium',
  ratio: 'simple',
  sodiumForm: 'salt',
  bottleMl: 500,
  flaskMl: 150,
  flaskCount: 1,
  carbsOverride: null,
  sessionsPerWeek: SAVINGS_DEFAULTS.sessionsPerWeek,
  avgSessionMin: SAVINGS_DEFAULTS.avgSessionMin,
  weeks: SAVINGS_DEFAULTS.weeks,
  prices: { ...DEFAULT_PRICES },
};

const RATIO_PARAM: Record<RatioKey, string> = { simple: '2-1', advanced: '1-08' };

const GUT_COPY: Record<GutLoadLevel, { chip: string; label: string; advice: string }> = {
  green: {
    chip: 'bg-green-soft border-green text-green',
    label: 'Green — drink mix',
    advice: 'Dilute / near-isotonic. Drink normally.',
  },
  amber: {
    chip: 'bg-amber-soft border-amber text-amber',
    label: 'Amber — concentrated',
    advice: 'Sip gradually; test carefully in training first.',
  },
  red: {
    chip: 'bg-red-soft border-red text-red',
    label: 'Red — gel / syrup territory',
    advice: 'Chase every dose with plain water.',
  },
};

const num = (v: string | null): number | null => {
  if (v === null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

function parseParams(search: string): Partial<CalcState> {
  const q = new URLSearchParams(search);
  const out: Partial<CalcState> = {};
  const mode = q.get('mode');
  if (mode === 'bottle' || mode === 'syrup') out.mode = mode;
  const sport = q.get('sport');
  if (sport && (sport === 'custom' || sport in SPORT_PRESETS)) out.sport = sport as SportKey;
  const duration = num(q.get('duration'));
  if (duration) out.durationMin = Math.min(duration, 1440);
  const carbs = num(q.get('carbs'));
  if (carbs) out.carbsOverride = Math.min(carbs, 150);
  const ratio = q.get('ratio');
  if (ratio === '2-1') out.ratio = 'simple';
  if (ratio === '1-08') out.ratio = 'advanced';
  const bottle = num(q.get('bottle'));
  if (bottle) out.bottleMl = bottle;
  const flask = num(q.get('flask'));
  if (flask) out.flaskMl = flask;
  const flasks = num(q.get('flasks'));
  if (flasks) out.flaskCount = Math.min(Math.round(flasks), 8);
  const sweat = q.get('sweat');
  if (sweat === 'low' || sweat === 'medium' || sweat === 'high') out.sweat = sweat;
  const sodium = q.get('sodium');
  if (sodium === 'salt' || sodium === 'citrate') out.sodiumForm = sodium;
  const weight = num(q.get('weight'));
  if (weight) out.weightKg = Math.min(weight, 200);
  const spw = num(q.get('spw'));
  if (spw) out.sessionsPerWeek = Math.min(Math.round(spw), 14);
  const avg = num(q.get('avg'));
  if (avg) out.avgSessionMin = Math.min(avg, 600);
  const weeks = num(q.get('weeks'));
  if (weeks) out.weeks = Math.min(Math.round(weeks), 52);
  return out;
}

function buildParams(s: CalcState, carbsPerHour: number): string {
  const q = new URLSearchParams({
    mode: s.mode,
    sport: s.sport,
    duration: String(s.durationMin),
    carbs: String(carbsPerHour),
    ratio: RATIO_PARAM[s.ratio],
    sweat: s.sweat,
    sodium: s.sodiumForm,
    weight: String(s.weightKg),
    spw: String(s.sessionsPerWeek),
    avg: String(s.avgSessionMin),
    weeks: String(s.weeks),
  });
  if (s.mode === 'bottle') q.set('bottle', String(s.bottleMl));
  else {
    q.set('flask', String(s.flaskMl));
    q.set('flasks', String(s.flaskCount));
  }
  return q.toString();
}

const labelCls = 'block font-sans text-[11px] font-extrabold uppercase tracking-[0.12em] text-text-muted mb-1';
const inputCls =
  'w-full rounded-lg border border-border bg-white px-3 py-2 font-sans text-sm text-text';
const chipCls = (active: boolean) =>
  `rounded-full border px-3.5 py-2 font-sans text-[13px] font-bold transition-colors ${
    active
      ? 'border-accent bg-accent text-white'
      : 'border-border bg-white text-text-muted hover:border-accent-deep hover:text-text'
  }`;

export default function RaceFuelCalculator() {
  const [state, setState] = useState<CalcState>(INITIAL);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const patch = (p: Partial<CalcState>) => setState((s) => ({ ...s, ...p }));
  const patchPrices = (p: Partial<Prices>) =>
    setState((s) => ({ ...s, prices: { ...s.prices, ...p } }));

  useEffect(() => {
    setState((s) => ({ ...s, ...parseParams(window.location.search) }));
    setReady(true);
  }, []);

  const carbsPerHour = state.carbsOverride ?? defaultCarbsPerHour(state.durationMin);

  useEffect(() => {
    if (!ready) return;
    const url = `${window.location.pathname}?${buildParams(state, carbsPerHour)}`;
    window.history.replaceState(null, '', url);
  }, [state, ready, carbsPerHour]);

  const recipe = useMemo(
    () =>
      computeRecipe({
        mode: state.mode,
        durationMin: state.durationMin,
        carbsPerHour,
        ratio: state.ratio,
        sweat: state.sweat,
        sodiumForm: state.sodiumForm,
        bottleMl: state.bottleMl,
        flaskMl: state.flaskMl,
        flaskCount: state.flaskCount,
        prices: state.prices,
      }),
    [state, carbsPerHour]
  );

  const savings = useMemo(
    () =>
      computeSavings(carbsPerHour, recipe.costPerGramCarb, state.prices, {
        sessionsPerWeek: state.sessionsPerWeek,
        avgSessionMin: state.avgSessionMin,
        weeks: state.weeks,
      }),
    [carbsPerHour, recipe.costPerGramCarb, state]
  );

  const cur = state.prices.currency;
  const money = (v: number) => `${cur}${v.toFixed(2)}`;
  const gut = GUT_COPY[recipe.gutLoad];
  const sodiumG = TSP_GRAMS[state.sodiumForm];
  const hyroxNote =
    state.sport === 'hyrox'
      ? state.durationMin < 60
        ? 'Expected sub-60: pre-race fuelling is the whole game — no mid-race gel by default.'
        : state.durationMin <= 75
          ? 'At 60–75 min, an optional pre-start gel or carb drink usually covers it; mid-race fuel is optional.'
          : state.durationMin <= 100
            ? 'At 75–100 min, one gel or carb-drink moment during the runs is a reasonable starting point.'
            : 'Over 100 min, fuel it like an endurance race.'
      : null;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the URL bar already has the params */
    }
  };

  return (
    <div className="fuel-card mt-8 p-5 sm:p-7">
      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Calculator mode">
        <button
          type="button"
          role="tab"
          aria-selected={state.mode === 'bottle'}
          className={chipCls(state.mode === 'bottle')}
          onClick={() => patch({ mode: 'bottle' })}
        >
          DIY bottle mix
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={state.mode === 'syrup'}
          className={chipCls(state.mode === 'syrup')}
          onClick={() => patch({ mode: 'syrup' })}
        >
          DIY soft-flask syrup
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={false}
          disabled
          className="cursor-not-allowed rounded-full border border-border bg-bg-soft px-3.5 py-2 font-sans text-[13px] font-bold text-text-muted opacity-70"
          title="Commercial gel comparison is coming in phase 2"
        >
          Commercial gel comparison — coming soon
        </button>
      </div>

      {/* Presets */}
      <div className="mt-5">
        <span className={labelCls}>Race / session preset</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SPORT_PRESETS) as Array<keyof typeof SPORT_PRESETS>).map((key) => (
            <button
              key={key}
              type="button"
              className={chipCls(state.sport === key)}
              onClick={() =>
                patch({ sport: key, durationMin: SPORT_PRESETS[key].durationMin, carbsOverride: null })
              }
            >
              {SPORT_PRESETS[key].label}
            </button>
          ))}
          <button type="button" className={chipCls(state.sport === 'custom')} onClick={() => patch({ sport: 'custom' })}>
            Custom
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <label className={labelCls} htmlFor="rf-duration">
            {state.sport === 'hyrox' ? 'Expected finish (min)' : 'Duration (min)'}
          </label>
          <input
            id="rf-duration"
            type="number"
            min="20"
            max="1440"
            className={inputCls}
            value={state.durationMin}
            onChange={(e) => patch({ sport: 'custom', durationMin: Math.max(20, Number(e.target.value) || 20) })}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="rf-carbs">
            Carbs g/hour
          </label>
          <input
            id="rf-carbs"
            type="number"
            min="10"
            max="150"
            className={inputCls}
            value={carbsPerHour}
            onChange={(e) => patch({ carbsOverride: Math.max(10, Number(e.target.value) || 10) })}
          />
          <p className="mt-1 font-sans text-[11px] text-text-muted">
            Default for this duration: {defaultCarbsPerHour(state.durationMin)} g/h
          </p>
        </div>
        <div>
          <label className={labelCls} htmlFor="rf-weight">
            Bodyweight (kg)
          </label>
          <input
            id="rf-weight"
            type="number"
            min="30"
            max="200"
            className={inputCls}
            value={state.weightKg}
            onChange={(e) => patch({ weightKg: Math.max(30, Number(e.target.value) || 30) })}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="rf-sweat">
            Sweat level
          </label>
          <select
            id="rf-sweat"
            className={inputCls}
            value={state.sweat}
            onChange={(e) => patch({ sweat: e.target.value as SweatLevel })}
          >
            <option value="low">Low — {SODIUM_BY_SWEAT.low} mg sodium/h</option>
            <option value="medium">Medium — {SODIUM_BY_SWEAT.medium} mg/h</option>
            <option value="high">High / hot — {SODIUM_BY_SWEAT.high} mg/h</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="rf-ratio">
            Carb ratio
          </label>
          <select
            id="rf-ratio"
            className={inputCls}
            value={state.ratio}
            onChange={(e) => patch({ ratio: e.target.value as RatioKey })}
          >
            <option value="simple">{RATIOS.simple.label} malto:fructose</option>
            <option value="advanced">{RATIOS.advanced.label} — gut-trained</option>
          </select>
          <p className="mt-1 font-sans text-[11px] text-text-muted">{RATIOS[state.ratio].note}</p>
        </div>
        <div>
          <label className={labelCls} htmlFor="rf-sodium">
            Sodium source
          </label>
          <select
            id="rf-sodium"
            className={inputCls}
            value={state.sodiumForm}
            onChange={(e) => patch({ sodiumForm: e.target.value as SodiumForm })}
          >
            <option value="salt">{SODIUM_FORMS.salt.label}</option>
            <option value="citrate">{SODIUM_FORMS.citrate.label}</option>
          </select>
          <p className="mt-1 font-sans text-[11px] text-text-muted">{SODIUM_FORMS[state.sodiumForm].note}</p>
        </div>
        {state.mode === 'bottle' ? (
          <div>
            <label className={labelCls} htmlFor="rf-bottle">
              Bottle size
            </label>
            <select
              id="rf-bottle"
              className={inputCls}
              value={state.bottleMl}
              onChange={(e) => patch({ bottleMl: Number(e.target.value) })}
            >
              {BOTTLE_SIZES_ML.map((ml) => (
                <option key={ml} value={ml}>
                  {ml} ml
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div>
              <label className={labelCls} htmlFor="rf-flask">
                Soft-flask size
              </label>
              <select
                id="rf-flask"
                className={inputCls}
                value={state.flaskMl}
                onChange={(e) => patch({ flaskMl: Number(e.target.value) })}
              >
                {FLASK_SIZES_ML.map((ml) => (
                  <option key={ml} value={ml}>
                    {ml} ml
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="rf-flasks">
                Flasks carried
              </label>
              <input
                id="rf-flasks"
                type="number"
                min="1"
                max="8"
                className={inputCls}
                value={state.flaskCount}
                onChange={(e) => patch({ flaskCount: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
              />
            </div>
          </>
        )}
      </div>

      {hyroxNote && (
        <div className="mt-4 rounded-lg border border-border bg-paper-warm p-4 font-sans text-[13px] leading-relaxed text-text">
          <strong>HYROX honesty check:</strong> most races finish in 60–90 minutes, and under ~75 minutes you may not
          need to buy anything mid-race — pre-race carbs and the race-morning routine do most of the work. {hyroxNote}
        </div>
      )}

      {/* Per-serving recipe */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-paper-warm p-5">
          <h3 className="m-0 font-sans text-sm font-extrabold uppercase tracking-[0.1em] text-text">
            Your recipe — per {state.mode === 'bottle' ? 'bottle' : 'flask'}
          </h3>
          <p className="mb-3 mt-1 font-sans text-[12px] text-text-muted">{recipe.servingLabel}</p>
          <ul className="m-0 list-none space-y-2 p-0 font-sans text-[14px]">
            <li>
              <strong>{round(recipe.maltoG)} g</strong> maltodextrin{' '}
              <span className="text-text-muted">(≈ {round(recipe.maltoG / TSP_GRAMS.malto)} tsp)</span>
            </li>
            <li>
              <strong>{round(recipe.fructoseG)} g</strong> fructose{' '}
              <span className="text-text-muted">(≈ {round(recipe.fructoseG / TSP_GRAMS.fructose)} tsp)</span>
            </li>
            <li>
              <strong>{round(recipe.sodiumIngredientG, 2)} g</strong> {SODIUM_FORMS[state.sodiumForm].label.toLowerCase()}{' '}
              <span className="text-text-muted">
                (≈ {round(recipe.sodiumIngredientG / sodiumG, 2)} tsp · {Math.round(recipe.sodiumMgPerServing)} mg sodium)
              </span>
            </li>
            <li>
              <strong>{recipe.waterMlPerServing} ml</strong> water
            </li>
          </ul>
          <p className="mb-0 mt-3 font-sans text-[12px] text-text-muted">
            Grams first — teaspoons are rough. A basic kitchen scale (under {cur}10) makes this repeatable.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className={`rounded-lg border-2 p-4 ${gut.chip}`}>
            <p className="m-0 font-sans text-[13px] font-extrabold uppercase tracking-[0.08em]">
              Estimated gut-load: {gut.label}
            </p>
            <p className="mb-0 mt-1 font-sans text-[13px] leading-relaxed text-text">
              {round(recipe.concentration)} g carbs per 100 ml. {gut.advice} This is an estimate from concentration,
              ingredient type and sodium — not a lab osmolality test.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-white p-4 font-sans text-[14px]">
            <ul className="m-0 list-none space-y-1.5 p-0">
              <li>
                Carbs delivered: <strong>{carbsPerHour} g/hour</strong> ·{' '}
                <strong>{Math.round(recipe.totalCarbs)} g total</strong> over {round(state.durationMin / 60)} h
              </li>
              <li>
                Servings for the session: <strong>{round(recipe.servingCount)}</strong>
              </li>
              <li>
                Cost per serving: <strong>{money(recipe.costPerServing)}</strong>
              </li>
              <li>
                Cost per gram of carb: <strong>
                  {cur}
                  {recipe.costPerGramCarb.toFixed(4)}
                </strong>{' '}
                <span className="text-text-muted">(≈ {money(recipe.costPerGramCarb * 60)} per 60 g)</span>
              </li>
              <li>
                Whole session DIY: <strong>{money(recipe.sessionCost)}</strong> vs gels ≈{' '}
                <strong>{money(recipe.gelSessionCost)}</strong>{' '}
                <span className="text-text-muted">({recipe.gelsForSession} × {money(state.prices.gelPrice)})</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Training-block savings */}
      <div className="fuel-card-green mt-6 rounded-lg border border-border p-5">
        <h3 className="m-0 font-sans text-sm font-extrabold uppercase tracking-[0.1em] text-green">
          Training-block savings estimate
        </h3>
        <div className="mt-3 grid grid-cols-3 gap-3 md:max-w-md">
          <div>
            <label className={labelCls} htmlFor="rf-spw">
              Sessions/week
            </label>
            <input
              id="rf-spw"
              type="number"
              min="1"
              max="14"
              className={inputCls}
              value={state.sessionsPerWeek}
              onChange={(e) => patch({ sessionsPerWeek: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="rf-avg">
              Avg mins
            </label>
            <input
              id="rf-avg"
              type="number"
              min="20"
              max="600"
              className={inputCls}
              value={state.avgSessionMin}
              onChange={(e) => patch({ avgSessionMin: Math.max(20, Number(e.target.value) || 20) })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="rf-weeks">
              Weeks
            </label>
            <input
              id="rf-weeks"
              type="number"
              min="1"
              max="52"
              className={inputCls}
              value={state.weeks}
              onChange={(e) => patch({ weeks: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-2 font-sans text-[14px] md:grid-cols-3">
          <div className="rounded-lg bg-white p-3">
            Commercial gels: <strong>{money(savings.gelCost)}</strong>
            <span className="block text-[12px] text-text-muted">{savings.gels} gels over the block</span>
          </div>
          <div className="rounded-lg bg-white p-3">
            DIY mix: <strong>{money(savings.diyCost)}</strong>
            <span className="block text-[12px] text-text-muted">
              {Math.round(savings.totalCarbs)} g carbs · {round(savings.totalHours)} fuelled hours
            </span>
          </div>
          <div className="rounded-lg bg-green p-3 text-white">
            Estimated saving: <strong>{money(Math.max(0, savings.saving))}</strong>
            <span className="block text-[12px] opacity-90">at {carbsPerHour} g/h target</span>
          </div>
        </div>
      </div>

      {/* Editable prices */}
      <details className="mt-6 rounded-lg border border-border bg-white p-4">
        <summary className="cursor-pointer font-sans text-[13px] font-extrabold uppercase tracking-[0.1em] text-text">
          Edit ingredient prices ({cur}/kg) &amp; gel reference
        </summary>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className={labelCls} htmlFor="rf-cur">
              Currency symbol
            </label>
            <input
              id="rf-cur"
              type="text"
              maxLength={4}
              className={inputCls}
              value={state.prices.currency}
              onChange={(e) => patchPrices({ currency: e.target.value || '€' })}
            />
          </div>
          {(
            [
              ['maltoPerKg', 'Maltodextrin /kg'],
              ['fructosePerKg', 'Fructose /kg'],
              ['saltPerKg', 'Table salt /kg'],
              ['citratePerKg', 'Sodium citrate /kg'],
              ['gelPrice', 'Gel price (each)'],
              ['gelCarbs', 'Carbs per gel (g)'],
            ] as Array<[keyof Prices, string]>
          ).map(([key, text]) => (
            <div key={key}>
              <label className={labelCls} htmlFor={`rf-${key}`}>
                {text}
              </label>
              <input
                id={`rf-${key}`}
                type="number"
                min="0"
                step="0.1"
                className={inputCls}
                value={state.prices[key] as number}
                onChange={(e) => patchPrices({ [key]: Math.max(0, Number(e.target.value) || 0) } as Partial<Prices>)}
              />
            </div>
          ))}
        </div>
        <p className="mb-0 mt-3 font-sans text-[12px] text-text-muted">
          Set your local prices and currency — the defaults are only rough EU starting points.
        </p>
      </details>

      {/* Share + caffeine + framing */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" onClick={share} className="fuel-btn fuel-btn-accent border-0 text-[14px]">
          {copied ? 'Link copied ✓' : 'Copy shareable link'}
        </button>
        <p className="m-0 font-sans text-[12px] text-text-muted">
          Your inputs are encoded in the URL — send it to a training partner.
        </p>
      </div>
      <div className="mt-5 rounded-lg border border-amber bg-amber-soft p-4 font-sans text-[13px] leading-relaxed">
        <strong>Caffeine is deliberately not in this calculator.</strong> If you use it: guidance is 3–6 mg per kg of
        bodyweight (≈ {Math.round(state.weightKg * 3)}–{Math.round(state.weightKg * 6)} mg for {state.weightKg} kg),
        taken 30–60 minutes before, tested in training first. Use gels or tablets with a measured dose — never pure
        caffeine powder.
      </div>
      <p className="mb-0 mt-4 font-sans text-[12px] leading-relaxed text-text-muted">
        Every output here is a training-tested starting point, not a prescription: start at the lower end, test on easy
        long sessions, and never try anything new on race day.
      </p>
    </div>
  );
}
