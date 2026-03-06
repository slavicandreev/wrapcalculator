import { useState } from 'react';
import { SkuCard } from './SkuCard';
import { AIAnalysisPanel } from './AIAnalysisPanel';
import type { SkuMatch } from '../../data/wrapSkus';
import type { AIAnalysisResult } from './types';

type BrandFilter = 'all' | '3M' | 'Avery';

interface ResultsGridProps {
  matches: SkuMatch[];
  isRefining: boolean;
  aiAnalysis?: AIAnalysisResult;
  aiError?: boolean;
  onRefineWithAI: () => void;
}

export function ResultsGrid({
  matches,
  isRefining,
  aiAnalysis,
  aiError,
  onRefineWithAI,
}: ResultsGridProps) {
  const [brandFilter, setBrandFilter] = useState<BrandFilter>('all');
  const [showAlgorithmic, setShowAlgorithmic] = useState(false);

  const filtered = brandFilter === 'all'
    ? matches
    : matches.filter(m => m.sku.brand === brandFilter);

  return (
    <div className="space-y-4">
      {aiAnalysis ? (
        <>
          {/* AI results — primary */}
          <AIAnalysisPanel analysis={aiAnalysis} />

          {/* Collapsible algorithmic results */}
          <div className="border-t border-slate-100 pt-3">
            <button
              onClick={() => setShowAlgorithmic(v => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showAlgorithmic ? 'rotate-90' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {showAlgorithmic ? 'Hide' : 'Show'} algorithmic Delta-E matches
            </button>

            {showAlgorithmic && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-slate-500 font-medium">Delta-E 2000 pixel matching</span>
                  <div className="flex gap-1.5">
                    {(['all', '3M', 'Avery'] as BrandFilter[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setBrandFilter(f)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors focus:outline-none ${
                          brandFilter === f
                            ? 'bg-brand-500 border-brand-500 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {f === 'all' ? 'All brands' : f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filtered.map((match, i) => (
                    <SkuCard key={match.sku.sku} match={match} rank={i + 1} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 pt-1 border-t border-slate-100">
                  <span>ΔE:</span>
                  <span className="text-emerald-600">&lt;2 Excellent</span>
                  <span className="text-brand-600">2–5 Very close</span>
                  <span className="text-amber-600">5–10 Similar</span>
                  <span>&gt;10 Approximate</span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Algorithmic results — shown before AI */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold text-slate-800 text-sm">
              Top matches — 3M 1080 + Avery SW900
            </h2>
            <div className="flex gap-1.5">
              {(['all', '3M', 'Avery'] as BrandFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setBrandFilter(f)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    brandFilter === f
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {f === 'all' ? 'All brands' : f}
                </button>
              ))}
            </div>
          </div>

          {aiError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
              AI analysis unavailable — showing algorithmic results only.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((match, i) => (
              <SkuCard key={match.sku.sku} match={match} rank={i + 1} />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full text-sm text-slate-400 py-4 text-center">
                No matches for this brand filter.
              </p>
            )}
          </div>

          {/* Analyze with AI button */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onRefineWithAI}
              disabled={isRefining}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-violet-300 bg-violet-50 text-violet-700 text-sm font-medium hover:bg-violet-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {isRefining ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Analyzing with AI…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Analyze with AI
                </>
              )}
            </button>
            <span className="text-xs text-slate-400">GPT-4o Vision · identifies color, finish + confidence scores</span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 pt-1 border-t border-slate-100">
            <span>ΔE:</span>
            <span className="text-emerald-600">&lt;2 Excellent</span>
            <span className="text-brand-600">2–5 Very close</span>
            <span className="text-amber-600">5–10 Similar</span>
            <span>&gt;10 Approximate</span>
          </div>
        </>
      )}
    </div>
  );
}
