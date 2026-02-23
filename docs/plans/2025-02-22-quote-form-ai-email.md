# Quote Form + AI Preview Email Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Step 4 "Generate AI Preview" button with a "Send me an AI preview" checkbox on the Step 5 quote form; on submission, optionally generate the AI image server-side and email the full wrap configuration + image to wrapmatchpro@gmail.com via Resend.

**Architecture:** A new `QuoteFormModal` React component opens from Step 5's CTA button, collects name/email/timeline/checkbox, then posts to a new `/api/send-quote` Vercel serverless function which (if checkbox checked) calls Gemini to generate the AI image and then sends a formatted HTML email via Resend. `WrapPreviewPanel` is simplified to remove all AI generation UI; `wrapPreviewApi.ts` is deleted.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS 3, Vercel serverless functions (`@vercel/node`), Gemini 2.0 Flash Image REST API, Resend npm package, IMAGIN.Studio for car photos.

---

## Task 1: Install Resend and add environment variable

**Files:**
- Modify: `package.json` (add dependency)
- Modify: `.env.local`

**Step 1: Install resend**

```bash
npm install resend
```

Expected: `added 1 package` (resend has minimal deps)

**Step 2: Add RESEND_API_KEY to .env.local**

Append to `.env.local`:
```
RESEND_API_KEY=<paste key from resend.com dashboard>
```

Note: User needs to create a free account at resend.com and get an API key. The free tier allows 3,000 emails/month.

**Step 3: Add RESEND_API_KEY to Vercel environment**

```bash
vercel env add RESEND_API_KEY production
vercel env add RESEND_API_KEY preview
vercel env add RESEND_API_KEY development
```

Paste the key when prompted for each.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install resend for email delivery"
```

---

## Task 2: Create `api/send-quote.ts` serverless function

**Files:**
- Create: `api/send-quote.ts`

This function accepts the full quote payload, optionally generates an AI image via Gemini (reusing the same logic from `api/generate-wrap.ts`), and sends an HTML email via Resend.

**Step 1: Create the file**

Create `api/send-quote.ts` with this content:

```typescript
// api/send-quote.ts
// Vercel serverless function — handles quote form submission
// Optionally generates AI wrap preview via Gemini, then emails via Resend

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

interface QuotePayload {
  // Contact info
  name: string;
  email: string;
  timeline: 'asap' | '1-3mo' | '3-6mo' | 'researching';
  sendAiPreview: boolean;

  // Wrap config
  projectType: string;
  vehicle: {
    year: number | null;
    makeName: string | null;
    modelName: string | null;
    trim: string | null;
  };
  stateCode: string | null;
  material: string | null;
  colorLabel: string | null;
  colorHex: string | null;
  coverage: string | null;
  addons: string[];
  priceMin: number | null;
  priceMax: number | null;

  // For AI generation
  imageUrl: string | null;
}

const TIMELINE_LABELS: Record<string, string> = {
  asap: 'ASAP',
  '1-3mo': '1–3 months',
  '3-6mo': '3–6 months',
  researching: 'Just researching',
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  personal: 'Personal Vehicle',
  business: 'Business Branding',
  fleet: 'Fleet Wrap',
};

const COVERAGE_LABELS: Record<string, string> = {
  full: 'Full Wrap',
  partial_60: 'Partial (60%)',
  partial_45: 'Partial (45%)',
  partial_30: 'Partial (30%)',
  decal: 'Decal Only',
};

async function generateAiImage(
  imageUrl: string,
  colorLabel: string,
  colorHex: string,
  material: string,
  coverage: string,
  apiKey: string
): Promise<{ base64: string; mimeType: string } | null> {
  // Fetch the IMAGIN.Studio car photo
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;

  const imgBuffer = await imgRes.arrayBuffer();
  const base64Image = Buffer.from(imgBuffer).toString('base64');
  const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

  const materialLabel = material.replace('_', ' ');
  const coverageDesc =
    coverage === 'full' ? 'entire car body' :
    coverage === 'partial_60' ? 'most of the car body' :
    coverage === 'partial_45' ? 'partial car body' :
    coverage === 'partial_30' ? 'accent panels only' :
    'accent decals only';

  const prompt = `Change the ${coverageDesc} of this car to a ${colorLabel} ${materialLabel} vinyl wrap color ${colorHex}. Keep the wheels, tires, glass, windows, headlights, taillights, grille, and background completely unchanged. The result should look like a professional automotive vinyl wrap installation. Photorealistic result.`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;

  const geminiRes = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Image } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  });

  if (!geminiRes.ok) {
    console.error('Gemini error:', await geminiRes.text());
    return null;
  }

  const geminiData = await geminiRes.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { data: string; mimeType: string };
        }>;
      };
    }>;
  };

  const parts = geminiData.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(p => p.inlineData?.data);
  if (!imagePart?.inlineData) return null;

  return { base64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType };
}

