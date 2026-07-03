// Phase 2 commercial gel dataset (brief §9). Static data, no database.
//
// HONESTY NOTES:
// - Prices are TYPICAL single-unit prices (multipacks are usually cheaper)
//   and vary by retailer and flavour. Treat them as estimates.
// - Sodium and caffeine vary by flavour within a range; representative
//   values are listed. Always check the packet.
// - lastChecked marks when these values were last reviewed.
//
// Ranking rule (§9): never "best overall" — rank by use case only.

export type Region = 'UK' | 'EU' | 'US';
export type ProductType = 'gel' | 'flask';

export type UseCaseTag =
  | 'value'
  | 'high-carb'
  | 'caffeine-free'
  | 'soft-flask'
  | 'sensitive-stomach'
  | 'widely-available';

export interface GelProduct {
  id: string;
  brand: string;
  product: string;
  type: ProductType;
  carbsG: number; // per serving
  sodiumMg: number; // per serving (representative — varies by flavour)
  caffeineMg: number; // per serving (0 = caffeine-free variant listed)
  servingSize: string;
  typicalPrice: number;
  currency: '£' | '€' | '$';
  regions: Region[];
  tags: UseCaseTag[];
  lastChecked: string;
  note?: string;
}

export const REGION_LABELS: Record<Region, string> = {
  UK: 'United Kingdom (£)',
  EU: 'EU / Schengen (€)',
  US: 'United States ($)',
};

const CHECKED = '2026-07';

