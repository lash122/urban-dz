/* URBAN DZ — checkout: COD order form, per-wilaya fees, stopdesk/home */
let SETTINGS = null;
let deliveryType = 'home';
let promo = { code: '', percent: 0 };

function zoneFee(zoneName) {
  if (!SETTINGS) return null;
  const z = (SETTINGS.zones || []).find(z => z.name === zoneName);
  if (!z) return null;
  return deliveryType === 'desk' ? (z.desk ?? z.home ?? z.fee) : (z.home ?? z.fee);
}

function totals() {
  const sub = Cart.subtotal();
  const discount = Math.round(sub * promo.percent / 100);
  const zone = document.getElementById('f-zone') ? document.getElementById('f-zone').value : '';
  let fee = zoneFee(zone);
  if (fee == null) fee = null; // unknown yet
  const freeFrom = Number(SETTINGS && SETTINGS.free_delivery_from) || 0;
  let isFree = false;
  if (freeFrom > 0 && sub - discount >= freeFrom) { fee = 0; isFree = true; }
  return { sub, discount, fee, total: sub - discount + (fee || 0), isFree };
}

function renderSummary() {
  const box = document.getElementById('summary');
  if (!box) return;
  const tt = totals();
  document.querySelectorAll('[data-type-fee]').forEach(el => {
    const savedType = deliveryType;
    deliveryType = el.dataset.typeFee;
    const f = zoneFee(document.getElementById('f-zone')?.value || '');
    el.textContent = f != null ? money(f) : '—';
    deliveryType = savedType;
  });
  box.innerHTML = Cart.items.map(it => `
    <div class="sum-row"><span>${esc(productName(it))} × ${it.qty}${it.color ? ` · ${colorDot(it.color)}${esc(colorName(it.color))}` : ''}${it.size ? ` - ${t('size_label')} ${esc(it.size)}` : ''}</span>
      <b>${money(it.price * it.qty)}</b></div>`).join('') + `
    ${tt.discount ? `<div class="sum-row"><span data-i18n="discount">${t('discount')}</span>
      <b style="color:var(--ok)">−${money(tt.discount)}</b></div>` : ''}
    <div class="sum-row"><span data-i18n="fee">${t('fee')}</span>
      <b>${tt.fee == null ? '—' : (tt.isFree ? t('free') : money(tt.fee))}</b></div>
    <div class="sum-row total"><span data-i18n="total">${t('total')}</span><b>${money(tt.total)}</b></div>`;
}

