// Pure prompt-assembly logic for the AI Race Fuel Prompt Generator (brief §8).
// Kept free of UI state so the generated text is easy to review and test.

import { SODIUM_BY_SWEAT, SPORT_PRESETS, type SportKey, type SweatLevel } from '../data/defaults';

export type PromptType =
  | 'find-gels'
  | 'compare'
  | 'marathon-plan'
  | 'hyrox-plan'
  | 'troubleshoot'
  | 'checklist';

export type Budget = 'value' | 'mid' | 'premium';
export type Preference = 'commercial' | 'diy' | 'both';
export type Container = 'bottles' | 'gels' | 'vest' | 'course';

export interface PromptAnswers {
  sport: SportKey;
  durationMin: number;
  weightKg: number;
  carbsPerHour: number;
  sweat: SweatLevel;
  sensitiveStomach: boolean;
  usesCaffeine: boolean;
  country: string;
  budget: Budget;
  preference: Preference;
  container: Container;
}

export const PROMPT_TYPES: Record<PromptType, { label: string; blurb: string }> = {
  'find-gels': {
    label: 'Find gels I can buy in my country',
    blurb: 'Current availability and prices where you live, ranked by cost per gram of carb.',
  },
  compare: {
    label: 'Compare commercial gels vs DIY',
    blurb: 'An honest buy/make/both comparison for your training and racing.',
  },
  'marathon-plan': {
    label: 'Build my marathon fuelling plan',
    blurb: 'Carb loading, race morning, per-hour intake and contingencies.',
  },
  'hyrox-plan': {
    label: 'Build my HYROX fuelling plan',
    blurb: 'Pre-race-first plan — most races need little or nothing mid-race.',
  },
  troubleshoot: {
    label: 'Troubleshoot stomach problems',
    blurb: 'Work through GI issues with your fuelling, step by step.',
  },
  checklist: {
    label: 'Create my race-day checklist',
    blurb: 'A T-3h-to-finish fuelling checklist you can print.',
  },
};

const BUDGET_LABELS: Record<Budget, string> = {
  value: 'budget-focused — cheapest reliable option matters most',
  mid: 'balanced — value matters but so does convenience',
  premium: 'price is not a constraint',
};

const PREFERENCE_LABELS: Record<Preference, string> = {
  commercial: 'commercial products only',
  diy: 'DIY / homemade fuel preferred',
  both: 'open to both commercial products and DIY mixes',
};

const CONTAINER_LABELS: Record<Container, string> = {
  bottles: 'bottles (drink mix)',
  gels: 'gels carried in pockets or a belt',
  vest: 'hydration vest',
  course: 'relying on what the course provides',
};

function sportLabel(a: PromptAnswers): string {
  if (a.sport === 'custom') return `Custom session (~${a.durationMin} min)`;
  return `${SPORT_PRESETS[a.sport].label} (~${a.durationMin} min expected)`;
}

function countryLabel(a: PromptAnswers): string {
  return a.country.trim() || 'my country';
}

function profileBlock(a: PromptAnswers): string {
  return [
    'My profile:',
    `- Sport / event: ${sportLabel(a)}`,
    `- Bodyweight: ${a.weightKg} kg`,
    `- Target carbohydrate intake: ${a.carbsPerHour} g/hour`,
    `- Sweat level: ${a.sweat} (sodium target ~${SODIUM_BY_SWEAT[a.sweat]} mg/hour)`,
    `- Sensitive stomach: ${a.sensitiveStomach ? 'yes — prioritise gentle options' : 'no known issues'}`,
    `- Caffeine: ${a.usesCaffeine ? 'yes — include caffeinated options and timing' : 'I avoid caffeine — caffeine-free options only'}`,
    `- Country: ${countryLabel(a)}`,
    `- Budget: ${BUDGET_LABELS[a.budget]}`,
    `- Preference: ${PREFERENCE_LABELS[a.preference]}`,
    `- Fuel carrier: ${CONTAINER_LABELS[a.container]}`,
  ].join('\n');
}

// §8 structured instructions, baked into every generated prompt.
function rulesBlock(a: PromptAnswers): string {
  return [
    'Follow these rules:',
    `- Search current availability and prices in ${countryLabel(a)}.`,
    '- Rank products by price per gram of carbohydrate.',
    '- Show carbs, sodium, caffeine, serving size, and cost per 60 g of carbs for each option.',
    '- Separate race-day convenience from training-cost value.',
    '- Include DIY alternatives using maltodextrin, fructose and sodium citrate.',
    '- Do not recommend caffeine powder recipes.',
    '- Treat all plans as starting points to test in training — never anything new on race day.',
  ].join('\n');
}

