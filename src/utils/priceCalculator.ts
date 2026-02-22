import type { WizardState, PriceRange } from '../types';
import {
  MATERIAL_PRICING,
  LABOR_RATE,
  COVERAGE_MULTIPLIER,
  PROJECT_TYPE_ADJUSTMENTS,
  getFleetMultiplier,
  DECAL_PRICE_FLOOR,
  PRICE_ROUND_TO,
} from '../data/pricing';
import { getAreaForBodyClass } from '../data/vehicleAreas';
import { getStateByCode } from '../data/states';
import { ADDONS } from '../data/addons';

function roundTo(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

export function calculatePrice(state: WizardState): PriceRange | null {
  const { projectType, vehicle, stateCode, customization, fleetSize } = state;

  if (!customization.material || !customization.coverage) {
    if (!vehicle.bodyClass && !customization.coverage) return null;
    if (!customization.coverage) return null;
  }

  // 1. Vehicle surface area (sq ft)
  const area = getAreaForBodyClass(vehicle.bodyClass);

  // 2. Material cost per sq ft
  const material = customization.material ?? 'gloss';
  const matCost = MATERIAL_PRICING[material] ?? MATERIAL_PRICING.gloss;

  // 3. Coverage multiplier
  const coverage = customization.coverage ?? 'full';
  const coverageMult = COVERAGE_MULTIPLIER[coverage] ?? 1.0;

  // 4. Project type adjustment (personal / business only — fleet handled separately)
  const projAdj = projectType === 'fleet'
    ? 1.0 // fleet multiplier applied after, along with count
    : (PROJECT_TYPE_ADJUSTMENTS[projectType ?? 'personal'] ?? 1.0);

  // 5. State/regional multiplier
  const stateData = stateCode ? getStateByCode(stateCode) : undefined;
  const stateMult = stateData?.multiplier ?? 1.0;

  // 6. Single-vehicle base cost
  const coveredAreaMin = area.min * coverageMult;
  const coveredAreaMax = area.max * coverageMult;
  const costPerSqftMin = matCost.min + LABOR_RATE.min;
  const costPerSqftMax = matCost.max + LABOR_RATE.max;

  let singleMin = coveredAreaMin * costPerSqftMin * stateMult * projAdj;
  let singleMax = coveredAreaMax * costPerSqftMax * stateMult * projAdj;

  // 7. Add-ons (per vehicle)
  const selectedAddons = customization.selectedAddons ?? [];
  for (const addonId of selectedAddons) {
    const addon = ADDONS.find(a => a.id === addonId);
    if (addon) {
      singleMin += addon.priceMin;
      singleMax += addon.priceMax;
    }
  }

  // 8. Decal minimum floor (per vehicle)
  if (coverage === 'decal') {
    singleMin = Math.max(singleMin, DECAL_PRICE_FLOOR.min);
    singleMax = Math.max(singleMax, DECAL_PRICE_FLOOR.max);
  }

  // 9. Fleet: apply tiered multiplier × vehicle count
  let priceMin = singleMin;
  let priceMax = singleMax;

  if (projectType === 'fleet' && fleetSize && fleetSize >= 2) {
    const fleetMult = getFleetMultiplier(fleetSize);
    priceMin = singleMin * fleetSize * fleetMult;
    priceMax = singleMax * fleetSize * fleetMult;
  }

  return {
    min: roundTo(Math.max(priceMin, 200), PRICE_ROUND_TO),
    max: roundTo(Math.max(priceMax, 400), PRICE_ROUND_TO),
    // Expose single-vehicle price for Step 5 breakdown
    singleMin: projectType === 'fleet' ? roundTo(Math.max(singleMin, 200), PRICE_ROUND_TO) : undefined,
    singleMax: projectType === 'fleet' ? roundTo(Math.max(singleMax, 400), PRICE_ROUND_TO) : undefined,
  };
}

export function formatPriceRange(range: PriceRange): string {
  return `$${range.min.toLocaleString()} – $${range.max.toLocaleString()}`;
}
