import type { VehicleMake, VehicleModel } from '../types';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// Module-level caches
let makesCacheData: VehicleMake[] | null = null;
const modelsCache = new Map<number, VehicleModel[]>();

export async function fetchAllMakes(): Promise<VehicleMake[]> {
  if (makesCacheData) return makesCacheData;

  const res = await fetch(`${NHTSA_BASE}/getallmakes?format=json`);
  if (!res.ok) throw new Error('Failed to fetch makes');

  const data = await res.json();
  const makes: VehicleMake[] = (data.Results ?? [])
    .filter((r: Record<string, unknown>) => r.Make_Name && typeof r.Make_Name === 'string' && (r.Make_Name as string).trim().length > 0)
    .map((r: Record<string, unknown>) => ({
      makeId: r.Make_ID as number,
      makeName: (r.Make_Name as string).trim(),
    }));

  makesCacheData = makes;
  return makes;
}

export async function fetchModelsForMake(makeId: number): Promise<VehicleModel[]> {
  if (modelsCache.has(makeId)) return modelsCache.get(makeId)!;

  const res = await fetch(`${NHTSA_BASE}/getmodelsformakeid/${makeId}?format=json`);
  if (!res.ok) throw new Error('Failed to fetch models');

  const data = await res.json();
  const models: VehicleModel[] = (data.Results ?? [])
    .filter((r: Record<string, unknown>) => r.Model_Name)
    .map((r: Record<string, unknown>) => ({
      modelId: r.Model_ID as number,
      modelName: (r.Model_Name as string).trim(),
    }));

  modelsCache.set(makeId, models);
  return models;
}

// Keyword-based heuristic body class from model name
// Used as a fast fallback before CarAPI.app responds
export function guessBodyClassFromModel(modelName: string): string | null {
  const m = modelName.toLowerCase();
  if (/\b(f-?150|f-?250|f-?350|silverado|sierra|ram|tundra|tacoma|frontier|ranger|colorado|canyon|ridgeline|titan|maverick|cybertruck|pickup|truck)\b/.test(m)) return 'Pickup';
  if (/\b(suburban|tahoe|expedition|navigator|sequoia|4runner|land cruiser|escalade|yukon|armada|gx|lx|qx80|patrol|defender|wrangler|bronco|blazer|trailblazer|explorer|pilot|pathfinder|highlander|4-runner)\b/.test(m)) return 'SUV';
  if (/\b(cr-?v|rav4|rogue|escape|equinox|tiguan|tucson|sportage|cx-?5|cx-?50|forester|outback|ascent|atlas|telluride|palisade|murano|rogue|qx50|rdx|mdx|q5|q7|x3|x5|x7|gla|glb|glc|gle|traverse|enclave|acadia|edge|flex|crossover)\b/.test(m)) return 'SUV';
  if (/\b(transit|sprinter|promaster|nv|express|savana|metris|sienna|odyssey|carnival|pacifica|chrysler|minivan|town &amp; country|town and country)\b/.test(m)) return 'Van';
  if (/\b(corvette|camaro|mustang|challenger|charger|miata|mx-5|supra|gt-r|gtr|911|boxster|cayman|viper|ferrari|lamborghini|mclaren|lotus|nsx|s2000|wrx sti|coupe|86|brz|gr86|type r)\b/.test(m)) return 'Sports Car';
  if (/\b(model s|model 3|model y|model x|sedan|camry|accord|civic|altima|sentra|maxima|malibu|fusion|sonata|elantra|optima|k5|jetta|passat|arteon|stinger|genesis|g80|g70|a4|a6|3 series|5 series|c-class|e-class|is|es|gs|ls|ghibli|quattroporte|panamera)\b/.test(m)) return 'Sedan';
  return null;
}