export const GEL_PRODUCTS: GelProduct[] = [
  // ---------- UK ----------
  {
    id: 'sis-go-isotonic',
    brand: 'Science in Sport',
    product: 'GO Isotonic Energy Gel',
    type: 'gel',
    carbsG: 22,
    sodiumMg: 10,
    caffeineMg: 0,
    servingSize: '60 ml',
    typicalPrice: 1.5,
    currency: '£',
    regions: ['UK', 'EU'],
    tags: ['value', 'caffeine-free', 'widely-available'],
    lastChecked: CHECKED,
    note: 'Isotonic — designed to take without water. Frequently discounted in multipacks.',
  },
  {
    id: 'sis-beta-fuel',
    brand: 'Science in Sport',
    product: 'Beta Fuel Gel',
    type: 'gel',
    carbsG: 40,
    sodiumMg: 20,
    caffeineMg: 0,
    servingSize: '60 ml',
    typicalPrice: 2.5,
    currency: '£',
    regions: ['UK', 'EU'],
    tags: ['high-carb', 'caffeine-free'],
    lastChecked: CHECKED,
    note: '1:0.8 glucose:fructose ratio for higher hourly targets.',
  },
  {
    id: 'high5-aqua',
    brand: 'High5',
    product: 'Energy Gel Aqua',
    type: 'gel',
    carbsG: 23,
    sodiumMg: 30,
    caffeineMg: 0,
    servingSize: '66 g',
    typicalPrice: 1.2,
    currency: '£',
    regions: ['UK', 'EU'],
    tags: ['value', 'caffeine-free'],
    lastChecked: CHECKED,
  },
  {
    id: 'torq-gel',
    brand: 'TORQ',
    product: 'Energy Gel',
    type: 'gel',
    carbsG: 29,
    sodiumMg: 50,
    caffeineMg: 0,
    servingSize: '45 g',
    typicalPrice: 2.2,
    currency: '£',
    regions: ['UK'],
    tags: ['caffeine-free'],
    lastChecked: CHECKED,
    note: '2:1 maltodextrin:fructose.',
  },
  {
    id: 'styrkr-gel50',
    brand: 'Styrkr',
    product: 'GEL50',
    type: 'gel',
    carbsG: 50,
    sodiumMg: 110,
    caffeineMg: 0,
    servingSize: '76 g',
    typicalPrice: 2.75,
    currency: '£',
    regions: ['UK', 'EU'],
    tags: ['high-carb', 'caffeine-free'],
    lastChecked: CHECKED,
    note: 'Dual-source carbs; one of the highest carb loads per sachet.',
  },
  {
    id: 'kmc-nrg',
    brand: 'Kendal Mint Co',
    product: 'KMC NRG Gel',
    type: 'gel',
    carbsG: 27,
    sodiumMg: 45,
    caffeineMg: 0,
    servingSize: '70 g',
    typicalPrice: 1.35,
    currency: '£',
    regions: ['UK'],
    tags: ['value', 'caffeine-free'],
    lastChecked: CHECKED,
  },
  {
    id: 'veloforte-fresco',
    brand: 'Veloforte',
    product: 'Fresco Gel',
    type: 'gel',
    carbsG: 22,
    sodiumMg: 30,
    caffeineMg: 0,
    servingSize: '33 g',
    typicalPrice: 2.8,
    currency: '£',
    regions: ['UK', 'EU'],
    tags: ['sensitive-stomach', 'caffeine-free'],
    lastChecked: CHECKED,
    note: 'Natural / real-food ingredients — popular with sensitive stomachs.',
  },
  {
    id: 'pf30-gel',
    brand: 'Precision Fuel & Hydration',
    product: 'PF 30 Gel',
    type: 'gel',
    carbsG: 30,
    sodiumMg: 0,
    caffeineMg: 0,
    servingSize: '51 g',
    typicalPrice: 2.6,
    currency: '£',
    regions: ['UK', 'EU', 'US'],
    tags: ['caffeine-free', 'sensitive-stomach'],
    lastChecked: CHECKED,
    note: 'Deliberately sodium-free — electrolytes handled separately.',
  },
  {
    id: 'pf90-flask',
    brand: 'Precision Fuel & Hydration',
    product: 'PF 90 Gel (flask)',
    type: 'flask',
    carbsG: 90,
    sodiumMg: 0,
    caffeineMg: 0,
    servingSize: '153 g flask',
    typicalPrice: 6.5,
    currency: '£',
    regions: ['UK', 'EU', 'US'],
    tags: ['soft-flask', 'high-carb', 'caffeine-free'],
    lastChecked: CHECKED,
    note: 'Three hours of fuel at 30 g/h in one flask — the ready-made version of DIY syrup.',
  },

  // ---------- EU ----------
  {
    id: 'maurten-100',
    brand: 'Maurten',
    product: 'Gel 100',
    type: 'gel',
    carbsG: 25,
    sodiumMg: 34,
    caffeineMg: 0,
    servingSize: '40 g',
    typicalPrice: 3.9,
    currency: '€',
    regions: ['EU', 'UK', 'US'],
    tags: ['sensitive-stomach', 'widely-available', 'caffeine-free'],
    lastChecked: CHECKED,
    note: 'Hydrogel format; the premium sensitive-stomach benchmark.',
  },
  {
    id: 'maurten-160',
    brand: 'Maurten',
    product: 'Gel 160',
    type: 'gel',
    carbsG: 40,
    sodiumMg: 55,
    caffeineMg: 0,
    servingSize: '65 g',
    typicalPrice: 4.4,
    currency: '€',
    regions: ['EU', 'UK', 'US'],
    tags: ['high-carb', 'caffeine-free'],
    lastChecked: CHECKED,
  },
  {
    id: 'enervit-isotonic',
    brand: 'Enervit',
    product: 'Isotonic Gel',
    type: 'gel',
    carbsG: 24,
    sodiumMg: 40,
    caffeineMg: 0,
    servingSize: '60 ml',
    typicalPrice: 2.2,
    currency: '€',
    regions: ['EU'],
    tags: ['caffeine-free'],
    lastChecked: CHECKED,
  },
  {
    id: '226ers-high-energy',
    brand: '226ERS',
    product: 'High Energy Gel',
    type: 'gel',
    carbsG: 50,
    sodiumMg: 60,
    caffeineMg: 0,
    servingSize: '76 g',
    typicalPrice: 2.9,
    currency: '€',
    regions: ['EU'],
    tags: ['high-carb', 'caffeine-free'],
    lastChecked: CHECKED,
  },
  {
    id: 'decathlon-gel',
    brand: 'Decathlon',
    product: 'Energy Gel (own brand)',
    type: 'gel',
    carbsG: 21,
    sodiumMg: 55,
    caffeineMg: 0,
    servingSize: '32 g',
    typicalPrice: 1.1,
    currency: '€',
    regions: ['EU'],
    tags: ['value', 'caffeine-free', 'widely-available'],
    lastChecked: CHECKED,
    note: 'Store-brand pricing; available in every Decathlon.',
  },
  {
    id: 'powerbar-powergel',
    brand: 'PowerBar',
    product: 'PowerGel Original',
    type: 'gel',
    carbsG: 27,
    sodiumMg: 200,
    caffeineMg: 0,
    servingSize: '41 g',
    typicalPrice: 1.9,
    currency: '€',
    regions: ['EU'],
    tags: ['caffeine-free'],
    lastChecked: CHECKED,
    note: 'Notably high sodium per serving — useful for heavy sweaters.',
  },
  {
    id: 'nduranz-nrgy',
    brand: 'Nduranz',
    product: 'Nrgy Unit Gel',
    type: 'gel',
    carbsG: 45,
    sodiumMg: 150,
    caffeineMg: 0,
    servingSize: '75 g',
    typicalPrice: 2.5,
    currency: '€',
    regions: ['EU'],
    tags: ['high-carb', 'caffeine-free'],
    lastChecked: CHECKED,
    note: '1:0.8 ratio with meaningful sodium.',
  },

  // ---------- US ----------
  {
    id: 'gu-original',
    brand: 'GU Energy',
    product: 'Original Energy Gel',
    type: 'gel',
    carbsG: 22,
    sodiumMg: 60,
    caffeineMg: 20,
    servingSize: '32 g',
    typicalPrice: 1.75,
    currency: '$',
    regions: ['US', 'UK', 'EU'],
    tags: ['widely-available'],
    lastChecked: CHECKED,
    note: 'Caffeine varies 0–40 mg by flavour; caffeine-free flavours exist.',
  },
  {
    id: 'gu-roctane',
    brand: 'GU Energy',
    product: 'Roctane Energy Gel',
    type: 'gel',
    carbsG: 21,
    sodiumMg: 125,
    caffeineMg: 35,
    servingSize: '32 g',
    typicalPrice: 2.75,
    currency: '$',
    regions: ['US'],
    tags: [],
    lastChecked: CHECKED,
    note: 'Higher sodium and amino acids; caffeine varies by flavour.',
  },
  {
    id: 'honey-stinger',
    brand: 'Honey Stinger',
    product: 'Organic Energy Gel',
    type: 'gel',
    carbsG: 24,
    sodiumMg: 50,
    caffeineMg: 0,
    servingSize: '32 g',
    typicalPrice: 1.6,
    currency: '$',
    regions: ['US'],
    tags: ['value', 'caffeine-free', 'sensitive-stomach'],
    lastChecked: CHECKED,
    note: 'Honey-based — a real-food option.',
  },
  {
    id: 'untapped-maple',
    brand: 'UnTapped',
    product: 'Pure Maple Syrup Gel',
    type: 'gel',
    carbsG: 26,
    sodiumMg: 15,
    caffeineMg: 0,
    servingSize: '30 g',
    typicalPrice: 1.9,
    currency: '$',
    regions: ['US'],
    tags: ['sensitive-stomach', 'caffeine-free'],
    lastChecked: CHECKED,
    note: 'Single-ingredient maple syrup; very gentle.',
  },
  {
    id: 'neversecond-c30',
    brand: 'Neversecond',
    product: 'C30 Energy Gel',
    type: 'gel',
    carbsG: 30,
    sodiumMg: 200,
    caffeineMg: 0,
    servingSize: '60 ml',
    typicalPrice: 2.1,
    currency: '$',
    regions: ['US', 'EU'],
    tags: ['caffeine-free'],
    lastChecked: CHECKED,
    note: '2:1 glucose:fructose with high sodium.',
  },
  {
    id: 'clif-shot',
    brand: 'Clif',
    product: 'Shot Energy Gel',
    type: 'gel',
    carbsG: 24,
    sodiumMg: 60,
    caffeineMg: 0,
    servingSize: '34 g',
    typicalPrice: 1.5,
    currency: '$',
    regions: ['US'],
    tags: ['value', 'widely-available'],
    lastChecked: CHECKED,
    note: 'Caffeinated flavours run 25–100 mg; caffeine-free listed here.',
  },
  {
    id: 'huma-chia',
    brand: 'Huma',
    product: 'Chia Energy Gel',
    type: 'gel',
    carbsG: 22,
    sodiumMg: 105,
    caffeineMg: 0,
    servingSize: '39 g',
    typicalPrice: 1.9,
    currency: '$',
    regions: ['US'],
    tags: ['sensitive-stomach', 'caffeine-free'],
    lastChecked: CHECKED,
    note: 'Real-food chia base, 2:1 ratio.',
  },
  {
    id: 'maurten-320-mix',
    brand: 'Maurten',
    product: 'Drink Mix 320',
    type: 'flask',
    carbsG: 79,
    sodiumMg: 200,
    caffeineMg: 0,
    servingSize: '80 g sachet (500 ml)',
    typicalPrice: 4.6,
    currency: '$',
    regions: ['US', 'UK', 'EU'],
    tags: ['soft-flask', 'high-carb', 'caffeine-free'],
    lastChecked: CHECKED,
    note: 'Bottle/flask format — the ready-made version of a DIY bottle mix.',
  },
];

