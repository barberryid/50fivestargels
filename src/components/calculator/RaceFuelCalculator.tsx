// Race Fuel Cost Calculator — the only React island on the site (brief §10).
// All maths lives in src/lib/fuelMath.ts; this file is state + presentation.
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
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
import {
  REGION_LABELS,
  costPerGramCarb,
  productsForRegion,
  useCasePicks,
  type Region,
} from '../../data/gels';
import UnitToggle, { useUnitSystem } from '../UnitToggle';
import { copyToClipboard } from '../../lib/clipboard';
import {
  currencyForSystem,
  displayWeight,
  volumeLabel,
  weightBounds,
  weightToKg,
  weightUnit as weightUnitFor,
} from '../../lib/units';

type Mode = 'bottle' | 'syrup' | 'commercial';

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
  region: Region;
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
  region: 'EU',
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

const CARBS_PRESETS = [
  { value: 45, label: 'Cautious gut' },
  { value: 60, label: 'Standard' },
  { value: 90, label: 'Trained gut' },
] as const;

const num = (v: string | null): number | null => {
  if (v === null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// Number inputs: don't clamp min/max on every keystroke (it fights typing —
// e.g. a min of 20 would snap "7" up to "20" before the user can type the
// second digit of "75"). Parse loosely as the user types, clamp on blur.
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const blockNonDigitKeys = (e: KeyboardEvent<HTMLInputElement>) => {
  if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
};

// Bottle/flask sizes come from <select>s, so URL params must land on an
// actual option or the select renders out of sync with the recipe.
const nearestSize = (value: number, sizes: readonly number[]): number =>
  sizes.reduce((best, size) => (Math.abs(size - value) < Math.abs(best - value) ? size : best));

function parseParams(search: string): Partial<CalcState> {
  const q = new URLSearchParams(search);
  const out: Partial<CalcState> = {};
  const mode = q.get('mode');
  if (mode === 'bottle' || mode === 'syrup' || mode === 'commercial') out.mode = mode;
  const region = q.get('region');
  if (region === 'UK' || region === 'EU' || region === 'US') out.region = region;
  const sport = q.get('sport');
  if (sport && (sport === 'custom' || sport in SPORT_PRESETS)) out.sport = sport as SportKey;
  const duration = num(q.get('duration'));
  if (duration) out.durationMin = clamp(duration, 20, 1440);
  const carbs = num(q.get('carbs'));
  if (carbs) out.carbsOverride = clamp(carbs, 10, 150);
  const ratio = q.get('ratio');
  if (ratio === '2-1') out.ratio = 'simple';
  if (ratio === '1-08') out.ratio = 'advanced';
  const bottle = num(q.get('bottle'));
  if (bottle) out.bottleMl = nearestSize(bottle, BOTTLE_SIZES_ML);
  const flask = num(q.get('flask'));
  if (flask) out.flaskMl = nearestSize(flask, FLASK_SIZES_ML);
  const flasks = num(q.get('flasks'));
  if (flasks) out.flaskCount = clamp(Math.round(flasks), 1, 8);
  const sweat = q.get('sweat');
  if (sweat === 'low' || sweat === 'medium' || sweat === 'high') out.sweat = sweat;
  const sodium = q.get('sodium');
  if (sodium === 'salt' || sodium === 'citrate') out.sodiumForm = sodium;
  const weight = num(q.get('weight'));
  if (weight) out.weightKg = clamp(weight, 30, 200);
  const spw = num(q.get('spw'));
  if (spw) out.sessionsPerWeek = clamp(Math.round(spw), 1, 14);
  const avg = num(q.get('avg'));
  if (avg) out.avgSessionMin = clamp(avg, 20, 600);
  const weeks = num(q.get('weeks'));
  if (weeks) out.weeks = clamp(Math.round(weeks), 1, 52);
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
  else if (s.mode === 'syrup') {
    q.set('flask', String(s.flaskMl));
    q.set('flasks', String(s.flaskCount));
  } else {
    q.set('region', s.region);
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
  const [showCarbsHelp, setShowCarbsHelp] = useState(false);
  const [unitSystem, setUnitSystem] = useUnitSystem();
  const weightUnit = weightUnitFor(unitSystem);
  const weightBoundsDisplay = weightBounds(unitSystem);
  const patch = (p: Partial<CalcState>) => setState((s) => ({ ...s, ...p }));
  const patchPrices = (p: Partial<Prices>) =>
    setState((s) => ({ ...s, prices: { ...s.prices, ...p } }));

  useEffect(() => {
    setState((s) => ({ ...s, ...parseParams(window.location.search) }));
    setReady(true);
  }, []);

  // Currency follows the unit system (Metric €, American $, UK Hybrid £),
  // including the system restored from localStorage on load. Still editable
  // by hand in the price panel afterwards.
  useEffect(() => {
    setState((s) => ({ ...s, prices: { ...s.prices, currency: currencyForSystem(unitSystem) } }));
  }, [unitSystem]);

  const carbsPerHour = state.carbsOverride ?? defaultCarbsPerHour(state.durationMin);
  const carbsWarning =
    carbsPerHour > 90
      ? { tone: 'amber' as const, text: "High intake — only recommended if you've trained your gut for it." }
      : carbsPerHour < 30
        ? { tone: 'muted' as const, text: "That's quite low for a long session — most runners need at least 30 g/h." }
        : null;

  useEffect(() => {
    if (!ready) return;
    const url = `${window.location.pathname}?${buildParams(state, carbsPerHour)}`;
    window.history.replaceState(null, '', url);
  }, [state, ready, carbsPerHour]);

  // In commercial mode the DIY reference recipe (for cost comparison) is a
  // standard bottle mix built from the same inputs.
  const recipe = useMemo(
    () =>
      computeRecipe({
        mode: state.mode === 'commercial' ? 'bottle' : state.mode,
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

  // fuelMath.ts stays unit-agnostic (always ml internally); build the
  // display label here so it can respect the selected unit system.
  const servingLabel =
    state.mode === 'syrup'
      ? `${volumeLabel(state.flaskMl, unitSystem)} soft flask of syrup — sip and chase with plain water`
      : `${volumeLabel(state.bottleMl, unitSystem)} bottle — drink one per hour`;

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
    if (await copyToClipboard(window.location.href)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    /* if both copy paths fail, the URL bar already has the params */
  };

  return (
    <div className="fuel-card mt-8 p-5 sm:p-7">
      <UnitToggle value={unitSystem} onChange={setUnitSystem} />
      {/* Mode switcher — toggle buttons, not ARIA tabs (no tabpanel/arrow-key wiring) */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Calculator mode">
        <button
          type="button"
          aria-pressed={state.mode === 'bottle'}
          className={chipCls(state.mode === 'bottle')}
          onClick={() => patch({ mode: 'bottle' })}
        >
          DIY bottle mix
        </button>
        <button
          type="button"
          aria-pressed={state.mode === 'syrup'}
          className={chipCls(state.mode === 'syrup')}
          onClick={() => patch({ mode: 'syrup' })}
        >
          DIY soft-flask syrup
        </button>
        <button
          type="button"
          aria-pressed={state.mode === 'commercial'}
          className={chipCls(state.mode === 'commercial')}
          onClick={() => patch({ mode: 'commercial' })}
        >
          Commercial gel comparison
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
            onKeyDown={blockNonDigitKeys}
            onChange={(e) => {
              const raw = Number(e.target.value);
              patch({ sport: 'custom', durationMin: Number.isFinite(raw) ? raw : 0 });
            }}
            onBlur={(e) => patch({ durationMin: clamp(Number(e.target.value) || 20, 20, 1440) })}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className={labelCls} htmlFor="rf-carbs">
            Carbs g/hour
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {CARBS_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={carbsPerHour === p.value}
                className={chipCls(carbsPerHour === p.value)}
                onClick={() => patch({ carbsOverride: p.value })}
              >
                {p.label} · {p.value}
              </button>
            ))}
          </div>
          <input
            id="rf-carbs"
            type="number"
            min="10"
            max="150"
            className={inputCls}
            value={carbsPerHour}
            onKeyDown={blockNonDigitKeys}
            onChange={(e) => {
              const raw = Number(e.target.value);
              patch({ carbsOverride: Number.isFinite(raw) ? raw : 0 });
            }}
            onBlur={(e) => patch({ carbsOverride: clamp(Number(e.target.value) || 10, 10, 150) })}
            aria-describedby={`rf-carbs-help${carbsWarning ? ' rf-carbs-warning' : ''}`}
          />
          <p id="rf-carbs-help" className="mt-1 font-sans text-[11px] text-text-muted">
            Most runners handle 45–60 g/h. Above 90 g/h needs practice in training.{' '}
            <button
              type="button"
              aria-expanded={showCarbsHelp}
              onClick={() => setShowCarbsHelp((v) => !v)}
              className="cursor-pointer border-0 bg-transparent p-0 font-sans text-[11px] font-bold text-accent underline underline-offset-2"
            >
              How do I choose?
            </button>
          </p>
          {showCarbsHelp && (
            <ul className="m-0 mt-1 list-disc space-y-0.5 pl-4 font-sans text-[11px] text-text-muted">
              <li>Under ~2.5 h: 30–60 g/h is plenty.</li>
              <li>Marathon and longer: 60–90 g/h.</li>
              <li>90–120 g/h: only if you've practiced high intake repeatedly in training.</li>
            </ul>
          )}
          {carbsWarning && (
            <p
              id="rf-carbs-warning"
              className={`mt-1 font-sans text-[11px] leading-relaxed ${
                carbsWarning.tone === 'amber'
                  ? 'rounded-md border border-amber bg-amber-soft px-2 py-1 text-amber'
                  : 'text-text-muted'
              }`}
            >
              {carbsWarning.text}
            </p>
          )}
        </div>
        <div>
          <label className={labelCls} htmlFor="rf-weight">
            Bodyweight ({weightUnit})
          </label>
          <input
            id="rf-weight"
            type="number"
            min={weightBoundsDisplay.min}
            max={weightBoundsDisplay.max}
            className={inputCls}
            value={Math.round(displayWeight(state.weightKg, unitSystem))}
            onKeyDown={blockNonDigitKeys}
            onChange={(e) => {
              const raw = Number(e.target.value);
              patch({ weightKg: Number.isFinite(raw) ? weightToKg(raw, unitSystem) : 0 });
            }}
            onBlur={(e) => {
              const raw = clamp(Number(e.target.value) || weightBoundsDisplay.min, weightBoundsDisplay.min, weightBoundsDisplay.max);
              patch({ weightKg: weightToKg(raw, unitSystem) });
            }}
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
            {/* container pickers hidden in commercial mode */}
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
                  {volumeLabel(ml, unitSystem)}
                </option>
              ))}
            </select>
          </div>
        ) : state.mode === 'syrup' ? (
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
                    {volumeLabel(ml, unitSystem)}
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
                onKeyDown={blockNonDigitKeys}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  patch({ flaskCount: Number.isFinite(raw) ? raw : 0 });
                }}
                onBlur={(e) => patch({ flaskCount: clamp(Math.round(Number(e.target.value) || 1), 1, 8) })}
              />
            </div>
          </>
        ) : (
          <div>
            <label className={labelCls} htmlFor="rf-region">
              Where do you shop?
            </label>
            <select
              id="rf-region"
              className={inputCls}
              value={state.region}
              onChange={(e) => patch({ region: e.target.value as Region })}
            >
              {(Object.keys(REGION_LABELS) as Region[]).map((r) => (
                <option key={r} value={r}>
                  {REGION_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {hyroxNote && (
        <div className="mt-4 rounded-lg border border-border bg-paper-warm p-4 font-sans text-[13px] leading-relaxed text-text">
          <strong>HYROX honesty check:</strong> most races finish in 60–90 minutes, and under ~75 minutes you may not
          need to buy anything mid-race — pre-race carbs and the race-morning routine do most of the work. {hyroxNote}
        </div>
      )}

      {/* Per-serving recipe (DIY modes) */}
      {state.mode !== 'commercial' && (
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-paper-warm p-5">
          <h3 className="m-0 font-sans text-sm font-extrabold uppercase tracking-[0.1em] text-text">
            Your recipe — per {state.mode === 'bottle' ? 'bottle' : 'flask'}
          </h3>
          <p className="mb-3 mt-1 font-sans text-[12px] text-text-muted">{servingLabel}</p>
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
              <strong>{volumeLabel(recipe.waterMlPerServing, unitSystem)}</strong> water
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
      )}

      {/* Commercial gel comparison (phase 2 dataset) */}
      {state.mode === 'commercial' && (
        <div className="mt-6">
          <div className="rounded-lg border border-border bg-white p-4 font-sans text-[14px]">
            Your DIY reference mix (same targets, bottle mix): <strong>{cur}{recipe.costPerGramCarb.toFixed(4)}</strong>{' '}
            per gram of carb <span className="text-text-muted">(≈ {money(recipe.costPerGramCarb * 60)} per 60 g)</span>.
            Every product below shows the same metric so you can compare buy vs make directly.
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {useCasePicks(state.region).map((pick) => (
              <div key={pick.label} className="rounded-lg border border-border bg-paper-warm px-3 py-2">
                <span className="block font-sans text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-accent">
                  {pick.label}
                </span>
                <span className="block font-sans text-[13px] font-bold text-text">
                  {pick.product.brand} {pick.product.product}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse font-sans text-[13px]">
              <thead>
                <tr className="border-b-2 border-border text-left">
                  <th className="py-2 pr-3 font-extrabold">Product</th>
                  <th className="py-2 pr-3 font-extrabold">Carbs</th>
                  <th className="py-2 pr-3 font-extrabold">Sodium</th>
                  <th className="py-2 pr-3 font-extrabold">Caffeine</th>
                  <th className="py-2 pr-3 font-extrabold">Typical price</th>
                  <th className="py-2 pr-3 font-extrabold">Per g carb</th>
                  <th className="py-2 pr-3 font-extrabold">Per 60 g</th>
                  <th className="py-2 font-extrabold"></th>
                </tr>
              </thead>
              <tbody>
                {productsForRegion(state.region).map((p) => (
                  <tr key={p.id} className="border-b border-border align-top">
                    <td className="py-2 pr-3">
                      <strong>
                        {p.brand} {p.product}
                      </strong>
                      <span className="block text-[11.5px] text-text-muted">
                        {p.servingSize}
                        {p.note ? ` · ${p.note}` : ''}
                      </span>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{p.carbsG} g</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{p.sodiumMg} mg</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{p.caffeineMg > 0 ? `${p.caffeineMg} mg` : '—'}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {p.currency}
                      {p.typicalPrice.toFixed(2)}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {p.currency}
                      {costPerGramCarb(p).toFixed(4)}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {p.currency}
                      {(costPerGramCarb(p) * 60).toFixed(2)}
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      <button
                        type="button"
                        className="rounded-md border border-border bg-white px-2 py-1 text-[11.5px] font-bold text-text-muted hover:border-accent-deep hover:text-text"
                        onClick={() =>
                          patchPrices({ gelPrice: p.typicalPrice, gelCarbs: p.carbsG, currency: p.currency })
                        }
                        title="Use this product's price and carbs in the training-block savings comparison below"
                      >
                        Use in savings
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mb-0 mt-3 font-sans text-[12px] leading-relaxed text-text-muted">
            Typical single-unit prices, last checked 2026-07 — multipacks are usually cheaper, and sodium/caffeine vary
            by flavour. Ranked by cost per gram of carbohydrate within your region; picks above are by use case, never
            "best overall". For live prices in your country, the{' '}
            <a href="/ai-race-fuel-prompt-generator/" className="font-bold text-accent">
              prompt generator
            </a>{' '}
            asks your AI to check today's shelves.
          </p>
        </div>
      )}

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
              onKeyDown={blockNonDigitKeys}
              onChange={(e) => {
                const raw = Number(e.target.value);
                patch({ sessionsPerWeek: Number.isFinite(raw) ? raw : 0 });
              }}
              onBlur={(e) => patch({ sessionsPerWeek: clamp(Math.round(Number(e.target.value) || 1), 1, 14) })}
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
              onKeyDown={blockNonDigitKeys}
              onChange={(e) => {
                const raw = Number(e.target.value);
                patch({ avgSessionMin: Number.isFinite(raw) ? raw : 0 });
              }}
              onBlur={(e) => patch({ avgSessionMin: clamp(Number(e.target.value) || 20, 20, 600) })}
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
              onKeyDown={blockNonDigitKeys}
              onChange={(e) => {
                const raw = Number(e.target.value);
                patch({ weeks: Number.isFinite(raw) ? raw : 0 });
              }}
              onBlur={(e) => patch({ weeks: clamp(Math.round(Number(e.target.value) || 1), 1, 52) })}
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
        bodyweight (≈ {Math.round(state.weightKg * 3)}–{Math.round(state.weightKg * 6)} mg for{' '}
        {Math.round(displayWeight(state.weightKg, unitSystem))} {weightUnit}),
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
