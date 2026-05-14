import { useState, useEffect } from 'react';
import { useWizard } from '../../context/WizardContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CarVisualization } from '../visualization/CarVisualization';
import { fetchMakes, fetchModels, guessBodyClassFromModel } from '../../services/vehicleApi';
import { MANUAL_BODY_TYPES } from '../../data/vehicleAreas';

const FLEET_SIZE_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50];

const CURRENT_YEAR = new Date().getFullYear() + 1; // include next model year
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i);

// Popular makes sorted first
const POPULAR_MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Dodge', 'Jeep', 'Ram', 'GMC', 'Nissan', 'Hyundai', 'Kia', 'Subaru', 'Volkswagen', 'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Lincoln', 'Buick'];

function sortMakes(makes: string[]): string[] {
  return makes.sort((a, b) => {
    const aIdx = POPULAR_MAKES.indexOf(a);
    const bIdx = POPULAR_MAKES.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Extract the base model name from fueleconomy.gov's detailed model string.
 * e.g. "Accord Sport/Touring" → "Accord", "X5 xDrive40i" → "X5"
 * Groups models so user picks base model first, then a trim variant.
 */
function extractBaseModel(fullModel: string): string {
  // Split on first space that's followed by a lowercase letter, digit,
  // or known trim prefix — but keep multi-word base models like "Model 3", "Land Cruiser"
  const knownMultiWord = /^(Model [3SXY]|Grand Cherokee|Land Cruiser|Town Car|Crown Victoria|Monte Carlo|Grand Prix|Gran Coupe|El Camino|New Yorker)/i;
  const match = fullModel.match(knownMultiWord);
  if (match) return match[1];

  // For most cars: first word (or first word + number) is the model
  const parts = fullModel.split(/\s+/);
  if (parts.length === 1) return fullModel;

  // Keep "CR-V", "CX-5" style compound names
  if (/^[A-Z]{1,3}-?\d/.test(parts[0])) return parts[0];

  // If second part starts with a digit, it's still the model name (e.g. "3 Series", "5 Series")
  if (parts.length >= 2 && /^\d/.test(parts[1])) return `${parts[0]} ${parts[1]}`;

  return parts[0];
}

export function Step2VehicleSelect() {
  const { state, dispatch } = useWizard();
  const { vehicle } = state;
  const isFleet = state.projectType === 'fleet';
  const fleetSize = state.fleetSize ?? 2;

  const [makes, setMakes] = useState<string[]>([]);
  const [allModels, setAllModels] = useState<string[]>([]); // raw from API
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Derived: unique base models and trims for selected base model
  const baseModels = [...new Set(allModels.map(extractBaseModel))].sort();

  const selectedBaseModel = vehicle.modelName;
  const trims = selectedBaseModel
    ? allModels
        .filter(m => extractBaseModel(m) === selectedBaseModel && m !== selectedBaseModel)
        .map(m => m.slice(selectedBaseModel.length).trim())
        .filter(Boolean)
    : [];

  // Load makes when year changes
  useEffect(() => {
    if (!vehicle.year) {
      setMakes([]);
      return;
    }
    setLoadingMakes(true);
    setApiError(false);
    fetchMakes(vehicle.year)
      .then(data => setMakes(sortMakes(data)))
      .catch(() => setApiError(true))
      .finally(() => setLoadingMakes(false));
  }, [vehicle.year]);

  // Load models when year + make changes
  useEffect(() => {
    if (!vehicle.year || !vehicle.makeName) {
      setAllModels([]);
      return;
    }
    setLoadingModels(true);
    fetchModels(vehicle.year, vehicle.makeName)
      .then(data => setAllModels(data))
      .catch(() => setAllModels([]))
      .finally(() => setLoadingModels(false));
  }, [vehicle.year, vehicle.makeName]);

  // Resolve body class when model changes
  useEffect(() => {
    if (!vehicle.modelName) return;
    const guessed = guessBodyClassFromModel(vehicle.modelName);
    dispatch({ type: 'SET_VEHICLE', payload: { bodyClass: guessed ?? 'Sedan' } });
  }, [vehicle.modelName, dispatch]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left: Form */}
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Select your vehicle
          </h1>
          <p className="text-slate-500">
            We'll use this to calculate the wrap area and show you a preview.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Year */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Year</label>
            <select
              value={vehicle.year ?? ''}
              onChange={e => {
                const year = Number(e.target.value);
                dispatch({ type: 'SET_VEHICLE', payload: { year, makeId: null, makeName: null, modelId: null, modelName: null, trim: null, bodyClass: null } });
                setAllModels([]);
              }}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 bg-white focus:border-brand-400 focus:outline-none transition-colors"
            >
              <option value="">Select year</option>
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Make */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Make</label>
            <div className="relative">
              <select
                value={vehicle.makeName ?? ''}
                onChange={e => {
                  dispatch({ type: 'SET_VEHICLE', payload: {
                    makeId: e.target.value,
                    makeName: e.target.value || null,
                    modelId: null,
                    modelName: null,
                    trim: null,
                    bodyClass: null,
                  }});
                  setAllModels([]);
                }}
                disabled={!vehicle.year || loadingMakes}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 bg-white focus:border-brand-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select make</option>
                {makes.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {loadingMakes && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Model</label>
            <div className="relative">
              <select
                value={vehicle.modelName ?? ''}
                onChange={e => {
                  dispatch({ type: 'SET_VEHICLE', payload: {
                    modelId: e.target.value,
                    modelName: e.target.value || null,
                    trim: null,
                  }});
                }}
                disabled={!vehicle.makeName || loadingModels || baseModels.length === 0}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 bg-white focus:border-brand-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{!vehicle.makeName ? 'Select make first' : 'Select model'}</option>
                {baseModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {loadingModels && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
          </div>

          {/* Trim (derived from model variants) */}
          {trims.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Trim <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <select
                value={vehicle.trim ?? ''}
                onChange={e => dispatch({ type: 'SET_VEHICLE', payload: { trim: e.target.value || null } })}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 bg-white focus:border-brand-400 focus:outline-none transition-colors"
              >
                <option value="">Any trim</option>
                {trims.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {/* Fleet size */}
          {isFleet && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Number of vehicles
              </label>
              <select
                value={fleetSize}
                onChange={e => dispatch({ type: 'SET_FLEET_SIZE', payload: Number(e.target.value) })}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 bg-white focus:border-brand-400 focus:outline-none transition-colors"
              >
                {FLEET_SIZE_OPTIONS.map(n => (
                  <option key={n} value={n}>
                    {n === 50 ? '50+ vehicles' : `${n} vehicles`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1.5">
                {fleetSize >= 10 ? '20% volume discount applied' :
                 fleetSize >= 5  ? '15% volume discount applied' :
                                   '10% volume discount applied'}
              </p>
            </div>
          )}

          {/* Manual body type fallback */}
          {apiError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 mb-3">
                Vehicle database unavailable. Please select your vehicle type manually:
              </p>
              <select
                value={vehicle.bodyClass ?? ''}
                onChange={e => dispatch({ type: 'SET_VEHICLE', payload: {
                  bodyClass: e.target.value || null,
                  makeName: 'Unknown',
                  modelName: 'Vehicle',
                  year: new Date().getFullYear(),
                }})}
                className="w-full rounded-xl border-2 border-amber-200 px-4 py-3 text-sm font-medium text-slate-800 bg-white focus:border-amber-400 focus:outline-none"
              >
                <option value="">Select vehicle type</option>
                {MANUAL_BODY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="mt-4 flex gap-4">
          <button className="text-xs text-brand-600 hover:underline">
            I don't see my vehicle
          </button>
        </div>
      </div>

      {/* Right: Car Visualization */}
      <div className="hidden lg:block sticky top-24">
        <CarVisualization
          bodyClass={vehicle.bodyClass}
          make={vehicle.makeName}
          model={vehicle.modelName}
          year={vehicle.year}
          colorHex={null}
          coverage={null}
          material={null}
          size="large"
        />
        {vehicle.makeName && vehicle.modelName && (
          <p className="text-center text-sm text-slate-500 mt-3 font-medium">
            {vehicle.year} {vehicle.makeName} {vehicle.modelName}
            {vehicle.trim && ` · ${vehicle.trim}`}
          </p>
        )}
      </div>
    </div>
  );
}
