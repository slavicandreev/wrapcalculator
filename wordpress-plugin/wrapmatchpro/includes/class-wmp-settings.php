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
