import type { WrapCoverage } from '../../types';
import { normalizeBodyClass } from '../../data/vehicleAreas';

interface SilhouetteProps {
  bodyClass: string | null;
  colorHex: string | null;
  coverage: WrapCoverage | null;
  className?: string;
}

const COVERAGE_OPACITY: Record<WrapCoverage, number> = {
  full:       0.80,
  partial_60: 0.60,
  partial_45: 0.50,
  partial_30: 0.38,
  decal:      0.20,
};

export function SilhouetteFallback({ bodyClass, colorHex, coverage, className = '' }: SilhouetteProps) {
  const normalized = normalizeBodyClass(bodyClass);
  const opacity = coverage ? COVERAGE_OPACITY[coverage] : 0.6;
  const fill = colorHex ?? '#94a3b8';

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      {getSVG(normalized, fill, opacity)}
    </div>
  );
}

function getSVG(bodyClass: string, fill: string, opacity: number) {
  const wrapColor = fill;
  const chassis = '#94a3b8';

  // Shared props for wrap panels
  const wrapFill = { fill: wrapColor, opacity };

  if (bodyClass === 'Pickup' || bodyClass === 'Truck') {
    return <TruckSVG chassis={chassis} wrapFill={wrapFill} />;
  }
  if (bodyClass === 'Van' || bodyClass === 'Minivan') {
    return <VanSVG chassis={chassis} wrapFill={wrapFill} />;
  }
  if (bodyClass === 'SUV' || bodyClass === 'Crossover') {
    return <SuvSVG chassis={chassis} wrapFill={wrapFill} />;
  }
  if (bodyClass === 'Sports Car' || bodyClass === 'Coupe' || bodyClass === 'Convertible') {
    return <SportsSVG chassis={chassis} wrapFill={wrapFill} />;
  }
  // Default: Sedan
  return <SedanSVG chassis={chassis} wrapFill={wrapFill} />;
}

interface SVGProps {
  chassis: string;
  wrapFill: { fill: string; opacity: number };
}

function SedanSVG({ chassis, wrapFill }: SVGProps) {
  return (
    <svg viewBox="0 0 400 160" className="w-full max-w-sm" xmlns="http://www.w3.org/2000/svg">
      {/* Wheels */}
      <circle cx="100" cy="128" r="22" fill="#1e293b" />
      <circle cx="100" cy="128" r="12" fill="#475569" />
      <circle cx="300" cy="128" r="22" fill="#1e293b" />
      <circle cx="300" cy="128" r="12" fill="#475569" />
      {/* Chassis */}
      <path d="M 60 120 Q 55 100 70 95 L 100 90 L 150 55 L 250 50 L 340 70 L 355 90 L 360 120 Z" fill={chassis} />
      {/* Wrap panels - body */}
      <path d="M 60 120 Q 55 100 70 95 L 100 90 L 150 55 L 250 50 L 340 70 L 355 90 L 360 120 Z" {...wrapFill} />
      {/* Windows */}
      <path d="M 155 60 L 145 88 L 255 85 L 248 55 Z" fill="#bfdbfe" opacity="0.8" />
      {/* Door lines */}
      <line x1="200" y1="55" x2="200" y2="115" stroke="#64748b" strokeWidth="1.5" />
      {/* Headlights */}
      <rect x="348" y="90" width="12" height="14" rx="3" fill="#fef3c7" />
      {/* Taillights */}
      <rect x="48" y="90" width="12" height="14" rx="3" fill="#fecaca" />
    </svg>
  );
}

function SuvSVG({ chassis, wrapFill }: SVGProps) {
  return (
    <svg viewBox="0 0 420 170" className="w-full max-w-sm" xmlns="http://www.w3.org/2000/svg">
      <circle cx="105" cy="135" r="24" fill="#1e293b" />
      <circle cx="105" cy="135" r="13" fill="#475569" />
      <circle cx="315" cy="135" r="24" fill="#1e293b" />
      <circle cx="315" cy="135" r="13" fill="#475569" />
      {/* Body */}
      <path d="M 58 128 Q 50 105 68 98 L 105 95 L 140 50 L 290 48 L 350 65 L 368 95 L 370 128 Z" fill={chassis} />
      <path d="M 58 128 Q 50 105 68 98 L 105 95 L 140 50 L 290 48 L 350 65 L 368 95 L 370 128 Z" {...wrapFill} />
      {/* Windows */}
      <path d="M 145 56 L 132 92 L 285 90 L 280 52 Z" fill="#bfdbfe" opacity="0.8" />
      {/* Roof rack */}
      <rect x="140" y="44" width="145" height="6" rx="2" fill={chassis} opacity="0.7" />
      <line x1="210" y1="50" x2="210" y2="120" stroke="#64748b" strokeWidth="1.5" />
      <rect x="358" y="92" width="14" height="16" rx="3" fill="#fef3c7" />
      <rect x="46" y="92" width="14" height="16" rx="3" fill="#fecaca" />
    </svg>
  );
}

