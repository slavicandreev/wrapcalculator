import { useState, useEffect, useCallback } from 'react';
import { useWizard } from '../../context/WizardContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CarVisualization } from '../visualization/CarVisualization';
import { fetchAllMakes, fetchModelsForMake, guessBodyClassFromModel } from '../../services/nhtsaApi';
import { fetchTrims, fetchBodyStyle } from '../../services/carApi';
import { normalizeBodyClass } from '../../data/vehicleAreas';
import { MANUAL_BODY_TYPES } from '../../data/vehicleAreas';
import type { VehicleMake, VehicleModel } from '../../types';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i);

// Popular makes sorted first (compared case-insensitively since NHTSA returns ALL CAPS)
const POPULAR_MAKES_UPPER = ['TOYOTA', 'HONDA', 'FORD', 'CHEVROLET', 'BMW', 'MERCEDES-BENZ', 'AUDI', 'TESLA', 'DODGE', 'JEEP', 'RAM', 'GMC', 'NISSAN', 'HYUNDAI', 'KIA', 'SUBARU', 'VOLKSWAGEN', 'LEXUS', 'ACURA', 'INFINITI', 'CADILLAC', 'LINCOLN', 'BUICK'];

// Convert "TOYOTA" → "Toyota", "BMW" → "BMW" (keep short all-caps as-is)
function toTitleCase(str: string): string {
  return str
    .split(/[\s-]/)
    .map(w => w.length <= 3 ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(str.includes('-') ? '-' : ' ');
}

function sortMakes(makes: VehicleMake[]): VehicleMake[] {
  // Normalize display names and sort popular ones first
  const normalized = makes.map(m => ({
    ...m,
    makeName: toTitleCase(m.makeName),
  }));

  return normalized.sort((a, b) => {
    const aUpper = a.makeName.toUpperCase();
    const bUpper = b.makeName.toUpperCase();
    const aIdx = POPULAR_MAKES_UPPER.indexOf(aUpper);
    const bIdx = POPULAR_MAKES_UPPER.indexOf(bUpper);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.makeName.localeCompare(b.makeName);
  });
}

export function Step2VehicleSelect() {
  const { state, dispatch } = useWizard();
  const { vehicle } = state;

  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [trims, setTrims] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingTrims, setLoadingTrims] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Load makes on mount
  useEffect(() => {
    setLoadingMakes(true);
    fetchAllMakes()
      .then(data => setMakes(sortMakes(data)))
      .catch(() => setApiError(true))
      .finally(() => setLoadingMakes(false));
  }, []);

  // Load models when make + year changes
  useEffect(() => {
    if (!vehicle.makeId || !vehicle.year) {
      setModels([]);
      return;
    }
    setLoadingModels(true);
    fetchModelsForMake(Number(vehicle.makeId))
      .then(data => setModels(data.sort((a, b) => a.modelName.localeCompare(b.modelName))))
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false));
  }, [vehicle.makeId, vehicle.year]);

  // Load trims + resolve body class when model selected
  const loadTrims = useCallback(async () => {
    if (!vehicle.makeName || !vehicle.modelName || !vehicle.year) return;

    // 1. Immediately apply heuristic body class guess so visualization shows something fast
    const guessed = guessBodyClassFromModel(vehicle.modelName);
    if (guessed) {
      dispatch({ type: 'SET_VEHICLE', payload: { bodyClass: guessed } });
    }

    setLoadingTrims(true);
    try {
      const [trimData, bodyStyleRaw] = await Promise.all([
        fetchTrims(vehicle.makeName, vehicle.modelName, vehicle.year),
        fetchBodyStyle(vehicle.makeName, vehicle.modelName, vehicle.year),
      ]);
      setTrims(trimData);

      // CarAPI body style overrides heuristic when available
      if (bodyStyleRaw) {
        const normalized = normalizeBodyClass(bodyStyleRaw);
        dispatch({ type: 'SET_VEHICLE', payload: { bodyClass: normalized } });
      } else if (!guessed) {
        // Final fallback: default to Sedan
        dispatch({ type: 'SET_VEHICLE', payload: { bodyClass: 'Sedan' } });
      }
    } catch {
      setTrims([]);
    } finally {
      setLoadingTrims(false);
    }
  }, [vehicle.makeName, vehicle.modelName, vehicle.year, dispatch]);

  useEffect(() => {
    if (vehicle.modelName) loadTrims();
  }, [vehicle.modelName, loadTrims]);

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
                dispatch({ type: 'SET_VEHICLE', payload: { year, modelId: null, modelName: null, trim: null, bodyClass: null } });
                setModels([]);
                setTrims([]);
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
                value={vehicle.makeId ?? ''}
                onChange={e => {
                  const selected = makes.find(m => String(m.makeId) === e.target.value);
                  dispatch({ type: 'SET_VEHICLE', payload: {
                    makeId: e.target.value,
                    makeName: selected?.makeName ?? null,
                  }});
                  setTrims([]);
                }}
                disabled={!vehicle.year || loadingMakes}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 bg-white focus:border-brand-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select make</option>
                {makes.map(m => (
                  <option key={m.makeId} value={m.makeId}>{m.makeName}</option>
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
                value={vehicle.modelId ?? ''}
                onChange={e => {
                  const selected = models.find(m => String(m.modelId) === e.target.value);
                  dispatch({ type: 'SET_VEHICLE', payload: {
                    modelId: e.target.value,
                    modelName: selected?.modelName ?? null,
                  }});
                  setTrims([]);
                }}
                disabled={!vehicle.makeId || loadingModels || models.length === 0}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 bg-white focus:border-brand-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{!vehicle.makeId ? 'Select make first' : 'Select model'}</option>
                {models.map(m => (
                  <option key={m.modelId} value={m.modelId}>{m.modelName}</option>
                ))}
              </select>
              {loadingModels && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
          </div>

          {/* Trim (optional) */}
          {(trims.length > 0 || loadingTrims) && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Trim <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <select
                  value={vehicle.trim ?? ''}
                  onChange={e => dispatch({ type: 'SET_VEHICLE', payload: { trim: e.target.value || null } })}
                  disabled={loadingTrims}
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 bg-white focus:border-brand-400 focus:outline-none transition-colors disabled:opacity-50"
                >
                  <option value="">Any trim</option>
                  {trims.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {loadingTrims && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual body type fallback (shown if API fails) */}
          {apiError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 mb-3">
                ⚠️ Vehicle database unavailable. Please select your vehicle type manually:
              </p>
              <select
                value={vehicle.bodyClass ?? ''}
                onChange={e => dispatch({ type: 'SET_VEHICLE', payload: {
                  bodyClass: e.target.value || null,
                  makeName: 'Unknown',
                  modelName: 'Vehicle',
                  year: CURRENT_YEAR,
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
