import type { WizardState, PriceRange } from '../types';
import {
  MATERIAL_PRICING,
  LABOR_RATE,
  COVERAGE_MULTIPLIER,
  PROJECT_TYPE_ADJUSTMENTS,
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
  const { projectType, vehicle, stateCode, customization } = state;

  // Need at least bodyClass + material + coverage to show a price
  if (!customization.material || !customization.coverage) {
    // Show a rough estimate if we have bodyClass even without material
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

  // 4. Project type adjustment
  const projAdj = PROJECT_TYPE_ADJUSTMENTS[projectType ?? 'personal'] ?? 1.0;

  // 5. State/regional multiplier
  const stateData = stateCode ? getStateByCode(stateCode) : undefined;
  const stateMult = stateData?.multiplier ?? 1.0;

  // 6. Base cost: area × coverage × (material + labor) × state × projectType
  const coveredAreaMin = area.min * coverageMult;
  const coveredAreaMax = area.max * coverageMult;
  const costPerSqftMin = matCost.min + LABOR_RATE.min;
  const costPerSqftMax = matCost.max + LABOR_RATE.max;

  let priceMin = coveredAreaMin * costPerSqftMin * stateMult * projAdj;
  let priceMax = coveredAreaMax * costPerSqftMax * stateMult * projAdj;

  // 7. Add-ons
  const selectedAddons = customization.selectedAddons ?? [];
  for (const addonId of selectedAddons) {
    const addon = ADDONS.find(a => a.id === addonId);
    if (addon) {
      priceMin += addon.priceMin;
      priceMax += addon.priceMax;
    }
  }

  // 8. Decal minimum floor
  if (coverage === 'decal') {
    priceMin = Math.max(priceMin, DECAL_PRICE_FLOOR.min);
    priceMax = Math.max(priceMax, DECAL_PRICE_FLOOR.max);
  }

  return {
    min: roundTo(Math.max(priceMin, 200), PRICE_ROUND_TO),
    max: roundTo(Math.max(priceMax, 400), PRICE_ROUND_TO),
  };
}

export function formatPriceRange(range: PriceRange): string {
  return `$${range.min.toLocaleString()} – $${range.max.toLocaleString()}`;
}
