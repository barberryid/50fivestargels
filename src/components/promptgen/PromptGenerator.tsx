import { useMemo, useState } from 'react';
import { copyToClipboard } from '../../lib/clipboard';

type Step = 1 | 2 | 3;
type TaskKey = 'find' | 'compare' | 'marathon' | 'hyrox' | 'gi' | 'checklist';
type EventKey = 'half' | 'marathon' | 'hyrox' | 'long' | 'custom';
type Phase = 'duration' | 'bodyweight' | 'carbs' | 'sweat';
type SweatKey = 'low' | 'medium' | 'high';
type Units = 'kg' | 'lb';

const TASKS: Array<{ key: TaskKey; title: string; desc: string }> = [
  {
    key: 'find',
    title: 'Find gels I can buy in my country',
    desc: 'Current availability and prices where you live, ranked by cost per gram of carb.',
  },
  {
    key: 'compare',
    title: 'Compare commercial gels vs DIY',
    desc: 'An honest buy/make/both comparison for your training and racing.',
  },
  {
    key: 'marathon',
    title: 'Build my marathon fuelling plan',
    desc: 'Carb loading, race morning, per-hour intake and contingencies.',
  },
  {
    key: 'hyrox',
    title: 'Build my HYROX fuelling plan',
    desc: 'Pre-race-first plan — most races need little or nothing mid-race.',
  },
  {
    key: 'gi',
    title: 'Troubleshoot stomach problems',
    desc: 'Work through GI issues with your fuelling, step by step.',
  },
  {
    key: 'checklist',
    title: 'Create my race-day checklist',
    desc: 'A T-3h-to-finish fuelling checklist you can print.',
  },
];

const EVENTS: Array<{ key: EventKey; label: string; mins: string }> = [
  { key: 'half', label: 'Half marathon', mins: '105' },
  { key: 'marathon', label: 'Marathon', mins: '240' },
  { key: 'hyrox', label: 'HYROX', mins: '75' },
  { key: 'long', label: 'Long training run', mins: '120' },
  { key: 'custom', label: 'Custom', mins: '' },
];

const SWEATS: Array<{ key: SweatKey; label: string; desc: string }> = [
  { key: 'low', label: 'Low', desc: '~300 mg sodium/h' },
  { key: 'medium', label: 'Medium', desc: '~650 mg sodium/h' },
  { key: 'high', label: 'High', desc: '~1000 mg sodium/h' },
];

const OPENERS: Record<TaskKey, string> = {
  find:
    'You are a pragmatic sports-nutrition assistant. Find energy gels I can actually buy in my country right now — current availability and prices where I live — and rank them by cost per gram of carbohydrate. Include where to buy each one and flag anything frequently out of stock.',
  compare:
    'You are a pragmatic sports-nutrition assistant. Give me an honest comparison of commercial energy gels versus DIY alternatives (maltodextrin/fructose mixes) for my training and racing: cost per gram of carb, convenience, GI risk, and when each makes sense. End with a clear buy/make/both recommendation.',
  marathon:
    'You are a pragmatic sports-nutrition assistant. Build my complete marathon fuelling plan: carb loading in the final 48 h, race morning breakfast and timing, per-hour intake during the race with exact gel timings, and contingencies for cramping, nausea or a missed aid station.',
  hyrox:
    'You are a pragmatic sports-nutrition assistant. Build my HYROX fuelling plan, pre-race-first — most races this length need little or nothing mid-race. Cover the final 24 h, the last 3 h before the start, and whether mid-race fuel is worth it at my duration.',
  gi:
    'You are a pragmatic sports-nutrition assistant. Help me troubleshoot stomach problems with my race fuelling, step by step. Work through the most likely causes in order (concentration, timing, fructose ratio, caffeine, dehydration), and give me one change to test per training session.',
  checklist:
    'You are a pragmatic sports-nutrition assistant. Create my race-day fuelling checklist from T-3 hours to the finish, as a printable timeline: what to eat and drink, exact times, quantities in grams and millilitres, and what to pack.',
};

const STEP_META: Record<Step, { eyebrow: string; title: string; sub: string }> = {
  1: {
    eyebrow: 'STEP 1 · WHAT SHOULD THE AI DO?',
    title: 'Pick one task',
    sub: 'The prompt is rebuilt around it. Everything else is three numbers and a tap.',
  },
  2: {
    eyebrow: 'STEP 2 · YOU AND YOUR EVENT',
    title: 'Type your numbers',
    sub: 'Big keys, no keyboard. Entry advances on its own when a value makes sense.',
  },
  3: {
    eyebrow: 'STEP 3 · YOUR PROMPT',
    title: 'Copy and paste into any AI',
    sub: 'A specific, guard-railed prompt built from your numbers. Works in Claude or ChatGPT.',
  },
};

