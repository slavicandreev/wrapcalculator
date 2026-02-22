interface SelectCardProps {
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectCard({
  selected,
  onClick,
  icon,
  title,
  description,
  badge,
  disabled = false,
  className = '',
}: SelectCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
        ${selected
          ? 'border-brand-500 bg-brand-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      aria-pressed={selected}
    >
      {badge && (
        <span className="absolute -top-2 right-3 bg-brand-100 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}

      <div className="flex items-start gap-3">
        {icon && (
          <div className={`text-2xl flex-shrink-0 ${selected ? '' : 'opacity-75'}`}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${selected ? 'text-brand-700' : 'text-slate-800'}`}>
            {title}
          </div>
          {description && (
            <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {description}
            </div>
          )}
        </div>

        {/* Selection indicator */}
        <div className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
          transition-all duration-200
          ${selected
            ? 'border-brand-500 bg-brand-500'
            : 'border-slate-300 bg-white'
          }
        `}>
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}
