import type { MaterialType, WrapCoverage, ProjectType } from '../types';

// ─── Material Costs (per sq ft, material only) ────────────────────────────────
export interface MaterialCost {
  min: number;
  max: number;
  label: string;
  description: string;
  popular?: boolean;
}

export const MATERIAL_PRICING: Record<MaterialType, MaterialCost> = {
  gloss: {
    min: 2, max: 5,
    label: 'Gloss Vinyl',
    description: 'Classic high-shine finish. Most popular choice.',
    popular: true,
  },
  matte: {
    min: 3, max: 5,
    label: 'Matte Vinyl',
    description: 'Flat, modern look. Hides minor imperfections.',
    popular: true,
  },
  satin: {
    min: 3, max: 4,
    label: 'Satin Vinyl',
    description: 'Semi-gloss between matte and gloss. Sophisticated look.',
  },
  chrome: {
    min: 10, max: 15,
    label: 'Chrome',
    description: 'Mirror-like reflective finish. Maximum visual impact.',
  },
  color_shift: {
    min: 6, max: 10,
    label: 'Color Shift',
    description: 'Changes color in different lighting. Unique, eye-catching.',
  },
  carbon_fiber: {
    min: 12, max: 15,
    label: 'Carbon Fiber',
    description: 'Textured carbon fiber look. Sporty and premium.',
  },
  textured: {
    min: 5, max: 8,
    label: 'Textured',
    description: 'Brushed metal, leather, or sand textures.',
  },
};

// ─── Labor Rate (per sq ft) ───────────────────────────────────────────────────
export const LABOR_RATE = { min: 3, max: 4 }; // per sqft, added on top of material

// ─── Coverage Multipliers ─────────────────────────────────────────────────────
export const COVERAGE_MULTIPLIER: Record<WrapCoverage, number> = {
  full:       1.00,
  partial_60: 0.60,
  partial_45: 0.45,
  partial_30: 0.30,
  decal:      0.10,
};

export interface CoverageOption {
  id: WrapCoverage;
  label: string;
  description: string;
  areas: string;
}

export const COVERAGE_OPTIONS: CoverageOption[] = [
  {
    id: 'full',
    label: 'Full Wrap',
    description: 'Complete vehicle coverage — every panel wrapped.',
    areas: 'Hood, roof, doors, trunk, bumpers, mirrors',
  },
  {
    id: 'partial_60',
    label: 'Partial — Large',
    description: '~60% coverage. Hood, roof, doors, and rear.',
    areas: 'Hood, roof, all doors, rear bumper',
  },
  {
    id: 'partial_45',
    label: 'Partial — Medium',
    description: '~45% coverage. Hood, roof, and sides.',
    areas: 'Hood, roof, front doors',
  },
  {
    id: 'partial_30',
    label: 'Partial — Small',
    description: '~30% coverage. Hood and roof accent.',
    areas: 'Hood and roof only',
  },
  {
    id: 'decal',
    label: 'Business Sticker / Decal',
    description: 'Spot graphics, logos, or lettering only.',
    areas: 'Logo panels, door lettering, rear window',
  },
];

// ─── Project Type Adjustments ─────────────────────────────────────────────────
export const PROJECT_TYPE_ADJUSTMENTS: Record<ProjectType, number> = {
  personal: 1.0,
  business: 1.1,  // business wraps often need design/graphics premium
  fleet:    0.85, // fleet discount for volume
};

// ─── Price Floors (decal minimum) ─────────────────────────────────────────────
export const DECAL_PRICE_FLOOR = { min: 200, max: 800 };

// ─── Rounding ─────────────────────────────────────────────────────────────────
export const PRICE_ROUND_TO = 50; // round to nearest $50
