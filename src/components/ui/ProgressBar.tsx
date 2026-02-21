import React from 'react';
import { useWizard } from '../../context/WizardContext';

const STEPS = [
  { num: 1, label: 'Project' },
  { num: 2, label: 'Vehicle' },
  { num: 3, label: 'Location' },
  { num: 4, label: 'Customize' },
  { num: 5, label: 'Estimate' },
];

export function ProgressBar() {
  const { state, dispatch } = useWizard();
  const { currentStep } = state;

  return (
    <div className="w-full px-6 py-4">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {STEPS.map((step, idx) => {
          const isCompleted = currentStep > step.num;
          const isActive = currentStep === step.num;
          const isClickable = currentStep > step.num;

          return (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => isClickable && dispatch({ type: 'SET_STEP', payload: step.num as 1|2|3|4|5 })}
                  disabled={!isClickable && !isActive}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-200
                    ${isCompleted
                      ? 'bg-brand-600 text-white cursor-pointer hover:bg-brand-700 shadow-sm'
                      : isActive
                      ? 'bg-brand-600 text-white ring-4 ring-brand-200 shadow-sm'
                      : 'bg-slate-100 text-slate-400 cursor-default'
                    }
                  `}
                  aria-label={`Step ${step.num}: ${step.label}`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </button>
                <span className={`text-xs font-medium hidden sm:block ${
                  isActive ? 'text-brand-600' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>

              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${
                  currentStep > step.num ? 'bg-brand-600' : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
