# WrapMatchPro WordPress Plugin — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the WrapMatchPro React SPA + Vercel serverless app into a self-contained WordPress plugin with shortcode rendering, WP REST API endpoints, quote storage as a custom post type, and Media Library integration.

**Architecture:** The plugin enqueues the existing React app (rebuilt as IIFE) into a `[wrap_calculator]` shortcode div. Three WP REST endpoints replace Vercel serverless functions, proxying AI API calls with keys stored in `wp_options`. Quotes are saved as a `wmp_quote` custom post type with attached media. Email uses `wp_mail()`.

**Tech Stack:** PHP 7.4+, WordPress 6.0+, React 18 (existing), Vite IIFE build, WP REST API, `wp_mail()`

---

### Task 1: Plugin Bootstrap & Shortcode

**Files:**
- Create: `wordpress-plugin/wrapmatchpro/wrapmatchpro.php`

**Step 1: Create the main plugin file**

```php
<?php
/**
 * Plugin Name: WrapMatchPro
 * Description: Vehicle vinyl wrap cost calculator with AI color matching.
 * Version: 1.0.0
 * Author: WrapMatchPro
 * Text Domain: wrapmatchpro
 * Requires PHP: 7.4
 * Requires at least: 6.0
 */

defined('ABSPATH') || exit;

define('WMP_VERSION', '1.0.0');
define('WMP_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WMP_PLUGIN_URL', plugin_dir_url(__FILE__));

// Load plugin classes
require_once WMP_PLUGIN_DIR . 'includes/class-wmp-settings.php';
require_once WMP_PLUGIN_DIR . 'includes/class-wmp-quote-cpt.php';
require_once WMP_PLUGIN_DIR . 'includes/class-wmp-media.php';
require_once WMP_PLUGIN_DIR . 'includes/class-wmp-rest-api.php';

// Initialize
add_action('init', ['WMP_Quote_CPT', 'register']);
add_action('admin_menu', ['WMP_Settings', 'add_menu']);
add_action('admin_init', ['WMP_Settings', 'register_settings']);
add_action('rest_api_init', ['WMP_REST_API', 'register_routes']);

// Shortcode
add_shortcode('wrap_calculator', 'wmp_render_shortcode');

function wmp_render_shortcode() {
    // Enqueue the React bundle only when shortcode is used
    wp_enqueue_script(
        'wrapmatchpro-app',
        WMP_PLUGIN_URL . 'assets/js/wrapmatchpro.js',
        [],
        WMP_VERSION,
        true
    );

    wp_enqueue_style(
        'wrapmatchpro-styles',
        WMP_PLUGIN_URL . 'assets/css/wrapmatchpro.css',
        [],
        WMP_VERSION
    );

    // Pass config to JS (no secrets!)
    wp_localize_script('wrapmatchpro-app', 'wrapmatchproConfig', [
        'apiBase' => esc_url_raw(rest_url('wrapmatchpro/v1')),
        'nonce'   => wp_create_nonce('wp_rest'),
    ]);

    return '<div id="wrapmatchpro-root"></div>';
}
```

**Step 2: Create directory structure**

Run:
```bash
mkdir -p wordpress-plugin/wrapmatchpro/includes
mkdir -p wordpress-plugin/wrapmatchpro/assets/js
mkdir -p wordpress-plugin/wrapmatchpro/assets/css
mkdir -p wordpress-plugin/wrapmatchpro/templates
```

**Step 3: Commit**

```bash
git add wordpress-plugin/
git commit -m "feat(wp): add plugin bootstrap with shortcode registration"
```

---

### Task 2: Settings Page

**Files:**
- Create: `wordpress-plugin/wrapmatchpro/includes/class-wmp-settings.php`

**Step 1: Create the settings class**

