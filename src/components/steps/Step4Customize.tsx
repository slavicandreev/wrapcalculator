import { useWizard } from '../../context/WizardContext';
import { SelectCard } from '../ui/SelectCard';
import { ColorSwatch } from '../ui/ColorSwatch';
import { CheckboxFeature } from '../ui/CheckboxFeature';
import { CarVisualization } from '../visualization/CarVisualization';
import { MATERIAL_PRICING } from '../../data/pricing';
import { COVERAGE_OPTIONS } from '../../data/pricing';
import { COLORS_BY_CATEGORY } from '../../data/colors';
import { ADDONS } from '../../data/addons';
import { formatCurrency } from '../../utils/formatCurrency';
import type { MaterialType } from '../../types';
import { getColorById } from '../../data/colors';

const MATERIAL_ICONS: Record<MaterialType, string> = {
  gloss: '✨',
  matte: '🌫️',
  satin: '💎',
  chrome: '🪙',
  color_shift: '🌈',
  carbon_fiber: '⚙️',
  textured: '🧱',
};

export function Step4Customize() {
  const { state, dispatch } = useWizard();
  const { customization, vehicle } = state;

  const selectedColor = customization.color ? getColorById(customization.color) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left: Controls */}
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Customize your wrap
          </h1>
          <p className="text-slate-500">
            Choose your material, color, and coverage. Add extras below.
          </p>
        </div>

        {/* Material Selection */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Material
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(MATERIAL_PRICING) as MaterialType[]).map(mat => {
              const info = MATERIAL_PRICING[mat];
              return (
                <SelectCard
                  key={mat}
                  selected={customization.material === mat}
                  onClick={() => dispatch({ type: 'SET_MATERIAL', payload: mat })}
                  icon={MATERIAL_ICONS[mat]}
                  title={info.label}
                  description={`${info.description} · ${formatCurrency(info.min)}–${formatCurrency(info.max)}/sq ft`}
                  badge={info.popular ? 'Popular' : undefined}
                />
              );
            })}
          </div>
        </section>

        {/* Color Selection */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Color
          </h2>

          {/* Color categories */}
          {(['solid', 'metallic', 'special'] as const).map(category => (
            <div key={category} className="mb-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 capitalize">
                {category === 'special' ? 'Special Finishes' : `${category} Colors`}
              </p>
              <div className="flex flex-wrap gap-2">
                {COLORS_BY_CATEGORY[category].map(color => (
                  <div key={color.id} className="flex flex-col items-center gap-1">
                    <ColorSwatch
                      color={color}
                      selected={customization.color === color.id}
                      onClick={() => dispatch({ type: 'SET_COLOR', payload: color.id })}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {selectedColor && (
            <div className="flex items-center gap-2 mt-2 p-3 bg-slate-50 rounded-xl">
              <div
                className="w-5 h-5 rounded-full border border-slate-200 flex-shrink-0"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span className="text-sm font-medium text-slate-700">{selectedColor.label}</span>
              <span className="text-xs text-slate-400 ml-auto capitalize">{selectedColor.category}</span>
            </div>
          )}
        </section>

        {/* Coverage Selection */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Coverage
          </h2>
          <div className="flex flex-col gap-2">
            {COVERAGE_OPTIONS.map(opt => (
              <SelectCard
                key={opt.id}
                selected={customization.coverage === opt.id}
                onClick={() => dispatch({ type: 'SET_COVERAGE', payload: opt.id })}
                title={opt.label}
                description={`${opt.description} · ${opt.areas}`}
              />
            ))}
          </div>
        </section>

        {/* Add-ons */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">
            Add-ons
          </h2>
          <p className="text-xs text-slate-400 mb-3">Optional extras to complete your wrap.</p>
          <div className="flex flex-col gap-2">
            {ADDONS.map(addon => (
              <CheckboxFeature
                key={addon.id}
                addon={addon}
                checked={customization.selectedAddons.includes(addon.id)}
                onChange={id => dispatch({ type: 'TOGGLE_ADDON', payload: id })}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Right: Live Visualization */}
      <div className="hidden lg:flex flex-col gap-4 sticky top-24">
        <CarVisualization
          bodyClass={vehicle.bodyClass}
          make={vehicle.makeName}
          model={vehicle.modelName}
          year={vehicle.year}
          colorHex={selectedColor?.hex ?? null}
          colorLabel={selectedColor?.label ?? null}
          colorId={customization.color}
          coverage={customization.coverage}
          coverageLabel={COVERAGE_OPTIONS.find(c => c.id === customization.coverage)?.label ?? null}
          material={customization.material}
          size="large"
        />
        {vehicle.makeName && (
          <p className="text-center text-sm text-slate-500 font-medium">
            {vehicle.year} {vehicle.makeName} {vehicle.modelName}
          </p>
        )}
      </div>
    </div>
  );
}
