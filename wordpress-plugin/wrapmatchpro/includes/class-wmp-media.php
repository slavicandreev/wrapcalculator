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

        $ext_map = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        ];
        $ext = $ext_map[$mime_type] ?? 'jpg';

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
