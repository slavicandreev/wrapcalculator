interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-slate-200 border-t-brand-500 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-1 items-center ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