function TruckSVG({ chassis, wrapFill }: SVGProps) {
  return (
    <svg viewBox="0 0 460 170" className="w-full max-w-sm" xmlns="http://www.w3.org/2000/svg">
      <circle cx="115" cy="135" r="24" fill="#1e293b" />
      <circle cx="115" cy="135" r="13" fill="#475569" />
      <circle cx="350" cy="135" r="24" fill="#1e293b" />
      <circle cx="350" cy="135" r="13" fill="#475569" />
      {/* Cab */}
      <path d="M 68 128 Q 62 105 80 98 L 115 95 L 145 50 L 230 48 L 240 60 L 240 128 Z" fill={chassis} />
      <path d="M 68 128 Q 62 105 80 98 L 115 95 L 145 50 L 230 48 L 240 60 L 240 128 Z" {...wrapFill} />
      {/* Bed */}
      <path d="M 240 65 L 380 65 L 388 128 L 240 128 Z" fill={chassis} opacity="0.85" />
      <path d="M 240 65 L 380 65 L 388 128 L 240 128 Z" {...wrapFill} />
      {/* Tailgate */}
      <rect x="378" y="65" width="10" height="63" rx="2" fill="#64748b" />
      {/* Cab windows */}
      <path d="M 150 58 L 140 90 L 228 88 L 228 55 Z" fill="#bfdbfe" opacity="0.8" />
      <rect x="378" y="95" width="14" height="14" rx="3" fill="#fef3c7" />
      <rect x="56" y="95" width="14" height="14" rx="3" fill="#fecaca" />
    </svg>
  );
}

function VanSVG({ chassis, wrapFill }: SVGProps) {
  return (
    <svg viewBox="0 0 460 170" className="w-full max-w-sm" xmlns="http://www.w3.org/2000/svg">
      <circle cx="110" cy="135" r="24" fill="#1e293b" />
      <circle cx="110" cy="135" r="13" fill="#475569" />
      <circle cx="350" cy="135" r="24" fill="#1e293b" />
      <circle cx="350" cy="135" r="13" fill="#475569" />
      {/* Box body */}
      <path d="M 62 128 Q 55 108 75 100 L 110 98 L 120 48 L 380 48 L 392 75 L 395 128 Z" fill={chassis} />
      <path d="M 62 128 Q 55 108 75 100 L 110 98 L 120 48 L 380 48 L 392 75 L 395 128 Z" {...wrapFill} />
      {/* Windows */}
      <rect x="125" y="56" width="80" height="40" rx="4" fill="#bfdbfe" opacity="0.8" />
      <rect x="215" y="56" width="60" height="40" rx="4" fill="#bfdbfe" opacity="0.6" />
      {/* Sliding door line */}
      <line x1="215" y1="50" x2="215" y2="125" stroke="#64748b" strokeWidth="2" />
      <line x1="285" y1="50" x2="285" y2="125" stroke="#64748b" strokeWidth="2" />
      <rect x="380" y="90" width="16" height="16" rx="3" fill="#fef3c7" />
      <rect x="48" y="90" width="16" height="16" rx="3" fill="#fecaca" />
    </svg>
  );
}

function SportsSVG({ chassis, wrapFill }: SVGProps) {
  return (
    <svg viewBox="0 0 400 150" className="w-full max-w-sm" xmlns="http://www.w3.org/2000/svg">
      <circle cx="98" cy="122" r="22" fill="#1e293b" />
      <circle cx="98" cy="122" r="12" fill="#475569" />
      <circle cx="302" cy="122" r="22" fill="#1e293b" />
      <circle cx="302" cy="122" r="12" fill="#475569" />
      {/* Low-slung sports body */}
      <path d="M 58 115 Q 52 98 68 90 L 98 88 L 145 52 L 255 48 L 330 68 L 350 90 L 358 115 Z" fill={chassis} />
      <path d="M 58 115 Q 52 98 68 90 L 98 88 L 145 52 L 255 48 L 330 68 L 350 90 L 358 115 Z" {...wrapFill} />
      {/* Fastback window */}
      <path d="M 150 58 L 138 85 L 275 82 L 258 50 Z" fill="#bfdbfe" opacity="0.8" />
      {/* Spoiler hint */}
      <rect x="48" y="86" width="18" height="5" rx="2" fill="#475569" />
      <rect x="344" y="86" width="18" height="5" rx="2" fill="#fef3c7" />
    </svg>
  );
}