function renderCheckout() {
  const root = document.getElementById('co-root');
  if (!Cart.items.length) {
    root.innerHTML = `
      <div style="text-align:center;padding:60px 0">
        <p style="color:var(--ink-soft);margin-bottom:24px" data-i18n="cart_empty">${t('cart_empty')}</p>
        <a class="btn" href="shop.html" data-i18n="cart_continue">${t('cart_continue')}</a>
      </div>`;
    applyI18n();
    return;
  }

  root.innerHTML = `
  <div class="page-head"><h1 data-i18n="co_title"></h1></div>
  <form id="co-form" class="co-layout" style="padding-bottom:56px" novalidate>
    <div>
      <div class="panel">
        <h3 data-i18n="co_contact"></h3>
        <div class="field">
          <label for="f-name" data-i18n="co_name"></label>
          <input id="f-name" required maxlength="120" data-i18n-ph="co_name_ph" autocomplete="name">
        </div>
        <div class="field">
          <label for="f-phone" data-i18n="co_phone"></label>
          <input id="f-phone" required inputmode="tel" maxlength="20" placeholder="05 XX XX XX XX" autocomplete="tel">
        </div>
      </div>

      <div class="panel">
        <h3 data-i18n="co_delivery"></h3>
        <div class="field">
          <label for="f-zone" data-i18n="co_zone"></label>
          <select id="f-zone" required>
            <option value="" data-i18n="co_zone_ph"></option>
            ${(SETTINGS.zones || []).map(z => `<option value="${esc(z.name)}">${esc(z.code)} — ${esc(z.name)}</option>`).join('')}
          </select>
        </div>
        <label class="opt-label" style="margin-top:4px" data-i18n="co_delivery"></label>
        <div class="radio-cards">
          <label class="radio-card checked">
            <input type="radio" name="dtype" value="home" checked>
            <span data-i18n="co_type_home"></span><span class="fee-tag" data-type-fee="home">—</span>
          </label>
          <label class="radio-card">
            <input type="radio" name="dtype" value="desk">
            <span data-i18n="co_type_desk"></span><span class="fee-tag" data-type-fee="desk">—</span>
          </label>
        </div>
        <div class="field">
          <label for="f-address" data-i18n="co_addr"></label>
          <textarea id="f-address" data-i18n-ph="co_addr_ph"></textarea>
        </div>
      </div>

      <div class="panel">
        <h3 data-i18n="co_payment"></h3>
        <div class="cod-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#96733f" stroke-width="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>
          <span data-i18n="cod_only"></span>
        </div>
      </div>
    </div>

    <aside class="summary-card">
      <h3 data-i18n="summary"></h3>
      <div id="summary"></div>
      <div class="promo-row">
        <input id="f-promo" data-i18n-ph="promo_ph" autocomplete="off">
        <button type="button" class="btn ghost" id="btn-promo" data-i18n="apply"></button>
      </div>
      <p class="promo-msg" id="promo-msg" hidden></p>
      <button type="submit" class="btn accent block" id="btn-submit" data-i18n="place_order"></button>
      <p class="promo-msg bad" id="form-msg" hidden style="margin-top:10px"></p>
    </aside>
  </form>`;

  renderSummary();

  const form = document.getElementById('co-form');
  form.addEventListener('change', e => {
    if (e.target.name === 'dtype') {
      deliveryType = e.target.value;
      form.querySelectorAll('.radio-card').forEach(c =>
        c.classList.toggle('checked', c.querySelector('input').checked));
      const addrField = document.getElementById('f-address').closest('.field');
      addrField.style.display = deliveryType === 'home' ? '' : 'none';
      renderSummary();
    }
    if (e.target.id === 'f-zone') renderSummary();
  });

  // promo
  document.getElementById('btn-promo').onclick = async () => {
    const msg = document.getElementById('promo-msg');
    msg.hidden = false;
    try {
      const c = await DB.checkPromo(document.getElementById('f-promo').value, Cart.subtotal());
      promo = { code: c.code, percent: c.percent };
      msg.className = 'promo-msg ok';
      msg.textContent = t('promo_ok').replace('{p}', c.percent);
    } catch (e) {
      promo = { code: '', percent: 0 };
      msg.className = 'promo-msg bad';
      msg.textContent = e.message === 'PROMO_MIN_ORDER' ? 'Min. non atteint' : t('promo_bad');
    }
    renderSummary();
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('f-name').value.trim();
    const phone = document.getElementById('f-phone').value.trim();
    const zone = document.getElementById('f-zone').value;
    const address = document.getElementById('f-address').value.trim();
    const msgEl = document.getElementById('form-msg');

    function fail(textKey) {
      msgEl.hidden = false;
      msgEl.textContent = t(textKey);
    }

    if (!DB.validDzPhone(phone)) return fail('invalid_phone');
    if (!name || !zone || (deliveryType === 'home' && !address)) return fail('fill_fields');

    const btn = document.getElementById('btn-submit');
    btn.disabled = true;
    btn.textContent = t('placing');
    try {
      const order = await DB.placeOrder({
        name, phone, address, zone,
        deliveryType,
        items: Cart.items.map(i => ({ id: i.id, size: i.size, color: i.color, qty: i.qty })),
        promoCode: promo.code,
      });
      Cart.clear();
      showSuccess(order);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = t('place_order');
      msgEl.hidden = false;
      msgEl.textContent =
        err.message === 'INVALID_PHONE' ? t('invalid_phone')
        : err.message === 'TOO_MANY_ORDERS' ? 'Trop de commandes — réessayez plus tard.'
        : t('fill_fields') + (err.message && err.message !== 'ORDER_FAILED' && err.message !== 'MISSING_FIELDS'
            ? ` (${err.message})` : '');
    }
  });

  applyI18n();

  if (window.Ads) Ads.event('InitiateCheckout', {
    value: Cart.subtotal(), num_items: Cart.count(),
  });
}

function showSuccess(order) {
  const waBtn = window.WHATSAPP ? `
      <a href="${waOrderUrl(order)}" target="_blank" rel="noopener"
         class="btn block" style="margin-top:12px;background:#25d366;border-color:#25d366">
        ${t('ok_wa_share')}</a>` : '';
  document.getElementById('co-root').innerHTML = `
    <div class="success-box">
      <div class="check">✓</div>
      <h1>${t('ok_title')}</h1>
      <p>${t('ok_body').replace('{id}', order.id)}</p>
      <a href="track.html?id=${order.id}" class="btn accent">${t('ok_track')}</a>
      ${waBtn}
    </div>`;
  window.scrollTo(0, 0);
  if (window.Ads) Ads.event('Purchase', {
    value: Number(order.total) || 0, num_items: (order.items || []).length,
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  renderChrome('');
  try { SETTINGS = await DB.getSettings(); } catch (e) { console.error(e); SETTINGS = { zones: [] }; }
  renderCheckout();
});

document.addEventListener('lang:changed', () => location.reload());
