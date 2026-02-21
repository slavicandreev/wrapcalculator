import type { MaterialType, WrapCoverage } from '../../types';
import { CarVisualization } from './CarVisualization';

interface ThreeAngleViewProps {
  make: string | null;
  model: string | null;
  year: number | null;
  bodyClass: string | null;
  colorHex: string | null;
  coverage: WrapCoverage | null;
  material: MaterialType | null;
}

export function ThreeAngleView({
  make,
  model,
  year,
  bodyClass,
  colorHex,
  coverage,
  material,
}: ThreeAngleViewProps) {
  const sharedProps = { make, model, year, bodyClass, colorHex, coverage, material };

  return (
    <div className="w-full">
      {/* Mobile: single large view */}
      <div className="lg:hidden">
        <CarVisualization
          {...sharedProps}
          angle="side"
          size="large"
          className="rounded-2xl"
        />
      </div>

      {/* Desktop: 3-angle layout like Wrapmate */}
      <div className="hidden lg:grid grid-cols-3 gap-3">
        {/* Side view — left */}
        <div className="col-span-1">
          <CarVisualization
            {...sharedProps}
            angle="side"
            size="small"
            className="rounded-xl"
          />
          <p className="text-center text-xs text-slate-400 mt-1.5 font-medium">Side</p>
        </div>

        {/* Front 3/4 — center (hero, larger) */}
        <div className="col-span-1">
          <CarVisualization
            {...sharedProps}
            angle="front"
            size="large"
            className="rounded-xl shadow-sm"
          />
          <p className="text-center text-xs text-slate-400 mt-1.5 font-medium">Front</p>
        </div>

        {/* Rear 3/4 — right */}
        <div className="col-span-1">
          <CarVisualization
            {...sharedProps}
            angle="rear"
            size="small"
            className="rounded-xl"
          />
          <p className="text-center text-xs text-slate-400 mt-1.5 font-medium">Rear</p>
        </div>
      </div>
    </div>
  );
}
