// api/detect-wrap-color.ts
// Vercel serverless function — GPT-4o Vision wrap color identification
// Keeps OPENAI_API_KEY server-side only

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RequestPayload {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function validateImageBytes(base64: string, mimeType: string): boolean {
  const bytes = Buffer.from(base64.substring(0, 16), 'base64');
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (mimeType === 'image/png')  return bytes[0] === 0x89 && bytes[1] === 0x50;
  if (mimeType === 'image/webp') return bytes[8] === 0x57 && bytes[9] === 0x45;
  return false;
}

const PROMPT = `Act as an expert automotive vinyl wrap specialist. Analyze the car wrap color in the provided image using professional colorimetry standards.
### Step-by-Step Analysis:
1. Environment Check: Identify the lighting (Direct Sun, Overcast, Artificial) and compensate for color cast or reflections. Focus on "clean" panels like the hood or side doors.
2. Color Decomposition: Estimate the HSB (Hue, Saturation, Brightness) and identify the specific undertone (e.g., Cool/Blue-based vs. Warm/Yellow-based).
3. Texture & Finish: Distinguish between Gloss, Satin, Matte, Metallic, or Pearlescent. Look for the "flop" (how light interacts with the pigment at angles).
4. Database Cross-Reference: Compare against the 2024-2026 catalogs for Avery Dennison SW900 and 3M 2080/High Gloss series.
### Requirements:
- You MUST return exactly 3 matches for Avery Dennison and 3 matches for 3M.
- Rank them by "Confidence" (0-100).
- Provide a brief "Match Reasoning" for each to explain why it fits the visual data.
### JSON Output Format (Strict):
{
  "dominant_color_description": "Detailed visual description of the color and finish",
  "lighting_context": "Assessment of the light source and environment",
  "color_properties": {
    "hue": "",
    "undertone": "",
    "saturation": "",
    "brightness": ""
  },
  "avery_matches": [
    { "rank": 1, "color_name": "", "series_code": "", "hex_estimate": "", "match_reasoning": "", "confidence": 0 },
    { "rank": 2, "color_name": "", "series_code": "", "hex_estimate": "", "match_reasoning": "", "confidence": 0 },
    { "rank": 3, "color_name": "", "series_code": "", "hex_estimate": "", "match_reasoning": "", "confidence": 0 }
  ],
  "3m_matches": [
    { "rank": 1, "color_name": "", "series_code": "", "hex_estimate": "", "match_reasoning": "", "confidence": 0 },
    { "rank": 2, "color_name": "", "series_code": "", "hex_estimate": "", "match_reasoning": "", "confidence": 0 },
    { "rank": 3, "color_name": "", "series_code": "", "hex_estimate": "", "match_reasoning": "", "confidence": 0 }
  ]
}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI analysis not configured' });
  }

  const { imageBase64, mimeType } = req.body as RequestPayload;

  if (!imageBase64 || !mimeType) {
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

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: 'low',
                },
              },
              {
                type: 'text',
                text: PROMPT,
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

    const parsed = JSON.parse(content);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('detect-wrap-color error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
