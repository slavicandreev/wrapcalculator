export interface AIColorMatch {
  color_name: string;
  series_code: string;
  confidence: number;
  closest_hex_match?: string;
}

export interface AIAnalysisResult {
  dominant_color_description: string;
  finish: string;
  color_properties: {
    hue: string;
    undertone: string;
    saturation: string;
    brightness: string;
  };
  avery_matches: AIColorMatch[];
  '3m_matches': AIColorMatch[];
}