```php
<?php
defined('ABSPATH') || exit;

class WMP_Settings {

    const OPTION_KEY = 'wrapmatchpro_settings';

    public static function defaults() {
        return [
            'gemini_api_key'  => '',
            'openai_api_key'  => '',
            'recipient_email' => get_option('admin_email'),
            'imagin_api_key'  => '',
        ];
    }

    public static function get($key = null) {
        $settings = wp_parse_args(
            get_option(self::OPTION_KEY, []),
            self::defaults()
        );
        return $key ? ($settings[$key] ?? null) : $settings;
    }

    public static function add_menu() {
        add_options_page(
            'WrapMatchPro',
            'WrapMatchPro',
            'manage_options',
            'wrapmatchpro',
            [self::class, 'render_page']
        );
    }

    public static function register_settings() {
        register_setting('wrapmatchpro_group', self::OPTION_KEY, [
            'sanitize_callback' => [self::class, 'sanitize'],
        ]);

        add_settings_section('wmp_main', 'API Keys & Configuration', null, 'wrapmatchpro');

        $fields = [
            'gemini_api_key'  => ['label' => 'Gemini API Key',  'type' => 'password'],
            'openai_api_key'  => ['label' => 'OpenAI API Key',  'type' => 'password'],
            'recipient_email' => ['label' => 'Quote Recipient Email', 'type' => 'email'],
            'imagin_api_key'  => ['label' => 'IMAGIN.Studio API Key (optional)', 'type' => 'text'],
        ];

        foreach ($fields as $key => $field) {
            add_settings_field(
                'wmp_' . $key,
                $field['label'],
                [self::class, 'render_field'],
                'wrapmatchpro',
                'wmp_main',
                ['key' => $key, 'type' => $field['type']]
            );
        }
    }

    public static function sanitize($input) {
        $clean = [];
        $clean['gemini_api_key']  = sanitize_text_field($input['gemini_api_key'] ?? '');
        $clean['openai_api_key']  = sanitize_text_field($input['openai_api_key'] ?? '');
        $clean['recipient_email'] = sanitize_email($input['recipient_email'] ?? '');
        $clean['imagin_api_key']  = sanitize_text_field($input['imagin_api_key'] ?? '');
        if (empty($clean['recipient_email'])) {
            $clean['recipient_email'] = get_option('admin_email');
        }
        return $clean;
    }

    public static function render_field($args) {
        $settings = self::get();
        $value = esc_attr($settings[$args['key']] ?? '');
        $type  = $args['type'];
        echo "<input type='{$type}' name='" . self::OPTION_KEY . "[{$args['key']}]' value='{$value}' class='regular-text' />";
    }

    public static function render_page() {
        if (!current_user_can('manage_options')) return;
        ?>
        <div class="wrap">
            <h1>WrapMatchPro Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('wrapmatchpro_group');
                do_settings_sections('wrapmatchpro');
                submit_button();
                ?>
            </form>
            <hr>
            <h2>Shortcode Usage</h2>
            <p>Add <code>[wrap_calculator]</code> to any page or post to display the calculator.</p>
        </div>
        <?php
    }
}
```

**Step 2: Commit**

```bash
git add wordpress-plugin/wrapmatchpro/includes/class-wmp-settings.php
git commit -m "feat(wp): add admin settings page for API keys"
```

---

### Task 3: Custom Post Type for Quotes

**Files:**
- Create: `wordpress-plugin/wrapmatchpro/includes/class-wmp-quote-cpt.php`

**Step 1: Create the CPT class**

