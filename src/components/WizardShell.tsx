import { useWizard } from '../context/WizardContext';
import { ProgressBar } from './ui/ProgressBar';
import { PriceDisplay } from './ui/PriceDisplay';
import { Step1ProjectType } from './steps/Step1ProjectType';
import { Step2VehicleSelect } from './steps/Step2VehicleSelect';
import { Step3StateSelect } from './steps/Step3StateSelect';
import { Step4Customize } from './steps/Step4Customize';
import { Step5Estimate } from './steps/Step5Estimate';

const STEP_COMPONENTS = {
  1: Step1ProjectType,
  2: Step2VehicleSelect,
  3: Step3StateSelect,
  4: Step4Customize,
  5: Step5Estimate,
};

export function WizardShell() {
  const { state, dispatch, canAdvance } = useWizard();
  const { currentStep } = state;

  const StepComponent = STEP_COMPONENTS[currentStep];

  const handleNext = () => {
    if (canAdvance && currentStep < 5) {
      dispatch({ type: 'SET_STEP', payload: (currentStep + 1) as 1|2|3|4|5 });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: (currentStep - 1) as 1|2|3|4|5 });
    }
  };

  return (
    <div className="bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="w-[90%] mx-auto">
          <ProgressBar />
        </div>
      </header>

      {/* Step Content */}
      <main className="flex-1 w-[90%] mx-auto px-4 py-6">
        <div className="animate-fade-in">
          <StepComponent />
        </div>
      </main>

      {/* Footer: Price + Navigation */}
      <footer className="bg-white border-t border-slate-100">
        <div className="w-[90%] mx-auto">
          <PriceDisplay />
          <div className="flex items-center justify-between px-6 py-4">
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                disabled={!canAdvance}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm
                  transition-all duration-200
                  ${canAdvance
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }
                `}
              >
                {currentStep === 4 ? 'See My Estimate' : 'Continue'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => dispatch({ type: 'RESET' })}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
