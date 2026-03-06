// Vinyl wrap manufacturer color database
// SKU numbers and hex values are representative — verify against current manufacturer catalogs
// before publishing. 3M: 1080 series. Avery: SW900 series.
//
// Note: Color-shift/chameleon wraps are listed with their primary dominant hex color;
// they cannot be reliably detected from a single photo.

export type FinishType =
  | 'gloss'
  | 'matte'
  | 'satin'
  | 'metallic'
  | 'brushed'
  | 'carbon'
  | 'color-shift'
  | 'chrome'
  | 'satin-pearl'
  | 'textured';

export interface WrapSku {
  brand: '3M' | 'Avery';
  sku: string;
  name: string;
  finish: FinishType;
  hex: string;
}

export interface SkuMatch {
  sku: WrapSku;
  deltaE: number;
  aiRefined?: boolean;
}

// ─── 3M 1080 Series ─────────────────────────────────────────────────────────

export const SKUS_3M_1080: WrapSku[] = [
  // Gloss — Neutrals
  { brand: '3M', sku: '1080-G10',  name: 'Gloss White',               finish: 'gloss',       hex: '#f2f2f2' },
  { brand: '3M', sku: '1080-G12',  name: 'Gloss Black',               finish: 'gloss',       hex: '#0a0a0a' },
  { brand: '3M', sku: '1080-G13',  name: 'Gloss Battleship Gray',     finish: 'gloss',       hex: '#6b6b6b' },
  { brand: '3M', sku: '1080-G15',  name: 'Gloss Charcoal Metallic',   finish: 'metallic',    hex: '#3a3a3a' },
  { brand: '3M', sku: '1080-G16',  name: 'Gloss Shadow Gray',         finish: 'gloss',       hex: '#808080' },
  { brand: '3M', sku: '1080-G72',  name: 'Gloss Gunmetal',            finish: 'metallic',    hex: '#404040' },
  { brand: '3M', sku: '1080-G120', name: 'Gloss Starlight Blue',      finish: 'metallic',    hex: '#b8d0ea' },
  { brand: '3M', sku: '1080-G223', name: 'Gloss White Aluminum',      finish: 'metallic',    hex: '#d8d8d8' },
  { brand: '3M', sku: '1080-G251', name: 'Gloss Titanium',            finish: 'metallic',    hex: '#909090' },
  { brand: '3M', sku: '1080-G347', name: 'Gloss Black Metallic',      finish: 'metallic',    hex: '#1a1a1a' },

  // Gloss — Reds & Pinks
  { brand: '3M', sku: '1080-G36',  name: 'Gloss Dragon Fire Red',     finish: 'gloss',       hex: '#c0141e' },
  { brand: '3M', sku: '1080-G43',  name: 'Gloss Fierce Fuchsia',      finish: 'gloss',       hex: '#cc0080' },
  { brand: '3M', sku: '1080-G206', name: 'Gloss Shocking Pink',       finish: 'gloss',       hex: '#ef0090' },
  { brand: '3M', sku: '1080-G211', name: 'Gloss Hot Rod Red',         finish: 'gloss',       hex: '#c8000a' },
  { brand: '3M', sku: '1080-G269', name: 'Gloss Red Plum',            finish: 'gloss',       hex: '#8b1025' },
  { brand: '3M', sku: '1080-G323', name: 'Gloss Bitter Sweet',        finish: 'gloss',       hex: '#e04020' },

  // Gloss — Oranges & Yellows
  { brand: '3M', sku: '1080-G21',  name: 'Gloss Yellow',              finish: 'gloss',       hex: '#f5c800' },
  { brand: '3M', sku: '1080-G25',  name: 'Gloss Bright Yellow',       finish: 'gloss',       hex: '#ffe000' },
  { brand: '3M', sku: '1080-G83',  name: 'Gloss Burnt Orange',        finish: 'gloss',       hex: '#c84500' },
  { brand: '3M', sku: '1080-G217', name: 'Gloss Fiery Orange',        finish: 'gloss',       hex: '#e84500' },

  // Gloss — Greens
  { brand: '3M', sku: '1080-G31',  name: 'Gloss Envy Green',          finish: 'gloss',       hex: '#00a550' },
  { brand: '3M', sku: '1080-G177', name: 'Gloss Avocado Green',       finish: 'gloss',       hex: '#4a6820' },
  { brand: '3M', sku: '1080-G342', name: 'Gloss Atomic Teal',         finish: 'gloss',       hex: '#008090' },
  { brand: '3M', sku: '1080-G396', name: 'Gloss Lime Green',          finish: 'gloss',       hex: '#90d000' },

  // Gloss — Blues
  { brand: '3M', sku: '1080-G53',  name: 'Gloss Atlantic Blue',       finish: 'gloss',       hex: '#003580' },
  { brand: '3M', sku: '1080-G57',  name: 'Gloss Dark Blue',           finish: 'gloss',       hex: '#001050' },

  // Gloss — Purples
  { brand: '3M', sku: '1080-G44',  name: 'Gloss Royal Purple',        finish: 'gloss',       hex: '#440090' },
  { brand: '3M', sku: '1080-G103', name: 'Gloss Midnight Purple',     finish: 'gloss',       hex: '#2d0050' },
  { brand: '3M', sku: '1080-G374', name: 'Gloss Grape Metallic',      finish: 'metallic',    hex: '#5a0088' },

  // Matte — Neutrals
  { brand: '3M', sku: '1080-M10',  name: 'Matte White',               finish: 'matte',       hex: '#f0f0f0' },
  { brand: '3M', sku: '1080-M12',  name: 'Matte Black',               finish: 'matte',       hex: '#0d0d0d' },
  { brand: '3M', sku: '1080-M13',  name: 'Matte Gray Aluminum',       finish: 'matte',       hex: '#6a6a6a' },
  { brand: '3M', sku: '1080-M72',  name: 'Matte Dark Gray',           finish: 'matte',       hex: '#3a3a3a' },

  // Matte — Colors
  { brand: '3M', sku: '1080-M21',  name: 'Matte Bright Yellow',       finish: 'matte',       hex: '#f5c800' },
  { brand: '3M', sku: '1080-M36',  name: 'Matte Dragon Fire Red',     finish: 'matte',       hex: '#c0141e' },
  { brand: '3M', sku: '1080-M43',  name: 'Matte Fierce Fuchsia',      finish: 'matte',       hex: '#cc0080' },
  { brand: '3M', sku: '1080-M53',  name: 'Matte Atlantic Blue',       finish: 'matte',       hex: '#003580' },
  { brand: '3M', sku: '1080-M83',  name: 'Matte Burnt Orange',        finish: 'matte',       hex: '#c84500' },
  { brand: '3M', sku: '1080-M103', name: 'Matte Midnight Purple',     finish: 'matte',       hex: '#2d0050' },
  { brand: '3M', sku: '1080-M211', name: 'Matte Hot Rod Red',         finish: 'matte',       hex: '#c8000a' },
  { brand: '3M', sku: '1080-M217', name: 'Matte Fiery Orange',        finish: 'matte',       hex: '#e84500' },
  { brand: '3M', sku: '1080-M396', name: 'Matte Lime Green',          finish: 'matte',       hex: '#90d000' },

  // Satin — Neutrals
  { brand: '3M', sku: '1080-S10',  name: 'Satin White',               finish: 'satin',       hex: '#f0f0f0' },
  { brand: '3M', sku: '1080-S12',  name: 'Satin Black',               finish: 'satin',       hex: '#0d0d0d' },
  { brand: '3M', sku: '1080-S13',  name: 'Satin Battleship Gray',     finish: 'satin',       hex: '#6b6b6b' },
  { brand: '3M', sku: '1080-S15',  name: 'Satin Charcoal Metallic',   finish: 'metallic',    hex: '#3a3a3a' },
  { brand: '3M', sku: '1080-S16',  name: 'Satin Silver Aluminum',     finish: 'satin',       hex: '#c0c0c0' },

  // Satin — Colors
  { brand: '3M', sku: '1080-S53',  name: 'Satin Atlantic Blue',       finish: 'satin',       hex: '#003580' },
  { brand: '3M', sku: '1080-S83',  name: 'Satin Burnt Orange',        finish: 'satin',       hex: '#c84500' },
  { brand: '3M', sku: '1080-S103', name: 'Satin Midnight Purple',     finish: 'satin',       hex: '#2d0050' },
  { brand: '3M', sku: '1080-S120', name: 'Satin Starlight Blue',      finish: 'metallic',    hex: '#b8d0ea' },
  { brand: '3M', sku: '1080-S177', name: 'Satin Avocado Green',       finish: 'satin',       hex: '#4a6820' },
  { brand: '3M', sku: '1080-S211', name: 'Satin Hot Rod Red',         finish: 'satin',       hex: '#c8000a' },
  { brand: '3M', sku: '1080-S217', name: 'Satin Fiery Orange',        finish: 'satin',       hex: '#e84500' },

  // Satin Pearl
  { brand: '3M', sku: '1080-SP10', name: 'Satin Pearl White',         finish: 'satin-pearl', hex: '#f0ede8' },
  { brand: '3M', sku: '1080-SP16', name: 'Satin Pearl Metallic Gold', finish: 'satin-pearl', hex: '#c8a850' },
  { brand: '3M', sku: '1080-SP90', name: 'Satin Pearl Dark Gray',     finish: 'satin-pearl', hex: '#505050' },

  // Brushed
  { brand: '3M', sku: '1080-BR120', name: 'Brushed Aluminum',         finish: 'brushed',     hex: '#b8b8b8' },
  { brand: '3M', sku: '1080-BR201', name: 'Brushed Steel',            finish: 'brushed',     hex: '#a0a0a0' },
  { brand: '3M', sku: '1080-BR230', name: 'Brushed Gold',             finish: 'brushed',     hex: '#c0a040' },

  // Carbon Fiber
  { brand: '3M', sku: '1080-CF12',  name: 'Carbon Fiber Black',       finish: 'carbon',      hex: '#151515' },
  { brand: '3M', sku: '1080-CF152', name: 'Carbon Fiber Silver',      finish: 'carbon',      hex: '#888888' },

  // Color Shift (primary color only — cannot be reliably matched from photo)
  { brand: '3M', sku: '1080-GP280', name: 'Gloss Psychedelic Black',  finish: 'color-shift', hex: '#1a0a2a' },
  { brand: '3M', sku: '1080-GP281', name: 'Gloss Ghost Pearl',        finish: 'color-shift', hex: '#e8e4f0' },
  { brand: '3M', sku: '1080-GP289', name: 'Gloss Flip Deep Space',    finish: 'color-shift', hex: '#1a2a4a' },
];