```php
<?php
defined('ABSPATH') || exit;

class WMP_Quote_CPT {

    const POST_TYPE = 'wmp_quote';

    public static function register() {
        register_post_type(self::POST_TYPE, [
            'labels' => [
                'name'               => 'Wrap Quotes',
                'singular_name'      => 'Wrap Quote',
                'menu_name'          => 'Wrap Quotes',
                'all_items'          => 'All Quotes',
                'search_items'       => 'Search Quotes',
                'not_found'          => 'No quotes found',
                'not_found_in_trash' => 'No quotes in trash',
            ],
            'public'             => false,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'menu_icon'          => 'dashicons-car',
            'capability_type'    => 'post',
            'supports'           => ['title', 'custom-fields'],
            'has_archive'        => false,
            'rewrite'            => false,
        ]);

        add_filter('manage_' . self::POST_TYPE . '_posts_columns', [self::class, 'columns']);
        add_action('manage_' . self::POST_TYPE . '_posts_custom_column', [self::class, 'column_content'], 10, 2);
    }

    public static function columns($columns) {
        $new = [];
        $new['cb']              = $columns['cb'];
        $new['title']           = 'Quote';
        $new['wmp_customer']    = 'Customer';
        $new['wmp_vehicle']     = 'Vehicle';
        $new['wmp_price']       = 'Price Range';
        $new['date']            = $columns['date'];
        return $new;
    }

    public static function column_content($column, $post_id) {
        switch ($column) {
            case 'wmp_customer':
                $name  = get_post_meta($post_id, '_wmp_customer_name', true);
                $email = get_post_meta($post_id, '_wmp_customer_email', true);
                echo esc_html($name) . '<br><small>' . esc_html($email) . '</small>';
                break;
            case 'wmp_vehicle':
                $parts = array_filter([
                    get_post_meta($post_id, '_wmp_vehicle_year', true),
                    get_post_meta($post_id, '_wmp_vehicle_make', true),
                    get_post_meta($post_id, '_wmp_vehicle_model', true),
                ]);
                echo esc_html(implode(' ', $parts) ?: '—');
                break;
            case 'wmp_price':
                $min = get_post_meta($post_id, '_wmp_price_min', true);
                $max = get_post_meta($post_id, '_wmp_price_max', true);
                if ($min && $max) {
                    echo '$' . number_format((float)$min) . ' – $' . number_format((float)$max);
                } else {
                    echo '—';
                }
                break;
        }
    }

    /**
     * Create a quote post with meta fields and return the post ID.
     */
    public static function create_quote($data) {
        $vehicle_str = implode(' ', array_filter([
            $data['vehicle_year'] ?? '',
            $data['vehicle_make'] ?? '',
            $data['vehicle_model'] ?? '',
        ])) ?: 'Unknown Vehicle';

        $title = sprintf('Quote — %s — %s', $data['customer_name'] ?? 'Unknown', $vehicle_str);

        $post_id = wp_insert_post([
            'post_type'   => self::POST_TYPE,
            'post_title'  => $title,
            'post_status' => 'publish',
        ]);

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        $meta_map = [
            '_wmp_customer_name'  => 'customer_name',
            '_wmp_customer_email' => 'customer_email',
            '_wmp_timeline'       => 'timeline',
            '_wmp_vehicle_year'   => 'vehicle_year',
            '_wmp_vehicle_make'   => 'vehicle_make',
            '_wmp_vehicle_model'  => 'vehicle_model',
            '_wmp_vehicle_trim'   => 'vehicle_trim',
            '_wmp_body_class'     => 'body_class',
            '_wmp_material'       => 'material',
            '_wmp_color'          => 'color_label',
            '_wmp_color_hex'      => 'color_hex',
            '_wmp_coverage'       => 'coverage',
            '_wmp_project_type'   => 'project_type',
            '_wmp_fleet_size'     => 'fleet_size',
            '_wmp_price_min'      => 'price_min',
            '_wmp_price_max'      => 'price_max',
            '_wmp_state'          => 'state_code',
            '_wmp_notes'          => 'notes',
        ];

        foreach ($meta_map as $meta_key => $data_key) {
            if (isset($data[$data_key]) && $data[$data_key] !== '' && $data[$data_key] !== null) {
                update_post_meta($post_id, $meta_key, $data[$data_key]);
            }
        }

        // Store addons as JSON
        if (!empty($data['addons']) && is_array($data['addons'])) {
            update_post_meta($post_id, '_wmp_addons', wp_json_encode($data['addons']));
        }

        return $post_id;
    }
}
```

**Step 2: Commit**

```bash
git add wordpress-plugin/wrapmatchpro/includes/class-wmp-quote-cpt.php
git commit -m "feat(wp): add wmp_quote custom post type with admin columns"
```

---

### Task 4: Media Library Helper

**Files:**
- Create: `wordpress-plugin/wrapmatchpro/includes/class-wmp-media.php`

**Step 1: Create the media helper class**

