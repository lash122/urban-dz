/* URBAN DZ — shared UI: money, placeholders, header/footer, cards, toast */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function money(n) {
  const v = Math.round(Number(n) || 0).toLocaleString('fr-FR').replace(/\u202f/g, ' ');
  return `${v} ${window.CURRENCY[LANG] || 'DA'}`;
}

/* Self-contained SVG placeholder so the demo needs zero image files */
function placeholder(name, hue = 210) {
  const label = encodeURIComponent((name || 'URBAN DZ').slice(0, 24));
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='750'>` +
    `<rect width='600' height='750' fill='hsl(${hue},22%,92%)'/>` +
    `<rect x='40' y='40' width='520' height='670' fill='none' stroke='hsl(${hue},18%,82%)' stroke-width='2'/>` +
    `<text x='300' y='380' font-family='Arial,sans-serif' font-size='34' fill='hsl(${hue},12%,55%)' ` +
    `text-anchor='middle'>${label}</text>` +
    `<text x='300' y='430' font-family='Arial,sans-serif' font-size='20' letter-spacing='8' ` +
    `fill='hsl(${hue},10%,70%)' text-anchor='middle'>URBAN DZ</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function productPhoto(p) {
  return p.photo || placeholder(LANG === 'ar' ? p.name_ar : p.name_fr, (p.id * 47) % 360);
}

function productName(p) { return LANG === 'ar' ? (p.name_ar || p.name_fr) : (p.name_fr || p.name_ar); }

const COLOR_AR = {
  'Noir': 'أسود', 'Blanc': 'أبيض', 'Bleu': 'أزرق', 'Marine': 'كحلي', 'Kaki': 'خاكي',
  'Gris': 'رمادي', 'Beige': 'بيج', 'Taupe': 'رمادي فاتح', 'Vert': 'أخضر', 'Bordeaux': 'بوردو',
};
const COLOR_HEX = {
  'Noir': '#1c1a17', 'Blanc': '#f7f4ee', 'Bleu': '#2b5ea7', 'Marine': '#22304d',
  'Kaki': '#8a815c', 'Gris': '#9a958d', 'Beige': '#d9c7a7', 'Taupe': '#a89a86',
  'Vert': '#4e6b4e', 'Bordeaux': '#6e2b35', 'Rouge': '#b3402e', 'Rose': '#d98ca0',
  'Marron': '#5c4632', 'Orange': '#d97b29', 'Jaune': '#d9b23a', 'Violet': '#6a4ba1',
};
function colorName(c) { return LANG === 'ar' ? (COLOR_AR[c] || c) : c; }
function colorHex(c) { return COLOR_HEX[c] || '#b8b0a4'; }
function colorDot(c) {
  return `<span class="dot-swatch" style="background:${colorHex(c)}" aria-hidden="true"></span>`;
}

function priceHtml(p) {
  const hasCompare = p.compare_at_price && p.compare_at_price > p.price;
  return `
    <div class="price">
      <span class="price-now">${money(p.price)}</span>
      ${hasCompare ? `<span class="price-old">${money(p.compare_at_price)}</span>
        <span class="badge-sale">−${Math.round(100 - p.price / p.compare_at_price * 100)}%</span>` : ''}
    </div>`;
}

function cardHtml(p) {
  return `
  <a class="card" href="product.html?id=${p.id}">
    <div class="card-media">
      <img src="${esc(productPhoto(p))}" alt="${esc(productName(p))}" loading="lazy">
      ${p.stock <= 0 ? `<span class="card-flag" data-i18n="out_stock">${t('out_stock')}</span>`
        : (p.compare_at_price > p.price ? `<span class="card-flag sale">−${Math.round(100 - p.price / p.compare_at_price * 100)}%</span>` : '')}
      <button class="card-quick" data-add="${p.id}">${esc(t('add_cart'))}</button>
    </div>
    <div class="card-body">
      <h3>${esc(productName(p))}</h3>
      ${priceHtml(p)}
    </div>
  </a>`;
}

/* Quick add from a card: uses first size; product page enforces size choice */
document.addEventListener('click', async e => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  e.preventDefault();
  const id = Number(btn.dataset.add);
  try {
    const p = await DB.getProduct(id);
    if (!p) return;
    if (p.sizes && p.sizes.length) {
      location.href = `product.html?id=${id}`;
      return;
    }
    Cart.add(p, '', '', 1);
    toast(t('added'));
    if (window.Ads) Ads.event('AddToCart', {
      content_name: productName(p), content_ids: [String(p.id)], value: Number(p.price) || 0,
    });
  } catch { /* ignore */ }
});

/* ---------- scroll reveal (premium micro-interaction) ---------- */
const revealIO = ('IntersectionObserver' in window) && !matchMedia('(prefers-reduced-motion: reduce)').matches
  ? new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); revealIO.unobserve(e.target); }
      });
    }, { threshold: .08 })
  : null;

function watchReveals(root = document) {
  if (!revealIO) return;
  root.querySelectorAll(
    '.grid-products .card, .cat-grid .cat-tile, .upsell-grid .up-card, .section-head'
  ).forEach(el => {
    if (!el.classList.contains('reveal')) { el.classList.add('reveal'); revealIO.observe(el); }
  });
}
new MutationObserver(() => watchReveals())
  .observe(document.documentElement, { childList: true, subtree: true });

