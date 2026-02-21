// IMAGIN.Studio car imagery API
// Free tier: customer=img (watermarked)
// Paid tier: use your own customer key
// Docs: https://docs.imagin.studio/

const IMAGIN_BASE = 'https://cdn.imagin.studio/getimage';
const CUSTOMER_KEY = 'img'; // free tier — swap for paid key in production

export type ImagineAngle = 'side' | 'front' | 'rear' | 'frontInterior' | 'rearInterior';

export interface ImagineImageParams {
  make: string;
  model: string;
  year: number;
  angle?: ImagineAngle;
  width?: number;
  paintId?: string;
  customerKey?: string;
}

// Normalize make/model names to IMAGIN slug format (lowercase, no special chars)
export function toImagineSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars except space/hyphen
    .replace(/\s+/g, '-')            // spaces to hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .trim();
}

export function buildImagineUrl({
  make,
  model,
  year,
  angle = 'side',
  width = 800,
  paintId = '',
  customerKey = CUSTOMER_KEY,
}: ImagineImageParams): string {
  const params = new URLSearchParams({
    customer: customerKey,
    make: toImagineSlug(make),
    modelFamily: toImagineSlug(model),
    modelYear: String(year),
    angle,
    width: String(width),
    zoomType: 'fullscreen',
    ...(paintId ? { paintId } : {}),
  });

  return `${IMAGIN_BASE}?${params.toString()}`;
}

export function buildImagineUrls(
  make: string,
  model: string,
  year: number,
  customerKey?: string
): { side: string; front: string; rear: string } {
  const base = { make, model, year, customerKey };
  return {
    side:  buildImagineUrl({ ...base, angle: 'side',          width: 800 }),
    front: buildImagineUrl({ ...base, angle: 'frontInterior', width: 800 }),
    rear:  buildImagineUrl({ ...base, angle: 'rear',          width: 800 }),
  };
}

// Check if an IMAGIN URL actually resolves (returns true if image loads)
export async function checkImagineAvailable(url: string): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
}
