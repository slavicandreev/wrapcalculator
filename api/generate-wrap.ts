// api/generate-wrap.ts
// Vercel serverless function — proxies Gemini 2.5 Flash Image API
// Keeps GEMINI_API_KEY server-side only

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageUrl, colorLabel, colorHex, material, coverage } = req.body as {
    imageUrl: string;
    colorLabel: string;
    colorHex: string;
    material: string;
    coverage: string;
  };

  if (!imageUrl || !colorLabel || !colorHex) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Fetch the IMAGIN.Studio car photo server-side
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return res.status(400).json({ error: 'Failed to fetch source image' });
    }
    const imgBuffer = await imgRes.arrayBuffer();
    const base64Image = Buffer.from(imgBuffer).toString('base64');
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

    // Build a clear prompt for vinyl wrap color change
    const materialLabel = material ? material.replace('_', ' ') : 'vinyl';
    const coverageDesc = coverage === 'full' ? 'entire car body' :
                         coverage === 'partial_60' ? 'most of the car body' :
                         coverage === 'partial_45' ? 'partial car body' :
                         coverage === 'partial_30' ? 'accent panels only' :
                         'accent decals only';

    const prompt = `Change the ${coverageDesc} of this car to a ${colorLabel} ${materialLabel} vinyl wrap color ${colorHex}. Keep the wheels, tires, glass, windows, headlights, taillights, grille, and background completely unchanged. The result should look like a professional automotive vinyl wrap installation. Photorealistic result.`;

    // Call Gemini 2.5 Flash Image Generation via REST API
    // Model: gemini-2.0-flash-preview-image-generation (current preview name)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;

    const geminiBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    };

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', errText);
      return res.status(502).json({ error: 'AI generation failed', details: errText });
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { data: string; mimeType: string };
            text?: string;
          }>;
        };
      }>;
    };

    // Extract the generated image
    const parts = geminiData.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find(p => p.inlineData?.data);

    if (!imagePart?.inlineData) {
      return res.status(502).json({ error: 'No image in AI response' });
    }

    return res.status(200).json({
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    });
  } catch (err) {
    console.error('generate-wrap error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
