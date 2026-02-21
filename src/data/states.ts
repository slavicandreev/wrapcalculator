import type { StateData } from '../types';

export const US_STATES: StateData[] = [
  // West (higher cost)
  { code: 'AK', name: 'Alaska',         multiplier: 1.30, region: 'west' },
  { code: 'CA', name: 'California',     multiplier: 1.25, region: 'west' },
  { code: 'HI', name: 'Hawaii',         multiplier: 1.30, region: 'west' },
  { code: 'WA', name: 'Washington',     multiplier: 1.15, region: 'west' },
  { code: 'OR', name: 'Oregon',         multiplier: 1.10, region: 'west' },
  { code: 'NV', name: 'Nevada',         multiplier: 1.10, region: 'west' },
  { code: 'AZ', name: 'Arizona',        multiplier: 1.05, region: 'west' },
  { code: 'CO', name: 'Colorado',       multiplier: 1.10, region: 'west' },
  { code: 'UT', name: 'Utah',           multiplier: 1.00, region: 'west' },
  { code: 'ID', name: 'Idaho',          multiplier: 0.95, region: 'west' },
  { code: 'MT', name: 'Montana',        multiplier: 0.90, region: 'west' },
  { code: 'WY', name: 'Wyoming',        multiplier: 0.90, region: 'west' },
  { code: 'NM', name: 'New Mexico',     multiplier: 0.95, region: 'southwest' },

  // Southwest
  { code: 'TX', name: 'Texas',          multiplier: 1.10, region: 'southwest' },

  // Northeast (higher cost)
  { code: 'NY', name: 'New York',       multiplier: 1.20, region: 'northeast' },
  { code: 'MA', name: 'Massachusetts',  multiplier: 1.15, region: 'northeast' },
  { code: 'CT', name: 'Connecticut',    multiplier: 1.15, region: 'northeast' },
  { code: 'NJ', name: 'New Jersey',     multiplier: 1.15, region: 'northeast' },
  { code: 'DC', name: 'Washington D.C.',multiplier: 1.20, region: 'northeast' },
  { code: 'MD', name: 'Maryland',       multiplier: 1.10, region: 'northeast' },
  { code: 'DE', name: 'Delaware',       multiplier: 1.05, region: 'northeast' },
  { code: 'PA', name: 'Pennsylvania',   multiplier: 1.05, region: 'northeast' },
  { code: 'NH', name: 'New Hampshire',  multiplier: 1.00, region: 'northeast' },
  { code: 'VT', name: 'Vermont',        multiplier: 1.00, region: 'northeast' },
  { code: 'ME', name: 'Maine',          multiplier: 0.95, region: 'northeast' },
  { code: 'RI', name: 'Rhode Island',   multiplier: 1.05, region: 'northeast' },

  // Southeast
  { code: 'FL', name: 'Florida',        multiplier: 1.15, region: 'southeast' },
  { code: 'GA', name: 'Georgia',        multiplier: 1.05, region: 'southeast' },
  { code: 'VA', name: 'Virginia',       multiplier: 1.05, region: 'southeast' },
  { code: 'NC', name: 'North Carolina', multiplier: 1.00, region: 'southeast' },
  { code: 'SC', name: 'South Carolina', multiplier: 0.95, region: 'southeast' },
  { code: 'TN', name: 'Tennessee',      multiplier: 0.95, region: 'southeast' },
  { code: 'AL', name: 'Alabama',        multiplier: 0.90, region: 'southeast' },
  { code: 'MS', name: 'Mississippi',    multiplier: 0.85, region: 'southeast' },
  { code: 'LA', name: 'Louisiana',      multiplier: 0.90, region: 'southeast' },
  { code: 'AR', name: 'Arkansas',       multiplier: 0.88, region: 'southeast' },
  { code: 'KY', name: 'Kentucky',       multiplier: 0.90, region: 'southeast' },
  { code: 'WV', name: 'West Virginia',  multiplier: 0.85, region: 'southeast' },

  // Midwest
  { code: 'IL', name: 'Illinois',       multiplier: 1.10, region: 'midwest' },
  { code: 'MN', name: 'Minnesota',      multiplier: 1.05, region: 'midwest' },
  { code: 'MI', name: 'Michigan',       multiplier: 1.00, region: 'midwest' },
  { code: 'OH', name: 'Ohio',           multiplier: 1.00, region: 'midwest' },
  { code: 'WI', name: 'Wisconsin',      multiplier: 0.97, region: 'midwest' },
  { code: 'IN', name: 'Indiana',        multiplier: 0.95, region: 'midwest' },
  { code: 'MO', name: 'Missouri',       multiplier: 0.95, region: 'midwest' },
  { code: 'IA', name: 'Iowa',           multiplier: 0.92, region: 'midwest' },
  { code: 'KS', name: 'Kansas',         multiplier: 0.90, region: 'midwest' },
  { code: 'NE', name: 'Nebraska',       multiplier: 0.90, region: 'midwest' },
  { code: 'SD', name: 'South Dakota',   multiplier: 0.88, region: 'midwest' },
  { code: 'ND', name: 'North Dakota',   multiplier: 0.88, region: 'midwest' },
  { code: 'OK', name: 'Oklahoma',       multiplier: 0.90, region: 'southwest' },
];

// Sorted alphabetically by name for dropdown
export const US_STATES_SORTED = [...US_STATES].sort((a, b) =>
  a.name.localeCompare(b.name)
);

export function getStateByCode(code: string): StateData | undefined {
  return US_STATES.find(s => s.code === code);
}
