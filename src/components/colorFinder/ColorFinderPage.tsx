import { useState } from 'react';
import { extractDominantLab, matchColor } from '../../utils/colorMatcher';
import { ALL_WRAP_SKUS } from '../../data/wrapSkus';
import type { SkuMatch } from '../../data/wrapSkus';
import type { AIAnalysisResult } from './types';
import { ImageUploadZone } from './ImageUploadZone';
import { ColorPreviewBar } from './ColorPreviewBar';
import { ResultsGrid } from './ResultsGrid';

type PagePhase =
  | { status: 'idle' }
  | { status: 'results'; extractedLab: [number, number, number]; matches: SkuMatch[]; aiError?: boolean }
  | { status: 'refining'; extractedLab: [number, number, number]; matches: SkuMatch[] }
  | { status: 'ai-results'; extractedLab: [number, number, number]; matches: SkuMatch[]; aiAnalysis: AIAnalysisResult };

interface ColorFinderPageProps {
  onBack: () => void;
}

export function ColorFinderPage({ onBack }: ColorFinderPageProps) {
  const [phase, setPhase] = useState<PagePhase>({ status: 'idle' });
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);

  const handleImageLoaded = (img: HTMLImageElement, dataUrl: string) => {
    setUploadedDataUrl(dataUrl);
    const lab = extractDominantLab(img);
    const matches = matchColor(lab, ALL_WRAP_SKUS, 6);
    setPhase({ status: 'results', extractedLab: lab, matches });
  };

  const handleReset = () => {
    setPhase({ status: 'idle' });
    setUploadedDataUrl(null);
  };

  const handleAnalyzeWithAI = async () => {
    if ((phase.status !== 'results' && phase.status !== 'ai-results') || !uploadedDataUrl) return;
    const currentMatches = phase.matches;
    const currentLab = phase.extractedLab;

    setPhase({ status: 'refining', extractedLab: currentLab, matches: currentMatches });

    try {
      const [meta, base64] = uploadedDataUrl.split(',');
      const mimeType = meta.split(';')[0].split(':')[1] as 'image/jpeg' | 'image/png' | 'image/webp';

      const res = await fetch('/api/detect-wrap-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      if (!res.ok) throw new Error(`${res.status}`);

      const aiAnalysis = await res.json() as AIAnalysisResult;

      setPhase({ status: 'ai-results', extractedLab: currentLab, matches: currentMatches, aiAnalysis });
    } catch {
      setPhase({ status: 'results', extractedLab: currentLab, matches: currentMatches, aiError: true });
    }
  };

  const showResults = phase.status === 'results' || phase.status === 'refining' || phase.status === 'ai-results';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded"
            aria-label="Back to calculator"
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

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {phase.status === 'idle' && (
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">What color is that wrap?</h2>
            <p className="text-sm text-slate-500">
              Upload a car photo to identify the wrap color and match it against 3M 2080 and Avery SW900 SKUs.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[
                { n: '1', label: 'Upload a photo',      desc: 'Any car photo — cropped to the body works best' },
                { n: '2', label: 'Pixel color match',   desc: 'Canvas API extracts dominant color, Delta-E 2000 finds closest SKUs' },
                { n: '3', label: 'AI deep analysis',    desc: 'GPT-4o identifies hue, finish, and returns confidence scores per brand' },
              ].map(step => (
                <div key={step.n} className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center mx-auto mb-2">
                    {step.n}
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mb-1">{step.label}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!showResults && <ImageUploadZone onImageLoaded={handleImageLoaded} />}

        {showResults && (
          <>
            <div className="flex gap-3 items-start flex-wrap sm:flex-nowrap">
              {uploadedDataUrl && (
                <img
                  src={uploadedDataUrl}
                  alt="Uploaded car"
                  className="w-24 h-24 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <ColorPreviewBar extractedLab={phase.extractedLab} onReset={handleReset} />
              </div>
            </div>

            <ResultsGrid
              matches={phase.matches}
              isRefining={phase.status === 'refining'}
              aiAnalysis={phase.status === 'ai-results' ? phase.aiAnalysis : undefined}
              aiError={phase.status === 'results' ? phase.aiError : undefined}
              onRefineWithAI={handleAnalyzeWithAI}
            />
          </>
        )}

        <p className="text-xs text-slate-400 border-t border-slate-200 pt-4">
          Color matching is approximate. Results depend on photo lighting and camera calibration.
          SKU numbers should be verified against current manufacturer catalogs.
          Color-shift wraps cannot be reliably identified from a single photo.
        </p>
      </main>
    </div>
  );
}
