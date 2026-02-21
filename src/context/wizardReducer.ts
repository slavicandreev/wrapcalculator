import type { WizardState, WizardAction, WizardVehicle } from '../types';

export const initialVehicle: WizardVehicle = {
  makeId: null,
  makeName: null,
  modelId: null,
  modelName: null,
  year: null,
  trim: null,
  bodyClass: null,
};

export const initialState: WizardState = {
  currentStep: 1,
  projectType: null,
  vehicle: initialVehicle,
  stateCode: null,
  customization: {
    material: null,
    color: null,
    coverage: null,
    selectedAddons: [],
  },
};

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_PROJECT_TYPE':
      return { ...state, projectType: action.payload };

    case 'SET_VEHICLE': {
      const newVehicle = { ...state.vehicle, ...action.payload };
      // When make changes, reset model/trim/bodyClass
      if ('makeId' in action.payload && action.payload.makeId !== state.vehicle.makeId) {
        newVehicle.modelId = null;
        newVehicle.modelName = null;
        newVehicle.trim = null;
        newVehicle.bodyClass = null;
      }
      // When model changes, reset trim/bodyClass
      if ('modelId' in action.payload && action.payload.modelId !== state.vehicle.modelId) {
        newVehicle.trim = null;
        newVehicle.bodyClass = null;
      }
      return { ...state, vehicle: newVehicle };
    }

    case 'SET_STATE':
      return { ...state, stateCode: action.payload };

    case 'SET_MATERIAL':
      return {
        ...state,
        customization: { ...state.customization, material: action.payload },
      };

    case 'SET_COLOR':
      return {
        ...state,
        customization: { ...state.customization, color: action.payload },
      };

    case 'SET_COVERAGE':
      return {
        ...state,
        customization: { ...state.customization, coverage: action.payload },
      };

    case 'TOGGLE_ADDON': {
      const current = state.customization.selectedAddons;
      const updated = current.includes(action.payload)
        ? current.filter(id => id !== action.payload)
        : [...current, action.payload];
      return {
        ...state,
        customization: { ...state.customization, selectedAddons: updated },
      };
    }

    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
