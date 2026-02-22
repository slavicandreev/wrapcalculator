// src/components/visualization/WrapPreviewPanel.tsx
import { useState } from 'react';
import type { MaterialType, WrapCoverage } from '../../types';

interface WrapPreviewPanelProps {
  src: string;
  colorHex: string | null;
  colorLabel: string | null;
  material: MaterialType | null;
  coverage: WrapCoverage | null;
  coverageLabel: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  colorId: string | null;
  /** Tailwind height classes forwarded to the photo container (e.g. "h-48 sm:h-56") */
  photoHeightClass?: string;
  alt?: string;
  onError?: () => void;
  className?: string;
}

export function WrapPreviewPanel({
  src,
  colorHex,
  colorLabel,
  material,
  coverageLabel,
  photoHeightClass = '',
  alt = 'Vehicle',
  onError,
  className = '',
}: WrapPreviewPanelProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleError = () => {
    setErrored(true);
    onError?.();
  };

  if (errored) return null;

  const materialLabel = material
    ? material.charAt(0).toUpperCase() + material.slice(1).replace(/_/g, ' ')
    : null;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Photo area */}
      <div
        className={`relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center ${photoHeightClass}`}
      >
        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-slate-200 rounded-2xl" />
        )}

        {/* Car image */}
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`w-full h-full object-contain transition-opacity duration-300 select-none ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
        />
      </div>

      {/* Color chip badge */}
      {colorHex && (
        <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 border border-slate-200"
            style={{ backgroundColor: colorHex }}
          />
          {colorLabel && <span className="font-medium text-slate-700">{colorLabel}</span>}
          {materialLabel && (
            <>
              <span className="text-slate-300">·</span>
              <span className="capitalize">{materialLabel}</span>
            </>
          )}
          {coverageLabel && (
            <>
              <span className="text-slate-300">·</span>
              <span>{coverageLabel}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
