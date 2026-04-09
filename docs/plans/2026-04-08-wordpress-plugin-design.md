# WrapMatchPro WordPress Plugin — Design

**Date**: 2026-04-08
**Status**: Approved

## Goal

Convert the existing WrapMatchPro React SPA + Vercel serverless app into a self-contained WordPress plugin. The plugin renders the calculator via a `[wrap_calculator]` shortcode, stores quotes and images in WordPress, and proxies AI API calls through WP REST endpoints so API keys stay server-side.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend integration | Shortcode `[wrap_calculator]` | Maximum compatibility across themes and page builders |
| Data storage | Quotes as CPT + images in Media Library | Manageable in WP admin, searchable, with attached media |
| Frontend framework | Keep existing React app | Complex state management (wizard, color science); rewrite would be massive effort for no gain |
| API key management | WP Settings page (`wp_options`) | Standard WP plugin pattern, user-friendly |
| Car photos (IMAGIN) | Direct browser calls | Free no-auth API, no reason to proxy |
| Email sending | `wp_mail()` | Leverages existing site mail config, removes Resend dependency |

## Plugin Structure

```
wrapmatchpro/
├── wrapmatchpro.php              — Plugin bootstrap, shortcode registration, script enqueue
├── includes/
│   ├── class-wmp-settings.php    — Admin settings page (API keys, recipient email)
│   ├── class-wmp-rest-api.php    — WP REST endpoint handlers (Gemini, OpenAI, quote submission)
│   ├── class-wmp-quote-cpt.php   — Custom post type registration, admin columns
│   └── class-wmp-media.php       — Helper for saving base64 images to WP Media Library
├── assets/
│   └── js/
│       └── wrapmatchpro.js       — Built React bundle (IIFE, retargeted to WP REST)
└── templates/
    └── quote-email.php           — HTML email template for wp_mail()
```

## Shortcode Behavior

`[wrap_calculator]` outputs:

```html
<div id="wrapmatchpro-root"></div>
```

And enqueues `wrapmatchpro.js` with `wp_localize_script` passing:

```js
window.wrapmatchproConfig = {
  apiBase: '/wp-json/wrapmatchpro/v1',
  nonce: '...',       // wp_create_nonce('wp_rest')
  imaginKey: '...',   // optional IMAGIN.Studio key override
}
```

No API keys are exposed to the frontend. The nonce provides CSRF protection.

## WP REST API Endpoints

All endpoints registered under namespace `wrapmatchpro/v1`.

### POST `/generate-wrap`

Replaces `/api/generate-wrap`. Accepts `imageUrl`, `colorLabel`, `colorHex`, `material`, `coverage`. Server-side: fetches IMAGIN image, sends to Gemini 2.0 Flash Image API, returns base64 result. Reads Gemini API key from `wp_options`.

### POST `/detect-color`

Replaces `/api/detect-wrap-color`. Accepts `imageBase64`, `mimeType`. Server-side: validates image magic bytes, calls GPT-4o Vision, returns color analysis JSON. Reads OpenAI API key from `wp_options`.

### POST `/submit-quote`

Replaces `/api/send-quote`. Accepts all quote form fields + optional base64 images.

Server-side:
1. Saves customer photo to Media Library (if provided)
2. Saves AI preview to Media Library (if provided)
3. Creates `wmp_quote` CPT entry with all meta fields and attached images
4. Builds HTML email from `templates/quote-email.php`
5. Sends via `wp_mail()` with image attachments
6. Returns success/error response

**Rate limiting**: Uses WP transients to rate-limit public submissions (e.g., 5 quotes per IP per hour).

## Custom Post Type: `wmp_quote`

- **Slug**: `wmp_quote`
- **Public**: No (admin only)
- **Supports**: title, custom-fields
- **Title format**: "Quote — {Customer Name} — {Year} {Make} {Model}"

### Meta Fields

| Meta Key | Type | Description |
|---|---|---|
| `_wmp_customer_name` | string | Customer full name |
| `_wmp_customer_email` | string | Customer email |
| `_wmp_timeline` | string | ASAP / 1-3mo / 3-6mo / researching |
| `_wmp_vehicle_year` | string | Vehicle year |
| `_wmp_vehicle_make` | string | Vehicle make |
| `_wmp_vehicle_model` | string | Vehicle model |
| `_wmp_vehicle_trim` | string | Vehicle trim |
| `_wmp_body_class` | string | Body classification |
| `_wmp_material` | string | Material type |
| `_wmp_color` | string | Color label |
| `_wmp_color_hex` | string | Color hex value |
| `_wmp_coverage` | string | Coverage level |
| `_wmp_addons` | json | Selected add-ons array |
| `_wmp_project_type` | string | personal / business / fleet |
| `_wmp_fleet_size` | int | Number of vehicles (fleet only) |
| `_wmp_price_min` | float | Estimated minimum price |
| `_wmp_price_max` | float | Estimated maximum price |
| `_wmp_state` | string | Selected US state |
| `_wmp_notes` | string | Customer notes |

### Attached Media

Customer photos and AI previews are uploaded to Media Library with `post_parent` set to the quote post ID, making them accessible from the quote's admin screen.

### Admin Columns

Visible in WP admin list view: Customer Name, Vehicle, Price Range, Date.

## Settings Page

Registered under **Settings > WrapMatchPro**.

| Field | Type | Default |
|---|---|---|
| Gemini API Key | password | — |
| OpenAI API Key | password | — |
| Quote Recipient Email | email | `get_option('admin_email')` |
| IMAGIN.Studio API Key | text | Built-in default key |

Stored as serialized array in `wp_options` key `wrapmatchpro_settings`.

## React App Changes

Minimal modifications to the existing React codebase:

1. **API client**: Replace hardcoded `/api/*` fetch URLs with `window.wrapmatchproConfig.apiBase + '/...'` and add `X-WP-Nonce` header to all requests
2. **Build config**: Use the existing IIFE embed build mode from `vite.config.ts`, output as `wrapmatchpro.js`
3. **Remove Vercel env vars**: No more `VITE_*` env vars needed; config comes from `wp_localize_script`
4. **Color Finder routing**: Handle via internal React state (no browser history pushState, since we're embedded via shortcode)

Everything else (wizard state, pricing logic, color science, IMAGIN calls, UI components) stays unchanged.

## Email

Uses `wp_mail()` with:
- **To**: Configured recipient email from settings
- **Reply-To**: Customer email
- **Subject**: "New Wrap Quote — {Year} {Make} {Model} — {Customer Name}"
- **Body**: HTML built from `templates/quote-email.php` with full quote details
- **Attachments**: Customer photo + AI preview (file paths from Media Library)

## Security

- API keys stored in `wp_options`, never sent to frontend
- WP REST nonce for CSRF protection on all endpoints
- Input sanitization via `sanitize_text_field()`, `sanitize_email()`, etc.
- Image validation: magic bytes check + size limit (5 MB)
- Rate limiting on quote submissions via transients
- `capability_type` on CPT restricts access to admins