```php
<?php
defined('ABSPATH') || exit;

class WMP_Media {

    /**
     * Save a base64-encoded image to the WordPress Media Library.
     *
     * @param string $base64    Raw base64 image data (no data: prefix).
     * @param string $mime_type e.g. 'image/jpeg', 'image/png'.
     * @param string $filename  Desired filename without extension.
     * @param int    $parent_id Post ID to attach the image to.
     * @return int|WP_Error     Attachment ID or error.
     */
    public static function save_base64_image($base64, $mime_type, $filename, $parent_id = 0) {
        $decoded = base64_decode($base64, true);
        if ($decoded === false) {
            return new WP_Error('invalid_base64', 'Failed to decode image data.');
        }

        // Determine file extension
        $ext_map = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        ];
        $ext = $ext_map[$mime_type] ?? 'jpg';

        // Ensure we have the upload functions
        if (!function_exists('wp_upload_bits')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        if (!function_exists('wp_generate_attachment_metadata')) {
            require_once ABSPATH . 'wp-admin/includes/image.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';
        }

        $upload = wp_upload_bits("{$filename}.{$ext}", null, $decoded);
        if (!empty($upload['error'])) {
            return new WP_Error('upload_failed', $upload['error']);
        }

        $attachment = [
            'post_mime_type' => $mime_type,
            'post_title'     => $filename,
            'post_status'    => 'inherit',
        ];

        $attach_id = wp_insert_attachment($attachment, $upload['file'], $parent_id);
        if (is_wp_error($attach_id)) {
            return $attach_id;
        }

        $metadata = wp_generate_attachment_metadata($attach_id, $upload['file']);
        wp_update_attachment_metadata($attach_id, $metadata);

        return $attach_id;
    }
}
```

**Step 2: Commit**

```bash
git add wordpress-plugin/wrapmatchpro/includes/class-wmp-media.php
git commit -m "feat(wp): add Media Library helper for base64 image uploads"
```

---

### Task 5: WP REST API Endpoints

**Files:**
- Create: `wordpress-plugin/wrapmatchpro/includes/class-wmp-rest-api.php`

**Step 1: Create the REST API class**

This is the largest file — it replaces all three Vercel serverless functions.

```php
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
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
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

        // Size check (~5 MB)
        if (strlen($image_base64) * 0.75 > 5 * 1024 * 1024) {
            return new WP_REST_Response(['error' => 'Image too large (max 5 MB)'], 400);
        }

        // Magic bytes validation
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

        $status = wp_remote_retrieve_response_code($response);
        if ($status !== 200) {
            return new WP_REST_Response(['error' => 'AI analysis failed'], 502);
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);
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

        $img_body    = wp_remote_retrieve_body($img_response);
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

        // Build HTML email
        $html = self::build_email_html($quote_data, $send_ai_preview);

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            "Reply-To: {$name} <{$email}>",
        ];

        $sent = wp_mail($recipient, $subject, $html, $headers, $attachments);

        if (!$sent) {
            // Quote was saved even if email fails — don't return error
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
            // Fallback: simple text
            return '<p>New quote from ' . esc_html($data['customer_name']) . '</p>';
        }

        ob_start();
        // Make $data available to the template
        include $template;
        return ob_get_clean();
    }
}
```

**Step 2: Commit**

```bash
git add wordpress-plugin/wrapmatchpro/includes/class-wmp-rest-api.php
git commit -m "feat(wp): add WP REST endpoints for color detection, wrap generation, and quote submission"
```

---

### Task 6: Email Template

**Files:**
- Create: `wordpress-plugin/wrapmatchpro/templates/quote-email.php`

**Step 1: Create the email template**

Port the HTML email from `api/send-quote.ts` `buildEmailHtml()` to a PHP template.

