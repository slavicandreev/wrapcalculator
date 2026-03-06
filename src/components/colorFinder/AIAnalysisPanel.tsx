import { ALL_WRAP_SKUS } from '../../data/wrapSkus';
import type { AIAnalysisResult, AIColorMatch } from './types';

interface AIAnalysisPanelProps {
  analysis: AIAnalysisResult;
}

/** Normalize 0-1 decimals to 0-100 if GPT-4o returns them that way */
function normalizeConfidence(raw: number): number {
  return raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
}

function confidenceStyle(confidence: number): { bar: string; text: string } {
  if (confidence >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-700' };
  if (confidence >= 60) return { bar: 'bg-brand-500',   text: 'text-brand-700'  };
  if (confidence >= 40) return { bar: 'bg-amber-400',   text: 'text-amber-700'  };
  return                       { bar: 'bg-slate-300',   text: 'text-slate-500'  };
}

/** Try to find a hex swatch from our local DB by series code */
function hexForCode(code: string): string | null {
  if (!code) return null;
  const normalized = code.toLowerCase().replace(/\s/g, '');
  const found = ALL_WRAP_SKUS.find(s =>
    s.sku.toLowerCase().replace(/\s/g, '') === normalized ||
    normalized.includes(s.sku.toLowerCase().replace(/\s/g, ''))
  );
  return found?.hex ?? null;
}

function MatchRow({ match, rank }: { match: AIColorMatch; rank: number }) {
  const hex = hexForCode(match.series_code);
  const confidence = normalizeConfidence(match.confidence);
  const style = confidenceStyle(confidence);

  return (
    <div className={`flex items-center gap-3 py-2.5 ${rank < 3 ? 'border-b border-slate-100' : ''}`}>
      {/* Rank */}
      <span className="text-xs text-slate-400 w-3 flex-shrink-0">{rank}</span>

      {/* Swatch */}
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 border border-slate-200 shadow-sm"
        style={{ backgroundColor: hex ?? '#e2e8f0' }}
        aria-label={match.color_name}
      />

      {/* Name + code */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-800 truncate leading-tight">{match.color_name}</div>
        <div className="font-mono text-xs text-slate-400 mt-0.5 truncate">{match.series_code}</div>
      </div>

      {/* Confidence */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0 w-14">
        <span className={`text-xs font-semibold ${style.text}`}>{confidence}%</span>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${style.bar}`}
            style={{ width: `${Math.min(100, confidence)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function AIAnalysisPanel({ analysis }: AIAnalysisPanelProps) {
  const props = analysis.color_properties;
  const chips = [
    { label: 'Hue',        value: props.hue        },
    { label: 'Undertone',  value: props.undertone  },
    { label: 'Saturation', value: props.saturation },
    { label: 'Brightness', value: props.brightness },
  ].filter(c => c.value);

  return (
    <div className="space-y-4">
      {/* Color description */}
      <div className="bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="bg-violet-200 text-violet-800 text-xs font-semibold px-2 py-0.5 rounded-full">AI Analysis</span>
          {analysis.finish && (
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full capitalize">
              {analysis.finish}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-800 font-medium">{analysis.dominant_color_description}</p>

        {/* Color property chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {chips.map(c => (
              <span key={c.label} className="text-xs bg-white border border-violet-200 text-slate-600 rounded-full px-2 py-0.5">
                <span className="text-violet-500 font-medium">{c.label}:</span> {c.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Brand match columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 3M */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">3M 2080</span>
          </div>
          <div className="divide-y divide-slate-100">
            {(analysis['3m_matches'] ?? []).map((m, i) => (
              <MatchRow key={m.series_code || i} match={m} rank={i + 1} />
            ))}
            {(!analysis['3m_matches'] || analysis['3m_matches'].length === 0) && (
              <p className="text-xs text-slate-400 py-3">No matches returned</p>
            )}
          </div>
        </div>

        {/* Avery */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">Avery SW900</span>
          </div>
          <div className="divide-y divide-slate-100">
            {(analysis.avery_matches ?? []).map((m, i) => (
              <MatchRow key={m.series_code || i} match={m} rank={i + 1} />
            ))}
            {(!analysis.avery_matches || analysis.avery_matches.length === 0) && (
              <p className="text-xs text-slate-400 py-3">No matches returned</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
