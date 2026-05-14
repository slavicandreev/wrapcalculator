// Vehicle data from fueleconomy.gov — free, no auth, CORS-friendly
// Replaces both NHTSA (makes/models) and CarAPI (trims)
// Docs: https://www.fueleconomy.gov/feg/ws/

const BASE = 'https://www.fueleconomy.gov/ws/rest/vehicle/menu';

interface MenuItem {
  text: string;
  value: string;
}

// fueleconomy.gov returns { menuItem: MenuItem | MenuItem[] } — single item is NOT an array
function normalizeMenuItems(data: { menuItem?: MenuItem | MenuItem[] }): MenuItem[] {
  if (!data.menuItem) return [];
  return Array.isArray(data.menuItem) ? data.menuItem : [data.menuItem];
}

// ─── Caches ──────────────────────────────────────────────────────────────────

const makesCache = new Map<number, string[]>();
const modelsCache = new Map<string, string[]>();

// ─── Fetchers ────────────────────────────────────────────────────────────────

/** Fetch all makes for a given year */
export async function fetchMakes(year: number): Promise<string[]> {
  if (makesCache.has(year)) return makesCache.get(year)!;

  const res = await fetch(`${BASE}/make?year=${year}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch makes');

  const data = await res.json();
  const makes = normalizeMenuItems(data).map(item => item.text);

  makesCache.set(year, makes);
  return makes;
}

/** Fetch all models for a given year + make */
export async function fetchModels(year: number, make: string): Promise<string[]> {
  const key = `${year}-${make}`;
  if (modelsCache.has(key)) return modelsCache.get(key)!;

  const res = await fetch(
    `${BASE}/model?year=${year}&make=${encodeURIComponent(make)}`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) return [];

  const data = await res.json();
  const models = normalizeMenuItems(data).map(item => item.text);

  modelsCache.set(key, models);
  return models;
}

// ─── Body class heuristic ────────────────────────────────────────────────────

/** Keyword-based body class guess from model name */
export function guessBodyClassFromModel(modelName: string): string | null {
  const m = modelName.toLowerCase();
  if (/\b(f-?150|f-?250|f-?350|silverado|sierra|ram|tundra|tacoma|frontier|ranger|colorado|canyon|ridgeline|titan|maverick|cybertruck|pickup|truck)\b/.test(m)) return 'Pickup';
  if (/\b(suburban|tahoe|expedition|navigator|sequoia|4runner|land cruiser|escalade|yukon|armada|gx|lx|qx80|patrol|defender|wrangler|bronco|blazer|trailblazer|explorer|pilot|pathfinder|highlander|4-runner)\b/.test(m)) return 'SUV';
  if (/\b(cr-?v|rav4|rogue|escape|equinox|tiguan|tucson|sportage|cx-?5|cx-?50|forester|outback|ascent|atlas|telluride|palisade|murano|rogue|qx50|rdx|mdx|q5|q7|x3|x5|x7|gla|glb|glc|gle|traverse|enclave|acadia|edge|flex|crossover)\b/.test(m)) return 'SUV';
  if (/\b(transit|sprinter|promaster|nv|express|savana|metris|sienna|odyssey|carnival|pacifica|chrysler|minivan|town &amp; country|town and country)\b/.test(m)) return 'Van';
  if (/\b(corvette|camaro|mustang|challenger|charger|miata|mx-5|supra|gt-r|gtr|911|boxster|cayman|viper|ferrari|lamborghini|mclaren|lotus|nsx|s2000|wrx sti|86|brz|gr86|type r)\b/.test(m)) return 'Sports Car';
  // fueleconomy.gov often includes body type in the model name
  if (/\bconvertible\b/.test(m)) return 'Sports Car';
  if (/\bcoupe\b/.test(m)) return 'Sports Car';
  if (/\bsedan\b/.test(m)) return 'Sedan';
  if (/\bsuv\b/.test(m)) return 'SUV';
  if (/\bwagon\b/.test(m)) return 'Sedan';
  if (/\b(model s|model 3|model y|model x|camry|accord|civic|altima|sentra|maxima|malibu|fusion|sonata|elantra|optima|k5|jetta|passat|arteon|stinger|genesis|g80|g70|a4|a6|3 series|5 series|c-class|e-class|is|es|gs|ls|ghibli|quattroporte|panamera)\b/.test(m)) return 'Sedan';
  return null;
}