```php
<?php
/**
 * Quote notification email template.
 *
 * Variables available: $data (array), $send_ai_preview (bool)
 */
defined('ABSPATH') || exit;

$timeline_labels = [
    'asap'        => 'ASAP',
    '1-3mo'       => '1–3 months',
    '3-6mo'       => '3–6 months',
    'researching' => 'Just researching',
];

$project_labels = [
    'personal' => 'Personal Vehicle',
    'business' => 'Business Branding',
    'fleet'    => 'Fleet Wrap',
];

$coverage_labels = [
    'full'       => 'Full Wrap',
    'partial_60' => 'Partial (60%)',
    'partial_45' => 'Partial (45%)',
    'partial_30' => 'Partial (30%)',
    'decal'      => 'Decal Only',
];

$vehicle_str = implode(' ', array_filter([
    $data['vehicle_year'],
    $data['vehicle_make'],
    $data['vehicle_model'],
    $data['vehicle_trim'],
])) ?: '—';

$coverage_label  = $coverage_labels[$data['coverage']] ?? ($data['coverage'] ?: '—');
$timeline_label  = $timeline_labels[$data['timeline']] ?? $data['timeline'];
$project_label   = $project_labels[$data['project_type']] ?? ($data['project_type'] ?: '—');
$material_label  = $data['material'] ? ucwords(str_replace('_', ' ', $data['material'])) : '—';
$price_str       = ($data['price_min'] && $data['price_max'])
    ? '$' . number_format($data['price_min']) . '–$' . number_format($data['price_max'])
    : '—';
$addons_str      = !empty($data['addons']) ? implode(', ', $data['addons']) : 'None';

$color_swatch = '';
if (!empty($data['color_hex'])) {
    $hex = esc_attr($data['color_hex']);
    $color_swatch = "<span style=\"display:inline-block;width:12px;height:12px;border-radius:50%;background:{$hex};border:1px solid #ccc;vertical-align:middle;margin-right:4px;\"></span>";
}

$safe_notes = '';
if (!empty($data['notes'])) {
    $safe_notes = nl2br(esc_html(substr($data['notes'], 0, 2000)));
}
?>
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;">
  <h2 style="margin-bottom:4px;">New Wrap Quote Request</h2>
  <p style="color:#64748b;margin-top:0;">Submitted via WrapMatchPro calculator</p>

  <h3 style="border-bottom:1px solid #e2e8f0;padding-bottom:8px;">Contact</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:6px 0;color:#64748b;width:40%;">Name</td><td style="padding:6px 0;font-weight:600;"><?php echo esc_html($data['customer_name']); ?></td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;font-weight:600;"><a href="mailto:<?php echo esc_attr($data['customer_email']); ?>"><?php echo esc_html($data['customer_email']); ?></a></td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Timeline</td><td style="padding:6px 0;font-weight:600;"><?php echo esc_html($timeline_label); ?></td></tr>
  </table>

  <h3 style="border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-top:24px;">Wrap Configuration</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:6px 0;color:#64748b;width:40%;">Project Type</td><td style="padding:6px 0;font-weight:600;"><?php echo esc_html($project_label); ?></td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Vehicle</td><td style="padding:6px 0;font-weight:600;"><?php echo esc_html($vehicle_str); ?></td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">State</td><td style="padding:6px 0;font-weight:600;"><?php echo esc_html($data['state_code'] ?: '—'); ?></td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Material</td><td style="padding:6px 0;font-weight:600;"><?php echo esc_html($material_label); ?></td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Color</td><td style="padding:6px 0;font-weight:600;"><?php echo $color_swatch . esc_html($data['color_label'] ?: '—'); ?></td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Coverage</td><td style="padding:6px 0;font-weight:600;"><?php echo esc_html($coverage_label); ?></td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Add-ons</td><td style="padding:6px 0;font-weight:600;"><?php echo esc_html($addons_str); ?></td></tr>
    <tr style="background:#f8fafc;"><td style="padding:10px 8px;font-weight:700;">Estimated Price</td><td style="padding:10px 8px;font-weight:700;color:#7c3aed;"><?php echo esc_html($price_str); ?></td></tr>
  </table>

  <?php if ($send_ai_preview): ?>
  <p style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;color:#1e40af;font-size:13px;margin-top:24px;">
    ✨ <strong>AI Preview requested.</strong> Car photo attached — use it to generate the wrap preview.
  </p>
  <?php endif; ?>

  <?php if ($safe_notes): ?>
  <h3 style="border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-top:24px;">Notes from Customer</h3>
  <p style="font-size:14px;color:#1e293b;line-height:1.6;white-space:pre-wrap;"><?php echo $safe_notes; ?></p>
  <?php endif; ?>

  <p style="color:#94a3b8;font-size:12px;margin-top:32px;">Sent from WrapMatchPro cost calculator</p>
</body>
</html>
```

**Step 2: Commit**

```bash
git add wordpress-plugin/wrapmatchpro/templates/quote-email.php
git commit -m "feat(wp): add HTML email template for quote notifications"
```

---

### Task 7: Adapt React App for WordPress

