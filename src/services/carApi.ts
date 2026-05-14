// CarAPI.app — trims lookup
// In WordPress mode, proxied through WP REST to avoid CORS.
// In Vercel/dev mode, calls CarAPI directly.

const CARAPI_BASE = 'https://carapi.app/api';

const trimsCache = new Map<string, string[]>();

function getTrimsUrl(make: string, model: string, year: number): string {
  const wpBase = window.wrapmatchproConfig?.apiBase;
  if (wpBase) {
    // WordPress: proxy through our REST endpoint
    return `${wpBase}/trims?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&limit=50`;
  }
  // Vercel/dev: call CarAPI directly
  return `${CARAPI_BASE}/trims/v2?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&limit=50`;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (window.wrapmatchproConfig?.nonce) {
    headers['X-WP-Nonce'] = window.wrapmatchproConfig.nonce;
  }
  return headers;
}

export async function fetchTrims(make: string, model: string, year: number): Promise<string[]> {
  const cacheKey = `${make}-${model}-${year}`.toLowerCase();
  if (trimsCache.has(cacheKey)) return trimsCache.get(cacheKey)!;

  try {
    const url = getTrimsUrl(make, model, year);
    const res = await fetch(url, { headers: getHeaders() });
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

// v2 API no longer returns body_style — body class is now resolved
// entirely via NHTSA heuristics in Step2VehicleSelect.
