// Square footage estimates per body class for vinyl wrap surface area.
// These are industry estimates used for pricing calculations.

export interface BodyClassArea {
  min: number; // sq ft
  max: number; // sq ft
  label: string;
  imaginAngle: string; // IMAGIN.Studio angle param fallback
}

// Maps NHTSA body class strings (normalized) → sq ft area
export const VEHICLE_AREA_BY_BODY_CLASS: Record<string, BodyClassArea> = {
  'Sedan': {
    min: 200, max: 250,
    label: 'Sedan',
    imaginAngle: 'side',
  },
  'Hatchback': {
    min: 190, max: 235,
    label: 'Hatchback',
    imaginAngle: 'side',
  },
  'Coupe': {
    min: 185, max: 225,
    label: 'Coupe',
    imaginAngle: 'side',
  },
  'Convertible': {
    min: 170, max: 215,
    label: 'Convertible',
    imaginAngle: 'side',
  },
  'Sports Car': {
    min: 180, max: 220,
    label: 'Sports Car',
    imaginAngle: 'side',
  },
  'SUV': {
    min: 260, max: 320,
    label: 'SUV',
    imaginAngle: 'side',
  },
  'Crossover': {
    min: 250, max: 310,
    label: 'Crossover',
    imaginAngle: 'side',
  },
  'Pickup': {
    min: 280, max: 350,
    label: 'Pickup Truck',
    imaginAngle: 'side',
  },
  'Truck': {
    min: 280, max: 350,
    label: 'Truck',
    imaginAngle: 'side',
  },
  'Van': {
    min: 350, max: 450,
    label: 'Van',
    imaginAngle: 'side',
  },
  'Minivan': {
    min: 300, max: 380,
    label: 'Minivan',
    imaginAngle: 'side',
  },
  'Wagon': {
    min: 210, max: 260,
    label: 'Station Wagon',
    imaginAngle: 'side',
  },
  'default': {
    min: 220, max: 280,
    label: 'Vehicle',
    imaginAngle: 'side',
  },
};

// Normalizes raw NHTSA body class strings to our keys
export function normalizeBodyClass(raw: string | null | undefined): string {
  if (!raw) return 'default';
  const r = raw.toLowerCase();

  if (r.includes('sedan'))      return 'Sedan';
  if (r.includes('hatchback'))  return 'Hatchback';
  if (r.includes('coupe'))      return 'Coupe';
  if (r.includes('convertible') || r.includes('cabriolet')) return 'Convertible';
  if (r.includes('sport') || r.includes('roadster')) return 'Sports Car';
  if (r.includes('suv') || r.includes('sport utility')) return 'SUV';
  if (r.includes('crossover'))  return 'Crossover';
  if (r.includes('pickup') || r.includes('pick-up')) return 'Pickup';
  if (r.includes('van') && !r.includes('mini')) return 'Van';
  if (r.includes('minivan') || r.includes('mini van')) return 'Minivan';
  if (r.includes('wagon') || r.includes('estate')) return 'Wagon';
  if (r.includes('truck'))      return 'Truck';

  return 'default';
}

export function getAreaForBodyClass(bodyClass: string | null): BodyClassArea {
  const normalized = normalizeBodyClass(bodyClass);
  return VEHICLE_AREA_BY_BODY_CLASS[normalized] ?? VEHICLE_AREA_BY_BODY_CLASS['default'];
}

// Manual fallback body type options shown when API fails
export const MANUAL_BODY_TYPES = [
  { value: 'Sedan',      label: 'Sedan / Car' },
  { value: 'SUV',        label: 'SUV / Crossover' },
  { value: 'Pickup',     label: 'Pickup Truck' },
  { value: 'Van',        label: 'Van / Minivan' },
  { value: 'Sports Car', label: 'Sports Car / Coupe' },
];