**Files:**
- Create: `src/wordpress-entry.tsx` (new entry point for WP build)
- Create: `src/utils/api.ts` (centralized API helper)
- Modify: `src/components/QuoteFormModal.tsx:98` (use API helper)
- Modify: `src/components/colorFinder/ColorFinderPage.tsx:26` (use API helper)
- Modify: `src/App.tsx` (remove history-based routing for embedded use)
- Modify: `vite.config.ts` (add `wordpress` build mode)

**Step 1: Create the API helper**

```typescript
// src/utils/api.ts
// Centralized fetch wrapper for WP REST API or Vercel

interface WPConfig {
  apiBase: string;
  nonce: string;
}

declare global {
  interface Window {
    wrapmatchproConfig?: WPConfig;
  }
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (window.wrapmatchproConfig?.nonce) {
    headers['X-WP-Nonce'] = window.wrapmatchproConfig.nonce;
  }
  return headers;
}

function getApiUrl(path: string): string {
  const base = window.wrapmatchproConfig?.apiBase;
  if (base) {
    // WordPress mode: /wp-json/wrapmatchpro/v1 + /submit-quote
    return `${base}${path}`;
  }
  // Vercel mode: /api/send-quote
  const vercelPaths: Record<string, string> = {
    '/submit-quote': '/api/send-quote',
    '/detect-color': '/api/detect-wrap-color',
    '/generate-wrap': '/api/generate-wrap',
  };
  return vercelPaths[path] ?? `/api${path}`;
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(getApiUrl(path), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Server error ${res.status}`);
  }

  return res.json() as Promise<T>;
}
```

**Step 2: Update QuoteFormModal to use the API helper**

In `src/components/QuoteFormModal.tsx`, replace the fetch call:

```typescript
// Replace line 98 and surroundings:
// OLD:
//   const res = await fetch('/api/send-quote', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({...}),
//   });
//   if (!res.ok) {
//     const data = await res.json() as { error?: string };
//     throw new Error(data.error ?? 'Submission failed');
//   }

// NEW:
import { apiPost } from '../utils/api';

// In handleSubmit, replace the fetch block with:
      await apiPost('/submit-quote', {
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
        notes: notes.trim() || null,
        carPhotoBase64,
        carPhotoMimeType,
      });
```

**Step 3: Update ColorFinderPage to use the API helper**

In `src/components/colorFinder/ColorFinderPage.tsx`, replace the fetch call:

```typescript
// Replace line 26 and surroundings:
import { apiPost } from '../../utils/api';

// In handleImageLoaded, replace the fetch block with:
      const aiAnalysis = await apiPost<AIAnalysisResult>('/detect-color', {
        imageBase64: base64,
        mimeType,
      });
```

**Step 4: Create WordPress entry point**

```typescript
// src/wordpress-entry.tsx
// WordPress plugin entry — mounts React app into #wrapmatchpro-root

