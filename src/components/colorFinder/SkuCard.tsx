import { useState } from 'react';
import { deltaETier } from '../../utils/colorMatcher';
import type { SkuMatch } from '../../data/wrapSkus';

interface SkuCardProps {
  match: SkuMatch;
  rank: number;
}

const FINISH_LABELS: Record<string, string> = {
  gloss: 'Gloss',
  matte: 'Matte',
  satin: 'Satin',
  metallic: 'Metallic',
  brushed: 'Brushed',
  carbon: 'Carbon Fiber',
  'color-shift': 'Color Shift',
  chrome: 'Chrome',
  'satin-pearl': 'Satin Pearl',
  textured: 'Textured',
};

export function SkuCard({ match, rank }: SkuCardProps) {
  const [copied, setCopied] = useState(false);
  const { sku, deltaE, aiRefined } = match;
  const tier = deltaETier(deltaE);
  const isBest = rank === 1;

  const copyResult = () => {
    const text = `🎨 ${isBest ? 'Best match' : `Match #${rank}`}: ${sku.brand} ${sku.sku} — ${sku.name}\nDelta-E: ${deltaE.toFixed(1)} (${tier.label})\nHex: ${sku.hex}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className={`
        relative bg-white rounded-2xl border p-4 transition-shadow hover:shadow-md
        ${isBest ? 'border-brand-400 ring-2 ring-brand-400 ring-offset-1' : 'border-slate-200'}
      `}
    >
      {isBest && (
        <span className="absolute -top-2 right-3 bg-brand-100 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          Best match
        </span>
      )}
      {aiRefined && !isBest && (
        <span className="absolute -top-2 right-3 bg-violet-100 text-violet-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          AI refined
        </span>
      )}

      <div className="flex items-start gap-3">
        {/* Color swatch */}
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 border border-slate-200 shadow-sm"
          style={{ backgroundColor: sku.hex }}
          aria-label={`Color swatch: ${sku.name}`}
        />

        <div className="flex-1 min-w-0">
          {/* Brand badge */}
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                sku.brand === '3M'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {sku.brand}
            </span>
            <span className="bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded-full">
              {FINISH_LABELS[sku.finish] ?? sku.finish}
            </span>
          </div>

          {/* Color name */}
          <div className="font-semibold text-sm text-slate-900 truncate">{sku.name}</div>

          {/* SKU */}
          <div className="font-mono text-xs text-slate-400 mt-0.5">{sku.sku}</div>
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
        <span className={`text-xs font-medium ${tier.className}`}>
          ΔE {deltaE.toFixed(1)} — {tier.label}
        </span>
        <button
          onClick={copyResult}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded px-1"
          aria-label="Copy result to clipboard"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
