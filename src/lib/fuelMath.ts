// Pure calculation functions for the Race Fuel Cost Calculator. Kept free of
// UI state so the numbers are easy to verify in isolation.

import {
  GUT_LOAD,
  RATIOS,
  SODIUM_BY_SWEAT,
  SODIUM_FRACTION,
  type RatioKey,
  type SodiumForm,
  type SweatLevel,
} from '../data/defaults';

export interface Prices {
  currency: string;
  maltoPerKg: number;
  fructosePerKg: number;
  saltPerKg: number;
  citratePerKg: number;
  gelPrice: number;
  gelCarbs: number;
}

export interface CalcInputs {
  mode: 'bottle' | 'syrup';
  durationMin: number;
  carbsPerHour: number;
  ratio: RatioKey;
  sweat: SweatLevel;
  sodiumForm: SodiumForm;
  bottleMl: number;
  flaskMl: number;
  flaskCount: number;
  prices: Prices;
}

export type GutLoadLevel = 'green' | 'amber' | 'red';

export interface Recipe {
  servingLabel: string;
  servingCount: number;
  carbsPerServing: number;
  maltoG: number;
  fructoseG: number;
  sodiumIngredientG: number;
  sodiumMgPerServing: number;
  waterMlPerServing: number;
  concentration: number;
  gutLoad: GutLoadLevel;
  totalCarbs: number;
  totalSodiumMg: number;
  costPerServing: number;
  costPerGramCarb: number;
  sessionCost: number;
  gelsForSession: number;
  gelSessionCost: number;
}

export function round(value: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

// Estimated gut-load level: a heuristic on carbohydrate concentration
// (g per 100 ml of mixing water), bumped one step for very salty mixes.
// An ESTIMATE, not a lab osmolality measurement (brief §4).
export function gutLoadLevel(
  concentration: number,
  sodiumMgPerServing: number,
  waterMl: number
): GutLoadLevel {
  const sodiumMgPerLitre = sodiumMgPerServing / (waterMl / 1000);
  const verySalty = sodiumMgPerLitre > 1200;
  if (concentration <= GUT_LOAD.greenMax) return verySalty ? 'amber' : 'green';
  if (concentration <= GUT_LOAD.amberMax) return 'amber';
  return 'red';
}

export function computeRecipe(inputs: CalcInputs): Recipe {
  const hours = inputs.durationMin / 60;
  const sodiumPerHour = SODIUM_BY_SWEAT[inputs.sweat];
  const totalCarbs = inputs.carbsPerHour * hours;
  const totalSodiumMg = sodiumPerHour * hours;

  let servingCount: number;
  let carbsPerServing: number;
  let sodiumMgPerServing: number;
  let waterMlPerServing: number;
  let servingLabel: string;

  if (inputs.mode === 'bottle') {
    // One bottle carries one hour of fuel; drink one bottle per hour.
    servingCount = hours;
    carbsPerServing = inputs.carbsPerHour;
    sodiumMgPerServing = sodiumPerHour;
    waterMlPerServing = inputs.bottleMl;
    servingLabel = `${inputs.bottleMl} ml bottle — drink one per hour`;
  } else {
    // The whole session's fuel is split across N soft flasks of syrup.
    servingCount = inputs.flaskCount;
    carbsPerServing = totalCarbs / inputs.flaskCount;
    sodiumMgPerServing = totalSodiumMg / inputs.flaskCount;
    waterMlPerServing = inputs.flaskMl;
    servingLabel = `${inputs.flaskMl} ml soft flask of syrup — sip and chase with plain water`;
  }

  const ratio = RATIOS[inputs.ratio];
  const parts = ratio.malto + ratio.fructose;
  const maltoG = (carbsPerServing * ratio.malto) / parts;
  const fructoseG = (carbsPerServing * ratio.fructose) / parts;
  const sodiumIngredientG = sodiumMgPerServing / 1000 / SODIUM_FRACTION[inputs.sodiumForm];

  const concentration = (carbsPerServing / waterMlPerServing) * 100;
  const gutLoad = gutLoadLevel(concentration, sodiumMgPerServing, waterMlPerServing);

  const p = inputs.prices;
  const sodiumPricePerKg = inputs.sodiumForm === 'salt' ? p.saltPerKg : p.citratePerKg;
  const costPerServing =
    (maltoG / 1000) * p.maltoPerKg +
    (fructoseG / 1000) * p.fructosePerKg +
    (sodiumIngredientG / 1000) * sodiumPricePerKg;
  const costPerGramCarb = carbsPerServing > 0 ? costPerServing / carbsPerServing : 0;
  const sessionCost = costPerGramCarb * totalCarbs;

  const gelsForSession = p.gelCarbs > 0 ? Math.ceil(totalCarbs / p.gelCarbs) : 0;
  const gelSessionCost = gelsForSession * p.gelPrice;

  return {
    servingLabel,
    servingCount,
    carbsPerServing,
    maltoG,
    fructoseG,
    sodiumIngredientG,
    sodiumMgPerServing,
    waterMlPerServing,
    concentration,
    gutLoad,
    totalCarbs,
    totalSodiumMg,
    costPerServing,
    costPerGramCarb,
    sessionCost,
    gelsForSession,
    gelSessionCost,
  };
}

export interface SavingsInputs {
  sessionsPerWeek: number;
  avgSessionMin: number;
  weeks: number;
}

export interface SavingsResult {
  totalHours: number;
  totalCarbs: number;
  gels: number;
  gelCost: number;
  diyCost: number;
  saving: number;
}

// Training-block savings: same carbs/hour target applied across a block of
// fuelled sessions, costed as commercial gels vs the current DIY recipe.
export function computeSavings(
  carbsPerHour: number,
  costPerGramCarb: number,
  prices: Prices,
  s: SavingsInputs
): SavingsResult {
  const totalHours = (s.sessionsPerWeek * s.avgSessionMin * s.weeks) / 60;
  const totalCarbs = carbsPerHour * totalHours;
  const gels = prices.gelCarbs > 0 ? Math.ceil(totalCarbs / prices.gelCarbs) : 0;
  const gelCost = gels * prices.gelPrice;
  const diyCost = totalCarbs * costPerGramCarb;
  return { totalHours, totalCarbs, gels, gelCost, diyCost, saving: gelCost - diyCost };
}
