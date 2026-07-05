// Recovery Drink Builder — static data (brief: recovery-drink-builder-BUILD-INSTRUCTIONS.md §4, §5).
// All macros, prices and products come from research/recovery-drink-data-updated.md — do not
// invent numbers here. Prices are indicative bulk/RRP figures, always shown as "from"/"approx".

export type SessionType = 'endurance' | 'strength' | 'hybrid' | 'longDepleting';
export type Depletion = 'light' | 'moderate' | 'heavy';
export type SweatLevel = 'low' | 'medium' | 'high';
export type Goal = 'glycogen' | 'repair' | 'balanced';
export type ElectrolyteSource = 'lmnt' | 'diy' | 'lowSodiumTab';

export const SESSION_TYPES: Record<SessionType, { label: string; carbPerKgModifier: number }> = {
  endurance: { label: 'Endurance', carbPerKgModifier: 0.05 },
  strength: { label: 'Strength', carbPerKgModifier: -0.15 },
  hybrid: { label: 'Hybrid (HYROX)', carbPerKgModifier: 0 },
  longDepleting: { label: 'Long depleting session', carbPerKgModifier: 0.15 },
};

export const DEPLETION_LEVELS: Record<Depletion, { label: string; carbPerKgBase: number }> = {
  light: { label: 'Light', carbPerKgBase: 0.8 },
  moderate: { label: 'Moderate', carbPerKgBase: 1.0 },
  heavy: { label: 'Heavy (depleting)', carbPerKgBase: 1.2 },
};

export const SWEAT_SODIUM_MG: Record<SweatLevel, number> = { low: 500, medium: 750, high: 1000 };
export const SWEAT_LABELS: Record<SweatLevel, string> = { low: 'Low', medium: 'Medium', high: 'High' };

// Fixed potassium/magnesium targets per serving — the research file's DIY formula figures,
// held constant regardless of sweat level (only sodium scales with sweat).
export const POTASSIUM_MG = 200;
export const MAGNESIUM_MG = 60;

export const GOALS: Record<Goal, { label: string; proteinPerKgDelta: number }> = {
  glycogen: { label: 'Glycogen refill', proteinPerKgDelta: -0.05 },
  repair: { label: 'Muscle repair', proteinPerKgDelta: 0.05 },
  balanced: { label: 'Balanced', proteinPerKgDelta: 0 },
};

export const ELECTROLYTE_SOURCES: Record<ElectrolyteSource, { label: string }> = {
  lmnt: { label: 'LMNT stick' },
  diy: { label: 'DIY electrolytes (salt + powders)' },
  lowSodiumTab: { label: 'Low-sodium tab + salt top-up' },
};

// Sodium fraction by weight — table salt (NaCl) is ~39.3% sodium, matching the calculator's
// SODIUM_FRACTION constant in defaults.ts.
export const SALT_SODIUM_FRACTION = 0.393;
export const LMNT_SODIUM_MG_PER_STICK = 1000;
export const LOW_SODIUM_TAB_MG = 200;

export const DEFAULT_WATER_ML = 750;

// Bulk ingredient prices in USD, from the research file's "Indicative DIY cost per serving" table.
export const RECOVERY_PRICES = {
  currency: '$',
  maltoPerKg: 4.0,
  fructosePerKg: 4.5,
  hbcdPerKg: 18.0,
  wheyIsolatePerKg: 28.0,
  collagenPerKg: 25.0,
  creatinePerKg: 20.0,
  taurinePerKg: 15.0,
  glutaminePerKg: 15.0,
  saltPerKg: 1.0,
  lmntPerStick: 1.3,
  diyElectrolytePowderPerServing: 0.1, // potassium/magnesium powder, DIY route only
};

export interface RecoveryProduct {
  name: string;
  url: string;
  carbs: string;
  protein: string;
  carbBlend: string;
  creatine: boolean;
  extras: string;
  costPerServing: string;
  markets: string;
}

