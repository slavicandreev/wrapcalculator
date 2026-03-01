import { useWizard } from '../../context/WizardContext';
import { US_STATES_SORTED } from '../../data/states';

const REGION_LABELS: Record<string, string> = {
  west: '🌊 West',
  northeast: '🗽 Northeast',
  southeast: '🌴 Southeast',
  midwest: '🌾 Midwest',
  southwest: '☀️ Southwest',
};

const REGION_ORDER = ['west', 'northeast', 'southeast', 'midwest', 'southwest'];

// Group states by region
const STATES_BY_REGION = REGION_ORDER.reduce((acc, region) => {
  acc[region] = US_STATES_SORTED.filter(s => s.region === region);
  return acc;
}, {} as Record<string, typeof US_STATES_SORTED>);

export function Step3StateSelect() {
  const { state, dispatch } = useWizard();

  const selectedState = US_STATES_SORTED.find(s => s.code === state.stateCode);

  const handleSelect = (code: string) => {
    dispatch({ type: 'SET_STATE', payload: code });
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          Where are you located?
        </h1>
        <p className="text-slate-500">
          Labor and material costs vary by region. Your state helps us give you an accurate estimate.
        </p>
      </div>

      {/* Quick select dropdown for mobile / easy access */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select your state</label>
        <select
          value={state.stateCode ?? ''}
          onChange={e => handleSelect(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 bg-white focus:border-brand-400 focus:outline-none transition-colors"
        >
          <option value="">Choose a state…</option>
          {REGION_ORDER.map(region => (
            <optgroup key={region} label={REGION_LABELS[region]}>
              {STATES_BY_REGION[region].map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Selected state info card */}
      {selectedState && (
        <div className="p-5 bg-brand-50 border-2 border-brand-200 rounded-2xl animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-brand-700">{selectedState.code}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{selectedState.name}</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {selectedState.multiplier > 1
                  ? `+${Math.round((selectedState.multiplier - 1) * 100)}% regional adjustment applied`
                  : selectedState.multiplier < 1
                  ? `${Math.round((1 - selectedState.multiplier) * 100)}% below national average`
                  : 'Base national pricing applied'
                }
              </p>
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_STATE', payload: '' })}
              className="text-slate-400 hover:text-slate-600 text-xs"
              aria-label="Clear selection"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Regional pricing info */}
      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Regional Pricing Guide
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span>CA, HI, AK — highest (+25-30%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
            <span>NY, FL, WA — high (+15-20%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <span>TX, IL — moderate (+10%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span>Rural states — below average (-10-15%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
