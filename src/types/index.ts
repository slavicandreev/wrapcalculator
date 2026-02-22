// ─── Project Type ────────────────────────────────────────────────────────────
export type ProjectType = 'personal' | 'business' | 'fleet';

// ─── Material Types ───────────────────────────────────────────────────────────
export type MaterialType =
  | 'gloss'
  | 'matte'
  | 'satin'
  | 'chrome'
  | 'color_shift'
  | 'carbon_fiber'
  | 'textured';

// ─── Wrap Coverage ────────────────────────────────────────────────────────────
export type WrapCoverage = 'full' | 'partial_60' | 'partial_45' | 'partial_30' | 'decal';

// ─── Wrap Color ───────────────────────────────────────────────────────────────
export type ColorCategory = 'solid' | 'metallic' | 'special';

export interface WrapColor {
  id: string;
  label: string;
  hex: string;
  category: ColorCategory;
  blendMode?: 'multiply' | 'screen' | 'overlay' | 'color';
}

// ─── Add-on ───────────────────────────────────────────────────────────────────
export interface Addon {
  id: string;
  label: string;
  description: string;
  priceMin: number;
  priceMax: number;
  icon: string; // emoji icon
}

// ─── State/Region ─────────────────────────────────────────────────────────────
export interface StateData {
  code: string;
  name: string;
  multiplier: number; // 1.0 = base, 1.25 = 25% premium
  region: 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west';
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────
export interface VehicleMake {
  makeId: number;
  makeName: string;
}

export interface VehicleModel {
  modelId: number;
  modelName: string;
}

// ─── Wizard State ─────────────────────────────────────────────────────────────
export interface WizardVehicle {
  makeId: string | null;
  makeName: string | null;
  modelId: string | null;
  modelName: string | null;
  year: number | null;
  trim: string | null;
  bodyClass: string | null;
}

export interface WizardCustomization {
  material: MaterialType | null;
  color: string | null; // WrapColor id
  coverage: WrapCoverage | null;
  selectedAddons: string[]; // Addon ids
}

export interface PriceRange {
  min: number;
  max: number;
  singleMin?: number; // per-vehicle price (fleet only)
  singleMax?: number;
}

export interface WizardState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  projectType: ProjectType | null;
  vehicle: WizardVehicle;
  stateCode: string | null;
  fleetSize: number | null; // only used when projectType === 'fleet'
  customization: WizardCustomization;
}

// ─── Wizard Actions ───────────────────────────────────────────────────────────
export type WizardAction =
  | { type: 'SET_PROJECT_TYPE'; payload: ProjectType }
  | { type: 'SET_VEHICLE'; payload: Partial<WizardVehicle> }
  | { type: 'SET_STATE'; payload: string }
  | { type: 'SET_MATERIAL'; payload: MaterialType }
  | { type: 'SET_COLOR'; payload: string }
  | { type: 'SET_COVERAGE'; payload: WrapCoverage }
  | { type: 'TOGGLE_ADDON'; payload: string }
  | { type: 'SET_STEP'; payload: 1 | 2 | 3 | 4 | 5 }
  | { type: 'SET_FLEET_SIZE'; payload: number | null }
  | { type: 'RESET' };

// ─── Embed Config ─────────────────────────────────────────────────────────────
export interface EmbedConfig {
  ctaUrl: string;
  accentColor: string;
  mode: 'inline' | 'modal';
  imaginCustomerKey?: string; // for paid tier
}
