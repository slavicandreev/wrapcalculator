import { useState } from 'react';
import { useWizard } from '../../context/WizardContext';
import { CarVisualization } from '../visualization/CarVisualization';
import { MATERIAL_PRICING, COVERAGE_OPTIONS } from '../../data/pricing';
import { getColorById } from '../../data/colors';
import { getStateByCode } from '../../data/states';
import { ADDONS } from '../../data/addons';
import { formatCurrency, formatPriceRange } from '../../utils/formatCurrency';
import { QuoteFormModal } from '../QuoteFormModal';

const PROJECT_TYPE_LABELS: Record<string, string> = {
  personal: 'Personal Vehicle',
  business: 'Business Branding',
  fleet: 'Fleet Wrap',
};

export function Step5Estimate() {
  const { state, priceRange, dispatch } = useWizard();
  const { vehicle, customization, stateCode, projectType } = state;

  const selectedColor = customization.color ? getColorById(customization.color) : null;
  const selectedState = stateCode ? getStateByCode(stateCode) : null;
  const selectedMaterial = customization.material ? MATERIAL_PRICING[customization.material] : null;
  const selectedCoverage = customization.coverage
    ? COVERAGE_OPTIONS.find(c => c.id === customization.coverage)
    : null;
  const selectedAddons = ADDONS.filter(a => customization.selectedAddons.includes(a.id));
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Price Hero */}
      <div className="text-center mb-8">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
          Your Estimated Wrap Cost
        </p>
        {priceRange ? (
          <div className="text-5xl font-extrabold text-slate-900 mb-2 animate-slide-up">
            {formatPriceRange(priceRange.min, priceRange.max)}
          </div>
        ) : (
          <div className="text-3xl font-bold text-slate-400">
            Complete customization to see price
          </div>
        )}
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Estimate based on {vehicle.makeName ?? 'your vehicle'} in {selectedState?.name ?? 'your area'}.
          Final pricing depends on vehicle condition, installer, and design complexity.
        </p>
      </div>

      {/* Car View */}
      <div className="mb-8">
        <CarVisualization
          bodyClass={vehicle.bodyClass}
          make={vehicle.makeName}
          model={vehicle.modelName}
          year={vehicle.year}
          colorHex={selectedColor?.hex ?? null}
          coverage={customization.coverage}
          material={customization.material}
          angle="side"
          size="large"
          className="rounded-2xl"
        />
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Your Configuration</h2>
        </div>
        <div className="divide-y divide-slate-50">
          <SummaryRow label="Project Type" value={PROJECT_TYPE_LABELS[projectType ?? 'personal']} />
          <SummaryRow
            label="Vehicle"
            value={`${vehicle.year ?? ''} ${vehicle.makeName ?? ''} ${vehicle.modelName ?? ''}${vehicle.trim ? ` · ${vehicle.trim}` : ''}`.trim() || '—'}
          />
          <SummaryRow label="Location" value={selectedState?.name ?? '—'} />
          <SummaryRow label="Material" value={selectedMaterial?.label ?? '—'} />
          <SummaryRow
            label="Color"
            value={selectedColor?.label ?? '—'}
            colorHex={selectedColor?.hex}
          />
          <SummaryRow label="Coverage" value={selectedCoverage?.label ?? '—'} />

          {selectedAddons.length > 0 && (
            <div className="px-6 py-4">
              <div className="flex items-start justify-between">
                <span className="text-sm text-slate-500">Add-ons</span>
                <div className="text-right">
                  {selectedAddons.map(a => (
                    <div key={a.id} className="text-sm font-medium text-slate-800">
                      {a.label} (+{formatCurrency(a.priceMin)}–{formatCurrency(a.priceMax)})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {priceRange && (
            <div className="px-6 py-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Estimated Total</span>
                <span className="font-bold text-lg text-brand-700">
                  {formatPriceRange(priceRange.min, priceRange.max)}
                </span>
              </div>
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
            </div>
          )}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <button
          onClick={() => setQuoteModalOpen(true)}
          className="flex-1 bg-brand-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-brand-700 transition-colors shadow-sm text-center"
        >
          Get a Free Quote →
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_STEP', payload: 4 })}
          className="flex-1 bg-white border-2 border-slate-200 text-slate-700 font-semibold py-3.5 px-6 rounded-xl hover:border-slate-300 transition-colors text-center"
        >
          Edit Selections
        </button>
      </div>

      {/* Trust Indicators */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500">
        {[
          { icon: '✅', text: 'Free estimate' },
          { icon: '📍', text: 'Local installers' },
          { icon: '🏆', text: 'Certified materials' },
          { icon: '🔒', text: 'No commitment' },
        ].map(item => (
          <div key={item.text} className="flex items-center gap-1.5 text-xs font-medium">
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      <QuoteFormModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        wizardState={state}
        priceRange={priceRange}
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  colorHex,
}: {
  label: string;
  value: string;
  colorHex?: string;
}) {
  return (
    <div className="px-6 py-3 flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        {colorHex && (
          <div
            className="w-4 h-4 rounded-full border border-slate-200"
            style={{ backgroundColor: colorHex }}
          />
        )}
        <span className="text-sm font-semibold text-slate-800">{value}</span>
      </div>
    </div>
  );
}
