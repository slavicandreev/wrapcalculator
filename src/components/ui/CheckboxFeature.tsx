import type { Addon } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface CheckboxFeatureProps {
  addon: Addon;
  checked: boolean;
  onChange: (id: string) => void;
}

export function CheckboxFeature({ addon, checked, onChange }: CheckboxFeatureProps) {
  return (
    <label
      className={`
        flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150
        ${checked
          ? 'border-brand-400 bg-brand-50'
          : 'border-slate-200 bg-white hover:border-slate-300'
        }
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(addon.id)}
        className="sr-only"
      />

      {/* Custom checkbox */}
      <div className={`
        w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center
        transition-all duration-150
        ${checked
          ? 'border-brand-500 bg-brand-500'
          : 'border-slate-300 bg-white'
        }
      `}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{addon.icon}</span>
          <span className={`text-sm font-semibold ${checked ? 'text-brand-700' : 'text-slate-800'}`}>
            {addon.label}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          {addon.description}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <span className={`text-xs font-semibold ${checked ? 'text-brand-600' : 'text-slate-500'}`}>
          +{formatCurrency(addon.priceMin)}–{formatCurrency(addon.priceMax)}
        </span>
      </div>
    </label>
  );
}