// ─── Avery Dennison SW900 Series ─────────────────────────────────────────────

export const SKUS_AVERY_SW900: WrapSku[] = [
  // Gloss — Neutrals
  { brand: 'Avery', sku: 'SW900-197-O', name: 'Gloss White',              finish: 'gloss',       hex: '#f5f5f5' },
  { brand: 'Avery', sku: 'SW900-190-O', name: 'Gloss Black',              finish: 'gloss',       hex: '#080808' },
  { brand: 'Avery', sku: 'SW900-177-O', name: 'Gloss Silver Metallic',    finish: 'metallic',    hex: '#c8c8c8' },
  { brand: 'Avery', sku: 'SW900-178-O', name: 'Gloss Charcoal Metallic',  finish: 'metallic',    hex: '#383838' },
  { brand: 'Avery', sku: 'SW900-150-O', name: 'Gloss Storm Gray',         finish: 'gloss',       hex: '#6a6a6a' },
  { brand: 'Avery', sku: 'SW900-155-O', name: 'Gloss Dark Gray',          finish: 'gloss',       hex: '#3d3d3d' },

  // Gloss — Reds & Pinks
  { brand: 'Avery', sku: 'SW900-120-O', name: 'Gloss Red',                finish: 'gloss',       hex: '#cc1010' },
  { brand: 'Avery', sku: 'SW900-126-O', name: 'Gloss Hot Red',            finish: 'gloss',       hex: '#d0000a' },
  { brand: 'Avery', sku: 'SW900-127-O', name: 'Gloss Bright Red',         finish: 'gloss',       hex: '#e8001a' },
  { brand: 'Avery', sku: 'SW900-138-O', name: 'Gloss Wine Red',           finish: 'gloss',       hex: '#6a0010' },
  { brand: 'Avery', sku: 'SW900-210-O', name: 'Gloss Hot Pink',           finish: 'gloss',       hex: '#f0008a' },

  // Gloss — Oranges & Yellows
  { brand: 'Avery', sku: 'SW900-140-O', name: 'Gloss Orange',             finish: 'gloss',       hex: '#e06000' },
  { brand: 'Avery', sku: 'SW900-143-O', name: 'Gloss Carrot Orange',      finish: 'gloss',       hex: '#e85000' },
  { brand: 'Avery', sku: 'SW900-163-O', name: 'Gloss Yellow',             finish: 'gloss',       hex: '#f5c800' },
  { brand: 'Avery', sku: 'SW900-167-O', name: 'Gloss Bright Yellow',      finish: 'gloss',       hex: '#ffe000' },

  // Gloss — Greens
  { brand: 'Avery', sku: 'SW900-181-O', name: 'Gloss Lime Green',         finish: 'gloss',       hex: '#90d000' },
  { brand: 'Avery', sku: 'SW900-183-O', name: 'Gloss Grass Green',        finish: 'gloss',       hex: '#00a050' },
  { brand: 'Avery', sku: 'SW900-187-O', name: 'Gloss Forest Green',       finish: 'gloss',       hex: '#006020' },
  { brand: 'Avery', sku: 'SW900-196-O', name: 'Gloss Teal',               finish: 'gloss',       hex: '#008888' },

  // Gloss — Blues
  { brand: 'Avery', sku: 'SW900-214-O', name: 'Gloss Brilliant Blue',     finish: 'gloss',       hex: '#0050c8' },
  { brand: 'Avery', sku: 'SW900-217-O', name: 'Gloss Sky Blue',           finish: 'gloss',       hex: '#0080d0' },
  { brand: 'Avery', sku: 'SW900-221-O', name: 'Gloss Dark Blue',          finish: 'gloss',       hex: '#001888' },
  { brand: 'Avery', sku: 'SW900-224-O', name: 'Gloss Intense Blue',       finish: 'gloss',       hex: '#0028b0' },
  { brand: 'Avery', sku: 'SW900-244-O', name: 'Gloss Midnight Blue',      finish: 'gloss',       hex: '#001040' },
  { brand: 'Avery', sku: 'SW900-253-O', name: 'Gloss Blue Metallic',      finish: 'metallic',    hex: '#2040a0' },

  // Gloss — Purples
  { brand: 'Avery', sku: 'SW900-290-O', name: 'Gloss Purple',             finish: 'gloss',       hex: '#5000a0' },
  { brand: 'Avery', sku: 'SW900-293-O', name: 'Gloss Plum Purple',        finish: 'gloss',       hex: '#300050' },
  { brand: 'Avery', sku: 'SW900-297-O', name: 'Gloss Grape Metallic',     finish: 'metallic',    hex: '#5a0088' },

  // Gloss — Metallic Specials
  { brand: 'Avery', sku: 'SW900-351-O', name: 'Gloss Rose Gold Metallic', finish: 'metallic',    hex: '#c87860' },
  { brand: 'Avery', sku: 'SW900-352-O', name: 'Gloss Bronze Metallic',    finish: 'metallic',    hex: '#906030' },
  { brand: 'Avery', sku: 'SW900-356-O', name: 'Gloss Gold Metallic',      finish: 'metallic',    hex: '#c8a800' },

  // Matte — Neutrals
  { brand: 'Avery', sku: 'SW900-197-M', name: 'Matte White',              finish: 'matte',       hex: '#f0f0f0' },
  { brand: 'Avery', sku: 'SW900-190-M', name: 'Matte Black',              finish: 'matte',       hex: '#0d0d0d' },
  { brand: 'Avery', sku: 'SW900-150-M', name: 'Matte Storm Gray',         finish: 'matte',       hex: '#6a6a6a' },
  { brand: 'Avery', sku: 'SW900-155-M', name: 'Matte Dark Gray',          finish: 'matte',       hex: '#3d3d3d' },
  { brand: 'Avery', sku: 'SW900-178-M', name: 'Matte Charcoal Metallic',  finish: 'metallic',    hex: '#383838' },

  // Matte — Colors
  { brand: 'Avery', sku: 'SW900-120-M', name: 'Matte Red',                finish: 'matte',       hex: '#cc1010' },
  { brand: 'Avery', sku: 'SW900-140-M', name: 'Matte Orange',             finish: 'matte',       hex: '#e06000' },
  { brand: 'Avery', sku: 'SW900-163-M', name: 'Matte Yellow',             finish: 'matte',       hex: '#f5c800' },
  { brand: 'Avery', sku: 'SW900-181-M', name: 'Matte Lime Green',         finish: 'matte',       hex: '#90d000' },
  { brand: 'Avery', sku: 'SW900-183-M', name: 'Matte Grass Green',        finish: 'matte',       hex: '#00a050' },
  { brand: 'Avery', sku: 'SW900-214-M', name: 'Matte Brilliant Blue',     finish: 'matte',       hex: '#0050c8' },
  { brand: 'Avery', sku: 'SW900-221-M', name: 'Matte Dark Blue',          finish: 'matte',       hex: '#001888' },
  { brand: 'Avery', sku: 'SW900-290-M', name: 'Matte Purple',             finish: 'matte',       hex: '#5000a0' },

  // Satin
  { brand: 'Avery', sku: 'SW900-197-S', name: 'Satin White',              finish: 'satin',       hex: '#f0f0f0' },
  { brand: 'Avery', sku: 'SW900-190-S', name: 'Satin Black',              finish: 'satin',       hex: '#0d0d0d' },
  { brand: 'Avery', sku: 'SW900-150-S', name: 'Satin Storm Gray',         finish: 'satin',       hex: '#6a6a6a' },
  { brand: 'Avery', sku: 'SW900-120-S', name: 'Satin Red',                finish: 'satin',       hex: '#cc1010' },
  { brand: 'Avery', sku: 'SW900-214-S', name: 'Satin Brilliant Blue',     finish: 'satin',       hex: '#0050c8' },
  { brand: 'Avery', sku: 'SW900-290-S', name: 'Satin Purple',             finish: 'satin',       hex: '#5000a0' },

  // Brushed / Metallic Texture
  { brand: 'Avery', sku: 'SW900-169-O', name: 'Gloss Gold Metallic',      finish: 'metallic',    hex: '#c0a030' },
  { brand: 'Avery', sku: 'SW900-180-O', name: 'Gloss Satin Chrome',       finish: 'chrome',      hex: '#d0d0d0' },

  // Color Shift (primary color only)
  { brand: 'Avery', sku: 'SW900-376-O', name: 'Gloss Cosmic Blue',        finish: 'color-shift', hex: '#102060' },
  { brand: 'Avery', sku: 'SW900-377-O', name: 'Gloss Blue Black',         finish: 'color-shift', hex: '#080818' },
  { brand: 'Avery', sku: 'SW900-378-O', name: 'Gloss Green Black',        finish: 'color-shift', hex: '#081008' },
];

export const ALL_WRAP_SKUS: WrapSku[] = [...SKUS_3M_1080, ...SKUS_AVERY_SW900];
