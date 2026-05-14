<?php
defined('ABSPATH') || exit;

class WMP_REST_API {

    const NAMESPACE = 'wrapmatchpro/v1';

    public static function register_routes() {
        register_rest_route(self::NAMESPACE, '/detect-color', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'detect_color'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/generate-wrap', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'generate_wrap'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/submit-quote', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'submit_quote'],
            'permission_callback' => '__return_true',
        ]);

    }

    // ─── Rate Limiting ───────────────────────────────────────────────────────

    private static function check_rate_limit($action, $max_per_hour = 10) {
        $ip  = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $key = 'wmp_rate_' . md5($action . $ip);
        $count = (int) get_transient($key);
        if ($count >= $max_per_hour) {
            return false;
        }
        set_transient($key, $count + 1, HOUR_IN_SECONDS);
        return true;
    }

    // ─── Detect Color (GPT-4o Vision) ────────────────────────────────────────

    public static function detect_color(WP_REST_Request $request) {
        if (!self::check_rate_limit('detect_color', 20)) {
            return new WP_REST_Response(['error' => 'Rate limit exceeded. Try again later.'], 429);
        }

        $api_key = WMP_Settings::get('openai_api_key');
        if (empty($api_key)) {
            return new WP_REST_Response(['error' => 'AI analysis not configured'], 503);
        }

        $image_base64 = $request->get_param('imageBase64');
        $mime_type     = $request->get_param('mimeType');

        if (empty($image_base64) || empty($mime_type)) {
            return new WP_REST_Response(['error' => 'Missing required fields'], 400);
        }

        $allowed_types = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($mime_type, $allowed_types, true)) {
            return new WP_REST_Response(['error' => 'Unsupported image format'], 400);
        }

        if (strlen($image_base64) * 0.75 > 5 * 1024 * 1024) {
            return new WP_REST_Response(['error' => 'Image too large (max 5 MB)'], 400);
        }

        if (!self::validate_image_bytes($image_base64, $mime_type)) {
            return new WP_REST_Response(['error' => 'Invalid image data'], 400);
        }

        $prompt = self::get_color_detection_prompt();

        $body = [
            'model'           => 'gpt-4o',
            'max_tokens'      => 900,
            'response_format' => ['type' => 'json_object'],
            'messages'        => [
                [
                    'role'    => 'user',
                    'content' => [
                        [
                            'type'      => 'image_url',
                            'image_url' => [
                                'url'    => "data:{$mime_type};base64,{$image_base64}",
                                'detail' => 'low',
                            ],
                        ],
                        [
                            'type' => 'text',
                            'text' => $prompt,
                        ],
                    ],
                ],
            ],
        ];

        $response = wp_remote_post('https://api.openai.com/v1/chat/completions', [
            'timeout' => 30,
            'headers' => [
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json',
            ],
            'body' => wp_json_encode($body),
        ]);

        if (is_wp_error($response)) {
            return new WP_REST_Response(['error' => 'AI analysis failed'], 502);
        }

        if (wp_remote_retrieve_response_code($response) !== 200) {
            return new WP_REST_Response(['error' => 'AI analysis failed'], 502);
        }

        $data    = json_decode(wp_remote_retrieve_body($response), true);
        $content = $data['choices'][0]['message']['content'] ?? null;

        if (empty($content)) {
            return new WP_REST_Response(['error' => 'Empty AI response'], 502);
        }

        $parsed = json_decode($content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_REST_Response(['error' => 'Invalid AI response format'], 502);
        }

        return new WP_REST_Response($parsed, 200);
    }

    // ─── Generate Wrap (Gemini) ──────────────────────────────────────────────

    public static function generate_wrap(WP_REST_Request $request) {
        if (!self::check_rate_limit('generate_wrap', 10)) {
            return new WP_REST_Response(['error' => 'Rate limit exceeded. Try again later.'], 429);
        }

        $api_key = WMP_Settings::get('gemini_api_key');
        if (empty($api_key)) {
            return new WP_REST_Response(['error' => 'API key not configured'], 500);
        }

        $image_url   = $request->get_param('imageUrl');
        $color_label = $request->get_param('colorLabel');
        $color_hex   = $request->get_param('colorHex');
        $material    = $request->get_param('material');
        $coverage    = $request->get_param('coverage');

        if (empty($image_url) || empty($color_label) || empty($color_hex)) {
            return new WP_REST_Response(['error' => 'Missing required fields'], 400);
        }

        // Fetch the car photo server-side
        $img_response = wp_remote_get($image_url, ['timeout' => 15]);
        if (is_wp_error($img_response) || wp_remote_retrieve_response_code($img_response) !== 200) {
            return new WP_REST_Response(['error' => 'Failed to fetch source image'], 400);
        }

        $img_body     = wp_remote_retrieve_body($img_response);
        $base64_image = base64_encode($img_body);
        $img_mime     = wp_remote_retrieve_header($img_response, 'content-type') ?: 'image/jpeg';

        $material_label = $material ? str_replace('_', ' ', $material) : 'vinyl';
        $coverage_map = [
            'full'       => 'entire car body',
            'partial_60' => 'most of the car body',
            'partial_45' => 'partial car body',
            'partial_30' => 'accent panels only',
        ];
        $coverage_desc = $coverage_map[$coverage] ?? 'accent decals only';

        $prompt = "Change the {$coverage_desc} of this car to a {$color_label} {$material_label} vinyl wrap color {$color_hex}. Keep the wheels, tires, glass, windows, headlights, taillights, grille, and background completely unchanged. The result should look like a professional automotive vinyl wrap installation. Photorealistic result.";

        $gemini_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=' . $api_key;

        $gemini_body = [
            'contents' => [
                [
                    'parts' => [
                        [
                            'inline_data' => [
                                'mime_type' => $img_mime,
                                'data'      => $base64_image,
                            ],
                        ],
                        ['text' => $prompt],
                    ],
                ],
            ],
            'generationConfig' => [
                'responseModalities' => ['IMAGE', 'TEXT'],
            ],
        ];

        $response = wp_remote_post($gemini_url, [
            'timeout' => 60,
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => wp_json_encode($gemini_body),
        ]);

        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            return new WP_REST_Response(['error' => 'AI generation failed'], 502);
        }

        $data  = json_decode(wp_remote_retrieve_body($response), true);
        $parts = $data['candidates'][0]['content']['parts'] ?? [];

        $image_part = null;
        foreach ($parts as $part) {
            if (!empty($part['inlineData']['data'])) {
                $image_part = $part['inlineData'];
                break;
            }
        }

        if (empty($image_part)) {
            return new WP_REST_Response(['error' => 'No image in AI response'], 502);
        }

        return new WP_REST_Response([
            'imageBase64' => $image_part['data'],
            'mimeType'    => $image_part['mimeType'],
        ], 200);
    }

    // ─── Submit Quote ────────────────────────────────────────────────────────

    public static function submit_quote(WP_REST_Request $request) {
        if (!self::check_rate_limit('submit_quote', 5)) {
            return new WP_REST_Response(['error' => 'Rate limit exceeded. Try again later.'], 429);
        }

        $name     = sanitize_text_field($request->get_param('name'));
        $email    = sanitize_email($request->get_param('email'));
        $timeline = sanitize_text_field($request->get_param('timeline'));

        if (empty($name) || empty($email) || empty($timeline)) {
            return new WP_REST_Response(['error' => 'Missing required fields: name, email, timeline'], 400);
        }

        $vehicle = $request->get_param('vehicle') ?? [];

        // Validate customer photo if present
        $car_photo_base64 = $request->get_param('carPhotoBase64');
        $car_photo_mime   = $request->get_param('carPhotoMimeType') ?? 'image/jpeg';

        if (!empty($car_photo_base64)) {
            if (strlen($car_photo_base64) * 0.75 > 5 * 1024 * 1024) {
                return new WP_REST_Response(['error' => 'Customer photo exceeds 5 MB limit'], 400);
            }
            if (!self::validate_image_bytes($car_photo_base64, $car_photo_mime)) {
                return new WP_REST_Response(['error' => 'Customer photo must be a JPEG or PNG image'], 400);
            }
        }

        $notes = $request->get_param('notes');
        if ($notes && strlen($notes) > 2000) {
            $notes = substr($notes, 0, 2000);
        }

        // Create the quote CPT entry
        $quote_data = [
            'customer_name'  => $name,
            'customer_email' => $email,
            'timeline'       => $timeline,
            'vehicle_year'   => sanitize_text_field($vehicle['year'] ?? ''),
            'vehicle_make'   => sanitize_text_field($vehicle['makeName'] ?? ''),
            'vehicle_model'  => sanitize_text_field($vehicle['modelName'] ?? ''),
            'vehicle_trim'   => sanitize_text_field($vehicle['trim'] ?? ''),
            'material'       => sanitize_text_field($request->get_param('material') ?? ''),
            'color_label'    => sanitize_text_field($request->get_param('colorLabel') ?? ''),
            'color_hex'      => sanitize_text_field($request->get_param('colorHex') ?? ''),
            'coverage'       => sanitize_text_field($request->get_param('coverage') ?? ''),
            'project_type'   => sanitize_text_field($request->get_param('projectType') ?? ''),
            'fleet_size'     => intval($request->get_param('fleetSize') ?? 0),
            'price_min'      => floatval($request->get_param('priceMin') ?? 0),
            'price_max'      => floatval($request->get_param('priceMax') ?? 0),
            'state_code'     => sanitize_text_field($request->get_param('stateCode') ?? ''),
            'notes'          => sanitize_textarea_field($notes ?? ''),
            'addons'         => $request->get_param('addons') ?? [],
        ];

        $post_id = WMP_Quote_CPT::create_quote($quote_data);

        if (is_wp_error($post_id)) {
            return new WP_REST_Response(['error' => 'Failed to save quote'], 500);
        }

        // Save customer photo to Media Library
        $attachments = [];
        if (!empty($car_photo_base64)) {
            $attach_id = WMP_Media::save_base64_image(
                $car_photo_base64,
                $car_photo_mime,
                'customer-car-photo-' . $post_id,
                $post_id
            );
            if (!is_wp_error($attach_id)) {
                $file_path = get_attached_file($attach_id);
                if ($file_path) {
                    $attachments[] = $file_path;
                }
            }
        }

        // Optionally fetch & save IMAGIN photo
        $send_ai_preview = $request->get_param('sendAiPreview');
        $image_url       = $request->get_param('imageUrl');

        if ($send_ai_preview && !empty($image_url)) {
            $img_response = wp_remote_get($image_url, ['timeout' => 15]);
            if (!is_wp_error($img_response) && wp_remote_retrieve_response_code($img_response) === 200) {
                $img_body = wp_remote_retrieve_body($img_response);
                $img_b64  = base64_encode($img_body);
                $img_mime = wp_remote_retrieve_header($img_response, 'content-type') ?: 'image/jpeg';

                $attach_id = WMP_Media::save_base64_image(
                    $img_b64,
                    $img_mime,
                    'imagin-car-photo-' . $post_id,
                    $post_id
                );
                if (!is_wp_error($attach_id)) {
                    $file_path = get_attached_file($attach_id);
                    if ($file_path) {
                        $attachments[] = $file_path;
                    }
                }
            }
        }

        // Send email via wp_mail()
        $recipient = WMP_Settings::get('recipient_email');
        if (empty($recipient)) {
            $recipient = get_option('admin_email');
        }

        $vehicle_name = implode(' ', array_filter([
            $quote_data['vehicle_year'],
            $quote_data['vehicle_make'],
            $quote_data['vehicle_model'],
        ])) ?: 'Vehicle';

        $subject = "New wrap quote: {$vehicle_name} — {$name}";

        $html = self::build_email_html($quote_data, $send_ai_preview);

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            "Reply-To: {$name} <{$email}>",
        ];

        $sent = wp_mail($recipient, $subject, $html, $headers, $attachments);

        if (!$sent) {
            return new WP_REST_Response(['success' => true, 'warning' => 'Quote saved but email delivery may have failed'], 200);
        }

        return new WP_REST_Response(['success' => true], 200);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static function validate_image_bytes($base64, $mime_type) {
        $decoded = base64_decode(substr($base64, 0, 16), true);
        if ($decoded === false || strlen($decoded) < 4) return false;

        $bytes = array_values(unpack('C*', $decoded));

        if ($mime_type === 'image/jpeg') return $bytes[0] === 0xFF && $bytes[1] === 0xD8;
        if ($mime_type === 'image/png')  return $bytes[0] === 0x89 && $bytes[1] === 0x50;
        if ($mime_type === 'image/webp') return isset($bytes[8]) && $bytes[8] === 0x57 && $bytes[9] === 0x45;

        return false;
    }

    private static function get_color_detection_prompt() {
        return 'Act as an expert automotive vinyl wrap specialist. Analyze the car wrap color in the provided image using professional colorimetry standards.
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
}';
    }

    private static function build_email_html($data, $send_ai_preview) {
        $template = WMP_PLUGIN_DIR . 'templates/quote-email.php';
        if (!file_exists($template)) {
            return '<p>New quote from ' . esc_html($data['customer_name']) . '</p>';
        }

        ob_start();
        include $template;
        return ob_get_clean();
    }
}
