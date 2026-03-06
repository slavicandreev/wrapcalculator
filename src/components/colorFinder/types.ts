export interface AIColorMatch {
  rank?: number;
  color_name: string;
  series_code: string;
  confidence: number;
  hex_estimate?: string;
  match_reasoning?: string;
}

export interface AIAnalysisResult {
  dominant_color_description: string;
  lighting_context?: string;
  color_properties: {
    hue?: string;
    undertone: string;
    saturation: string;
    brightness: string;
  };
  avery_matches: AIColorMatch[];
  '3m_matches': AIColorMatch[];
}
