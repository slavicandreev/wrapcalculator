import type { WrapColor } from '../types';

export const WRAP_COLORS: WrapColor[] = [
  // ── Solid Colors ──────────────────────────────────────────────────────────
  {
    id: 'gloss_black',
    label: 'Gloss Black',
    hex: '#111111',
    category: 'solid',
    blendMode: 'multiply',
  },
  {
    id: 'matte_black',
    label: 'Matte Black',
    hex: '#222222',
    category: 'solid',
    blendMode: 'multiply',
  },
  {
    id: 'pearl_white',
    label: 'Pearl White',
    hex: '#F0EEE8',
    category: 'solid',
    blendMode: 'overlay',
  },
  {
    id: 'racing_red',
    label: 'Racing Red',
    hex: '#C41E1E',
    category: 'solid',
    blendMode: 'multiply',
  },
  {
    id: 'deep_blue',
    label: 'Deep Blue',
    hex: '#1A3A8F',
    category: 'solid',
    blendMode: 'multiply',
  },
  {
    id: 'royal_blue',
    label: 'Royal Blue',
    hex: '#1E5FCC',
    category: 'solid',
    blendMode: 'multiply',
  },
  {
    id: 'forest_green',
    label: 'Forest Green',
    hex: '#1A4A2A',
    category: 'solid',
    blendMode: 'multiply',
  },
  {
    id: 'olive_green',
    label: 'Olive Green',
    hex: '#4A5028',
    category: 'solid',
    blendMode: 'multiply',
  },
  {
    id: 'gunmetal_grey',
    label: 'Gunmetal Grey',
    hex: '#3A3A45',
    category: 'solid',
    blendMode: 'multiply',
  },
  {
    id: 'silver_grey',
    label: 'Silver Grey',
    hex: '#8A8A9A',
    category: 'solid',
    blendMode: 'multiply',
  },
  {
    id: 'burnt_orange',
    label: 'Burnt Orange',
    hex: '#C85820',
    category: 'solid',
    blendMode: 'multiply',
  },
  {
    id: 'yellow',
    label: 'Racing Yellow',
    hex: '#E8C020',
    category: 'solid',
    blendMode: 'multiply',
  },
  {
    id: 'purple',
    label: 'Deep Purple',
    hex: '#5A1E8A',
    category: 'solid',
    blendMode: 'multiply',
  },
  {
    id: 'pink',
    label: 'Hot Pink',
    hex: '#CC2070',
    category: 'solid',
    blendMode: 'multiply',
  },

  // ── Metallic Colors ────────────────────────────────────────────────────────
  {
    id: 'metallic_silver',
    label: 'Metallic Silver',
    hex: '#9A9AAA',
    category: 'metallic',
    blendMode: 'overlay',
  },
  {
    id: 'metallic_gold',
    label: 'Metallic Gold',
    hex: '#C9A82C',
    category: 'metallic',
    blendMode: 'overlay',
  },
  {
    id: 'metallic_bronze',
    label: 'Metallic Bronze',
    hex: '#8C5A28',
    category: 'metallic',
    blendMode: 'overlay',
  },
  {
    id: 'metallic_blue',
    label: 'Metallic Blue',
    hex: '#2855A0',
    category: 'metallic',
    blendMode: 'overlay',
  },

  // ── Special / Premium ──────────────────────────────────────────────────────
  {
    id: 'chrome_silver',
    label: 'Chrome Silver',
    hex: '#C0C0C8',
    category: 'special',
    blendMode: 'screen',
  },
  {
    id: 'chrome_gold',
    label: 'Chrome Gold',
    hex: '#D4AF37',
    category: 'special',
    blendMode: 'screen',
  },
  {
    id: 'color_shift_blue_purple',
    label: 'Color Shift Blue/Purple',
    hex: '#4040CC',
    category: 'special',
    blendMode: 'overlay',
  },
  {
    id: 'color_shift_green_gold',
    label: 'Color Shift Green/Gold',
    hex: '#508020',
    category: 'special',
    blendMode: 'overlay',
  },
];

export function getColorById(id: string): WrapColor | undefined {
  return WRAP_COLORS.find(c => c.id === id);
}

export const COLORS_BY_CATEGORY = {
  solid: WRAP_COLORS.filter(c => c.category === 'solid'),
  metallic: WRAP_COLORS.filter(c => c.category === 'metallic'),
  special: WRAP_COLORS.filter(c => c.category === 'special'),
};