function taskBlock(type: PromptType, a: PromptAnswers): string {
  const country = countryLabel(a);
  switch (type) {
    case 'find-gels':
      return [
        `Find energy gels and carbohydrate drink mixes I can actually buy in ${country} right now.`,
        '',
        'I want:',
        '- A shortlist of 5–10 products available to me, with where to buy each one',
        '- The cheapest reliable way to hit my carbohydrate target per hour',
        '- At least one high-carb option and at least one gentle-stomach option',
        a.usesCaffeine
          ? '- Which options contain caffeine and how much per serving'
          : '- Caffeine-free options only',
      ].join('\n');
    case 'compare':
      return [
        'Compare commercial gels against DIY carbohydrate mixes for my training and racing.',
        '',
        'I want:',
        '- A cost comparison per gram of carbohydrate: typical commercial gels vs a DIY maltodextrin/fructose mix',
        '- An honest list of when commercial gels are worth the money and when DIY wins',
        '- A "both" strategy: DIY for training, commercial for race day — does it make sense for me?',
        '- What a 12-week training block costs on each approach at my carbs-per-hour target',
      ].join('\n');
    case 'marathon-plan':
      return [
        'Build me a complete marathon fuelling plan.',
        '',
        'Cover:',
        '- Carb loading in the final 48 hours (foods, amounts for my bodyweight)',
        '- Race morning: what and when to eat and drink',
        '- Per-hour fuelling during the race to hit my carbohydrate target, matched to what is sold on my course or carried by me',
        '- Fluid and sodium strategy for my sweat level',
        '- A plan B for when my stomach turns or I drop a gel',
        a.usesCaffeine ? '- Where measured caffeine doses fit, if anywhere' : '- No caffeine anywhere in the plan',
      ].join('\n');
    case 'hyrox-plan':
      return [
        'Build me a HYROX fuelling plan.',
        '',
        'Important context: credible HYROX guidance says most races finish in 60–90 minutes and athletes under ~75 minutes usually need little or no mid-race fuel — the win is carb loading, the race-morning routine and arriving fuelled. Repeated heart-rate spikes across stations make mid-race gels risky for the gut.',
        '',
        'Cover:',
        `- Whether someone with my expected finish time (~${a.durationMin} min) needs mid-race fuel at all — be honest if the answer is no`,
        '- The day-before and race-morning routine (T-3h meal, T-1h snack, T-30min top-up)',
        '- Fluids and sodium for a warm indoor venue at my sweat level',
        '- If mid-race fuel makes sense for me: exactly what and when between stations',
        a.usesCaffeine ? '- Whether a pre-race caffeine dose fits my profile' : '- No caffeine in the plan',
      ].join('\n');
    case 'troubleshoot':
      return [
        'Help me troubleshoot stomach problems with my race fuelling.',
        '',
        'Work through this with me:',
        '- Ask me diagnostic questions first: when the trouble starts, what I take and how often, what I mix it with, fluid intake, weather, pace',
        '- Then give the most likely causes ranked, and one change to test at a time',
        '- Include gentler alternatives: different carb ratios, lower concentration, splitting doses, more plain water',
        '- Tell me what to log after each training session so we can narrow it down',
      ].join('\n');
    case 'checklist':
      return [
        'Create my race-day fuelling checklist.',
        '',
        'Format it as a printable checklist covering:',
        '- The evening before (meal, prep, kit)',
        '- T-3h: pre-race meal (high-carb, low-fibre, amounts for my bodyweight)',
        '- T-1h: carb snack',
        '- T-30min: final top-up' + (a.usesCaffeine ? ' including my measured caffeine dose' : ' (no caffeine)'),
        '- During: per-hour fuel and fluid reminders for my target',
        '- What to pack: fuel, spares, mixing notes if DIY',
        '- Contingencies: dropped fuel, stomach trouble, hotter than expected',
      ].join('\n');
  }
}

export function buildPrompt(type: PromptType, a: PromptAnswers): string {
  return [taskBlock(type, a), '', profileBlock(a), '', rulesBlock(a), ''].join('\n');
}
