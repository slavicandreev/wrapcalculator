import { labToHex } from '../../utils/colorMatcher';

interface ColorPreviewBarProps {
  extractedLab: [number, number, number];
  onReset: () => void;
}

export function ColorPreviewBar({ extractedLab, onReset }: ColorPreviewBarProps) {
  const hex = labToHex(extractedLab);
  const [L, a, b] = extractedLab;

  return (
    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
      <div
        className="w-10 h-10 rounded-full flex-shrink-0 border border-slate-200 shadow-sm"
        style={{ backgroundColor: hex }}
        aria-label="Extracted dominant color"
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-500 mb-0.5">Extracted dominant color</div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm text-slate-700">{hex.toUpperCase()}</span>
          <span className="text-xs text-slate-400">
            L {L.toFixed(1)} a {a.toFixed(1)} b {b.toFixed(1)}
          </span>
        </div>
      </div>
      <button
        onClick={onReset}
        className="text-xs text-slate-500 hover:text-slate-700 transition-colors underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded flex-shrink-0"
      >
        Change image
      </button>
    </div>
  );
}