export function costPerGramCarb(p: GelProduct): number {
  return p.typicalPrice / p.carbsG;
}

export function productsForRegion(region: Region): GelProduct[] {
  return GEL_PRODUCTS.filter((p) => p.regions.includes(region)).sort(
    (a, b) => costPerGramCarb(a) - costPerGramCarb(b)
  );
}

export interface UseCasePick {
  label: string;
  product: GelProduct;
}

// §9 use-case picks — computed per region, never a single "best overall".
export function useCasePicks(region: Region): UseCasePick[] {
  const pool = productsForRegion(region);
  const picks: UseCasePick[] = [];
  const byCost = (list: GelProduct[]) => [...list].sort((a, b) => costPerGramCarb(a) - costPerGramCarb(b));

  const cheapestGel = byCost(pool.filter((p) => p.type === 'gel'))[0];
  if (cheapestGel) picks.push({ label: 'Cheapest race-day gel', product: cheapestGel });

  const highCarb = [...pool].sort((a, b) => b.carbsG - a.carbsG)[0];
  if (highCarb) picks.push({ label: 'Best high-carb option', product: highCarb });

  const caffeineFree = byCost(pool.filter((p) => p.caffeineMg === 0 && p.type === 'gel'))[0];
  if (caffeineFree) picks.push({ label: 'Best caffeine-free', product: caffeineFree });

  const flask = byCost(pool.filter((p) => p.tags.includes('soft-flask')))[0];
  if (flask) picks.push({ label: 'Best soft-flask alternative', product: flask });

  const sensitive = byCost(pool.filter((p) => p.tags.includes('sensitive-stomach')))[0];
  if (sensitive) picks.push({ label: 'Best sensitive-stomach candidate', product: sensitive });

  const wide = byCost(pool.filter((p) => p.tags.includes('widely-available')))[0];
  if (wide) picks.push({ label: 'Most widely available', product: wide });

  return picks;
}
