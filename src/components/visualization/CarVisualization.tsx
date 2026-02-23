import { useState, useEffect } from 'react';
import type { MaterialType, WrapCoverage } from '../../types';
import { buildImagineUrl } from '../../services/imaginApi';
import { WrapPreviewPanel } from './WrapPreviewPanel';
import { SilhouetteFallback } from './SilhouetteFallback';

interface CarVisualizationProps {
  make: string | null;
  model: string | null;
  year: number | null;
  bodyClass: string | null;
  colorHex: string | null;
  colorLabel?: string | null;
  colorId?: string | null;
  coverage: WrapCoverage | null;
  coverageLabel?: string | null;
  material: MaterialType | null;
  angle?: 'side' | 'front' | 'rear';
  size?: 'small' | 'large';
  className?: string;
}

export function CarVisualization({
  make,
  model,
  year,
  bodyClass,
  colorHex,
  colorLabel = null,
  colorId = null,
  coverage,
  coverageLabel = null,
  material,
  angle = 'side',
  size = 'small',
  className = '',
}: CarVisualizationProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const heightClass = size === 'large' ? 'h-48 sm:h-56' : 'h-36 sm:h-40';

  // Build IMAGIN URL when make/model/year changes
  useEffect(() => {
    if (make && model && year) {
      setImageFailed(false);
      const angleParam = angle === 'side' ? 'side' : angle === 'front' ? 'frontInterior' : 'rear';
      const url = buildImagineUrl({ make, model, year, angle: angleParam, width: 800 });
      setImageUrl(url);
    } else {
      setImageUrl(null);
    }
  }, [make, model, year, angle]);

  // Empty state — no vehicle selected yet
  if (!make || !model || !year) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center ${heightClass} ${className}`}
      >
        <div className="flex flex-col items-center gap-2 text-slate-300">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h.01M12 7h.01M16 7h.01M3 12h18m-9 5v2m-4-2h8a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium text-slate-400">Select a vehicle to preview</p>
        </div>
      </div>
    );
  }

  // Silhouette fallback when IMAGIN photo is unavailable
  if (!imageUrl || imageFailed) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center ${heightClass} ${className}`}
      >
        <SilhouetteFallback
          bodyClass={bodyClass}
          colorHex={colorHex}
          coverage={coverage}
          className="w-full h-full"
        />
      </div>
    );
  }

  // IMAGIN photo via WrapPreviewPanel (clean photo + color chip + AI button)
  return (
    <WrapPreviewPanel
      src={imageUrl}
      colorHex={colorHex}
      colorLabel={colorLabel}
      colorId={colorId}
      coverage={coverage}
      coverageLabel={coverageLabel}
      material={material}
      make={make}
      model={model}
      year={year}
      alt={`${year} ${make} ${model}`}
      onError={() => setImageFailed(true)}
      photoHeightClass={heightClass}
      className={className}
    />
  );
}
