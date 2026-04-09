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
    wp_enqueue_script(
        'wrapmatchpro-app',
        WMP_PLUGIN_URL . 'assets/js/wrapmatchpro.js',
        [],
        WMP_VERSION,
        true
    );

    wp_localize_script('wrapmatchpro-app', 'wrapmatchproConfig', [
        'apiBase' => esc_url_raw(rest_url('wrapmatchpro/v1')),
        'nonce'   => wp_create_nonce('wp_rest'),
    ]);

    return '<div id="wrapmatchpro-root"></div>';
}
