// Recovery Drink Builder — third React island (recovery-drink-builder-BUILD-INSTRUCTIONS.md §4).
// Live-updating form + recipe/cost panel, mirroring PromptGenerator.tsx's layout and controls.
import { useMemo, useState, type KeyboardEvent } from 'react';
import {
  DEPLETION_LEVELS,
  ELECTROLYTE_SOURCES,
  GOALS,
  SESSION_TYPES,
  SWEAT_LABELS,
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

const stepEyebrowCls = 'font-sans text-[12px] font-extrabold uppercase tracking-[0.18em] text-accent';
const stepHelperCls = 'font-body text-[15px] text-text-muted';
const fieldLabelCls = 'font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted';
const fieldInputCls =
  'w-full rounded-[10px] border border-border bg-white px-3.5 py-[11px] font-body text-[16px] text-text';

const chipCls = (active: boolean) =>
  `rounded-full border px-4 py-[9px] font-sans text-[13.5px] font-semibold transition-colors duration-150 ${
    active ? 'border-accent bg-accent text-bg' : 'border-border bg-white text-text hover:border-accent'
  }`;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const blockNonDigitKeys = (e: KeyboardEvent<HTMLInputElement>) => {
  if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
};

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

function SegmentedGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ key: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      <span className={fieldLabelCls}>{label}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            aria-pressed={value === opt.key}
            className={chipCls(value === opt.key)}
            onClick={() => onChange(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RecoveryDrinkBuilder() {
  const [inputs, setInputs] = useState<RecoveryInputs>(INITIAL_INPUTS);
  const [copied, setCopied] = useState(false);
  const [unitSystem, setUnitSystem] = useUnitSystem();
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

  return (
    <div>
      <UnitToggle value={unitSystem} onChange={setUnitSystem} />
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* LEFT: the form */}
        <div className="flex min-w-0 flex-col gap-11">
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5 border-b border-border pb-3">
              <p className={stepEyebrowCls}>Step 1 · You and your session</p>
              <p className={stepHelperCls}>Bodyweight and session profile drive your carb and protein targets.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-[7px]">
                <span className={fieldLabelCls}>Bodyweight</span>
                <span className="relative block">
                  <input
                    type="number"
                    min={bounds.min}
                    max={bounds.max}
                    className={`${fieldInputCls} pr-12`}
                    value={Math.round(displayWeight(inputs.bodyweightKg, unitSystem))}
                    onKeyDown={blockNonDigitKeys}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      patch({ bodyweightKg: Number.isFinite(raw) ? weightToKg(raw, unitSystem) : 0 });
                    }}
                    onBlur={(e) => {
                      const raw = clamp(Number(e.target.value) || bounds.min, bounds.min, bounds.max);
                      patch({ bodyweightKg: weightToKg(raw, unitSystem) });
                    }}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-sans text-[12px] text-text-muted">
                    {weightUnit}
                  </span>
                </span>
              </label>
            </div>

            <SegmentedGroup
              label="Session type"
              value={inputs.sessionType}
              onChange={(v: SessionType) => patch({ sessionType: v })}
              options={(Object.keys(SESSION_TYPES) as SessionType[]).map((key) => ({
                key,
                label: SESSION_TYPES[key].label,
              }))}
            />

            <SegmentedGroup
              label="Session intensity / depletion"
              value={inputs.depletion}
              onChange={(v: Depletion) => patch({ depletion: v })}
              options={(Object.keys(DEPLETION_LEVELS) as Depletion[]).map((key) => ({
                key,
                label: DEPLETION_LEVELS[key].label,
              }))}
            />

            <SegmentedGroup
              label="Sweat level"
              value={inputs.sweat}
              onChange={(v: SweatLevel) => patch({ sweat: v })}
              options={(Object.keys(SWEAT_LABELS) as SweatLevel[]).map((key) => ({
                key,
                label: SWEAT_LABELS[key],
              }))}
            />

            <SegmentedGroup
              label="Goal emphasis"
              value={inputs.goal}
              onChange={(v: Goal) => patch({ goal: v })}
              options={(Object.keys(GOALS) as Goal[]).map((key) => ({ key, label: GOALS[key].label }))}
            />
          </section>

          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5 border-b border-border pb-3">
              <p className={stepEyebrowCls}>Step 2 · Extras</p>
              <p className={stepHelperCls}>Toggle what goes in, and how you'll cover electrolytes.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={inputs.includeCreatine}
                className={chipCls(inputs.includeCreatine)}
                onClick={() => patch({ includeCreatine: !inputs.includeCreatine })}
              >
                Include creatine
              </button>
              <button
                type="button"
                aria-pressed={inputs.includeCollagen}
                className={chipCls(inputs.includeCollagen)}
                onClick={() => patch({ includeCollagen: !inputs.includeCollagen })}
              >
                Include collagen
              </button>
              <button
                type="button"
                aria-pressed={inputs.includeBoosters}
                className={chipCls(inputs.includeBoosters)}
                onClick={() => patch({ includeBoosters: !inputs.includeBoosters })}
              >
                Taurine / glutamine boosters
              </button>
            </div>

            <SegmentedGroup
              label="Electrolyte source"
              value={inputs.electrolyteSource}
              onChange={(v: ElectrolyteSource) => patch({ electrolyteSource: v })}
              options={(Object.keys(ELECTROLYTE_SOURCES) as ElectrolyteSource[]).map((key) => ({
                key,
                label: ELECTROLYTE_SOURCES[key].label,
              }))}
            />
          </section>
        </div>

        {/* RIGHT: sticky recipe panel */}
        <aside className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-[18px]">
            <p className="font-sans text-[12px] font-extrabold uppercase tracking-[0.18em] text-accent">
              Your recipe
            </p>
            <div className="flex items-center gap-1.5 font-sans text-[12px] font-semibold text-green">
              <span className="inline-block h-[7px] w-[7px] rounded-full bg-green" />
              Updates live
            </div>
          </div>

          <div className="flex flex-col gap-3 px-5 py-[18px] font-body text-[14.5px] text-text">
            <div className="flex justify-between gap-3">
              <span>Water</span>
              <span className="font-semibold">{volumeLabel(recipe.waterMl, unitSystem)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Maltodextrin</span>
              <span className="font-semibold">{recipe.carbs.maltodextrinG} g</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Fructose</span>
              <span className="font-semibold">{recipe.carbs.fructoseG} g</span>
            </div>
            {recipe.carbs.hbcdG > 0 && (
              <div className="flex justify-between gap-3">
                <span>Cyclic dextrin (HBCD)</span>
                <span className="font-semibold">{recipe.carbs.hbcdG} g</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span>Whey isolate</span>
              <span className="font-semibold">{recipe.wheyG} g</span>
            </div>
            {recipe.collagenG > 0 && (
              <div className="flex justify-between gap-3">
                <span>Collagen peptides</span>
                <span className="font-semibold">{recipe.collagenG} g</span>
              </div>
            )}
            {recipe.creatineG > 0 && (
              <div className="flex justify-between gap-3">
                <span>Creatine monohydrate</span>
                <span className="font-semibold">{recipe.creatineG} g</span>
              </div>
            )}
            {recipe.taurineG > 0 && (
              <div className="flex justify-between gap-3">
                <span>Taurine</span>
                <span className="font-semibold">{recipe.taurineG} g</span>
              </div>
            )}
            {recipe.glutamineG > 0 && (
              <div className="flex justify-between gap-3">
                <span>L-glutamine</span>
                <span className="font-semibold">{recipe.glutamineG} g</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span>Electrolytes</span>
              <span className="font-semibold">{electrolyteLine}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border bg-bg-soft px-5 py-[18px] font-body text-[14px] text-text">
            <div className="flex justify-between gap-3">
              <span>Total carbs</span>
              <span className="font-semibold">
                {recipe.carbs.totalG} g ({recipe.carbs.gPerKg.toFixed(2)} g/kg)
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Total protein</span>
              <span className="font-semibold">{recipe.proteinG} g</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Carb : protein</span>
              <span className="font-semibold">{(recipe.carbs.totalG / recipe.proteinG).toFixed(1)} : 1</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Sodium</span>
              <span className="font-semibold">~{Math.round(recipe.electrolytes.sodiumMg)} mg</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-border pt-2 mt-1">
              <span>Indicative cost / serving</span>
              <span className="font-semibold">
                {cost.currency}
                {cost.withSelectedElectrolyte.toFixed(2)}
              </span>
            </div>
            <p className="m-0 font-body text-[12.5px] text-text-muted">
              With LMNT: {cost.currency}
              {cost.withLmnt.toFixed(2)} · with DIY electrolytes: {cost.currency}
              {cost.withDiy.toFixed(2)} — bulk-price based, not a fixed quote.
            </p>
          </div>

          <p className="m-0 border-t border-border px-5 py-[14px] font-body text-[13px] leading-relaxed text-text-muted">
            {why}
          </p>

          <div className="flex flex-col gap-2.5 border-t border-border px-5 py-[18px]">
            <button type="button" onClick={copy} className="fuel-btn fuel-btn-accent w-full border-0 text-[14px]">
              {copied ? 'Copied — paste anywhere' : 'Copy recipe'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
