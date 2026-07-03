// AI Race Fuel Prompt Generator — second React island (brief §8).
// Questionnaire → six prompt templates → copy to clipboard.
// All prompt text is assembled in src/lib/promptBuilder.ts.
import { useMemo, useState } from 'react';
import {
  SPORT_PRESETS,
  defaultCarbsPerHour,
  type SportKey,
  type SweatLevel,
} from '../../data/defaults';
import {
  PROMPT_TYPES,
  buildPrompt,
  type Budget,
  type Container,
  type Preference,
  type PromptAnswers,
  type PromptType,
} from '../../lib/promptBuilder';

const labelCls = 'block font-sans text-[11px] font-extrabold uppercase tracking-[0.12em] text-text-muted mb-1';
const inputCls =
  'w-full rounded-lg border border-border bg-white px-3 py-2 font-sans text-sm text-text';
const chipCls = (active: boolean) =>
  `rounded-full border px-3.5 py-2 font-sans text-[13px] font-bold transition-colors ${
    active
      ? 'border-accent bg-accent text-white'
      : 'border-border bg-white text-text-muted hover:border-accent-deep hover:text-text'
  }`;

const INITIAL: PromptAnswers = {
  sport: 'marathon',
  durationMin: SPORT_PRESETS.marathon.durationMin,
  weightKg: 70,
  carbsPerHour: defaultCarbsPerHour(SPORT_PRESETS.marathon.durationMin),
  sweat: 'medium',
  sensitiveStomach: false,
  usesCaffeine: false,
  country: '',
  budget: 'value',
  preference: 'both',
  container: 'bottles',
};

