/* ============================================================
   URBAN DZ — CONFIGURATION
   The only file you edit to connect your database.

   1. Create a free project at https://supabase.com
   2. Settings > API > copy Project URL + anon public key
   3. Run supabase/schema.sql in the SQL Editor
   4. Paste both values below. Done.

   While the values are empty, the site runs in DEMO mode
   with sample products so you can preview the design.
   ============================================================ */
const SUPABASE_CONFIG = {
  url: 'https://rcxwrumskukkxftdkiot.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeHdydW1za3Vra3hmdGRraW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NDE2OTcsImV4cCI6MjEwMzAxNzY5N30.GFD4y6u6Def64mWzEiC39uZKuVFayRPnrdzHbImsdck',
};

// Public site URL for share previews / canonical links.
// Leave '' to auto-detect from the address bar.
window.SITE_URL = 'https://taupe-belekoy-816519.netlify.app';

// Your WhatsApp number in international format WITHOUT '+' — digits only.
// e.g. Algerian number 0555 12 34 56 → '213555123456'.
// NOTE: the dashboard (admin → Boutique → WhatsApp) overrides this once set.
// This value is only a fallback so the button works before Supabase is connected.
window.WHATSAPP = '';

// Hero image on the homepage. Two options:
//   1. A file inside the project:  '/assets/img/hero.jpg'
//   2. Any public URL:             'https://...'
// Leave '' to use the generated artwork (fine for demo, replace before launch).
// Best ratio: landscape ~4:3 or wider; the text sits on the left column.
window.HERO_IMAGE = '';

// Ad pixels — fallback only; the dashboard (admin → Boutique) overrides these.
// Meta: 15-16 digits from Events Manager. TikTok: starts with 'C'.
// Empty = the pixel is never loaded at all (no third-party script, no cookie).
window.ADS = {
  metaPixelId: '',
  tiktokPixelId: '',
};

// Default currency label per language
window.CURRENCY = { fr: 'DA', ar: 'دج' };

window.IS_DEMO =
  !SUPABASE_CONFIG.url.startsWith('https://') ||
  SUPABASE_CONFIG.anonKey.startsWith('PASTE_');
