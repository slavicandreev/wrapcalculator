# Quote Form + AI Preview Email Design

**Date:** 2025-02-22
**Status:** Approved

## Context

The original "Generate AI Preview" button on Step 4 (Customize) used CSS mix-blend-mode overlay which looked poor, then was rebuilt as a Gemini-powered in-page button. The user decided to remove this interactive preview entirely and instead offer AI preview delivery as part of the quote request flow — a checkbox on the "Get a Quote" form that triggers server-side generation and emails the preview to the customer.

## Goal

Replace the Step 4 AI preview button with a "Send me an AI preview" checkbox on the Step 5 quote form. On submission, generate the AI image server-side (if checked) and email all selections + image to `wrapmatchpro@gmail.com` via Resend.

---

## Design

### User Flow

1. User completes Steps 1–4 → arrives at Step 5 (Estimate)
2. Clicks **"Get a Free Quote →"** button
3. A **modal** opens in-page with:
   - Name (text input, required)
   - Email (email input, required)
   - How soon? (dropdown, required): `ASAP`, `1–3 months`, `3–6 months`, `Just researching`
   - ☐ **Send me an AI preview of my wrap** (checkbox, always visible at Step 5 since color/material/coverage are guaranteed set)
   - Submit button
4. On submit → POST `/api/send-quote`
5. Server generates AI preview (if checked) via Gemini, then sends email via Resend
6. Modal shows confirmation: "We'll be in touch!"

### Email Content (to wrapmatchpro@gmail.com)

- Customer name, email, timeline
- Full wrap configuration: vehicle, state, material, color, coverage, add-ons, estimated price range
- AI preview image inline (if generated)

---

## Architecture

```
Step5Estimate → "Get a Free Quote" button
      ↓
QuoteFormModal (new component)
  fields: name, email, timeline, aiPreview checkbox
      ↓
POST /api/send-quote (new Vercel serverless function)
  ├── if aiPreview: fetch IMAGIN photo → Gemini 2.0 Flash → base64 image
  └── Resend API → email to wrapmatchpro@gmail.com
      ↓
Success response → modal shows confirmation
```

---

## Files

| File | Change |
|------|--------|
| `src/components/steps/Step5Estimate.tsx` | Replace "Get a Free Quote →" anchor/button with one that opens `QuoteFormModal` |
| `src/components/QuoteFormModal.tsx` | **New** — modal with form, loading state, confirmation state |
| `api/send-quote.ts` | **New** — Vercel serverless: optional Gemini generation + Resend email |
| `src/components/visualization/WrapPreviewPanel.tsx` | Strip AI button/generate/regenerate/reset states — keep clean photo + color chip only |
| `src/services/wrapPreviewApi.ts` | **Delete** — no longer needed |
| `.env.local` | Add `RESEND_API_KEY` |
| Vercel env vars | Add `RESEND_API_KEY` to production + preview + development |

---

## QuoteFormModal Props

```typescript
interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Wizard state passed in for the email payload
  wizardState: WizardState;
  priceRange: { min: number; max: number } | null;
  // For AI generation
  imageUrl: string;           // IMAGIN.Studio photo URL
  colorHex: string;
  colorLabel: string;
  material: MaterialType;
  coverage: WrapCoverage;
}
```

## api/send-quote.ts Request Body

```typescript
{
  // Contact info
  name: string;
  email: string;
  timeline: 'asap' | '1-3mo' | '3-6mo' | 'researching';
  sendAiPreview: boolean;

  // Wrap config (for email body)
  vehicle: { year, makeName, modelName, trim };
  stateCode: string;
  projectType: string;
  material: string;
  colorLabel: string;
  colorHex: string;
  coverage: string;
  addons: string[];
  priceMin: number;
  priceMax: number;

  // For AI generation (only used if sendAiPreview: true)
  imageUrl: string;
}
```

---

## Key Dependencies

- **Resend** (`resend` npm package) — email delivery
- **Gemini REST API** — reuse same call as `api/generate-wrap.ts` (`gemini-2.0-flash-exp-image-generation`)
- **GEMINI_API_KEY** — already set on Vercel
- **RESEND_API_KEY** — new env var needed

---

## Verification

1. Fill out all 4 steps in the wizard
2. Reach Step 5, click "Get a Free Quote"
3. Modal opens with all 4 fields
4. Submit without checkbox → email arrives at wrapmatchpro@gmail.com with config summary, no image
5. Submit with checkbox → email arrives with config summary + AI preview image embedded
6. Modal shows "We'll be in touch!" confirmation after submission
7. Confirm WrapPreviewPanel no longer shows AI generation button on Step 4