export default function PromptGenerator() {
  const [answers, setAnswers] = useState<PromptAnswers>(INITIAL);
  const [type, setType] = useState<PromptType>('find-gels');
  const [copied, setCopied] = useState(false);
  const patch = (p: Partial<PromptAnswers>) => setAnswers((a) => ({ ...a, ...p }));

  const prompt = useMemo(() => buildPrompt(type, answers), [type, answers]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — user can select the text manually */
    }
  };

  return (
    <div className="fuel-card mt-8 p-5 sm:p-7">
      {/* Step 1: prompt type */}
      <p className={labelCls}>1 · What do you want your AI to do?</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="tablist" aria-label="Prompt type">
        {(Object.keys(PROMPT_TYPES) as PromptType[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={type === key}
            onClick={() => setType(key)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              type === key
                ? 'border-accent bg-accent text-white'
                : 'border-border bg-white hover:border-accent-deep'
            }`}
          >
            <span className={`block font-sans text-[13px] font-extrabold ${type === key ? '' : 'text-text'}`}>
              {PROMPT_TYPES[key].label}
            </span>
            <span
              className={`mt-1 block font-sans text-[11.5px] leading-snug ${
                type === key ? 'opacity-90' : 'text-text-muted'
              }`}
            >
              {PROMPT_TYPES[key].blurb}
            </span>
          </button>
        ))}
      </div>

      {/* Step 2: questionnaire */}
      <p className={`${labelCls} mt-6`}>2 · About you and your event</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {(Object.keys(SPORT_PRESETS) as Array<keyof typeof SPORT_PRESETS>).map((key) => (
          <button
            key={key}
            type="button"
            className={chipCls(answers.sport === key)}
            onClick={() =>
              patch({
                sport: key,
                durationMin: SPORT_PRESETS[key].durationMin,
                carbsPerHour: defaultCarbsPerHour(SPORT_PRESETS[key].durationMin),
              })
            }
          >
            {SPORT_PRESETS[key].label}
          </button>
        ))}
        <button type="button" className={chipCls(answers.sport === 'custom')} onClick={() => patch({ sport: 'custom' })}>
          Custom
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <label className={labelCls} htmlFor="pg-duration">
            Expected duration (min)
          </label>
          <input
            id="pg-duration"
            type="number"
            min="20"
            max="1440"
            className={inputCls}
            value={answers.durationMin}
            onChange={(e) => {
              const durationMin = Math.max(20, Number(e.target.value) || 20);
              patch({ sport: 'custom', durationMin, carbsPerHour: defaultCarbsPerHour(durationMin) });
            }}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="pg-weight">
            Bodyweight (kg)
          </label>
          <input
            id="pg-weight"
            type="number"
            min="30"
            max="200"
            className={inputCls}
            value={answers.weightKg}
            onChange={(e) => patch({ weightKg: Math.max(30, Number(e.target.value) || 30) })}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="pg-carbs">
            Target carbs g/hour
          </label>
          <input
            id="pg-carbs"
            type="number"
            min="10"
            max="150"
            className={inputCls}
            value={answers.carbsPerHour}
            onChange={(e) => patch({ carbsPerHour: Math.max(10, Number(e.target.value) || 10) })}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="pg-sweat">
            Sweat level
          </label>
          <select
            id="pg-sweat"
            className={inputCls}
            value={answers.sweat}
            onChange={(e) => patch({ sweat: e.target.value as SweatLevel })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High / hot venue</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="pg-country">
            Country
          </label>
          <input
            id="pg-country"
            type="text"
            placeholder="e.g. Ireland"
            className={inputCls}
            value={answers.country}
            onChange={(e) => patch({ country: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="pg-budget">
            Budget
          </label>
          <select
            id="pg-budget"
            className={inputCls}
            value={answers.budget}
            onChange={(e) => patch({ budget: e.target.value as Budget })}
          >
            <option value="value">Budget-focused</option>
            <option value="mid">Balanced</option>
            <option value="premium">Premium okay</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="pg-pref">
            Commercial vs DIY
          </label>
          <select
            id="pg-pref"
            className={inputCls}
            value={answers.preference}
            onChange={(e) => patch({ preference: e.target.value as Preference })}
          >
            <option value="both">Open to both</option>
            <option value="commercial">Prefer commercial</option>
            <option value="diy">Prefer DIY</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="pg-container">
            Fuel carrier
          </label>
          <select
            id="pg-container"
            className={inputCls}
            value={answers.container}
            onChange={(e) => patch({ container: e.target.value as Container })}
          >
            <option value="bottles">Bottles (drink mix)</option>
            <option value="soft-flasks">Soft flasks (syrup)</option>
            <option value="gels-only">Gels only</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
        <label className="flex cursor-pointer items-center gap-2 font-sans text-[13px] font-bold text-text">
          <input
            type="checkbox"
            checked={answers.sensitiveStomach}
            onChange={(e) => patch({ sensitiveStomach: e.target.checked })}
          />
          Sensitive stomach
        </label>
        <label className="flex cursor-pointer items-center gap-2 font-sans text-[13px] font-bold text-text">
          <input
            type="checkbox"
            checked={answers.usesCaffeine}
            onChange={(e) => patch({ usesCaffeine: e.target.checked })}
          />
          I use caffeine
        </label>
      </div>

      {/* Step 3: generated prompt */}
      <p className={`${labelCls} mt-6`}>3 · Your prompt — copy it into Claude, ChatGPT or any AI assistant</p>
      <div className="rounded-lg border border-border bg-paper-warm p-4">
        <pre className="m-0 max-h-96 overflow-auto whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-text">
          {prompt}
        </pre>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="button" onClick={copy} className="fuel-btn fuel-btn-accent border-0 text-[14px]">
          {copied ? 'Prompt copied ✓' : 'Copy prompt'}
        </button>
        <p className="m-0 font-sans text-[12px] text-text-muted">
          The prompt updates live as you change your answers above.
        </p>
      </div>
      <p className="mb-0 mt-4 font-sans text-[12px] leading-relaxed text-text-muted">
        Whatever your AI suggests is a starting point to test in training — never race on something new.
      </p>
    </div>
  );
}
