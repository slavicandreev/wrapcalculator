// colorMatcher.ts
// Client-side color extraction and Delta-E 2000 matching against vinyl wrap SKU databases.
// All computation is synchronous and runs in < 5ms for 180 SKUs.

import type { WrapSku, SkuMatch } from '../data/wrapSkus';

// ─── sRGB → CIE Lab conversion ───────────────────────────────────────────────

function sRGBChannelToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearRGBToXYZ(r: number, g: number, b: number): [number, number, number] {
  // D65 sRGB matrix
  const X = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const Y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const Z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
  return [X, Y, Z];
}

function xyzFn(t: number): number {
  return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}

function xyzToLab(X: number, Y: number, Z: number): [number, number, number] {
  // D65 illuminant reference
  const fx = xyzFn(X / 0.95047);
  const fy = xyzFn(Y / 1.00000);
  const fz = xyzFn(Z / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function sRGBToLab(r: number, g: number, b: number): [number, number, number] {
  const rl = sRGBChannelToLinear(r);
  const gl = sRGBChannelToLinear(g);
  const bl = sRGBChannelToLinear(b);
  const [X, Y, Z] = linearRGBToXYZ(rl, gl, bl);
  return xyzToLab(X, Y, Z);
}

export function hexToLab(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return sRGBToLab(r, g, b);
}

/** Convert Lab back to hex string — used for displaying the extracted color swatch. */
export function labToHex(lab: [number, number, number]): string {
  const [L, a, b] = lab;
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const xyzFnInv = (f: number) =>
    f ** 3 > 0.008856 ? f ** 3 : (f - 16 / 116) / 7.787;

  const X = xyzFnInv(fx) * 0.95047;
  const Y = xyzFnInv(fy) * 1.00000;
  const Z = xyzFnInv(fz) * 1.08883;

  // XYZ → linear sRGB
  const rl =  X * 3.2404542 - Y * 1.5371385 - Z * 0.4985314;
  const gl = -X * 0.9692660 + Y * 1.8760108 + Z * 0.0415560;
  const bl =  X * 0.0556434 - Y * 0.2040259 + Z * 1.0572252;

  // Linear → sRGB gamma
  const toSRGB = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c));
    return clamped <= 0.0031308
      ? Math.round(clamped * 12.92 * 255)
      : Math.round((1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
  };

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(toSRGB(rl))}${toHex(toSRGB(gl))}${toHex(toSRGB(bl))}`;
}

// ─── CIE Delta-E 2000 ────────────────────────────────────────────────────────

/** Perceptually uniform color difference. <2 = imperceptible, <5 = close, <10 = similar */
export function deltaE2000(
  lab1: [number, number, number],
  lab2: [number, number, number],
): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  const kL = 1, kC = 1, kH = 1;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cbar = (C1 + C2) / 2;
  const C7 = Math.pow(Cbar, 7);
  const G = 0.5 * (1 - Math.sqrt(C7 / (C7 + 25 ** 7)));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p = Math.atan2(b1, a1p) * (180 / Math.PI);
  const h1pNorm = h1p < 0 ? h1p + 360 : h1p;
  const h2p = Math.atan2(b2, a2p) * (180 / Math.PI);
  const h2pNorm = h2p < 0 ? h2p + 360 : h2p;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2pNorm - h1pNorm) <= 180) {
    dhp = h2pNorm - h1pNorm;
  } else if (h2pNorm - h1pNorm > 180) {
    dhp = h2pNorm - h1pNorm - 360;
  } else {
    dhp = h2pNorm - h1pNorm + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * (Math.PI / 180));

  const Lbar = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let Hbarp: number;
  if (C1p * C2p === 0) {
    Hbarp = h1pNorm + h2pNorm;
  } else if (Math.abs(h1pNorm - h2pNorm) <= 180) {
    Hbarp = (h1pNorm + h2pNorm) / 2;
  } else if (h1pNorm + h2pNorm < 360) {
    Hbarp = (h1pNorm + h2pNorm + 360) / 2;
  } else {
    Hbarp = (h1pNorm + h2pNorm - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos((Hbarp - 30) * (Math.PI / 180)) +
    0.24 * Math.cos(2 * Hbarp * (Math.PI / 180)) +
    0.32 * Math.cos((3 * Hbarp + 6) * (Math.PI / 180)) -
    0.20 * Math.cos((4 * Hbarp - 63) * (Math.PI / 180));

  const SL = 1 + 0.015 * (Lbar - 50) ** 2 / Math.sqrt(20 + (Lbar - 50) ** 2);
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;

  const Cbarp7 = Math.pow(Cbarp, 7);
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + 25 ** 7));
  const dTheta = 30 * Math.exp(-(Math.pow((Hbarp - 275) / 25, 2)));
  const RT = -Math.sin(2 * dTheta * (Math.PI / 180)) * RC;

  return Math.sqrt(
    (dLp / (kL * SL)) ** 2 +
    (dCp / (kC * SC)) ** 2 +
    (dHp / (kH * SH)) ** 2 +
    RT * (dCp / (kC * SC)) * (dHp / (kH * SH)),
  );
}

// ─── Dominant color extraction via k-means clustering ─────────────────────────

const MAX_DIM = 200;     // Downscale for speed
const K = 4;             // Clusters: body color, trim/chrome, glass, shadows
const MAX_ITER = 20;     // Converges well within this for color data
const MAX_SAMPLES = 800; // Cap pixel count fed to k-means

type Lab = [number, number, number];

function labDistSq(a: Lab, b: Lab): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

/**
 * k-means++ initialization: spreads initial centroids across the color space
 * to avoid the degenerate case where multiple centroids land in the same cluster.
 */
function kMeansPlusPlus(pixels: Lab[], k: number): Lab[] {
  const centroids: Lab[] = [pixels[Math.floor(Math.random() * pixels.length)]];

  while (centroids.length < k) {
    const dists = pixels.map(p => Math.min(...centroids.map(c => labDistSq(p, c))));
    const total = dists.reduce((s, d) => s + d, 0);
    let r = Math.random() * total;
    let picked = pixels[pixels.length - 1];
    for (let i = 0; i < pixels.length; i++) {
      r -= dists[i];
      if (r <= 0) { picked = pixels[i]; break; }
    }
    centroids.push(picked);
  }

  return centroids;
}

/**
 * Runs k-means in Lab space and returns the centroid of the largest cluster.
 * The largest cluster is almost always the car body color — trim, glass, and
 * shadows form smaller distinct clusters that get separated out.
 */
function kMeansLargestCluster(pixels: Lab[]): Lab {
  if (pixels.length === 0) return [50, 0, 0];
  if (pixels.length <= K) return pixels[0];

  const centroids = kMeansPlusPlus(pixels, K);
  const assignments = new Int32Array(pixels.length);

  for (let iter = 0; iter < MAX_ITER; iter++) {
    let changed = false;

    // Assign each pixel to nearest centroid
    for (let i = 0; i < pixels.length; i++) {
      let minD = Infinity, nearest = 0;
      for (let j = 0; j < K; j++) {
        const d = labDistSq(pixels[i], centroids[j]);
        if (d < minD) { minD = d; nearest = j; }
      }
      if (assignments[i] !== nearest) { assignments[i] = nearest; changed = true; }
    }

    if (!changed) break;

    // Recompute centroids
    for (let j = 0; j < K; j++) {
      let sL = 0, sA = 0, sB = 0, n = 0;
      for (let i = 0; i < pixels.length; i++) {
        if (assignments[i] !== j) continue;
        sL += pixels[i][0]; sA += pixels[i][1]; sB += pixels[i][2]; n++;
      }
      if (n > 0) centroids[j] = [sL / n, sA / n, sB / n];
    }
  }

  // Pick the largest cluster
  const counts = new Int32Array(K);
  for (let i = 0; i < pixels.length; i++) counts[assignments[i]]++;
  let best = 0;
  for (let j = 1; j < K; j++) if (counts[j] > counts[best]) best = j;
  return centroids[best];
}

/**
 * Extracts the dominant car body Lab color using k-means clustering.
 * Samples the center 50% of the image, skips near-white/near-black pixels,
 * then clusters into K groups and returns the centroid of the largest cluster.
 */
export function extractDominantLab(img: HTMLImageElement): Lab {
  const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, w, h);

  // Read center 50% region
  const margin = 0.25;
  const x0 = Math.floor(w * margin);
  const y0 = Math.floor(h * margin);
  const sw = Math.max(1, Math.floor(w * 0.5));
  const sh = Math.max(1, Math.floor(h * 0.5));
  const { data } = ctx.getImageData(x0, y0, sw, sh);

  // Collect candidate pixels, subsampled to MAX_SAMPLES
  const totalPixels = sw * sh;
  const step = Math.max(1, Math.ceil(totalPixels / MAX_SAMPLES));
  const candidates: Lab[] = [];

  for (let i = 0; i < data.length; i += 4 * step) {
    const lab = sRGBToLab(data[i], data[i + 1], data[i + 2]);
    if (lab[0] > 92 || lab[0] < 8) continue; // skip sky/shadow
    candidates.push(lab);
  }

  // Fallback: if all pixels were filtered (very dark/light car), use them all
  if (candidates.length < K) {
    for (let i = 0; i < data.length; i += 4 * step) {
      candidates.push(sRGBToLab(data[i], data[i + 1], data[i + 2]));
    }
  }

  return kMeansLargestCluster(candidates);
}

// ─── Matching ─────────────────────────────────────────────────────────────────

/**
 * Returns the top N closest SKUs from the database, sorted by Delta-E 2000 score.
 */
export function matchColor(
  extractedLab: [number, number, number],
  database: WrapSku[],
  topN = 6,
): SkuMatch[] {
  return database
    .map(sku => ({ sku, deltaE: deltaE2000(extractedLab, hexToLab(sku.hex)) }))
    .sort((a, b) => a.deltaE - b.deltaE)
    .slice(0, topN);
}

/**
 * Re-orders existing SkuMatch[] to place AI-preferred SKUs first.
 * Remaining algorithmic results are appended after.
 */
export function reorderByAI(matches: SkuMatch[], rankedSkus: string[]): SkuMatch[] {
  const aiFirst: SkuMatch[] = [];
  const rest: SkuMatch[] = [];

  for (const skuCode of rankedSkus) {
    const found = matches.find(m => m.sku.sku === skuCode);
    if (found) aiFirst.push({ ...found, aiRefined: true });
  }
  for (const m of matches) {
    if (!rankedSkus.includes(m.sku.sku)) rest.push(m);
  }

  return [...aiFirst, ...rest];
}

/** Human-readable Delta-E confidence tier */
export function deltaETier(deltaE: number): { label: string; className: string } {
  if (deltaE < 2)  return { label: 'Excellent',   className: 'text-emerald-600' };
  if (deltaE < 5)  return { label: 'Very close',  className: 'text-brand-600'   };
  if (deltaE < 10) return { label: 'Similar',     className: 'text-amber-600'   };
  return                  { label: 'Approximate', className: 'text-slate-400'   };
}