import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('wrapmatchpro-root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
```

**Step 5: Update App.tsx for embedded use**

Replace the history-based routing with internal state routing that works when embedded via shortcode:

```typescript
// src/App.tsx
import { useState } from 'react';
import { WizardProvider } from './context/WizardContext';
import { WizardShell } from './components/WizardShell';
import { ColorFinderPage } from './components/colorFinder/ColorFinderPage';

type View = 'calculator' | 'color-finder';

function App() {
  const [view, setView] = useState<View>('calculator');

  if (view === 'color-finder') {
    return <ColorFinderPage onBack={() => setView('calculator')} />;
  }

  return (
    <WizardProvider>
      <WizardShell />
    </WizardProvider>
  );
}

export default App;
```

**Step 6: Add WordPress build mode to Vite config**

Add a new `wordpress` mode to `vite.config.ts`:

```typescript
  if (mode === 'wordpress') {
    return {
      plugins: [react()],
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      build: {
        lib: {
          entry: 'src/wordpress-entry.tsx',
          name: 'WrapMatchPro',
          fileName: 'wrapmatchpro',
          formats: ['iife'],
        },
        rollupOptions: {
          external: [],
          output: {
            dir: 'wordpress-plugin/wrapmatchpro/assets/js',
            entryFileNames: 'wrapmatchpro.js',
          },
        },
        cssCodeSplit: false,
        outDir: 'wordpress-plugin/wrapmatchpro/assets/js',
        emptyOutDir: false,
        minify: true,
      },
      css: {
        // Extract CSS to a file that the plugin enqueues separately
      },
    };
  }
```

**Step 7: Add build script to package.json**

Add to `scripts`:
```json
"build:wordpress": "vite build --mode wordpress"
```

**Step 8: Commit**

```bash
git add src/utils/api.ts src/wordpress-entry.tsx src/App.tsx src/components/QuoteFormModal.tsx src/components/colorFinder/ColorFinderPage.tsx vite.config.ts package.json
git commit -m "feat(wp): adapt React app for WordPress with API helper and IIFE build mode"
```

---

### Task 8: Handle CSS Extraction for WordPress

**Files:**
- Modify: `vite.config.ts` (ensure CSS is extracted to a separate file for the WP build)

**Step 1: Configure Vite to output CSS alongside JS**

The IIFE build by default inlines CSS. We need it extracted so the PHP plugin can enqueue it separately. In the `wordpress` mode config in `vite.config.ts`, add a PostCSS/Rollup plugin or use the Vite `build.cssCodeSplit` option.

For the simplest approach, use `css.extract` in the wordpress build mode. Since Vite's library mode doesn't extract CSS by default in IIFE format, use the `vite-plugin-css-injected-by-js` approach — or simpler: just inline the CSS via JS injection (as the embed mode already does).

Actually, the cleanest approach: Use the same `?inline` CSS import pattern from `embed.tsx` in `wordpress-entry.tsx` and inject a `<style>` tag. This avoids needing a separate CSS file and simplifies the plugin.

Update `src/wordpress-entry.tsx`:

```typescript
// src/wordpress-entry.tsx
import { createRoot } from 'react-dom/client';
import App from './App';
import inlineCss from './index.css?inline';

const container = document.getElementById('wrapmatchpro-root');
if (container) {
  // Inject styles
  const style = document.createElement('style');
  style.textContent = inlineCss;
  document.head.appendChild(style);

  const root = createRoot(container);
  root.render(<App />);
}
```

Then remove the `wp_enqueue_style` call from `wrapmatchpro.php` since CSS is bundled in JS.

Update `wrapmatchpro.php` — remove the CSS enqueue line:

```php
// Remove this line:
// wp_enqueue_style('wrapmatchpro-styles', ...);
```

**Step 2: Commit**

```bash
git add src/wordpress-entry.tsx wordpress-plugin/wrapmatchpro/wrapmatchpro.php
git commit -m "feat(wp): inline CSS in JS bundle, remove separate CSS enqueue"
```

---

### Task 9: Build & Test the WordPress Plugin Bundle

**Step 1: Run the WordPress build**

Run:
```bash
npm run build:wordpress
```

Expected: `wordpress-plugin/wrapmatchpro/assets/js/wrapmatchpro.js` is generated.

**Step 2: Verify the plugin structure**

Run:
```bash
ls -la wordpress-plugin/wrapmatchpro/
ls -la wordpress-plugin/wrapmatchpro/includes/
ls -la wordpress-plugin/wrapmatchpro/assets/js/
ls -la wordpress-plugin/wrapmatchpro/templates/
```

Expected: All files present — `wrapmatchpro.php`, 4 class files in `includes/`, `wrapmatchpro.js` in `assets/js/`, `quote-email.php` in `templates/`.

**Step 3: Verify plugin header is valid**

Run:
```bash
head -15 wordpress-plugin/wrapmatchpro/wrapmatchpro.php
```

Expected: Standard WordPress plugin header with `Plugin Name: WrapMatchPro`.

**Step 4: Commit the built bundle**

```bash
git add wordpress-plugin/wrapmatchpro/assets/js/wrapmatchpro.js
git commit -m "build(wp): add compiled React bundle for WordPress plugin"
```

---

### Task 10: Create ZIP distribution

**Step 1: Create a build script for distribution**

Add to `package.json` scripts:
```json
"build:wp-dist": "npm run build:wordpress && cd wordpress-plugin && zip -r ../wrapmatchpro.zip wrapmatchpro/"
```

**Step 2: Run it**

Run:
```bash
npm run build:wp-dist
```

Expected: `wrapmatchpro.zip` in project root, ready for WordPress plugin upload.

**Step 3: Commit**

```bash
git add package.json
git commit -m "feat(wp): add build:wp-dist script for plugin ZIP distribution"
```
