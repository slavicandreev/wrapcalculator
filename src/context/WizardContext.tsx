import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { WizardState, WizardAction, PriceRange } from '../types';
import { wizardReducer, initialState } from './wizardReducer';
import { calculatePrice } from '../utils/priceCalculator';

interface WizardContextValue {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  priceRange: PriceRange | null;
  canAdvance: boolean;
}

const WizardContext = createContext<WizardContextValue | null>(null);

function canAdvanceFromStep(state: WizardState): boolean {
  switch (state.currentStep) {
    case 1:
      return state.projectType !== null;
    case 2:
      return (
        state.vehicle.makeName !== null &&
        state.vehicle.modelName !== null &&
        state.vehicle.year !== null
      );
    case 3:
      return state.stateCode !== null;
    case 4:
      return (
        state.customization.material !== null &&
        state.customization.color !== null &&
        state.customization.coverage !== null
      );
    case 5:
      return true;
    default:
      return false;
  }
}

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const priceRange = useMemo(
    () => calculatePrice(state),
    [
      state.projectType,
      state.vehicle.bodyClass,
      state.stateCode,
      state.customization.material,
      state.customization.coverage,
      state.customization.selectedAddons,
    ]
  );

  const canAdvance = useMemo(() => canAdvanceFromStep(state), [state]);

  return (
    <WizardContext.Provider value={{ state, dispatch, priceRange, canAdvance }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used inside <WizardProvider>');
  return ctx;
}