function buildEmailHtml(payload: QuotePayload, aiImageBase64: string | null, aiMimeType: string): string {
  const vehicle = payload.vehicle;
  const vehicleStr = [vehicle.year, vehicle.makeName, vehicle.modelName, vehicle.trim]
    .filter(Boolean).join(' ');

  const coverageLabel = payload.coverage ? (COVERAGE_LABELS[payload.coverage] ?? payload.coverage) : '—';
  const timelineLabel = TIMELINE_LABELS[payload.timeline] ?? payload.timeline;
  const projectLabel = PROJECT_TYPE_LABELS[payload.projectType] ?? payload.projectType;
  const materialLabel = payload.material ? payload.material.replace('_', ' ') : '—';

  const priceStr = payload.priceMin && payload.priceMax
    ? `$${payload.priceMin.toLocaleString()}–$${payload.priceMax.toLocaleString()}`
    : '—';

  const addonsStr = payload.addons.length > 0 ? payload.addons.join(', ') : 'None';

  const colorSwatch = payload.colorHex
    ? `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${payload.colorHex};border:1px solid #ccc;vertical-align:middle;margin-right:4px;"></span>`
    : '';

  const aiSection = aiImageBase64
    ? `<tr><td colspan="2" style="padding:16px 0 8px 0;"><strong>AI Wrap Preview:</strong><br/><img src="cid:ai-preview" alt="AI Wrap Preview" style="max-width:100%;border-radius:8px;margin-top:8px;" /></td></tr>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;">
  <h2 style="margin-bottom:4px;">New Wrap Quote Request</h2>
  <p style="color:#64748b;margin-top:0;">Submitted via WrapMatchPro calculator</p>

  <h3 style="border-bottom:1px solid #e2e8f0;padding-bottom:8px;">Contact</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:6px 0;color:#64748b;width:40%;">Name</td><td style="padding:6px 0;font-weight:600;">${payload.name}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;font-weight:600;"><a href="mailto:${payload.email}">${payload.email}</a></td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Timeline</td><td style="padding:6px 0;font-weight:600;">${timelineLabel}</td></tr>
  </table>

  <h3 style="border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-top:24px;">Wrap Configuration</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:6px 0;color:#64748b;width:40%;">Project Type</td><td style="padding:6px 0;font-weight:600;">${projectLabel}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Vehicle</td><td style="padding:6px 0;font-weight:600;">${vehicleStr || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">State</td><td style="padding:6px 0;font-weight:600;">${payload.stateCode ?? '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Material</td><td style="padding:6px 0;font-weight:600;text-transform:capitalize;">${materialLabel}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Color</td><td style="padding:6px 0;font-weight:600;">${colorSwatch}${payload.colorLabel ?? '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Coverage</td><td style="padding:6px 0;font-weight:600;">${coverageLabel}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Add-ons</td><td style="padding:6px 0;font-weight:600;">${addonsStr}</td></tr>
    <tr style="background:#f8fafc;"><td style="padding:10px 8px;font-weight:700;">Estimated Price</td><td style="padding:10px 8px;font-weight:700;color:#7c3aed;">${priceStr}</td></tr>
    ${aiSection}
  </table>

  <p style="color:#94a3b8;font-size:12px;margin-top:32px;">Sent from WrapMatchPro cost calculator</p>
</body>
</html>
  `.trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body as QuotePayload;

  // Validate required fields
  if (!payload.name?.trim() || !payload.email?.trim() || !payload.timeline) {
    return res.status(400).json({ error: 'Missing required fields: name, email, timeline' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    // Optionally generate AI preview
    let aiImageBase64: string | null = null;
    let aiMimeType = 'image/png';

    if (
      payload.sendAiPreview &&
      payload.imageUrl &&
      payload.colorLabel &&
      payload.colorHex &&
      payload.material &&
      payload.coverage &&
      geminiKey
    ) {
      const result = await generateAiImage(
        payload.imageUrl,
        payload.colorLabel,
        payload.colorHex,
        payload.material,
        payload.coverage,
        geminiKey
      );
      if (result) {
        aiImageBase64 = result.base64;
        aiMimeType = result.mimeType;
      }
    }

    // Build and send email
    const resend = new Resend(resendKey);
    const html = buildEmailHtml(payload, aiImageBase64, aiMimeType);

    const emailPayload: Parameters<typeof resend.emails.send>[0] = {
      from: 'WrapMatchPro <quotes@wrapmatchpro.com>',
      to: ['wrapmatchpro@gmail.com'],
      reply_to: payload.email,
      subject: `New wrap quote: ${[payload.vehicle.year, payload.vehicle.makeName, payload.vehicle.modelName].filter(Boolean).join(' ') || 'Vehicle'} — ${payload.name}`,
      html,
    };

    // Attach AI image as inline attachment if generated
    if (aiImageBase64) {
      emailPayload.attachments = [
        {
          filename: 'ai-wrap-preview.png',
          content: aiImageBase64,
          content_type: aiMimeType,
        },
      ];
    }

    const { error: sendError } = await resend.emails.send(emailPayload);

    if (sendError) {
      console.error('Resend error:', sendError);
      return res.status(502).json({ error: 'Failed to send email', details: sendError.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('send-quote error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 3: Commit**

```bash
git add api/send-quote.ts
git commit -m "feat: add send-quote serverless function with Gemini + Resend"
```

---

## Task 3: Create `QuoteFormModal` component

**Files:**
- Create: `src/components/QuoteFormModal.tsx`

This modal collects name, email, timeline, and the AI preview checkbox. On submit it POSTs to `/api/send-quote` and shows a success confirmation.

**Step 1: Create the file**

```typescript
// src/components/QuoteFormModal.tsx
import { useState } from 'react';
import type { WizardState, PriceRange } from '../types';
import { buildImagineUrl } from '../services/imaginApi';
import { getColorById } from '../data/colors';
import { MATERIAL_PRICING, COVERAGE_OPTIONS } from '../data/pricing';
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
  const selectedMaterial = customization.material ? MATERIAL_PRICING[customization.material] : null;
  const selectedCoverage = customization.coverage
    ? COVERAGE_OPTIONS.find(c => c.id === customization.coverage)
    : null;
  const selectedAddons = ADDONS
    .filter(a => customization.selectedAddons.includes(a.id))
    .map(a => a.label);

  // Build IMAGIN side-view URL for AI generation
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
    // Backdrop
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
          // Success state
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">We'll be in touch!</h2>
            <p className="text-slate-500 mb-6">
              Your quote request has been sent.
              {sendAiPreview && ' We'll include an AI preview of your wrap in your inbox shortly.'}
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
              {/* Name */}
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

              {/* Email */}
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

              {/* Timeline */}
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

              {/* AI Preview checkbox */}
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
                    We'll generate a realistic AI image of your {selectedColor?.label ?? 'chosen color'} wrap on your {vehicle.makeName ?? 'vehicle'} and include it in your email.
                  </p>
                </div>
              </label>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !timeline}
                className="w-full bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? sendAiPreview
                    ? 'Generating preview & sending…'
                    : 'Sending…'
                  : 'Get My Free Quote →'}
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
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 3: Commit**

```bash
git add src/components/QuoteFormModal.tsx
git commit -m "feat: add QuoteFormModal with name/email/timeline/AI-preview checkbox"
```

---

## Task 4: Wire QuoteFormModal into Step5Estimate

**Files:**
- Modify: `src/components/steps/Step5Estimate.tsx`

Replace the "Get a Free Quote →" button (currently a plain button with no onClick) with state-controlled modal open/close, and pass the wizard state and priceRange as props.

**Step 1: Add import and state to Step5Estimate.tsx**

Add at top of file (after existing imports):
```typescript
import { useState } from 'react';
import { QuoteFormModal } from '../QuoteFormModal';
```

Add inside `Step5Estimate` function body, after the existing variable declarations:
```typescript
const [quoteModalOpen, setQuoteModalOpen] = useState(false);
```

**Step 2: Replace the "Get a Free Quote →" button**

Find this exact code in `Step5Estimate.tsx` (lines 111–114):
```tsx
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <button className="flex-1 bg-brand-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-brand-700 transition-colors shadow-sm text-center">
          Get a Free Quote →
        </button>
```

Replace with:
```tsx
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <button
          onClick={() => setQuoteModalOpen(true)}
          className="flex-1 bg-brand-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-brand-700 transition-colors shadow-sm text-center"
        >
          Get a Free Quote →
        </button>
```

**Step 3: Add the modal just before the closing `</div>` of the component's return**

Find the closing tag of Step5Estimate's return (after the trust indicators `</div>`):
```tsx
    </div>
  );
}
```

Insert the modal before `);`:
```tsx
      <QuoteFormModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        wizardState={state}
        priceRange={priceRange}
      />
    </div>
  );
}
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 5: Commit**

```bash
git add src/components/steps/Step5Estimate.tsx
git commit -m "feat: wire QuoteFormModal into Step5 CTA button"
```

---

## Task 5: Simplify WrapPreviewPanel — remove all AI generation UI

**Files:**
- Modify: `src/components/visualization/WrapPreviewPanel.tsx`

Remove all AI generation state, `handleGenerate`, `handleReset`, cache imports, and the entire "AI Preview button area" section. Keep the clean photo + color chip badge only.

**Step 1: Replace entire WrapPreviewPanel.tsx content**

```typescript
// src/components/visualization/WrapPreviewPanel.tsx
import { useState } from 'react';
import type { MaterialType, WrapCoverage } from '../../types';

interface WrapPreviewPanelProps {
  src: string;
  colorHex: string | null;
  colorLabel: string | null;
  material: MaterialType | null;
  coverage: WrapCoverage | null;
  coverageLabel: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  colorId: string | null;
  /** Tailwind height classes forwarded to the photo container (e.g. "h-48 sm:h-56") */
  photoHeightClass?: string;
  alt?: string;
  onError?: () => void;
  className?: string;
}

export function WrapPreviewPanel({
  src,
  colorHex,
  colorLabel,
  material,
  coverageLabel,
  photoHeightClass = '',
  alt = 'Vehicle',
  onError,
  className = '',
}: WrapPreviewPanelProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleError = () => {
    setErrored(true);
    onError?.();
  };

  if (errored) return null;

  const materialLabel = material
    ? material.charAt(0).toUpperCase() + material.slice(1).replace('_', ' ')
    : null;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Photo area */}
      <div
        className={`relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center ${photoHeightClass}`}
      >
        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-slate-200 rounded-2xl" />
        )}

        {/* Car image */}
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`w-full h-full object-contain transition-opacity duration-300 select-none ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
        />
      </div>

      {/* Color chip badge */}
      {colorHex && (
        <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 border border-slate-200"
            style={{ backgroundColor: colorHex }}
          />
          {colorLabel && <span className="font-medium text-slate-700">{colorLabel}</span>}
          {materialLabel && (
            <>
              <span className="text-slate-300">·</span>
              <span className="capitalize">{materialLabel}</span>
            </>
          )}
          {coverageLabel && (
            <>
              <span className="text-slate-300">·</span>
              <span>{coverageLabel}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 3: Commit**

```bash
git add src/components/visualization/WrapPreviewPanel.tsx
git commit -m "refactor: simplify WrapPreviewPanel — remove AI generation UI"
```

---

## Task 6: Delete wrapPreviewApi.ts and remove its usages

**Files:**
- Delete: `src/services/wrapPreviewApi.ts`
- Check: any remaining imports of `wrapPreviewApi` (should be none after Task 5)

**Step 1: Confirm no remaining imports**

```bash
grep -r "wrapPreviewApi" src/
```

Expected: no output (WrapPreviewPanel no longer imports it after Task 5)

**Step 2: Delete the file**

```bash
rm src/services/wrapPreviewApi.ts
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 4: Commit**

```bash
git add -u src/services/wrapPreviewApi.ts
git commit -m "chore: delete wrapPreviewApi.ts — AI generation moved server-side"
```

---

## Task 7: Build and deploy to Vercel

**Step 1: Final build check with Node 22**

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22.22.0 && npm run build:app
```

Expected: `✓ built in ~2s` with no errors

**Step 2: Deploy to production**

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22.22.0 && vercel --prod
```

Expected: `Production: https://wrapcostcalculator.vercel.app`

---

## Verification Checklist

After deploying:

1. Navigate to `https://wrapcostcalculator.vercel.app`
2. Complete all 4 steps (project type → vehicle → state → customize with material/color/coverage)
3. Arrive at Step 5 — confirm no AI generation button visible on the car photo
4. Click "Get a Free Quote →" — modal opens with Name, Email, Timeline dropdown, and AI preview checkbox
5. **Submit without AI checkbox** → check `wrapmatchpro@gmail.com` for email with config summary, no image
6. **Submit with AI checkbox checked** → check email for AI wrap preview image embedded
7. After submit, modal shows "We'll be in touch!" confirmation
8. Click Done — modal closes, user is back on Step 5

---

## Notes

- `from` address in Resend must be a verified domain. Use `wrapmatchpro.com` (already connected to email server). Add the domain in Resend dashboard → Domains, then verify DNS records.
- If domain verification takes time, Resend allows sending from `onboarding@resend.dev` on free tier for testing.
- AI generation adds ~5–15 seconds to submission time when checkbox is checked. The submit button text changes to "Generating preview & sending…" to set expectations.
- `api/generate-wrap.ts` remains in place (not deleted) — it's still a valid endpoint and causes no harm.
