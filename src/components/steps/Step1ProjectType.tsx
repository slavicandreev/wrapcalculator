import { useWizard } from '../../context/WizardContext';
import { SelectCard } from '../ui/SelectCard';
import type { ProjectType } from '../../types';

const PROJECT_TYPES: {
  id: ProjectType;
  icon: string;
  title: string;
  description: string;
  badge?: string;
}[] = [
  {
    id: 'personal',
    icon: '🚗',
    title: 'Personal Vehicle',
    description: 'Color change, custom look, or protection for your personal car.',
  },
  {
    id: 'business',
    icon: '🏢',
    title: 'Business Branding',
    description: 'Brand your company vehicle with logos, contact info, and graphics.',
    badge: 'Popular',
  },
  {
    id: 'fleet',
    icon: '🚛',
    title: 'Fleet Wrap',
    description: 'Multiple vehicles. Volume pricing applies — save up to 15%.',
    badge: 'Best Value',
  },
];

export function Step1ProjectType() {
  const { state, dispatch } = useWizard();

  const handleSelect = (type: ProjectType) => {
    dispatch({ type: 'SET_PROJECT_TYPE', payload: type });
    // Auto-advance after short delay
    setTimeout(() => {
      dispatch({ type: 'SET_STEP', payload: 2 });
    }, 280);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          What type of project is this?
        </h1>
        <p className="text-slate-500">
          We'll tailor the estimate to your specific needs.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {PROJECT_TYPES.map(type => (
          <SelectCard
            key={type.id}
            selected={state.projectType === type.id}
            onClick={() => handleSelect(type.id)}
            icon={type.icon}
            title={type.title}
            description={type.description}
            badge={type.badge}
          />
        ))}
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        Prices shown are estimates. Final pricing may vary by installer.
      </p>
    </div>
  );
}
