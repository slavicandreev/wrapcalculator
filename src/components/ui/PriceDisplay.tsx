import { useWizard } from '../../context/WizardContext';
import { formatCurrency } from '../../utils/formatCurrency';

export function PriceDisplay() {
  const { priceRange, state } = useWizard();
  const showFooter = state.currentStep >= 3;

  if (!showFooter) return null;

  return (
    <div className="border-t border-slate-100 bg-white px-6 py-3 flex items-center justify-between animate-slide-up">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          Estimated Cost
        </span>
      </div>

      {priceRange ? (
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-slate-900">
            {formatCurrency(priceRange.min)}
          </span>
          <span className="text-slate-400 font-medium">–</span>
          <span className="text-xl font-bold text-slate-900">
            {formatCurrency(priceRange.max)}
          </span>
        </div>
      ) : (
        <span className="text-sm text-slate-400 italic">
          Select options to see price
        </span>
      )}
    </div>
  );
}
