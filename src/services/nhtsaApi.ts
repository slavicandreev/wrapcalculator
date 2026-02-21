import type { VehicleMake, VehicleModel } from '../types';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// Module-level caches
const makesCache: VehicleMake[] | null = null;
let makesCacheData: VehicleMake[] | null = makesCache;
const modelsCache = new Map<number, VehicleModel[]>();
const bodyClassCache = new Map<string, string>();

export async function fetchAllMakes(): Promise<VehicleMake[]> {
  if (makesCacheData) return makesCacheData;

  const res = await fetch(`${NHTSA_BASE}/getallmakes?format=json`);
  if (!res.ok) throw new Error('Failed to fetch makes');

  const data = await res.json();
  const makes: VehicleMake[] = (data.Results ?? [])
    .filter((r: Record<string, unknown>) => r.MakeName && typeof r.MakeName === 'string' && (r.MakeName as string).trim().length > 0)
    .map((r: Record<string, unknown>) => ({
      makeId: r.Make_ID as number,
      makeName: (r.MakeName as string).trim(),
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

export async function fetchBodyClass(make: string, model: string, year: number): Promise<string | null> {
  const cacheKey = `${make.toLowerCase()}-${model.toLowerCase()}-${year}`;
  if (bodyClassCache.has(cacheKey)) return bodyClassCache.get(cacheKey)!;

  try {
    const encoded = encodeURIComponent(make);
    const res = await fetch(
      `${NHTSA_BASE}/GetModelsForMakeYear/make/${encoded}/modelyear/${year}?format=json`
    );
    if (!res.ok) return null;

    const data = await res.json();
    const results: Record<string, unknown>[] = data.Results ?? [];

    // Find matching model
    const match = results.find((r) =>
      (r.Model_Name as string)?.toLowerCase() === model.toLowerCase()
    );

    if (!match) return null;

    // NHTSA VehicleTypeId: 1=Motorcycle, 2=Passenger Car, 3=Truck, 5=Bus, 6=Trailer, 7=Multipurpose Vehicle, 10=Incomplete Vehicle
    const vehicleTypeId = match.VehicleTypeId as number;
    let bodyClass: string | null = null;

    if (vehicleTypeId === 2) bodyClass = 'Sedan';
    else if (vehicleTypeId === 3) bodyClass = 'Pickup';
    else if (vehicleTypeId === 7) bodyClass = 'SUV';
    else bodyClass = null;

    if (bodyClass) bodyClassCache.set(cacheKey, bodyClass);
    return bodyClass;
  } catch {
    return null;
  }
}
