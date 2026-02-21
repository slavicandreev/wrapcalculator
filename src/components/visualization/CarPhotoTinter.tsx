import { useState } from 'react';
import type { MaterialType, WrapCoverage } from '../../types';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface CarPhotoTinterProps {
  src: string;
  colorHex: string | null;
  coverage: WrapCoverage | null;
  material: MaterialType | null;
  alt?: string;
  onError?: () => void;
  className?: string;
}

// Tint strength by coverage level
const TINT_STRENGTH: Record<WrapCoverage, number> = {
  full:       0.55,
  partial_60: 0.42,
  partial_45: 0.34,
  partial_30: 0.26,
  decal:      0.14,
};

// CSS blend mode by material type
const BLEND_MODE: Record<MaterialType, string> = {
  gloss:        'multiply',
  matte:        'overlay',
  satin:        'soft-light',
  chrome:       'screen',
  color_shift:  'hard-light',
  carbon_fiber: 'multiply',
  textured:     'multiply',
};

export function CarPhotoTinter({
  src,
  colorHex,
  coverage,
  material,
  alt = 'Vehicle',
  onError,
  className = '',
}: CarPhotoTinterProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const tintStrength = coverage ? TINT_STRENGTH[coverage] : 0.45;
  const blendMode = material ? BLEND_MODE[material] : 'multiply';

  const handleError = () => {
    setErrored(true);
    onError?.();
  };

  if (errored) return null;

  return (
    <div className={`relative overflow-hidden select-none ${className}`}>
      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-xl">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* Base car image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        draggable={false}
      />

      {/* Color tint overlay */}
      {colorHex && loaded && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-200"
          style={{
            backgroundColor: colorHex,
            opacity: tintStrength,
            mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
          }}
        />
      )}
    </div>
  );
}
