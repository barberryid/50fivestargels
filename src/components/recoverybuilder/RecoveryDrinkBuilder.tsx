// Recovery Drink Builder — third React island (recovery-drink-builder-BUILD-INSTRUCTIONS.md §4).
// Presentation follows the tactile step-by-step flow shared with the AI Race Fuel Prompt Generator
// and the Race Fuel Cost Calculator (dark live-value card, big tappable rows, numeric keypad).
import { useMemo, useState } from 'react';
import {
  DEPLETION_LEVELS,
  ELECTROLYTE_SOURCES,
  GOALS,
  SWEAT_LABELS,
  SWEAT_SODIUM_MG,
  type Depletion,
  type ElectrolyteSource,
  type Goal,
  type SessionType,
  type SweatLevel,
} from '../../data/recoveryData';
import { buildRecipe, formatRecipeText, recoveryCost, whyLine, type RecoveryInputs } from '../../lib/recoveryMath';
import UnitToggle, { useUnitSystem } from '../UnitToggle';
import { copyToClipboard } from '../../lib/clipboard';
import { displayWeight, volumeLabel, weightBounds, weightToKg, weightUnit as weightUnitFor } from '../../lib/units';

type Step = 1 | 2 | 3;
type Phase = 'bodyweight' | 'depletion' | 'sweat' | 'goal' | 'electrolyteSource';

const phaseList: Phase[] = ['bodyweight', 'depletion', 'sweat', 'goal', 'electrolyteSource'];
const numericPhases: Phase[] = ['bodyweight'];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

const INITIAL_INPUTS: RecoveryInputs = {
  bodyweightKg: 90,
  sessionType: 'hybrid',
  depletion: 'moderate',
  sweat: 'medium',
  goal: 'balanced',
  includeCreatine: true,
  includeCollagen: false,
  includeBoosters: false,
  electrolyteSource: 'lmnt',
};

const SESSION_CARDS: Array<{ key: SessionType; title: string; desc: string }> = [
  { key: 'endurance', title: 'Endurance', desc: 'Steady-state running, cycling or rowing — carbs trend slightly higher.' },
  { key: 'strength', title: 'Strength', desc: 'Lifting-focused session — lighter carb need, protein still does the repair work.' },
  { key: 'hybrid', title: 'Hybrid (HYROX)', desc: 'Mixed strength + endurance — a balanced carb target.' },
  { key: 'longDepleting', title: 'Long depleting session', desc: 'Long or glycogen-depleting effort — carbs pushed toward the top of the range.' },
];

const STEP_META: Record<Step, { eyebrow: string; title: string; sub: string }> = {
  1: {
    eyebrow: 'STEP 1 · WHAT WAS THE SESSION?',
    title: 'Pick your session type',
    sub: 'This drives your carb-per-kg baseline and protein emphasis.',
  },
  2: {
    eyebrow: 'STEP 2 · YOU AND YOUR RECOVERY',
    title: 'Type your numbers',
    sub: 'Big keys, no keyboard. Tap any row above to jump straight to it.',
  },
  3: {
    eyebrow: 'STEP 3 · YOUR RECIPE',
    title: 'Recipe, macros and cost',
    sub: 'Everything below updates with your answers — go back to adjust anything.',
  },
};

function fieldMeta(
  phase: Phase,
  inputs: RecoveryInputs,
  unitSystem: ReturnType<typeof useUnitSystem>[0]
): { label: string; unit: string; value: string } {
  switch (phase) {
    case 'bodyweight':
      return {
        label: 'Bodyweight',
        unit: weightUnitFor(unitSystem),
        value: String(Math.round(displayWeight(inputs.bodyweightKg, unitSystem))),
      };
    case 'depletion':
      return { label: 'Session intensity / depletion', unit: '', value: DEPLETION_LEVELS[inputs.depletion].label };
    case 'sweat':
      return { label: 'Sweat level', unit: '', value: SWEAT_LABELS[inputs.sweat] };
    case 'goal':
      return { label: 'Goal emphasis', unit: '', value: GOALS[inputs.goal].label };
    case 'electrolyteSource':
      return { label: 'Electrolyte source', unit: '', value: ELECTROLYTE_SOURCES[inputs.electrolyteSource].label };
  }
}

