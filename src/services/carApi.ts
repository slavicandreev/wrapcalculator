// CarAPI.app — free, no auth required
// Docs: https://carapi.app/

const CARAPI_BASE = 'https://carapi.app/api';

const trimsCache = new Map<string, string[]>();

export async function fetchTrims(make: string, model: string, year: number): Promise<string[]> {
  const cacheKey = `${make}-${model}-${year}`.toLowerCase();
  if (trimsCache.has(cacheKey)) return trimsCache.get(cacheKey)!;

  try {
    const url = `${CARAPI_BASE}/trims?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&limit=50`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const trimNames: string[] = [];
    const seen = new Set<string>();

    for (const item of data.data ?? []) {
      const name: string = item.name ?? item.trim ?? '';
      if (name && !seen.has(name)) {
        seen.add(name);
        trimNames.push(name);
      }
    }

    trimsCache.set(cacheKey, trimNames);
    return trimNames;
  } catch {
    return [];
  }
}

export async function fetchBodyStyle(make: string, model: string, year: number): Promise<string | null> {
  try {
    const url = `${CARAPI_BASE}/trims?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    return data.data?.[0]?.body_style ?? null;
  } catch {
    return null;
  }
}
