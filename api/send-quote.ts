// api/send-quote.ts
// Vercel serverless function — handles quote form submission
// Sends wrap config email via Resend, optionally attaches car photo

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

interface QuotePayload {
  name: string;
  email: string;
  timeline: 'asap' | '1-3mo' | '3-6mo' | 'researching';
  sendAiPreview: boolean;
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

function buildEmailHtml(payload: QuotePayload): string {
  const vehicle = payload.vehicle;
  const vehicleStr = [vehicle.year, vehicle.makeName, vehicle.modelName, vehicle.trim]
    .filter(Boolean).join(' ');

  const coverageLabel = payload.coverage ? (COVERAGE_LABELS[payload.coverage] ?? payload.coverage) : '—';
  const timelineLabel = TIMELINE_LABELS[payload.timeline] ?? payload.timeline;
  const projectLabel = PROJECT_TYPE_LABELS[payload.projectType] ?? payload.projectType;
  const materialLabel = payload.material ? payload.material.replace(/_/g, ' ') : '—';
  const priceStr = payload.priceMin && payload.priceMax
    ? `$${payload.priceMin.toLocaleString()}–$${payload.priceMax.toLocaleString()}`
    : '—';
  const addonsStr = payload.addons.length > 0 ? payload.addons.join(', ') : 'None';
  const colorSwatch = payload.colorHex
    ? `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${payload.colorHex};border:1px solid #ccc;vertical-align:middle;margin-right:4px;"></span>`
    : '';
  const aiPreviewNote = payload.sendAiPreview
    ? '<p style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;color:#1e40af;font-size:13px;margin-top:24px;">✨ <strong>AI Preview requested.</strong> Car photo attached — use it to generate the wrap preview.</p>'
    : '';

  return `<!DOCTYPE html>
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
  </table>

  ${aiPreviewNote}

  <p style="color:#94a3b8;font-size:12px;margin-top:32px;">Sent from WrapMatchPro cost calculator</p>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body as QuotePayload;

  if (!payload.name?.trim() || !payload.email?.trim() || !payload.timeline) {
    return res.status(400).json({ error: 'Missing required fields: name, email, timeline' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    // Optionally fetch car photo for attachment
    let photoBuffer: Buffer | null = null;
    let photoMimeType = 'image/jpeg';

    if (payload.sendAiPreview && payload.imageUrl) {
      try {
        const imgRes = await fetch(payload.imageUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          photoBuffer = Buffer.from(arrayBuffer);
          photoMimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        }
      } catch {
        // If photo fetch fails, send email without attachment
        console.warn('Failed to fetch car photo for attachment');
      }
    }

    const resend = new Resend(resendKey);
    const html = buildEmailHtml(payload);

    const vehicle = payload.vehicle;
    const vehicleName = [vehicle.year, vehicle.makeName, vehicle.modelName]
      .filter(Boolean).join(' ') || 'Vehicle';

    const emailOptions: Parameters<typeof resend.emails.send>[0] = {
      from: 'WrapMatchPro <onboarding@resend.dev>',
      to: ['wrapmatchpro@gmail.com'],
      replyTo: payload.email,
      subject: `New wrap quote: ${vehicleName} — ${payload.name}`,
      html,
    };

    if (photoBuffer) {
      emailOptions.attachments = [
        {
          filename: 'car-photo.jpg',
          content: photoBuffer.toString('base64'),
          contentType: photoMimeType,
        },
      ];
    }

    const { error: sendError } = await resend.emails.send(emailOptions);

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