// Verified July 2026 — research/recovery-drink-data-updated.md §3.
export const RECOVERY_PRODUCTS: RecoveryProduct[] = [
  {
    name: 'Etixx Recovery Shake',
    url: 'https://www.etixxsports.com/en/products/recovery-shake',
    carbs: '~37 g',
    protein: '~9 g',
    carbBlend: 'Malto + dextrose + fructose',
    creatine: true,
    extras: 'Vit C, B-complex, iron, CoQ10, digestive enzymes',
    costPerServing: 'from ~€2.00 (€54.99 / 1.4 kg)',
    markets: '🇪🇺 🇬🇧',
  },
  {
    name: 'Torq Recovery',
    url: 'https://torqusa.com/products/torq-recovery-cookies-cream-1-5kg-ecosack',
    carbs: 'High (3:1 carb:pro)',
    protein: 'Whey (WPI)',
    carbBlend: '2:1 malto:fructose',
    creatine: false,
    extras: 'L-glutamine, D-ribose, vitamins',
    costPerServing: 'from ~£3 / 75 g serving',
    markets: '🇬🇧 🇺🇸 🇪🇺',
  },
  {
    name: 'GU Roctane Protein Recovery',
    url: 'https://guenergy.com/products/gu-roctane-protein-recovery-drink-mix',
    carbs: '~30 g',
    protein: '20 g WPI',
    carbBlend: 'Fast carbs, sodium-rich',
    creatine: false,
    extras: 'High sodium for rehydration',
    costPerServing: 'from ~$3.50 ($35 / 10)',
    markets: '🇺🇸 🇬🇧 🇪🇺',
  },
  {
    name: 'INFINIT REPAIR',
    url: 'https://www.infinitnutrition.us/repair-recovery-drink-mix',
    carbs: '~4:1 carb:pro',
    protein: '3-protein blend',
    carbBlend: 'Malto + glucose + sucrose + fructose',
    creatine: false,
    extras: 'BCAAs, L-glutamine, customisable',
    costPerServing: 'from ~$3.43 ($54.95 / 16)',
    markets: '🇺🇸 (ships EU/UK)',
  },
  {
    name: 'SiS REGO Rapid Recovery',
    url: 'https://www.scienceinsport.com/shop-sis/rego-range/rapid-recovery-1kg',
    carbs: '23 g',
    protein: '22 g',
    carbBlend: 'Carb + soy protein (vegan)',
    creatine: false,
    extras: '2.5 g L-leucine, vitamins/minerals',
    costPerServing: 'from ~£1.30 (£18.90+ / 500 g)',
    markets: '🇬🇧 🇪🇺',
  },
  {
    name: 'Skratch Labs Sport Recovery',
    url: 'https://www.skratchlabs.com/products/recovery-sport-drink-mix',
    carbs: '35 g',
    protein: '8 g',
    carbBlend: '4:1, milk protein',
    creatine: false,
    extras: 'Probiotics, simple ingredient list',
    costPerServing: 'from ~$2.80–3.50',
    markets: '🇺🇸',
  },
  {
    name: 'Tailwind Recovery Mix',
    url: 'https://tailwindnutrition.com/products/recovery-drink',
    carbs: '34 g',
    protein: '20 g',
    carbBlend: 'Dextrose + cane sugar, plant protein',
    creatine: false,
    extras: 'Dairy/soy/gluten-free, electrolytes',
    costPerServing: 'from ~$2.80 ($55.99 / 20)',
    markets: '🇺🇸 🇬🇧 🇪🇺',
  },
];

export const RECOVERY_VERDICTS = [
  {
    label: 'Closest all-in-one',
    product: 'Etixx Recovery Shake',
    note: 'The only mainstream mix that bundles creatine with carbs, WPI and vitamins — mirrors the DIY formula most closely, though a 90 kg athlete would need 1.5–2 servings for the carb/protein target.',
  },
  {
    label: 'Most customisable',
    product: 'INFINIT REPAIR',
    note: "Pick your own macros and add creatine or taurine yourself.",
  },
  {
    label: 'Best value ready-made',
    product: 'SiS REGO Rapid Recovery',
    note: 'From ~£1.30/serving in bulk.',
  },
  {
    label: 'Highest protein',
    product: 'Tailwind Recovery / SiS REGO / GU Roctane',
    note: '20 g, 22 g and 20 g protein respectively.',
  },
  {
    label: 'Rapid-glycogen bias',
    product: 'Skratch Sport Recovery / Torq Recovery',
    note: 'Highest carb:protein ratios of the group.',
  },
];

export const AVAILABILITY_NOTES = [
  { market: 'US', note: 'Skratch, Tailwind, GU widely stocked; INFINIT direct + retailers; Etixx/Torq via import.' },
  { market: 'UK', note: 'SiS REGO, Torq, GU, Tailwind all mainstream; Etixx via specialist retailers.' },
  {
    market: 'EU (incl. Luxembourg)',
    note: 'Etixx and Torq are the easiest to buy locally; GU and Tailwind via EU distributors; INFINIT ships from US/EU depending on SKU.',
  },
];
