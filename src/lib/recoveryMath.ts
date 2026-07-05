// Recovery Drink Builder — pure logic, no React (brief §4). Every number here traces back to
// research/recovery-drink-data-updated.md; keep constants in recoveryData.ts, not inline.
import {
  DEFAULT_WATER_ML,
  DEPLETION_LEVELS,
  GOALS,
  LMNT_SODIUM_MG_PER_STICK,
  LOW_SODIUM_TAB_MG,
  MAGNESIUM_MG,
  POTASSIUM_MG,
  RECOVERY_PRICES,
  SALT_SODIUM_FRACTION,
  SESSION_TYPES,
  SWEAT_SODIUM_MG,
  type Depletion,
  type ElectrolyteSource,
  type Goal,
  type SessionType,
  type SweatLevel,
} from '../data/recoveryData';

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// Round to the nearest multiple of `step`, defaulting to whole grams — the brief asks for
// "sensible" values (nearest 1–5 g), not decimals an athlete would need a lab scale for.
export const roundTo = (n: number, step = 1) => Math.round(n / step) * step;

export interface RecoveryInputs {
  bodyweightKg: number;
  sessionType: SessionType;
  depletion: Depletion;
  sweat: SweatLevel;
  goal: Goal;
  includeCreatine: boolean;
  includeCollagen: boolean;
  includeBoosters: boolean;
  electrolyteSource: ElectrolyteSource;
}

export interface CarbSplit {
  totalG: number;
  maltodextrinG: number;
  fructoseG: number;
  hbcdG: number;
  gPerKg: number;
  cappedByLimit: boolean;
}

export function carbTarget(bodyweightKg: number, sessionType: SessionType, depletion: Depletion): CarbSplit {
  const carbPerKgRaw = DEPLETION_LEVELS[depletion].carbPerKgBase + SESSION_TYPES[sessionType].carbPerKgModifier;
  const carbPerKg = clamp(carbPerKgRaw, 0.8, 1.3);
  const rawTotal = carbPerKg * bodyweightKg;
  const totalG = clamp(rawTotal, 60, 120);
  const cappedByLimit = rawTotal > 120;

  const hbcdG = depletion === 'heavy' ? roundTo(clamp(totalG * 0.08, 5, 10)) : 0;
  const remaining = totalG - hbcdG;
  // 2:1 maltodextrin:fructose split of whatever carbohydrate isn't HBCD.
  const maltodextrinG = roundTo((remaining * 2) / 3, 5);
  const fructoseG = roundTo(remaining - maltodextrinG, 5);

  return {
    totalG: maltodextrinG + fructoseG + hbcdG,
    maltodextrinG,
    fructoseG,
    hbcdG,
    gPerKg: carbPerKg,
    cappedByLimit,
  };
}

export function proteinTarget(bodyweightKg: number, goal: Goal): number {
  const proteinPerKg = clamp(0.3 + GOALS[goal].proteinPerKgDelta, 0.25, 0.4);
  return roundTo(clamp(proteinPerKg * bodyweightKg, 25, 40), 5);
}

export interface ElectrolyteMix {
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
  lmntSticks?: number;
  saltG?: number;
  lowSodiumTabs?: number;
}

export function electrolyteMix(sweat: SweatLevel, source: ElectrolyteSource): ElectrolyteMix {
  const sodiumTargetMg = SWEAT_SODIUM_MG[sweat];

  if (source === 'lmnt') {
    const lmntSticks = Math.max(1, Math.round(sodiumTargetMg / LMNT_SODIUM_MG_PER_STICK));
    return {
      sodiumMg: lmntSticks * LMNT_SODIUM_MG_PER_STICK,
      potassiumMg: POTASSIUM_MG,
      magnesiumMg: MAGNESIUM_MG,
      lmntSticks,
    };
  }

  if (source === 'lowSodiumTab') {
    const topUpMg = Math.max(0, sodiumTargetMg - LOW_SODIUM_TAB_MG);
    const saltG = roundTo(topUpMg / 1000 / SALT_SODIUM_FRACTION, 1);
    return {
      sodiumMg: LOW_SODIUM_TAB_MG + saltG * 1000 * SALT_SODIUM_FRACTION,
      potassiumMg: POTASSIUM_MG,
      magnesiumMg: MAGNESIUM_MG,
      lowSodiumTabs: 1,
      saltG,
    };
  }

  // DIY salts
  const saltG = roundTo(sodiumTargetMg / 1000 / SALT_SODIUM_FRACTION, 1);
  return {
    sodiumMg: roundTo(saltG * 1000 * SALT_SODIUM_FRACTION),
    potassiumMg: POTASSIUM_MG,
    magnesiumMg: MAGNESIUM_MG,
    saltG,
  };
}

export function waterVolumeMl(bodyweightKg: number): number {
  return roundTo(clamp(DEFAULT_WATER_ML + (bodyweightKg - 90) * 3, 500, 1000), 10);
}

export interface RecoveryRecipe {
  carbs: CarbSplit;
  proteinG: number;
  wheyG: number;
  collagenG: number;
  creatineG: number;
  taurineG: number;
  glutamineG: number;
  electrolytes: ElectrolyteMix;
  waterMl: number;
  sodiumMgPerKg: number;
}

