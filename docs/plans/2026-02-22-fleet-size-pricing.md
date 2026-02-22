# Fleet Size + Tiered Pricing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Number of vehicles" dropdown to Step 2 (only for fleet projects) and apply tiered per-vehicle discounts in the price calculator, showing a total fleet price + per-vehicle breakdown on Step 5.

**Architecture:** `fleetSize: number | null` added to `WizardState`. A `getFleetMultiplier(size)` helper in `pricing.ts` replaces the flat `fleet: 0.85` constant. `calculatePrice` multiplies the single-vehicle price by `fleetSize × multiplier`. Step 2 renders the dropdown conditionally when `projectType === 'fleet'`. Step 5 shows the total plus a "per vehicle" sub-line.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, Vite 5. No new dependencies.

---

## Tier Reference

| Fleet size | Discount | Multiplier |
|---|---|---|
| 2–4 vehicles | 10% off | 0.90 |
| 5–9 vehicles | 15% off | 0.85 |
| 10+ vehicles | 20% off | 0.80 |

---

### Task 1: Add `fleetSize` to types + wizard action

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/context/wizardReducer.ts`

**Step 1: Add `fleetSize` to `WizardState` and new action to `WizardAction`**

In `src/types/index.ts`, add `fleetSize: number | null` to `WizardState` and add `SET_FLEET_SIZE` action:

```typescript
// In WizardState interface — add after stateCode:
fleetSize: number | null; // only used when projectType === 'fleet'

// In WizardAction union — add:
| { type: 'SET_FLEET_SIZE'; payload: number | null }
```

**Step 2: Handle new action in reducer**

In `src/context/wizardReducer.ts`, find the switch statement and add a case. Also reset `fleetSize` when project type changes away from fleet:

```typescript
case 'SET_FLEET_SIZE':
  return { ...state, fleetSize: action.payload };

case 'SET_PROJECT_TYPE':
  return {
    ...state,
    projectType: action.payload,
    // reset fleet size if switching away from fleet
    fleetSize: action.payload === 'fleet' ? (state.fleetSize ?? 2) : null,
  };
```

Also add `fleetSize: null` to the initial state in the reducer.

**Step 3: TypeScript check**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npx tsc --noEmit 2>&1
```
Expected: no errors.

**Step 4: Commit**

```bash
git add src/types/index.ts src/context/wizardReducer.ts
git commit -m "feat: add fleetSize to WizardState and SET_FLEET_SIZE action"
```

---

### Task 2: Add `getFleetMultiplier` to pricing data

**Files:**
- Modify: `src/data/pricing.ts`

**Step 1: Replace flat fleet constant with a tiered multiplier function**

In `src/data/pricing.ts`, the current `PROJECT_TYPE_ADJUSTMENTS` has `fleet: 0.85`. Keep the record for `personal` and `business` but remove `fleet` from it (to avoid confusion), and add a dedicated fleet helper:

```typescript
// Replace the existing PROJECT_TYPE_ADJUSTMENTS with:
export const PROJECT_TYPE_ADJUSTMENTS: Record<'personal' | 'business', number> = {
  personal: 1.0,
  business: 1.1,
};

// Fleet tier multipliers (per-vehicle discount, applied before multiplying by count)
export const FLEET_TIERS: { min: number; max: number | null; multiplier: number; label: string }[] = [
  { min: 2,  max: 4,    multiplier: 0.90, label: '10% fleet discount' },
  { min: 5,  max: 9,    multiplier: 0.85, label: '15% fleet discount' },
  { min: 10, max: null, multiplier: 0.80, label: '20% fleet discount' },
];

export function getFleetMultiplier(size: number): number {
  const tier = FLEET_TIERS.find(t => size >= t.min && (t.max === null || size <= t.max));
  return tier?.multiplier ?? 0.85; // fallback to 15% if somehow out of range
}

export function getFleetDiscountLabel(size: number): string {
  const tier = FLEET_TIERS.find(t => size >= t.min && (t.max === null || size <= t.max));
  return tier?.label ?? 'Fleet discount';
}
```

**Step 2: TypeScript check**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npx tsc --noEmit 2>&1
```

This will produce errors in `priceCalculator.ts` because `PROJECT_TYPE_ADJUSTMENTS` no longer has `fleet` — that's expected and will be fixed in Task 3.

**Step 3: Commit**

```bash
git add src/data/pricing.ts
git commit -m "feat: add tiered fleet discount tiers and getFleetMultiplier helper"
```

---

### Task 3: Update `calculatePrice` for fleet size + tiered discounts

**Files:**
- Modify: `src/utils/priceCalculator.ts`

**Step 1: Update imports and fleet logic**

Replace the current content of `src/utils/priceCalculator.ts` with:

```typescript
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
```

**Step 2: Update `PriceRange` type to include optional single-vehicle fields**

In `src/types/index.ts`, update `PriceRange`:

```typescript
export interface PriceRange {
  min: number;
  max: number;
  singleMin?: number; // per-vehicle price (fleet only)
  singleMax?: number;
}
```

**Step 3: TypeScript check**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npx tsc --noEmit 2>&1
```
Expected: no errors.

