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

const PROMPT = `Act as an expert automotive vinyl wrap specialist. Analyze the car in the provided image to identify its wrap color with high precision.
### Analysis Requirements:
1. Environmental Compensation: Account for lighting conditions (e.g., direct sun, shade, artificial light) and color cast from surroundings. Focus on "clean" panels like the hood or doors, avoiding areas with heavy sky reflections or deep shadows.
2. Color Decomposition: Extract the Hue, Saturation, and Brightness (HSB). Specifically identify the "Undertone" (e.g., Is the grey a blue-grey or a brown-grey?).
3. Texture & Finish: Distinguish between Gloss, Satin, Matte, Metallic, or Pearlescent. Look for the 'flop'—how the color changes at different angles.
4. Database Cross-Reference: Compare the extracted data against the 2024-2026 catalogs for:
   - Avery Dennison Supreme Wrapping Film (SW900)
   - 3M High Gloss / 2080 Series
### Constraints:
- If the image contains multiple lighting conditions, prioritize the color visible in neutral, indirect daylight.
- If a match is between two similar colors (e.g., 3M Satin Black vs. Dead Matte Black), explain the choice in the description.
### Output Format (JSON):
{
  "dominant_color_description": "Detailed description including the 'flop' or metallic flake presence",
  "finish_type": "Gloss/Satin/Matte/Metallic/Shift",
  "lighting_context": "Assessment of the light source in the photo",
  "color_properties": {
    "hue_angle": "0-360",
    "undertone": "",
    "saturation": "0-100",
    "brightness": "0-100"
  },
  "avery_matches": [
    { "color_name": "", "series_code": "", "hex_estimate": "", "match_reasoning": "", "confidence": 0-100 }
  ],
  "3m_matches": [
    { "color_name": "", "series_code": "", "hex_estimate": "", "match_reasoning": "", "confidence": 0-100 }
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
        max_tokens: 600,
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
