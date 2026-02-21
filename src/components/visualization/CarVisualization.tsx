import { useState, useEffect } from 'react';
import type { MaterialType, WrapCoverage } from '../../types';
import { buildImagineUrl } from '../../services/imaginApi';
import { CarPhotoTinter } from './CarPhotoTinter';
import { SilhouetteFallback } from './SilhouetteFallback';

interface CarVisualizationProps {
  make: string | null;
  model: string | null;
  year: number | null;
  bodyClass: string | null;
  colorHex: string | null;
  coverage: WrapCoverage | null;
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
  coverage,
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

  const containerClass = `
    relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100
    flex items-center justify-center
    ${heightClass} ${className}
  `;

  // Empty state
  if (!make || !model || !year) {
    return (
      <div className={containerClass}>
        <div className="flex flex-col items-center gap-2 text-slate-300">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h.01M12 7h.01M16 7h.01M3 12h18m-9 5v2m-4-2h8a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium text-slate-400">Select a vehicle to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {/* IMAGIN photo with tint */}
      {imageUrl && !imageFailed ? (
        <CarPhotoTinter
          src={imageUrl}
          colorHex={colorHex}
          coverage={coverage}
          material={material}
          alt={`${year} ${make} ${model}`}
          onError={() => setImageFailed(true)}
          className="w-full h-full"
        />
      ) : (
        /* SVG silhouette fallback */
        <SilhouetteFallback
          bodyClass={bodyClass}
          colorHex={colorHex}
          coverage={coverage}
          className="w-full h-full"
        />
      )}
    </div>
  );
}
