import type { WrapColor } from '../../types';

interface ColorSwatchProps {
  color: WrapColor;
  selected: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ColorSwatch({ color, selected, onClick, size = 'md' }: ColorSwatchProps) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  return (
    <button
      onClick={onClick}
      title={color.label}
      aria-label={color.label}
      aria-pressed={selected}
      className={`
        ${sizeClasses[size]} rounded-full border-2 transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-400
        flex-shrink-0 relative
        ${selected
          ? 'border-brand-500 scale-110 shadow-md ring-2 ring-brand-200'
          : 'border-white shadow-sm hover:scale-105 hover:shadow-md'
        }
      `}
      style={{ backgroundColor: color.hex }}
    >
      {selected && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg
            className={`w-3 h-3 ${isLightColor(color.hex) ? 'text-slate-800' : 'text-white'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  );
}

// Determine if a hex color is light (for checkmark contrast)
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
