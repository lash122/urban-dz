/* URBAN DZ — cart page: lines, free-delivery progress, upsell */
let FREE_FROM = 0;

function renderCart() {
  const root = document.getElementById('cart-root');
  if (!Cart.items.length) {
    root.innerHTML = `
      <div style="text-align:center;padding:60px 0">
        <p style="color:var(--ink-soft);margin-bottom:24px" data-i18n="cart_empty">${t('cart_empty')}</p>
        <a class="btn" href="shop.html" data-i18n="cart_continue">${t('cart_continue')}</a>
      </div>`;
    applyI18n();
    return;
  }

  const sub = Cart.subtotal();
  const pct = FREE_FROM > 0 ? Math.min(100, Math.round(sub / FREE_FROM * 100)) : 0;
  const freeBar = FREE_FROM > 0 ? `
    <div class="free-bar${sub >= FREE_FROM ? ' done' : ''}">
      ${sub >= FREE_FROM ? t('free_done') : t('free_left').replace('{v}', money(FREE_FROM - sub))}
      <div class="free-track"><div class="free-fill" style="width:${pct}%"></div></div>
    </div>` : '';

  const n = Cart.count();
  root.innerHTML = `
  <div class="cart-layout" style="padding-block:20px 50px">
    <div>
      <div class="cart-lines">
        ${Cart.items.map((it, i) => `
          <div class="cart-line">
            <img src="${esc(it.photo || placeholder(LANG === 'ar' ? it.name_ar : it.name_fr, (it.id * 47) % 360))}" alt="">
            <div>
              <h3>${esc(productName(it))}</h3>
              <div class="muted">${money(it.price)}
                ${it.color ? ` · ${colorDot(it.color)}${esc(colorName(it.color))}` : ''}
                ${it.size ? ` · ${t('size_label')} ${esc(it.size)}` : ''}</div>
              <span class="qty-stepper" style="margin-top:8px">
                <button data-dec="${i}">−</button><output>${it.qty}</output><button data-inc="${i}">+</button>
              </span>
            </div>
            <div class="line-end">
              <b>${money(it.price * it.qty)}</b>
              <button class="line-remove" data-rm="${i}" data-i18n="remove">${t('remove')}</button>
            </div>
          </div>`).join('')}
      </div>
      <div id="upsell-slot" style="margin-top:34px"></div>
    </div>
    <aside class="summary-card">
      <h3 data-i18n="summary">${t('summary')}</h3>
      <div class="sum-row"><span data-i18n="subtotal">${t('subtotal')}</span><b>${money(sub)}</b></div>
      <div class="sum-row"><span>${n} ${n === 1 ? t('item') : t('items')}</span></div>
      <div class="sum-row total"><span data-i18n="total">${t('total')}</span><b>${money(sub)}</b></div>
      ${freeBar}
      <a href="checkout.html" class="btn accent block" style="margin-top:18px" data-i18n="to_checkout">${t('to_checkout')}</a>
      <div class="promo-note">
        <b data-i18n="promo_note_title">${t('promo_note_title')}</b>
        <div data-i18n="promo_note_body">${t('promo_note_body')}</div>
      </div>
    </aside>
  </div>`;
  loadUpsell();
}

async function loadUpsell() {
  if (!FREE_FROM && !Cart.items.length) return;
  const slot = document.getElementById('upsell-slot');
  if (!slot || !slot.isConnected) return;
  try {
    const inCart = new Set(Cart.items.map(i => i.id));
    const all = await DB.listProducts();
    const suggestions = all
      .filter(p => !inCart.has(p.id))
      .sort((a, b) =>
        ((b.compare_at_price > b.price) ? 1 : 0) - ((a.compare_at_price > a.price) ? 1 : 0)
        || a.price - b.price)
      .slice(0, 4);
    if (!suggestions.length) { slot.innerHTML = ''; return; }
    slot.innerHTML = `
      <div class="section-head"><h2 style="font-size:1.2rem">${t('upsell_title')}</h2></div>
      <div class="upsell-grid">
        ${suggestions.map(p => `
          <div class="up-card" data-up-id="${p.id}">
            <img src="${esc(productPhoto(p))}" alt="" loading="lazy">
            <div class="up-name">${esc(productName(p))}</div>
            <div class="price"><span class="price-now">${money(p.price)}</span>
              ${p.compare_at_price > p.price ? `<span class="badge-sale">−${Math.round(100 - p.price / p.compare_at_price * 100)}%</span>` : ''}</div>
            ${p.sizes && p.sizes.length
              ? `<select data-up-size>${p.sizes.map(s => `<option value="${esc(s)}">${t('size_label')} ${esc(s)}</option>`).join('')}</select>`
              : ''}
            <button class="btn accent" data-up-add="${p.id}">${t('add_cart')}</button>
          </div>`).join('')}
      </div>`;
  } catch { /* upsell is optional */ }
}

document.addEventListener('click', async e => {
  const btn = e.target.closest('[data-up-add]');
  if (!btn) return;
  e.preventDefault();
  const card = btn.closest('[data-up-id]');
  const sizeSel = card.querySelector('[data-up-size]');
  try {
    const p = await DB.getProduct(+card.dataset.upId);
    if (!p) return;
    Cart.add(p, sizeSel ? sizeSel.value : '', (p.colors && p.colors[0]) || '', 1);
    toast(t('added'));
    if (window.Ads) Ads.event('AddToCart', {
      content_name: productName(p), content_ids: [String(p.id)], value: Number(p.price) || 0,
    });
  } catch { /* ignore */ }
});

document.addEventListener('DOMContentLoaded', async () => {
  renderChrome('shop');
  try {
    const s = await DB.getSettings();
    FREE_FROM = Number(s.free_delivery_from) || 0;
  } catch { FREE_FROM = 0; }
  renderCart();

  document.getElementById('cart-root').addEventListener('click', e => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const rm = e.target.closest('[data-rm]');
    if (inc) { Cart.updateQty(+inc.dataset.inc, Cart.items[+inc.dataset.inc].qty + 1); }
    if (dec) { Cart.updateQty(+dec.dataset.dec, Cart.items[+dec.dataset.dec].qty - 1); }
    if (rm) { Cart.remove(+rm.dataset.rm); }
    if (inc || dec || rm) renderCart();
  });

  document.addEventListener('cart:changed', renderCart);
});
document.addEventListener('lang:changed', () => location.reload());
