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

        if (!empty($data['addons']) && is_array($data['addons'])) {
            update_post_meta($post_id, '_wmp_addons', wp_json_encode($data['addons']));
        }

        return $post_id;
    }
}
