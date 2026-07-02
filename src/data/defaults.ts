// Starter assumptions and default ingredient prices for the Race Fuel Cost
// Calculator (brief §3, §4, §7). Everything cost-related is editable in the
// UI — these are training-tested starting points, not prescriptions.

export type SweatLevel = 'low' | 'medium' | 'high';
export type SodiumForm = 'salt' | 'citrate';
export type RatioKey = 'simple' | 'advanced';
export type SportKey = 'half' | 'marathon' | 'hyrox' | 'training' | 'custom';

// §3 carbohydrate targets: default g/h by session duration. The calculator
// starts mid-band; the carbs/hour field lets athletes override it.
export interface CarbBand {
  maxMin: number | null;
  gPerHour: number;
  label: string;
}

export const CARB_BANDS: CarbBand[] = [
  { maxMin: 60, gPerHour: 20, label: 'Under 60 min — often not needed (0–20 g/h)' },
  { maxMin: 120, gPerHour: 40, label: '60–120 min — 30–45 g/h' },
  { maxMin: 150, gPerHour: 55, label: '120–150 min — 45–60 g/h' },
  { maxMin: null, gPerHour: 60, label: '150+ min — 60–90 g/h (90–120 only if gut-trained)' },
];

export function defaultCarbsPerHour(durationMin: number): number {
  for (const band of CARB_BANDS) {
    if (band.maxMin === null || durationMin <= band.maxMin) return band.gPerHour;
  }
  return 60;
}

// §3 glucose:fructose ratios — maltodextrin supplies the glucose side.
export const RATIOS: Record<
  RatioKey,
  { malto: number; fructose: number; label: string; note: string }
> = {
  simple: {
    malto: 2,
    fructose: 1,
    label: 'Simple 2:1',
    note: 'Gentler on an untrained gut and less sweet — a good starting point.',
  },
  advanced: {
    malto: 1,
    fructose: 0.8,
    label: 'Advanced 1:0.8',
    note: 'High-carb ratio for gut-trained athletes — build up to this in training.',
  },
};

// §3 sodium working range 400–900 mg/h, mapped to sweat level.
export const SODIUM_BY_SWEAT: Record<SweatLevel, number> = { low: 400, medium: 650, high: 900 };

// Sodium fraction by ingredient weight: table salt (NaCl) is about 39.3%
// sodium; trisodium citrate dihydrate is about 23.4% sodium.
export const SODIUM_FRACTION: Record<SodiumForm, number> = { salt: 0.393, citrate: 0.234 };

export const SODIUM_FORMS: Record<SodiumForm, { label: string; note: string }> = {
  salt: { label: 'Table salt', note: 'Cheapest; fine for most mixes.' },
  citrate: { label: 'Sodium citrate', note: 'Gentler, less salty taste at higher doses.' },
};

export const SPORT_PRESETS: Record<Exclude<SportKey, 'custom'>, { label: string; durationMin: number }> = {
  half: { label: 'Half marathon', durationMin: 110 },
  marathon: { label: 'Marathon', durationMin: 240 },
  hyrox: { label: 'HYROX', durationMin: 75 },
  training: { label: 'Long training run', durationMin: 90 },
};

export const BOTTLE_SIZES_ML = [500, 600, 750, 1000];
export const FLASK_SIZES_ML = [150, 250];

// Approximate grams per level teaspoon — convenience only; the calculator
// always shows grams first and nudges towards a cheap kitchen scale.
export const TSP_GRAMS = { malto: 3.5, fructose: 4, salt: 6, citrate: 5 };

// Default ingredient prices. All editable in the UI so the tool works in any
// country and currency — the currency symbol is just a label.
export const DEFAULT_PRICES = {
  currency: '€',
  maltoPerKg: 7.0,
  fructosePerKg: 5.0,
  saltPerKg: 1.0,
  citratePerKg: 12.0,
  gelPrice: 1.8,
  gelCarbs: 25,
};

// §4 estimated gut-load thresholds, in grams of carbohydrate per 100 ml of
// mixing water. A heuristic estimate — never presented as osmolality.
export const GUT_LOAD = { greenMax: 8, amberMax: 16 };

export const SAVINGS_DEFAULTS = { sessionsPerWeek: 2, avgSessionMin: 90, weeks: 12 };