let _toastTimer;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function renderHeader(active) {
  const el = document.getElementById('site-header');
  if (!el) return;
  const links = [
    ['index.html', 'nav_home', 'home'],
    ['shop.html', 'nav_shop', 'shop'],
    ['track.html', 'nav_track', 'track'],
    ['faq.html', 'nav_faq', 'faq'],
  ];
  el.innerHTML = `
  ${window.IS_DEMO ? `<div class="demo-bar" data-i18n="demo_banner">${t('demo_banner')}</div>` : ''}
  <div class="header-inner container">
    <button class="nav-burger" aria-label="menu">☰</button>
    <a class="logo" href="index.html">URBAN<span>DZ</span></a>
    <nav class="nav-links">
      ${links.map(([href, key, id]) =>
        `<a href="${href}" class="${active === id ? 'active' : ''}">${t(key)}</a>`).join('')}
    </nav>
    <div class="header-actions">
      <button class="lang-toggle" onclick="setLang('${LANG === 'ar' ? 'fr' : 'ar'}')">${LANG === 'ar' ? 'FR' : 'ع'}</button>
      <a class="cart-link" href="cart.html" aria-label="cart">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 7h12l-1.2 11a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
        <span class="cart-count${Cart.count() ? '' : ' empty'}">${Cart.count()}</span>
      </a>
    </div>
  </div>`;
}

function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = `
  <div class="container footer-grid">
    <div>
      <a class="logo" href="index.html">URBAN<span>DZ</span></a>
      <p>${t('footer_tag')}</p>
      <div class="social-links" id="social-links"></div>
    </div>
    <div>
      <h4>${t('footer_shop')}</h4>
      <a href="shop.html" data-i18n="nav_shop">${t('nav_shop')}</a>
      <a href="track.html" data-i18n="nav_track">${t('nav_track')}</a>
      <a href="admin.html" data-i18n="admin">${t('admin')}</a>
    </div>
    <div>
      <h4>${t('footer_help')}</h4>
      <a href="faq.html" data-i18n="nav_faq">${t('nav_faq')}</a>
      <a href="track.html" data-i18n="nav_track">${t('nav_track')}</a>
    </div>
  </div>
  <div class="footer-bottom"><div class="container" data-i18n="rights">${t('rights')}</div></div>`;
}

function waNumber() {
  return String((window.SETTINGS_CACHE && window.SETTINGS_CACHE.whatsapp) || window.WHATSAPP || '');
}

function waOrderUrl(order) {
  const lines = [
    `${t('order_no')} #${order.id}`,
    `${t('total')} : ${money(order.total)}`,
    ...(order.items || []).map(it =>
      `• ${productName(it)} × ${it.qty}${it.color ? ` (${colorName(it.color)})` : ''}${it.size ? ` ${it.size}` : ''}`),
  ];
  return `https://wa.me/${waNumber()}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/* Floating WhatsApp button — dashboard number first, config.js as fallback */
function renderWaFab() {
  const num = waNumber();
  if (!num || document.getElementById('wa-fab')) return;
  const a = document.createElement('a');
  a.id = 'wa-fab';
  a.href = `https://wa.me/${num}`;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', 'WhatsApp');
  a.innerHTML = `<svg viewBox="0 0 32 32" width="26" height="26" fill="#fff">
    <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.9 5 2.3 7L4.6 27l5.3-1.7c1.9 1.1 4 1.7 6.1 1.7 6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 21.6c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-3.1 1 1-3-.3-.4c-1.2-1.7-1.8-3.6-1.8-5.6C6 9.6 10.5 5.2 16 5.2s10 4.4 10 9.7-4.5 9.7-10 9.7zm5.5-7.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.8-.8 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.2-.7-.4z"/></svg>`;
  document.body.appendChild(a);
}

/* Canonical + og:url from window.SITE_URL (Google renders JS; crawlers of
   shares read raw HTML, so also keep the static og tags in each page head) */
function renderSeo() {
  if (!window.SITE_URL) return;
  const base = window.SITE_URL.replace(/\/$/, '');
  const here = base + location.pathname;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = here;
  const og = document.querySelector('meta[property="og:url"]');
  if (og) og.content = here;
}

/* Dashboard-driven bits: announcement bar, social links, exchange days */
window.EXCHANGE_DAYS = window.EXCHANGE_DAYS || 7;

function renderAnnounce() {
  const hdr = document.getElementById('site-header');
  if (!hdr) return;
  let bar = hdr.querySelector('.announce-bar');
  const a = (window.SETTINGS_CACHE || {}).announce;
  const txt = a && a.active ? (LANG === 'ar' ? (a.text_ar || a.text_fr) : (a.text_fr || a.text_ar)) : '';
  if (!txt) { if (bar) bar.remove(); return; }
  if (!bar) { bar = document.createElement('div'); bar.className = 'announce-bar'; hdr.prepend(bar); }
  bar.textContent = txt;
}

function renderSocials() {
  const el = document.getElementById('social-links');
  if (!el) return;
  const s = (window.SETTINGS_CACHE || {}).socials || {};
  const links = [['Instagram', s.instagram], ['Facebook', s.facebook], ['TikTok', s.tiktok]]
    .filter(x => x[1]);
  el.innerHTML = links.map(([n, u]) =>
    `<a href="${esc(u)}" target="_blank" rel="noopener">${n} ↗</a>`).join('');
}

async function loadStoreSettings() {
  try { window.SETTINGS_CACHE = await DB.getSettings(); } catch { return; }
  window.EXCHANGE_DAYS = window.SETTINGS_CACHE.exchange_days || 7;
  if (window.Ads) Ads.refresh();   // dashboard pixel IDs activate here
  renderWaFab();
  renderAnnounce();
  renderSocials();
  applyI18n();
}

function renderChrome(active) {
  renderHeader(active);
  renderFooter();
  applyI18n();
  renderWaFab();
  renderSeo();
  loadStoreSettings();
  document.addEventListener('cart:changed', () => {
    const badge = document.querySelector('.cart-count');
    if (badge) {
      badge.textContent = Cart.count();
      badge.classList.toggle('empty', !Cart.count());
    }
  });
}