**Step 4: Commit**

```bash
git add src/utils/priceCalculator.ts src/types/index.ts
git commit -m "feat: update calculatePrice for fleet tiered discount x vehicle count"
```

---

### Task 4: Add fleet size dropdown to Step 2

**Files:**
- Modify: `src/components/steps/Step2VehicleSelect.tsx`

**Step 1: Add fleet size options constant and dropdown JSX**

At the top of `Step2VehicleSelect.tsx`, after the imports, add:

```typescript
const FLEET_SIZE_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50];
```

Inside the component, destructure `projectType` and `fleetSize` from state:

```typescript
const { state, dispatch } = useWizard();
const { vehicle } = state;
const isFleet = state.projectType === 'fleet';
const fleetSize = state.fleetSize ?? 2;
```

After the Trim field block (and before the `apiError` block), add:

```tsx
{/* Fleet size — only shown for fleet project type */}
{isFleet && (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      Number of vehicles
    </label>
    <select
      value={fleetSize}
      onChange={e => dispatch({ type: 'SET_FLEET_SIZE', payload: Number(e.target.value) })}
      className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 bg-white focus:border-brand-400 focus:outline-none transition-colors"
    >
      {FLEET_SIZE_OPTIONS.map(n => (
        <option key={n} value={n}>
          {n === 50 ? '50+ vehicles' : `${n} vehicles`}
        </option>
      ))}
    </select>
    <p className="text-xs text-slate-400 mt-1.5">
      {fleetSize >= 10 ? '20% volume discount applied' :
       fleetSize >= 5  ? '15% volume discount applied' :
                         '10% volume discount applied'}
    </p>
  </div>
)}
```

**Step 2: Initialise fleetSize when arriving at Step 2 as fleet**

In `src/context/wizardReducer.ts`, confirm the `SET_PROJECT_TYPE` case already sets `fleetSize: 2` when fleet is selected (from Task 1). If it defaults to `null`, change to default `2` so the dropdown always has a valid value.

**Step 3: TypeScript check**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npx tsc --noEmit 2>&1
```
Expected: no errors.

**Step 4: Commit**

```bash
git add src/components/steps/Step2VehicleSelect.tsx src/context/wizardReducer.ts
git commit -m "feat: add fleet size dropdown to Step 2 with discount hint"
```

---

### Task 5: Show per-vehicle breakdown on Step 5

**Files:**
- Modify: `src/components/steps/Step5Estimate.tsx`

**Step 1: Find where priceRange is displayed**

In `Step5Estimate.tsx`, locate the price display section — it renders `priceRange.min` / `priceRange.max`. Add a per-vehicle sub-line directly below the total price, conditional on `projectType === 'fleet'` and `priceRange.singleMin` being present.

Read the file first to find the exact JSX location, then insert:

```tsx
{/* Fleet per-vehicle breakdown */}
{state.projectType === 'fleet' && state.fleetSize && priceRange?.singleMin && (
  <p className="text-sm text-slate-500 mt-1">
    ${priceRange.singleMin.toLocaleString()}–${priceRange.singleMax?.toLocaleString()} per vehicle
    &nbsp;·&nbsp;
    {state.fleetSize} vehicles
    &nbsp;·&nbsp;
    {state.fleetSize >= 10 ? '20%' : state.fleetSize >= 5 ? '15%' : '10%'} fleet discount
  </p>
)}
```

**Step 2: TypeScript check**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npx tsc --noEmit 2>&1
```
Expected: no errors.

**Step 3: Commit**

```bash
git add src/components/steps/Step5Estimate.tsx
git commit -m "feat: show per-vehicle price breakdown on Step 5 for fleet projects"
```

---

### Task 6: Build + deploy

**Step 1: Full build**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && npm --prefix /Users/slavic/Documents/projects/wrapcostcalculator run build:app 2>&1
```
Expected: `✓ built in X.XXs` with no errors.

**Step 2: Deploy**

```bash
NVM_DIR="/Users/slavic/.nvm" && . /Users/slavic/.nvm/nvm.sh && nvm use 22.22.0 && vercel --prod 2>&1
```
Expected: `Aliased: https://wrapcostcalculator.vercel.app`

---

## Verification

1. Go to https://wrapcostcalculator.vercel.app
2. Step 1 → select **Fleet Wrap**
3. Step 2 → confirm "Number of vehicles" dropdown appears with options 2–50
4. Select **5 vehicles** → confirm hint shows "15% volume discount applied"
5. Complete steps 3–4 → reach Step 5
6. Confirm total price = ~5 × single-vehicle price × 0.85
7. Confirm per-vehicle breakdown line shows: "$X–$Y per vehicle · 5 vehicles · 15% fleet discount"
8. Go back to Step 2, change to **10 vehicles** → Step 5 total and discount label update correctly
9. Select **Personal Vehicle** on Step 1 → Step 2 shows no fleet size dropdown
10. Select **Business Branding** on Step 1 → Step 2 shows no fleet size dropdown
