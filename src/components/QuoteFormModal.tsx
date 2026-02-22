// src/components/QuoteFormModal.tsx
import { useState } from 'react';
import type { WizardState, PriceRange } from '../types';
import { buildImagineUrl } from '../services/imaginApi';
import { getColorById } from '../data/colors';
import { ADDONS } from '../data/addons';

interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  wizardState: WizardState;
  priceRange: PriceRange | null;
}

type Timeline = 'asap' | '1-3mo' | '3-6mo' | 'researching';

const TIMELINE_OPTIONS: { value: Timeline; label: string }[] = [
  { value: 'asap', label: 'ASAP' },
  { value: '1-3mo', label: '1–3 months' },
  { value: '3-6mo', label: '3–6 months' },
  { value: 'researching', label: 'Just researching' },
];

export function QuoteFormModal({ isOpen, onClose, wizardState, priceRange }: QuoteFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [timeline, setTimeline] = useState<Timeline | ''>('');
  const [sendAiPreview, setSendAiPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const { vehicle, customization, stateCode, projectType } = wizardState;
  const selectedColor = customization.color ? getColorById(customization.color) : null;
  const selectedAddons = ADDONS
    .filter(a => customization.selectedAddons.includes(a.id))
    .map(a => a.label);

  const imageUrl = vehicle.makeName && vehicle.modelName && vehicle.year
    ? buildImagineUrl({ make: vehicle.makeName, model: vehicle.modelName, year: vehicle.year, angle: 'side', width: 800 })
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!timeline) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          timeline,
          sendAiPreview,
          projectType,
          vehicle: {
            year: vehicle.year,
            makeName: vehicle.makeName,
            modelName: vehicle.modelName,
            trim: vehicle.trim,
          },
          stateCode,
          material: customization.material,
          colorLabel: selectedColor?.label ?? null,
          colorHex: selectedColor?.hex ?? null,
          coverage: customization.coverage,
          addons: selectedAddons,
          priceMin: priceRange?.min ?? null,
          priceMax: priceRange?.max ?? null,
          imageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Submission failed');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">We'll be in touch!</h2>
            <p className="text-slate-500 mb-6">
              Your quote request has been sent.
              {sendAiPreview && " We'll include your vehicle photo so we can prepare an AI preview."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="bg-brand-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-brand-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">Get a Free Quote</h2>
            <p className="text-sm text-slate-500 mb-5">
              We'll connect you with local certified installers.
            </p>

            <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="quote-name">
                  Your Name
                </label>
                <input
                  id="quote-name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="quote-email">
                  Email Address
                </label>
                <input
                  id="quote-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="quote-timeline">
                  How soon are you looking to do this?
                </label>
                <select
                  id="quote-timeline"
                  required
                  value={timeline}
                  onChange={e => setTimeline(e.target.value as Timeline)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                >
                  <option value="" disabled>Select timeline…</option>
                  {TIMELINE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendAiPreview}
                  onChange={e => setSendAiPreview(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-brand-600 flex-shrink-0"
                />
                <div>
                  <span className="text-sm font-medium text-slate-800">Send me an AI preview ✨</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    We'll include your vehicle photo so our team can visualize your{selectedColor ? ` ${selectedColor.label}` : ''} wrap.
                  </p>
                </div>
              </label>

              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !timeline}
                className="w-full bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending…' : 'Get My Free Quote →'}
              </button>

              <p className="text-xs text-slate-400 text-center">
                No spam. We'll only use this to connect you with installers.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
