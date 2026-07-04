// AI Race Fuel Prompt Generator — second React island (brief §8).
// Questionnaire (goal → event/profile → preferences) with a sticky prompt
// panel that updates live, per design_handoff_prompt_creator/. All prompt
// text is assembled in src/lib/promptBuilder.ts.
import { useMemo, useState } from 'react';
import { SPORT_PRESETS, defaultCarbsPerHour, type SweatLevel } from '../../data/defaults';
import {
  PROMPT_TYPES,
  buildPrompt,
  type Budget,
  type Container,
  type Preference,
  type PromptAnswers,
  type PromptType,
} from '../../lib/promptBuilder';

const stepEyebrowCls = 'font-sans text-[12px] font-extrabold uppercase tracking-[0.18em] text-accent';
const stepHelperCls = 'font-body text-[15px] text-text-muted';
const fieldLabelCls = 'font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted';
const fieldInputCls =
  'w-full rounded-[10px] border border-border bg-white px-3.5 py-[11px] font-body text-[16px] text-text';

const chipCls = (active: boolean) =>
  `rounded-full border px-4 py-[9px] font-sans text-[13.5px] font-semibold transition-colors duration-150 ${
    active
      ? 'border-accent bg-accent text-bg'
      : 'border-border bg-white text-text hover:border-accent'
  }`;

