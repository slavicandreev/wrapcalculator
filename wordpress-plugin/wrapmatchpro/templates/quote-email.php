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
