// api/detect-wrap-color.ts
// Vercel serverless function — GPT-4o Vision color matching refinement
// Keeps OPENAI_API_KEY server-side only

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Candidate {
  sku: string;
  name: string;
  brand: string;
  hex: string;
  deltaE: number;
}

interface RequestPayload {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  topCandidates: Candidate[];
}

interface OpenAIResponse {
  rankedSkus: string[];
  colorDescription: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Magic bytes for supported image formats
function validateImageBytes(base64: string, mimeType: string): boolean {
  const bytes = Buffer.from(base64.substring(0, 16), 'base64');
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (mimeType === 'image/png')  return bytes[0] === 0x89 && bytes[1] === 0x50;
  if (mimeType === 'image/webp') return bytes[8] === 0x57 && bytes[9] === 0x45; // "WE" in WEBP header
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI refinement not configured' });
  }

  const { imageBase64, mimeType, topCandidates } = req.body as RequestPayload;

  if (!imageBase64 || !mimeType || !topCandidates?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return res.status(400).json({ error: 'Unsupported image format' });
  }

  const approxBytes = imageBase64.length * 0.75;
  if (approxBytes > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image too large (max 5 MB)' });
  }

  if (!validateImageBytes(imageBase64, mimeType)) {
    return res.status(400).json({ error: 'Invalid image data' });
  }

  const candidateList = topCandidates
    .map((c, i) => `${i + 1}. [${c.brand} ${c.sku}] ${c.name} (hex: ${c.hex})`)
    .join('\n');

  const prompt = `You are a professional automotive vinyl wrap color consultant.

Look at the car in this image and analyze its body color carefully.

Then, from the following vinyl wrap products, rank the top 3 that most closely match the actual car body color. Focus on hue and tone — ignore finish type (gloss/matte) since that cannot be determined from a photo.

Candidates:
${candidateList}

Respond ONLY with a JSON object in this exact format:
{
  "colorDescription": "Brief description of the car's color (e.g. 'deep navy blue with slight metallic shimmer')",
  "rankedSkus": ["SKU1", "SKU2", "SKU3"]
}

Use only the exact SKU codes from the candidate list above.`;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 200,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: 'low', // ~85 tokens — sufficient for color identification
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error:', errText);
      return res.status(502).json({ error: 'AI analysis failed' });
    }

    const openaiData = await openaiRes.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = openaiData.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({ error: 'Empty AI response' });
    }

    const parsed = JSON.parse(content) as OpenAIResponse;

    // Validate that returned SKUs exist in the candidate list
    const validSkus = topCandidates.map(c => c.sku);
    const safeRanked = (parsed.rankedSkus ?? []).filter(s => validSkus.includes(s));

    return res.status(200).json({
      rankedSkus: safeRanked,
      aiColorDescription: parsed.colorDescription ?? '',
    });
  } catch (err) {
    console.error('detect-wrap-color error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
