// Unit-system conversions for the calculator + prompt generator (brief:
// Metric / American / UK Hybrid toggle). Only bodyweight and bottle/flask/
// water volumes convert — carbs (g/hour), sodium (mg) and ingredient
// weights stay in grams/mg under every system, since that's how nutrition
// facts are labelled everywhere, including the US. "UK Hybrid" means
// pounds for bodyweight (like the US) but ml for volumes (like Metric),
// matching how the UK actually mixes imperial body-weight with metric
// packaged-liquid units day to day.

export type UnitSystem = 'metric' | 'us' | 'uk';

const KG_PER_LB = 0.45359237;
const ML_PER_FLOZ = 29.5735295625; // US fluid ounce

export function weightUnit(system: UnitSystem): 'kg' | 'lb' {
  return system === 'metric' ? 'kg' : 'lb';
}

export function volumeUnit(system: UnitSystem): 'ml' | 'fl oz' {
  return system === 'us' ? 'fl oz' : 'ml';
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function mlToFlOz(ml: number): number {
  return ml / ML_PER_FLOZ;
}

export function flOzToMl(flOz: number): number {
  return flOz * ML_PER_FLOZ;
}

// Bodyweight is stored internally in kg regardless of the selected system;
// these convert only for display/input.
export function displayWeight(kg: number, system: UnitSystem): number {
  return system === 'metric' ? kg : kgToLb(kg);
}

export function weightToKg(value: number, system: UnitSystem): number {
  return system === 'metric' ? value : lbToKg(value);
}

export const WEIGHT_BOUNDS_KG = { min: 30, max: 200 };

export function weightBounds(system: UnitSystem): { min: number; max: number } {
  return {
    min: Math.round(displayWeight(WEIGHT_BOUNDS_KG.min, system)),
    max: Math.round(displayWeight(WEIGHT_BOUNDS_KG.max, system)),
  };
}

// Volumes (bottle/flask/water) are stored internally in ml regardless of
// the selected system.
export function volumeLabel(ml: number, system: UnitSystem): string {
  return system === 'us' ? `${Math.round(mlToFlOz(ml) * 10) / 10} fl oz` : `${ml} ml`;
}

// Currency label by unit system: Metric → €, American → $, UK Hybrid → £.
// A display label only — the cost maths is currency-agnostic and the symbol
// stays editable in the price panel.
export function currencyForSystem(system: UnitSystem): '€' | '$' | '£' {
  return system === 'us' ? '$' : system === 'uk' ? '£' : '€';
}