const CARB_PRESETS = [
  { label: 'Cautious · 45', value: '45' },
  { label: 'Standard · 60', value: '60' },
  { label: 'Trained · 90', value: '90' },
];

const phaseOrder: Phase[] = ['duration', 'bodyweight', 'carbs', 'sweat'];

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export default function PromptGenerator({ units = 'kg', autoAdvance = true }: { units?: Units; autoAdvance?: boolean }) {
  const [step, setStep] = useState<Step>(1);
  const [task, setTask] = useState<TaskKey | null>(null);
  const [eventKey, setEventKey] = useState<EventKey | null>(null);
  const [duration, setDuration] = useState('');
  const [bodyweight, setBodyweight] = useState('');
  const [carbs, setCarbs] = useState('');
  const [sweat, setSweat] = useState<SweatKey | null>(null);
  const [phase, setPhase] = useState<Phase>('duration');
  const [copied, setCopied] = useState(false);

  const meta = STEP_META[step];
  const selectedTask = TASKS.find((item) => item.key === task) ?? TASKS[0];
  const selectedEvent = EVENTS.find((item) => item.key === eventKey);
  const selectedSweat = SWEATS.find((item) => item.key === sweat) ?? SWEATS[1];

  const advancePhase = () => {
    setPhase((current) => phaseOrder[Math.min(phaseOrder.indexOf(current) + 1, phaseOrder.length - 1)]);
  };

  const setFieldValue = (field: Phase, value: string) => {
    if (field === 'duration') setDuration(value);
    if (field === 'bodyweight') setBodyweight(value);
    if (field === 'carbs') setCarbs(value);
  };

  const fieldValue = (field: Phase) => {
    if (field === 'duration') return duration;
    if (field === 'bodyweight') return bodyweight;
    if (field === 'carbs') return carbs;
    return sweat ? selectedSweat.label : '';
  };

  const tapDigit = (digit: string) => {
    if (phase === 'sweat') return;
    const next = (fieldValue(phase) + digit).replace(/^0+(?=\d)/, '').slice(0, 3);
    setFieldValue(phase, next);
    setCopied(false);

    if (!autoAdvance) return;
    const n = Number.parseInt(next, 10) || 0;
    const len = next.length;
    const done =
      (phase === 'duration' && len === 3) ||
      (phase === 'bodyweight' && (len === 3 || (units === 'kg' && len === 2 && n >= 40))) ||
      (phase === 'carbs' && (len === 3 || (len === 2 && n >= 30)));

    if (done) advancePhase();
  };

  const tapBackspace = () => {
    if (phase === 'sweat') return;
    setFieldValue(phase, fieldValue(phase).slice(0, -1));
    setCopied(false);
  };

  const tapEnter = () => {
    if (phase === 'sweat') return;
    if ((Number.parseInt(fieldValue(phase), 10) || 0) > 0) advancePhase();
  };

  const promptText = useMemo(() => {
    const durationNum = Number.parseInt(duration, 10) || 0;
    const carbsNum = Number.parseInt(carbs, 10) || 0;
    const hours = Math.round((durationNum / 60) * 10) / 10;
    const totalCarbs = Math.round(carbsNum * hours);
    const eventName = selectedEvent && selectedEvent.key !== 'custom' ? selectedEvent.label.toLowerCase() : 'endurance event';

    const me = `About me and my event:
- Event: ${eventName}, expected duration ${duration || '0'} minutes (~${hours} h)
- Bodyweight: ${bodyweight || '0'} ${units}
- Target carb intake: ${carbs || '0'} g/h (~${totalCarbs} g total for the event)
- Sweat level: ${selectedSweat.label.toLowerCase()} (${selectedSweat.desc.replace('~', 'approximately ')})`;

    const guard = `Rules:
- Be specific: name real products, real prices in my local currency, real doses.
- State drawbacks plainly. No marketing language, no "ultimate" anything.
- If something depends on information you don't have, ask me before guessing.
- Exclude anything with caffeine unless I say otherwise.`;

    return `${OPENERS[selectedTask.key]}\n\n${me}\n\n${guard}`;
  }, [bodyweight, carbs, duration, selectedEvent, selectedSweat, selectedTask, units]);

  const copy = async () => {
    if (await copyToClipboard(promptText)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  const restart = () => {
    setStep(1);
    setTask(null);
    setEventKey(null);
    setDuration('');
    setBodyweight('');
    setCarbs('');
    setSweat(null);
    setPhase('duration');
    setCopied(false);
  };

  const back = () => {
    if (step === 3) {
      setStep(2);
      setPhase('sweat');
      return;
    }
    setStep(1);
  };

  const fields = [
    { key: 'duration' as const, label: 'Expected duration', unit: 'min', value: duration },
    { key: 'bodyweight' as const, label: 'Bodyweight', unit: units, value: bodyweight },
    { key: 'carbs' as const, label: 'Target carbs', unit: 'g/h', value: carbs },
    { key: 'sweat' as const, label: 'Sweat level', unit: '', value: sweat ? selectedSweat.label : '' },
  ];

  const padHint =
    phase === 'duration'
      ? 'Minutes, door to finish. Picking an event above fills a sensible number — adjust anything.'
      : phase === 'bodyweight'
        ? `In ${units === 'kg' ? 'kilograms' : 'pounds'}. Used to sanity-check your carb and sodium ranges.`
        : phase === 'carbs'
          ? 'Most runners handle 45–60 g/h. Above 90 g/h needs practice in training.'
          : '';

  return (
    <div
      className="min-h-screen bg-[#fdfaf3] px-4 py-6 text-[#15201d] sm:px-6"
      style={{ fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif' }}
    >
      <style>{`
        @keyframes rf-caret-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
      `}</style>
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[390px] flex-col">
        <div className="mb-2.5 flex items-center gap-2">
          <img src="/images/logo-star.svg" alt="" className="h-[22px] w-[22px]" />
          <span
            className="text-[16px] font-semibold tracking-[-0.015em] text-[#15201d]"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            50fivestargels
          </span>
        </div>

        <div className="mb-1 flex items-center gap-2.5">
          {step > 1 && (
            <button
              type="button"
              aria-label="Back"
              onClick={back}
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[#ddd6c4] bg-white p-0 text-[15px] text-[#8d3f1f] transition-colors duration-150 active:border-[#b85832] active:bg-[#f5f0e6]"
            >
              ←
            </button>
          )}
          <span className="font-sans text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#8d3f1f]">
            {meta.eyebrow}
          </span>
        </div>
        <h1
          className="m-0 text-[26px] font-semibold normal-case leading-[1.08] tracking-[-0.015em] text-[#15201d]"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', textTransform: 'none' }}
        >
          {meta.title}
        </h1>
        <p
          className="mb-3 mt-0 text-[13.5px] leading-[1.5] text-[#5c6762]"
          style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
        >
          {meta.sub}
        </p>

        {step === 1 && (
          <div className="flex flex-col gap-2">
            {TASKS.map((item) => (
              <button
                key={item.key}
                type="button"
                className="flex min-h-[60px] flex-col gap-[3px] rounded-[14px] border border-[#ddd6c4] bg-white px-3.5 py-3 text-left transition-colors duration-150 active:border-[#b85832] active:bg-[#f5f0e6]"
                onClick={() => {
                  setTask(item.key);
                  setStep(2);
                  setPhase('duration');
                  setCopied(false);
                }}
              >
                <span className="font-sans text-[14.5px] font-semibold leading-tight text-[#15201d]">{item.title}</span>
                <span
                  className="text-[12.5px] leading-[1.45] text-[#5c6762]"
                  style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
                >
                  {item.desc}
                </span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {EVENTS.map((event) => {
                const active = eventKey === event.key;
                return (
                  <button
                    key={event.key}
                    type="button"
                    aria-pressed={active}
                    className={cx(
                      'rounded-full border px-3 py-[7px] font-sans text-[12px] font-semibold transition-colors duration-150 active:border-[#b85832]',
                      active ? 'border-[#b85832] bg-[#b85832] text-[#fdfaf3]' : 'border-[#ddd6c4] bg-white text-[#8d3f1f]'
                    )}
                    onClick={() => {
                      setEventKey(event.key);
                      setDuration(event.mins);
                      setPhase(event.mins ? 'bodyweight' : 'duration');
                      setCopied(false);
                    }}
                  >
                    {event.label}
                  </button>
                );
              })}
            </div>

            <div className="mb-3 flex flex-col gap-[7px] rounded-2xl bg-[#15201d] px-4 py-3">
              {fields.map((field) => {
                const active = phase === field.key;
                const hasValue = field.value !== '';
                return (
                  <button
                    key={field.key}
                    type="button"
                    className="flex cursor-pointer items-baseline justify-between gap-3 border-0 bg-transparent p-0 text-left"
                    onClick={() => setPhase(field.key)}
                  >
                    <span
                      className={cx(
                        'font-sans text-[9.5px] font-extrabold uppercase tracking-[0.18em]',
                        active ? 'text-[#c49a3a]' : 'text-[rgba(244,239,228,0.5)]'
                      )}
                    >
                      {field.label}
                    </span>
                    <span className="flex items-baseline gap-[5px]">
                      <span
                        className={cx(
                          'text-[22px] font-semibold leading-none',
                          active || hasValue ? 'text-[#f4efe4]' : 'text-[rgba(244,239,228,0.3)]'
                        )}
                        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                      >
                        {hasValue ? field.value : '—'}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cx('text-[20px] text-[#b85832]', active ? 'animate-[rf-caret-blink_1s_step-end_infinite]' : 'opacity-0')}
                        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                      >
                        |
                      </span>
                      <span className={cx('font-sans text-[10.5px] font-semibold', active ? 'text-[rgba(244,239,228,0.5)]' : 'text-[rgba(244,239,228,0.3)]')}>
                        {field.unit}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {phase !== 'sweat' ? (
              <>
                {phase === 'carbs' && (
                  <div className="mb-2 flex gap-1.5">
                    {CARB_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        className="flex-1 rounded-full border border-[#ddd6c4] bg-[#f5f0e6] px-1 py-2 font-sans text-[11.5px] font-semibold text-[#8d3f1f] transition-colors duration-150 active:border-[#b85832] active:bg-[#b85832] active:text-[#fdfaf3]"
                        onClick={() => {
                          setCarbs(preset.value);
                          setPhase('sweat');
                          setCopied(false);
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '→'].map((key) => {
                    const isBackspace = key === '⌫';
                    const isEnter = key === '→';
                    return (
                      <button
                        key={key}
                        type="button"
                        className={cx(
                          'flex h-[58px] items-center justify-center rounded-[14px] border p-0 font-sans text-[24px] font-semibold transition-colors duration-150 active:border-[#b85832] active:bg-[#b85832] active:text-[#fdfaf3]',
                          isEnter
                            ? 'border-[#b85832] bg-[#b85832] text-[#fdfaf3]'
                            : isBackspace
                              ? 'border-[#ddd6c4] bg-[#f5f0e6] text-[#8d3f1f]'
                              : 'border-[#ddd6c4] bg-white text-[#15201d]'
                        )}
                        onClick={() => {
                          if (isBackspace) tapBackspace();
                          else if (isEnter) tapEnter();
                          else tapDigit(key);
                        }}
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
                <p
                  className="mx-0.5 mb-0 mt-2.5 text-[12px] leading-[1.5] text-[#5c6762]"
                  style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
                >
                  {padHint}
                </p>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {SWEATS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="flex h-[62px] items-center justify-between rounded-[14px] border border-[#ddd6c4] bg-white px-[18px] font-sans transition-colors duration-150 active:border-[#b85832] active:bg-[#b85832]"
                      onClick={() => {
                        setSweat(item.key);
                        setStep(3);
                        setCopied(false);
                      }}
                    >
                      <span className="text-[16px] font-semibold text-[#15201d]">{item.label}</span>
                      <span className="text-[12px] text-[#5c6762]" style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}>
                        {item.desc}
                      </span>
                    </button>
                  ))}
                </div>
                <p
                  className="mx-0.5 mb-0 mt-2.5 text-[12px] leading-[1.5] text-[#5c6762]"
                  style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
                >
                  Salt marks on your kit or cramping late in races usually means high.
                </p>
              </>
            )}
          </>
        )}

        {step === 3 && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-2.5 flex flex-wrap gap-[5px]">
              {[selectedTask.title, `${duration} min`, `${bodyweight} ${units}`, `${carbs} g/h · ${selectedSweat.label} sweat`].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-[#ddd6c4] bg-[#f5f0e6] px-2.5 py-[5px] font-sans text-[11px] font-semibold text-[#1f4c3b]"
                >
                  {label}
                </span>
              ))}
            </div>
            <div
              className="mb-3 min-h-[280px] flex-1 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-[#ddd6c4] bg-white px-4 py-3.5 text-[12.5px] leading-[1.65] text-[#283531]"
              style={{ fontFamily: '"Source Serif 4", Georgia, serif' }}
            >
              {promptText}
            </div>
            <div className="flex flex-col gap-2 pb-1.5">
              <button
                type="button"
                onClick={copy}
                className="flex w-full items-center justify-center rounded-[10px] border-0 bg-[#b85832] px-[26px] py-[15px] font-sans text-[15px] font-semibold text-[#fdfaf3] transition-colors duration-150 hover:bg-[#a64c29]"
              >
                {copied ? 'Copied — paste into your AI' : 'Copy prompt'}
              </button>
              <button
                type="button"
                onClick={restart}
                className="border-0 bg-transparent p-2 font-sans text-[13px] font-semibold text-[#8d3f1f]"
              >
                Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
