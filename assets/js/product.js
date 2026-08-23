/* URBAN DZ — product detail page */
let PDP = null;
let chosenSize = '';
let chosenColor = '';
let qty = 1;

function renderPdp() {
  const p = PDP;
  const root = document.getElementById('pdp-root');
  document.title = `${productName(p)} — URBAN DZ`;

  const photos = (p.photos && p.photos.filter(Boolean).length) ? p.photos.filter(Boolean) : [productPhoto(p)];
  const soldOut = p.stock <= 0;
  root.innerHTML = `
  <div class="pdp" style="padding-top:34px">
    <div>
      <div class="gallery-main"><img id="gal-main" src="${esc(photos[0])}" alt="${esc(productName(p))}"></div>
      ${photos.length > 1 ? `<div class="thumbs">${photos.map((src, i) =>
        `<img src="${esc(src)}" data-thumb="${i}" class="${i === 0 ? 'active' : ''}" alt="">`).join('')}</div>` : ''}
    </div>
    <div class="pdp-info">
      <h1>${esc(productName(p))}</h1>
      <div class="pdp-price price">${priceHtml(p)}</div>

      ${p.colors && p.colors.length ? `
        <label class="opt-label">${t('colors_label')}<span id="color-name" style="font-weight:400;color:var(--ink-soft)"> : ${esc(colorName(p.colors[0]))}</span></label>
        <div class="size-row" style="margin-bottom:14px" id="color-row">
          ${p.colors.map(c => `<button type="button" class="swatch${c === p.colors[0] ? ' active' : ''}" data-color="${esc(c)}"
            style="background:${colorHex(c)}" title="${esc(colorName(c))}" aria-label="${esc(colorName(c))}"></button>`).join('')}
        </div>` : ''}

      ${p.sizes && p.sizes.length ? `
        <label class="opt-label" data-i18n="size_label">${t('size_label')}</label>
        <div class="size-row">
          ${p.sizes.map(s => `<button type="button" class="size-btn${s === 'L' ? ' active' : ''}" data-size="${esc(s)}">${esc(s)}</button>`).join('')}
        </div>
        <button type="button" class="size-guide-link" id="btn-sizeguide">📏 ${esc(t('size_guide'))}</button>` : ''}

      <label class="opt-label" data-i18n="qty_label">${t('qty_label')}</label>
      <div class="qty-row">
        <span class="qty-stepper">
          <button type="button" id="q-minus">−</button>
          <output id="q-out">1</output>
          <button type="button" id="q-plus">+</button>
        </span>
      </div>

      <div class="pdp-actions">
        <button class="btn accent block" id="btn-add" ${soldOut ? 'disabled' : ''}
          data-i18n="${soldOut ? 'out_stock' : 'add_cart'}">${soldOut ? t('out_stock') : t('add_cart')}</button>
        <button class="btn block" id="btn-buy" ${soldOut ? 'disabled' : ''} data-i18n="buy_now">${t('buy_now')}</button>
        <div class="share-row">
          <span>${t('share')} :</span>
          <a id="sh-wa" target="_blank" rel="noopener">WhatsApp</a>
          <a id="sh-fb" target="_blank" rel="noopener">Facebook</a>
          <button type="button" id="sh-copy">Copier le lien</button>
        </div>
      </div>

      <div class="accordions">
        <details class="acc" open>
          <summary data-i18n="desc_title">${t('desc_title')}</summary>
          <div class="acc-body">${esc(LANG === 'ar' ? (p.description_ar || '') : (p.description_fr || ''))}</div>
        </details>
        <details class="acc">
          <summary data-i18n="info_title">${t('info_title')}</summary>
          <div class="acc-body" data-i18n="info_body">${t('info_body')}</div>
        </details>
      </div>
    </div>
  </div>`;

  // interactions
  root.querySelectorAll('[data-thumb]').forEach(img => {
    img.addEventListener('click', () => {
      document.getElementById('gal-main').src = img.src;
      root.querySelectorAll('[data-thumb]').forEach(x => x.classList.remove('active'));
      img.classList.add('active');
    });
  });
  root.querySelectorAll('[data-color]').forEach(b => {
    if (b.classList.contains('active')) chosenColor = b.dataset.color;
    b.addEventListener('click', () => {
      chosenColor = b.dataset.color;
      root.querySelectorAll('[data-color]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const nameEl = document.getElementById('color-name');
      if (nameEl) nameEl.textContent = ` : ${colorName(chosenColor)}`;
    });
  });
  root.querySelectorAll('.size-btn').forEach(b => {
    if (b.classList.contains('active')) chosenSize = b.dataset.size;
    b.addEventListener('click', () => {
      chosenSize = b.dataset.size;
      root.querySelectorAll('.size-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
  });
  const out = document.getElementById('q-out');
  document.getElementById('q-minus').onclick = () => { qty = Math.max(1, qty - 1); out.textContent = qty; };
  document.getElementById('q-plus').onclick = () => { qty = Math.min(20, qty + 1); out.textContent = qty; };

  function addToCart() {
    if (!chosenColor && p.colors && p.colors.length) { toast(t('choose_color')); return false; }
    if (!chosenSize && p.sizes && p.sizes.length) { toast(t('choose_size')); return false; }
    Cart.add(p, chosenSize, chosenColor, qty);
    toast(t('added'));
    if (window.Ads) Ads.event('AddToCart', {
      content_name: productName(p), content_ids: [String(p.id)],
      quantity: qty, value: (Number(p.price) || 0) * qty,
    });
    return true;
  }
  document.getElementById('btn-add').onclick = addToCart;
  document.getElementById('btn-buy').onclick = () => { if (addToCart()) location.href = 'checkout.html'; };

  // share buttons
  const url = location.href.split('#')[0];
  const shareText = `${productName(p)} — ${money(p.price)}\n${url}`;
  document.getElementById('sh-wa').href =
    `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  document.getElementById('sh-fb').href =
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  document.getElementById('sh-copy').textContent = LANG === 'ar' ? 'نسخ الرابط' : 'Copier le lien';
  document.getElementById('sh-copy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast(LANG === 'ar' ? 'تم نسخ الرابط ✓' : 'Lien copié ✓');
    } catch { /* clipboard blocked */ }
  };

  const sgBtn = document.getElementById('btn-sizeguide');
  if (sgBtn) sgBtn.onclick = openSizeGuide;
}

function openSizeGuide() {
  const rows = [
    ['S', 44, 96, 68], ['M', 46, 102, 70], ['L', 48, 108, 72],
    ['XL', 50, 114, 74], ['XXL', 52, 120, 76],
  ];
  const el = document.createElement('div');
  el.className = 'modal-bg';
  el.innerHTML = `<div class="modal">
    <h3 style="margin-bottom:4px">${t('size_guide')}</h3>
    <table>
      <thead><tr><th>${t('size_label')}</th><th>${t('sg_shoulder')}</th>
        <th>${t('sg_chest')}</th><th>${t('sg_length')}</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody>
    </table>
    <p class="sg-note">${t('sg_note')}</p>
    <div style="margin-top:14px;text-align:end"><button class="btn small" id="sg-close">${LANG === 'ar' ? 'إغلاق' : 'Fermer'}</button></div>
  </div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el || e.target.id === 'sg-close') el.remove(); });
}

async function loadRelated() {
  if (!PDP.category_id) return;
  const items = (await DB.listProducts({ category: PDP.category_id }))
    .filter(x => x.id !== PDP.id).slice(0, 4);
  if (!items.length) return;
  document.getElementById('related-wrap').style.display = '';
  document.getElementById('related-grid').innerHTML = items.map(cardHtml).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  renderChrome('');
  const id = new URLSearchParams(location.search).get('id');
  try {
    PDP = await DB.getProduct(id);
  } catch (e) { console.error(e); }
  if (!PDP) {
    document.getElementById('pdp-root').innerHTML =
      `<p style="padding:70px 0;text-align:center;color:var(--ink-soft)">${t('no_results')}
        <br><br><a class="btn ghost" href="shop.html">${t('cart_continue')}</a></p>`;
    applyI18n();
    return;
  }
  renderPdp();
  loadRelated();
  recordRecent();
  renderRecent();
  applyI18n();
  if (window.Ads) Ads.event('ViewContent', {
    content_name: productName(PDP), content_ids: [String(PDP.id)],
    value: Number(PDP.price) || 0,
  });
});

/* P7 — recently viewed (localStorage, most recent first) */
const RECENT_KEY = 'ud_recent';

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
  catch { return []; }
}

function recordRecent() {
  const ids = getRecent().filter(x => x !== PDP.id);
  ids.unshift(PDP.id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 10)));
}

async function renderRecent() {
  const ids = getRecent().filter(id => id !== PDP.id).slice(0, 4);
  if (!ids.length) return;
  const all = await DB.listProducts();
  const items = ids.map(id => all.find(p => p.id === id)).filter(Boolean);
  if (!items.length) return;
  document.getElementById('recent-wrap').style.display = '';
  document.getElementById('recent-grid').innerHTML = items.map(cardHtml).join('');
}

document.addEventListener('lang:changed', () => location.reload());