const goalCardCls = (selected: boolean) =>
  `flex flex-col gap-2 rounded-[14px] border p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-150 ${
    selected
      ? 'border-[1.5px] border-accent bg-bg-soft shadow-[0_6px_18px_rgba(0,0,0,0.10)]'
      : 'border-border bg-white hover:border-accent-deep'
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

function fallbackCopy(text: string) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch {
    /* clipboard unavailable — user can select the text manually */
  }
  document.body.removeChild(ta);
}

export default function PromptGenerator() {
  const [answers, setAnswers] = useState<PromptAnswers>(INITIAL);
  const [type, setType] = useState<PromptType>('find-gels');
  const [copied, setCopied] = useState(false);
  const patch = (p: Partial<PromptAnswers>) => {
    setAnswers((a) => ({ ...a, ...p }));
    setCopied(false);
  };

  const prompt = useMemo(() => buildPrompt(type, answers), [type, answers]);
  const wordCount = useMemo(() => prompt.trim().split(/\s+/).length, [prompt]);

  const copy = () => {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(prompt).then(done).catch(() => {
        fallbackCopy(prompt);
        done();
      });
    } else {
      fallbackCopy(prompt);
      done();
    }
  };

  const showCountryHint = type === 'find-gels' && !answers.country.trim();

  return (
    <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
      {/* LEFT: the form */}
      <div className="flex min-w-0 flex-col gap-11">
        {/* Step 1 */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5 border-b border-border pb-3">
            <p className={stepEyebrowCls}>Step 1 · What should the AI do?</p>
            <p className={stepHelperCls}>Pick one task. The prompt is rebuilt around it.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" role="tablist" aria-label="Prompt type">
            {(Object.keys(PROMPT_TYPES) as PromptType[]).map((key) => {
              const selected = type === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-pressed={selected}
                  onClick={() => {
                    setType(key);
                    setCopied(false);
                  }}
                  className={goalCardCls(selected)}
                >
                  <span className="flex items-start justify-between gap-2.5">
                    <span className="font-sans text-[15px] font-bold leading-tight text-text">
                      {PROMPT_TYPES[key].label}
                    </span>
                    <span
                      className={`mt-[1px] box-border block h-4 w-4 flex-none rounded-full bg-white transition-[border] duration-150 ${
                        selected ? 'border-[5px] border-accent' : 'border-[1.5px] border-border-strong'
                      }`}
                    />
                  </span>
                  <span className="font-body text-[14px] leading-snug text-text-muted">
                    {PROMPT_TYPES[key].blurb}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2 */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5 border-b border-border pb-3">
            <p className={stepEyebrowCls}>Step 2 · You and your event</p>
            <p className={stepHelperCls}>Picking an event fills in a sensible duration — adjust anything.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(SPORT_PRESETS) as Array<keyof typeof SPORT_PRESETS>).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={answers.sport === key}
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
            <button
              type="button"
              aria-pressed={answers.sport === 'custom'}
              className={chipCls(answers.sport === 'custom')}
              onClick={() => patch({ sport: 'custom' })}
            >
              Custom
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-[7px]">
              <span className={fieldLabelCls}>Expected duration</span>
              <span className="relative block">
                <input
                  type="number"
                  min="20"
                  max="1440"
                  className={`${fieldInputCls} pr-12`}
                  value={answers.durationMin}
                  onChange={(e) => {
                    const durationMin = Math.max(20, Number(e.target.value) || 20);
                    patch({ sport: 'custom', durationMin, carbsPerHour: defaultCarbsPerHour(durationMin) });
                  }}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-sans text-[12px] text-text-muted">
                  min
                </span>
              </span>
            </label>
            <label className="flex flex-col gap-[7px]">
              <span className={fieldLabelCls}>Bodyweight</span>
              <span className="relative block">
                <input
                  type="number"
                  min="30"
                  max="200"
                  className={`${fieldInputCls} pr-12`}
                  value={answers.weightKg}
                  onChange={(e) => patch({ weightKg: Math.max(30, Number(e.target.value) || 30) })}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-sans text-[12px] text-text-muted">
                  kg
                </span>
              </span>
            </label>
            <label className="flex flex-col gap-[7px]">
              <span className={fieldLabelCls}>Target carbs</span>
              <span className="relative block">
                <input
                  type="number"
                  min="10"
                  max="150"
                  step={5}
                  className={`${fieldInputCls} pr-12`}
                  value={answers.carbsPerHour}
                  onChange={(e) => patch({ carbsPerHour: Math.max(10, Number(e.target.value) || 10) })}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-sans text-[12px] text-text-muted">
                  g/h
                </span>
              </span>
            </label>
            <label className="flex flex-col gap-[7px]">
              <span className={fieldLabelCls}>Sweat level</span>
              <select
                className={fieldInputCls}
                value={answers.sweat}
                onChange={(e) => patch({ sweat: e.target.value as SweatLevel })}
              >
                <option value="low">Low — barely salty</option>
                <option value="medium">Medium</option>
                <option value="high">High — salt-crusted kit</option>
              </select>
            </label>
          </div>
        </section>

        {/* Step 3 */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5 border-b border-border pb-3">
            <p className={stepEyebrowCls}>Step 3 · Your preferences</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-[7px]">
              <span className={fieldLabelCls}>Country</span>
              <input
                type="text"
                placeholder="e.g. Ireland"
                className={fieldInputCls}
                value={answers.country}
                onChange={(e) => patch({ country: e.target.value })}
              />
              {showCountryHint && (
                <span className="font-body text-[13px] text-accent">
                  Needed for local availability and prices — the AI can only rank what you can buy.
                </span>
              )}
            </label>
            <label className="flex flex-col gap-[7px]">
              <span className={fieldLabelCls}>Budget</span>
              <select
                className={fieldInputCls}
                value={answers.budget}
                onChange={(e) => patch({ budget: e.target.value as Budget })}
              >
                <option value="value">Budget-focused</option>
                <option value="mid">Balanced</option>
                <option value="premium">Price is no object</option>
              </select>
            </label>
            <label className="flex flex-col gap-[7px]">
              <span className={fieldLabelCls}>Commercial vs DIY</span>
              <select
                className={fieldInputCls}
                value={answers.preference}
                onChange={(e) => patch({ preference: e.target.value as Preference })}
              >
                <option value="both">Open to both</option>
                <option value="commercial">Commercial products only</option>
                <option value="diy">DIY / homemade only</option>
              </select>
            </label>
            <label className="flex flex-col gap-[7px]">
              <span className={fieldLabelCls}>Fuel carrier</span>
              <select
                className={fieldInputCls}
                value={answers.container}
                onChange={(e) => patch({ container: e.target.value as Container })}
              >
                <option value="bottles">Bottles (drink mix)</option>
                <option value="gels">Gels in pockets / belt</option>
                <option value="vest">Hydration vest</option>
                <option value="course">Whatever the course hands out</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={answers.sensitiveStomach}
              className={chipCls(answers.sensitiveStomach)}
              onClick={() => patch({ sensitiveStomach: !answers.sensitiveStomach })}
            >
              Sensitive stomach
            </button>
            <button
              type="button"
              aria-pressed={answers.usesCaffeine}
              className={chipCls(answers.usesCaffeine)}
              onClick={() => patch({ usesCaffeine: !answers.usesCaffeine })}
            >
              I use caffeine
            </button>
          </div>
        </section>
      </div>

      {/* RIGHT: sticky prompt panel */}
      <aside className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-[18px]">
          <p className="font-sans text-[12px] font-extrabold uppercase tracking-[0.18em] text-accent">Your prompt</p>
          <div className="flex items-center gap-1.5 font-sans text-[12px] font-semibold text-green">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-green" />
            Updates live
          </div>
        </div>
        <pre className="m-0 max-h-[56vh] overflow-y-auto whitespace-pre-wrap break-words bg-bg-soft p-5 font-mono text-[12.5px] leading-relaxed text-text">
          {prompt}
        </pre>
        <div className="flex flex-col gap-2.5 border-t border-border px-5 py-[18px]">
          <button type="button" onClick={copy} className="fuel-btn fuel-btn-accent w-full border-0 text-[14px]">
            {copied ? 'Copied — paste it into your AI' : 'Copy prompt'}
          </button>
          <p className="m-0 text-center font-body text-[13px] leading-relaxed text-text-muted">
            {wordCount} words · paste into Claude, ChatGPT or any assistant
          </p>
        </div>
      </aside>
    </div>
  );
}