function optionsFor(phase: Phase): Array<{ key: string; label: string; desc?: string }> {
  switch (phase) {
    case 'depletion':
      return (Object.keys(DEPLETION_LEVELS) as Depletion[]).map((key) => ({
        key,
        label: DEPLETION_LEVELS[key].label,
        desc: `${DEPLETION_LEVELS[key].carbPerKgBase.toFixed(1)} g/kg carb baseline`,
      }));
    case 'sweat':
      return (Object.keys(SWEAT_LABELS) as SweatLevel[]).map((key) => ({
        key,
        label: SWEAT_LABELS[key],
        desc: `${SWEAT_SODIUM_MG[key]} mg sodium target`,
      }));
    case 'goal':
      return [
        { key: 'glycogen', label: GOALS.glycogen.label, desc: 'Lighter protein — carbs do the heavy lifting.' },
        { key: 'repair', label: GOALS.repair.label, desc: 'More protein, toward the top of the range.' },
        { key: 'balanced', label: GOALS.balanced.label, desc: 'Even split between carbs and protein.' },
      ];
    case 'electrolyteSource':
      return [
        { key: 'lmnt', label: ELECTROLYTE_SOURCES.lmnt.label, desc: '1 stick ≈ 1000 mg sodium.' },
        { key: 'diy', label: ELECTROLYTE_SOURCES.diy.label, desc: 'Salt + potassium/magnesium, tuned to your sweat level.' },
        { key: 'lowSodiumTab', label: ELECTROLYTE_SOURCES.lowSodiumTab.label, desc: 'A low-sodium tab topped up with a pinch of salt.' },
      ];
    default:
      return [];
  }
}