export function buildRecipe(inputs: RecoveryInputs): RecoveryRecipe {
  const carbs = carbTarget(inputs.bodyweightKg, inputs.sessionType, inputs.depletion);
  const proteinG = proteinTarget(inputs.bodyweightKg, inputs.goal);
  const electrolytes = electrolyteMix(inputs.sweat, inputs.electrolyteSource);

  return {
    carbs,
    proteinG,
    wheyG: proteinG,
    collagenG: inputs.includeCollagen ? 5 : 0,
    creatineG: inputs.includeCreatine ? 5 : 0,
    taurineG: inputs.includeBoosters ? 2 : 0,
    glutamineG: inputs.includeBoosters ? 2 : 0,
    electrolytes,
    waterMl: waterVolumeMl(inputs.bodyweightKg),
    sodiumMgPerKg: electrolytes.sodiumMg / inputs.bodyweightKg,
  };
}

export interface RecoveryCost {
  withSelectedElectrolyte: number;
  withLmnt: number;
  withDiy: number;
  currency: string;
}

function ingredientsCostBase(recipe: RecoveryRecipe): number {
  const p = RECOVERY_PRICES;
  return (
    (recipe.carbs.maltodextrinG / 1000) * p.maltoPerKg +
    (recipe.carbs.fructoseG / 1000) * p.fructosePerKg +
    (recipe.carbs.hbcdG / 1000) * p.hbcdPerKg +
    (recipe.wheyG / 1000) * p.wheyIsolatePerKg +
    (recipe.collagenG / 1000) * p.collagenPerKg +
    (recipe.creatineG / 1000) * p.creatinePerKg +
    (recipe.taurineG / 1000) * p.taurinePerKg +
    (recipe.glutamineG / 1000) * p.glutaminePerKg
  );
}

export function recoveryCost(recipe: RecoveryRecipe, source: ElectrolyteSource): RecoveryCost {
  const base = ingredientsCostBase(recipe);
  const p = RECOVERY_PRICES;

  const withLmnt = base + p.lmntPerStick;
  const withDiy = base + (recipe.electrolytes.saltG ?? 1) * (p.saltPerKg / 1000) + p.diyElectrolytePowderPerServing;

  const withSelectedElectrolyte = source === 'lmnt' ? withLmnt : withDiy;

  return {
    withSelectedElectrolyte: Math.round(withSelectedElectrolyte * 100) / 100,
    withLmnt: Math.round(withLmnt * 100) / 100,
    withDiy: Math.round(withDiy * 100) / 100,
    currency: p.currency,
  };
}

export function whyLine(inputs: RecoveryInputs, recipe: RecoveryRecipe): string {
  const parts: string[] = [];
  const sweatLabel = inputs.sweat === 'high' ? 'High sweat' : inputs.sweat === 'medium' ? 'Medium sweat' : 'Low sweat';
  const depletionLabel = inputs.depletion === 'heavy' ? 'a heavy depleting session' : `a ${inputs.depletion} session`;
  parts.push(
    `${sweatLabel} + ${depletionLabel} → sodium set to ~${Math.round(recipe.electrolytes.sodiumMg)} mg and carbs toward ${recipe.carbs.gPerKg.toFixed(2)} g/kg.`
  );
  if (recipe.carbs.cappedByLimit) {
    parts.push("Your target exceeded 120 g in one drink, so it's capped — spread the rest across a meal instead.");
  }
  if (inputs.goal === 'repair') {
    parts.push('Muscle repair emphasis nudged protein toward the top of the range.');
  } else if (inputs.goal === 'glycogen') {
    parts.push('Glycogen-refill emphasis kept protein lighter so carbs do the heavy lifting.');
  }
  return parts.join(' ');
}

export function formatRecipeText(recipe: RecoveryRecipe, cost: RecoveryCost): string {
  const lines: string[] = [];
  lines.push('Your DIY Recovery Drink');
  lines.push('');
  lines.push(`Water: ${recipe.waterMl} ml`);
  lines.push(`Maltodextrin: ${recipe.carbs.maltodextrinG} g`);
  lines.push(`Fructose: ${recipe.carbs.fructoseG} g`);
  if (recipe.carbs.hbcdG > 0) lines.push(`Highly branched cyclic dextrin: ${recipe.carbs.hbcdG} g`);
  lines.push(`Whey isolate: ${recipe.wheyG} g`);
  if (recipe.collagenG > 0) lines.push(`Collagen peptides: ${recipe.collagenG} g`);
  if (recipe.creatineG > 0) lines.push(`Creatine monohydrate: ${recipe.creatineG} g`);
  if (recipe.taurineG > 0) lines.push(`Taurine: ${recipe.taurineG} g`);
  if (recipe.glutamineG > 0) lines.push(`L-glutamine: ${recipe.glutamineG} g`);

  if (recipe.electrolytes.lmntSticks) {
    lines.push(`Electrolytes: ${recipe.electrolytes.lmntSticks} LMNT stick(s)`);
  } else if (recipe.electrolytes.lowSodiumTabs) {
    lines.push(`Electrolytes: 1 low-sodium tab + ${recipe.electrolytes.saltG} g salt`);
  } else {
    lines.push(`Electrolytes: ${recipe.electrolytes.saltG} g salt + potassium/magnesium powder`);
  }

  lines.push('');
  lines.push(
    `Totals: ${recipe.carbs.totalG} g carbs (${recipe.carbs.gPerKg.toFixed(2)} g/kg) · ${recipe.proteinG} g protein · sodium ~${Math.round(recipe.electrolytes.sodiumMg)} mg`
  );
  lines.push(`Indicative cost: ${cost.currency}${cost.withSelectedElectrolyte.toFixed(2)} per serving`);
  lines.push('');
  lines.push('A training-tested starting point — test it in training, never try anything new on race day.');

  return lines.join('\n');
}
