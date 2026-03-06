import { useState } from 'react';
import type { AIAnalysisResult } from './types';
import { ImageUploadZone } from './ImageUploadZone';
import { AIAnalysisPanel } from './AIAnalysisPanel';

type PagePhase =
  | { status: 'idle' }
  | { status: 'analyzing'; dataUrl: string }
  | { status: 'results'; dataUrl: string; aiAnalysis: AIAnalysisResult }
  | { status: 'error'; dataUrl: string; message: string };

interface ColorFinderPageProps {
  onBack: () => void;
}

export function ColorFinderPage({ onBack }: ColorFinderPageProps) {
  const [phase, setPhase] = useState<PagePhase>({ status: 'idle' });

  const handleImageLoaded = async (_img: HTMLImageElement, dataUrl: string) => {
    setPhase({ status: 'analyzing', dataUrl });

    try {
      const [meta, base64] = dataUrl.split(',');
      const mimeType = meta.split(';')[0].split(':')[1] as 'image/jpeg' | 'image/png' | 'image/webp';

      const res = await fetch('/api/detect-wrap-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Server error ${res.status}`);
      }

      const aiAnalysis = await res.json() as AIAnalysisResult;
      setPhase({ status: 'results', dataUrl, aiAnalysis });
    } catch (err) {
      setPhase({
        status: 'error',
        dataUrl,
        message: err instanceof Error ? err.message : 'Analysis failed',
      });
    }
  };

  const handleReset = () => setPhase({ status: 'idle' });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Calculator
          </button>
          <span className="text-slate-300">|</span>
          <h1 className="font-semibold text-slate-800 text-sm">Wrap Color Finder</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Intro */}
        {phase.status === 'idle' && (
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">What color is that wrap?</h2>
            <p className="text-sm text-slate-500">
              Upload a car photo — GPT-4o Vision identifies the color, finish, and matches it against 3M 2080 and Avery SW900 SKUs with confidence scores.
            </p>
          </div>
        )}

        {/* Upload zone */}
        {phase.status === 'idle' && (
          <ImageUploadZone onImageLoaded={handleImageLoaded} />
        )}

        {/* Analyzing state */}
        {phase.status === 'analyzing' && (
          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <img
                src={phase.dataUrl}
                alt="Uploaded car"
                className="w-20 h-20 object-cover rounded-xl border border-slate-200 flex-shrink-0"
              />
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <svg className="w-4 h-4 animate-spin text-violet-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Analyzing with GPT-4o Vision…
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {phase.status === 'results' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <img
                src={phase.dataUrl}
                alt="Uploaded car"
                className="w-20 h-20 object-cover rounded-xl border border-slate-200 flex-shrink-0"
              />
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors focus:outline-none"
              >
                Try another photo
              </button>
            </div>
            <AIAnalysisPanel analysis={phase.aiAnalysis} />
          </div>
        )}

        {/* Error */}
        {phase.status === 'error' && (
          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <img
                src={phase.dataUrl}
                alt="Uploaded car"
                className="w-20 h-20 object-cover rounded-xl border border-slate-200 flex-shrink-0"
              />
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex-1">
                <p className="text-sm text-red-700 font-medium">Analysis failed</p>
                <p className="text-xs text-red-500 mt-0.5">{phase.message}</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors focus:outline-none"
            >
              Try a different photo
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 border-t border-slate-200 pt-4">
          Results depend on photo lighting and camera calibration. SKU numbers should be verified
          against current manufacturer catalogs. Color-shift wraps cannot be reliably identified
          from a single photo.
        </p>
      </main>
    </div>
  );
}