export default function RecoveryDrinkBuilder() {
  const [inputs, setInputs] = useState<RecoveryInputs>(INITIAL_INPUTS);
  const [copied, setCopied] = useState(false);
  const [unitSystem, setUnitSystem] = useUnitSystem();
  const [step, setStep] = useState<Step>(1);
  const [phase, setPhase] = useState<Phase>('bodyweight');
  const [bodyweightBuf, setBodyweightBuf] = useState('');

  const patch = (p: Partial<RecoveryInputs>) => {
    setInputs((i) => ({ ...i, ...p }));
    setCopied(false);
  };

  const weightUnit = weightUnitFor(unitSystem);
  const bounds = weightBounds(unitSystem);

  const recipe = useMemo(() => buildRecipe(inputs), [inputs]);
  const cost = useMemo(() => recoveryCost(recipe, inputs.electrolyteSource), [recipe, inputs.electrolyteSource]);
  const why = useMemo(() => whyLine(inputs, recipe), [inputs, recipe]);
  const recipeText = useMemo(() => formatRecipeText(recipe, cost), [recipe, cost]);

  const copy = async () => {
    if (await copyToClipboard(recipeText)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const electrolyteLine =
    recipe.electrolytes.lmntSticks !== undefined
      ? `${recipe.electrolytes.lmntSticks} LMNT stick${recipe.electrolytes.lmntSticks > 1 ? 's' : ''}`
      : recipe.electrolytes.lowSodiumTabs
        ? `1 low-sodium tab + ${recipe.electrolytes.saltG} g salt`
        : `${recipe.electrolytes.saltG} g salt + potassium/magnesium powder`;

  const advance = () => {
    const idx = phaseList.indexOf(phase);
    const next = phaseList[idx + 1];
    if (next) setPhase(next);
    else setStep(3);
  };

  const back = () => {
    if (step === 3) {
      setStep(2);
      setPhase(phaseList[phaseList.length - 1]);
      return;
    }
    if (step === 2) {
      const idx = phaseList.indexOf(phase);
      if (idx > 0) setPhase(phaseList[idx - 1]);
      else setStep(1);
    }
  };

  const selectOption = (key: string) => {
    switch (phase) {
      case 'depletion':
        patch({ depletion: key as Depletion });
        break;
      case 'sweat':
        patch({ sweat: key as SweatLevel });
        break;
      case 'goal':
        patch({ goal: key as Goal });
        break;
      case 'electrolyteSource':
        patch({ electrolyteSource: key as ElectrolyteSource });
        break;
    }
    advance();
  };

  const tapDigit = (digit: string) => {
    setBodyweightBuf((b) => (b + digit).replace(/^0+(?=\d)/, '').slice(0, 3));
    setCopied(false);
  };

  const tapBackspace = () => setBodyweightBuf((b) => b.slice(0, -1));

  const commitNumeric = () => {
    if (bodyweightBuf !== '') {
      const raw = clamp(Number(bodyweightBuf) || bounds.min, bounds.min, bounds.max);
      patch({ bodyweightKg: weightToKg(raw, unitSystem) });
    }
    setBodyweightBuf('');
    advance();
  };

  const bodyweightValue = bodyweightBuf !== '' ? bodyweightBuf : String(Math.round(displayWeight(inputs.bodyweightKg, unitSystem)));

  const meta = STEP_META[step];
  const isNumericPhase = numericPhases.includes(phase);

  return (
    <div className="bg-bg px-4 py-6 text-text font-body sm:px-6 lg:flex lg:justify-center lg:px-10 lg:py-14">
      <style>{`
        @keyframes rdb-caret-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
      `}</style>
      <div className="mx-auto flex w-full max-w-[390px] flex-col lg:max-w-[480px] lg:rounded-2xl lg:border lg:border-border lg:bg-bg-card lg:px-9 lg:py-9 lg:shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="mb-3">
          <UnitToggle value={unitSystem} onChange={setUnitSystem} />
        </div>

        <div className="mb-1 flex items-center gap-2.5">
          {step > 1 && (
            <button
              type="button"
              aria-label="Back"
              onClick={back}
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-border bg-white p-0 text-[15px] text-accent-deep transition-colors duration-150 hover:border-accent active:border-accent active:bg-bg-soft"
            >
              ←
            </button>
          )}
          <span className="font-sans text-[11px] font-extrabold uppercase tracking-[0.18em] text-accent">
            {meta.eyebrow}
          </span>
        </div>
        <h2 className="m-0 text-[26px] uppercase leading-[1.05] lg:text-[32px]" style={{ letterSpacing: '-0.01em' }}>
          {meta.title}
        </h2>
        <p className="mb-3 mt-2 text-[13.5px] leading-[1.5] text-text-muted lg:text-[15px]">{meta.sub}</p>

        {step === 1 && (
          <div className="flex flex-col gap-2">
            {SESSION_CARDS.map((item) => (
              <button
                key={item.key}
                type="button"
                className="flex min-h-[60px] flex-col gap-[3px] rounded-[14px] border border-border bg-white px-3.5 py-3 text-left transition-colors duration-150 hover:border-accent active:border-accent active:bg-bg-soft"
                onClick={() => {
                  patch({ sessionType: item.key });
                  setStep(2);
                  setPhase('bodyweight');
                  setCopied(false);
                }}
              >
                <span className="font-sans text-[14.5px] font-semibold leading-tight text-text">{item.title}</span>
                <span className="text-[12.5px] leading-[1.45] text-text-muted">{item.desc}</span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-pressed={inputs.includeCreatine}
                className={cx(
                  'rounded-full border px-3 py-[7px] font-sans text-[12px] font-semibold transition-colors duration-150 hover:border-accent',
                  inputs.includeCreatine ? 'border-accent bg-accent text-bg' : 'border-border bg-white text-accent-deep'
                )}
                onClick={() => patch({ includeCreatine: !inputs.includeCreatine })}
              >
                Creatine
              </button>
              <button
                type="button"
                aria-pressed={inputs.includeCollagen}
                className={cx(
                  'rounded-full border px-3 py-[7px] font-sans text-[12px] font-semibold transition-colors duration-150 hover:border-accent',
                  inputs.includeCollagen ? 'border-accent bg-accent text-bg' : 'border-border bg-white text-accent-deep'
                )}
                onClick={() => patch({ includeCollagen: !inputs.includeCollagen })}
              >
                Collagen
              </button>
              <button
                type="button"
                aria-pressed={inputs.includeBoosters}
                className={cx(
                  'rounded-full border px-3 py-[7px] font-sans text-[12px] font-semibold transition-colors duration-150 hover:border-accent',
                  inputs.includeBoosters ? 'border-accent bg-accent text-bg' : 'border-border bg-white text-accent-deep'
                )}
                onClick={() => patch({ includeBoosters: !inputs.includeBoosters })}
              >
                Taurine / glutamine
              </button>
            </div>

            <div className="mb-3 flex flex-col gap-[7px] rounded-2xl bg-text px-4 py-3">
              {phaseList.map((p) => {
                const active = phase === p;
                const info = fieldMeta(p, inputs, unitSystem);
                const displayValue = p === 'bodyweight' ? bodyweightValue : info.value;
                return (
                  <button
                    key={p}
                    type="button"
                    className="flex cursor-pointer items-baseline justify-between gap-3 border-0 bg-transparent p-0 text-left"
                    onClick={() => setPhase(p)}
                  >
                    <span
                      className={cx(
                        'font-sans text-[9.5px] font-extrabold uppercase tracking-[0.18em]',
                        active ? 'text-amber' : 'text-bg/50'
                      )}
                    >
                      {info.label}
                    </span>
                    <span className="flex items-baseline gap-[5px]">
                      <span className="font-serif text-[20px] leading-none text-bg">{displayValue}</span>
                      <span
                        aria-hidden="true"
                        className={cx('font-serif text-[20px] text-accent', active ? 'animate-[rdb-caret-blink_1s_step-end_infinite]' : 'opacity-0')}
                      >
                        |
                      </span>
                      <span className={cx('font-sans text-[10.5px] font-semibold', active ? 'text-bg/50' : 'text-bg/30')}>
                        {info.unit}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {isNumericPhase ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '→'].map((key) => {
                    const isBackspace = key === '⌫';
                    const isEnter = key === '→';
                    return (
                      <button
                        key={key}
                        type="button"
                        className={cx(
                          'flex h-[58px] items-center justify-center rounded-[14px] border p-0 font-sans text-[24px] font-semibold transition-colors duration-150 lg:h-[62px]',
                          isEnter
                            ? 'border-accent bg-accent text-bg hover:bg-accent-deep active:bg-accent-deep'
                            : isBackspace
                              ? 'border-border bg-bg-soft text-accent-deep hover:border-accent active:border-accent active:bg-accent active:text-bg'
                              : 'border-border bg-white text-text hover:border-accent-deep active:border-accent active:bg-accent active:text-bg'
                        )}
                        onClick={() => {
                          if (isBackspace) tapBackspace();
                          else if (isEnter) commitNumeric();
                          else tapDigit(key);
                        }}
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
                <p className="mx-0.5 mb-0 mt-2.5 text-[12px] leading-[1.5] text-text-muted">
                  In {unitSystem === 'metric' ? 'kilograms' : 'pounds'}. Used to size your carb, protein and sodium targets.
                </p>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                {optionsFor(phase).map((opt) => {
                  const currentValue = fieldMeta(phase, inputs, unitSystem).value;
                  const active = currentValue === opt.label;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={cx(
                        'flex min-h-[54px] items-center justify-between rounded-[14px] border px-[18px] py-2 text-left font-sans transition-colors duration-150 hover:border-accent',
                        active ? 'border-accent bg-bg-soft' : 'border-border bg-white'
                      )}
                      onClick={() => selectOption(opt.key)}
                    >
                      <span className="text-[15.5px] font-semibold text-text">{opt.label}</span>
                      {opt.desc && <span className="ml-3 max-w-[55%] text-[12px] leading-snug text-text-muted">{opt.desc}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-[5px]">
              {[
                SESSION_CARDS.find((s) => s.key === inputs.sessionType)?.title ?? '',
                `${Math.round(displayWeight(inputs.bodyweightKg, unitSystem))} ${weightUnit}`,
                DEPLETION_LEVELS[inputs.depletion].label,
                `${SWEAT_LABELS[inputs.sweat]} sweat`,
              ].map((label) => (
                <span key={label} className="rounded-full border border-border bg-bg-soft px-2.5 py-[5px] font-sans text-[11px] font-semibold text-green">
                  {label}
                </span>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-paper-warm p-5">
              <h3 className="m-0 font-sans text-sm font-extrabold uppercase tracking-[0.1em] text-text">Your recipe</h3>
              <ul className="m-0 mt-3 list-none space-y-2 p-0 font-sans text-[14px]">
                <li>
                  <strong>{volumeLabel(recipe.waterMl, unitSystem)}</strong> water
                </li>
                <li>
                  <strong>{recipe.carbs.maltodextrinG} g</strong> maltodextrin
                </li>
                <li>
                  <strong>{recipe.carbs.fructoseG} g</strong> fructose
                </li>
                {recipe.carbs.hbcdG > 0 && (
                  <li>
                    <strong>{recipe.carbs.hbcdG} g</strong> cyclic dextrin (HBCD)
                  </li>
                )}
                <li>
                  <strong>{recipe.wheyG} g</strong> whey isolate
                </li>
                {recipe.collagenG > 0 && (
                  <li>
                    <strong>{recipe.collagenG} g</strong> collagen peptides
                  </li>
                )}
                {recipe.creatineG > 0 && (
                  <li>
                    <strong>{recipe.creatineG} g</strong> creatine monohydrate
                  </li>
                )}
                {recipe.taurineG > 0 && (
                  <li>
                    <strong>{recipe.taurineG} g</strong> taurine
                  </li>
                )}
                {recipe.glutamineG > 0 && (
                  <li>
                    <strong>{recipe.glutamineG} g</strong> L-glutamine
                  </li>
                )}
                <li>
                  Electrolytes: <strong>{electrolyteLine}</strong>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-white p-4 font-sans text-[14px]">
              <ul className="m-0 list-none space-y-1.5 p-0">
                <li>
                  Total carbs: <strong>{recipe.carbs.totalG} g</strong> ({recipe.carbs.gPerKg.toFixed(2)} g/kg)
                </li>
                <li>
                  Total protein: <strong>{recipe.proteinG} g</strong>
                </li>
                <li>
                  Carb : protein: <strong>{(recipe.carbs.totalG / recipe.proteinG).toFixed(1)} : 1</strong>
                </li>
                <li>
                  Sodium: <strong>~{Math.round(recipe.electrolytes.sodiumMg)} mg</strong>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-white p-4 font-sans text-[14px]">
              <div className="flex items-baseline justify-between gap-3">
                <span>Indicative cost / serving</span>
                <strong>
                  {cost.currency}
                  {cost.withSelectedElectrolyte.toFixed(2)}
                </strong>
              </div>
              <p className="m-0 mt-2 font-sans text-[12.5px] text-text-muted">
                With LMNT: {cost.currency}
                {cost.withLmnt.toFixed(2)} · with DIY electrolytes: {cost.currency}
                {cost.withDiy.toFixed(2)} — bulk-price based, not a fixed quote.
              </p>
            </div>

            <p className="m-0 rounded-lg border border-border bg-bg-soft p-4 font-sans text-[13px] leading-relaxed text-text-muted">
              {why}
            </p>

            <div className="flex flex-col gap-2 pb-1.5">
              <button type="button" onClick={copy} className="fuel-btn fuel-btn-accent w-full border-0 text-[15px]">
                {copied ? 'Copied — paste anywhere' : 'Copy recipe'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
