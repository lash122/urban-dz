/* URBAN DZ — order tracking */
const STEPS = ['new', 'confirmed', 'shipped', 'delivered'];

function renderOrder(o) {
  const idx = STEPS.indexOf(o.status);
  const cancelled = o.status === 'cancelled';
  const result = document.getElementById('t-result');
  result.innerHTML = `
  <div class="panel" style="max-width:560px;margin:40px auto 60px">
    <h3 style="margin-bottom:4px">${t('order_no')} #${o.id}</h3>
    <div style="color:var(--ink-soft);font-size:.88rem;margin-bottom:8px">
      ${new Date(o.created_at).toLocaleString(LANG === 'ar' ? 'ar-DZ' : 'fr-DZ')}
      · ${esc(o.zone)} · ${o.delivery_type === 'desk' ? t('co_type_desk') : t('co_type_home')}
    </div>

    ${cancelled
      ? `<p style="color:var(--danger);font-weight:700;padding-block:10px">${t('st_cancelled')}</p>`
      : `<ul class="timeline">
          ${STEPS.map((s, i) => `
            <li class="${i <= idx ? 'done' : ''}"><span class="dot"></span>${t('st_' + s)}</li>`).join('')}
        </ul>`}

    ${o.carrier || o.tracking_number ? `
      <div class="sum-row"><span>${t('carrier')} / ${t('tracking_no')}</span>
        <b>${esc(o.carrier || '')} ${esc(o.tracking_number || '')}</b></div>` : ''}

    <div style="border-top:1px solid var(--line);margin-top:12px;padding-top:10px">
      ${(o.items || []).map(it => `
        <div class="sum-row"><span>${esc(productName(it))} × ${it.qty}${it.color ? ` · ${colorDot(it.color)}${esc(colorName(it.color))}` : ''}${it.size ? ` (${esc(it.size)})` : ''}</span>
          <span>${money(it.price * it.qty)}</span></div>`).join('')}
      ${o.discount ? `<div class="sum-row"><span>${t('discount')}</span><b style="color:var(--ok)">−${money(o.discount)}</b></div>` : ''}
      <div class="sum-row"><span>${t('fee')}</span><b>${o.delivery_fee ? money(o.delivery_fee) : t('free')}</b></div>
      <div class="sum-row total"><span>${t('total')}</span><b>${money(o.total)}</b></div>
    </div>
  </div>`;
}

async function doTrack(e) {
  e.preventDefault();
  const id = document.getElementById('t-id').value.trim();
  const phone = document.getElementById('t-phone').value.trim();
  const msg = document.getElementById('t-msg');
  msg.hidden = true;
  if (!id || !phone) return;
  try {
    const order = await DB.trackOrder(id, phone);
    renderOrder(order);
  } catch {
    document.getElementById('t-result').innerHTML = '';
    msg.hidden = false;
    msg.textContent = t('not_found');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderChrome('track');
  document.getElementById('track-form').addEventListener('submit', doTrack);
  const preId = new URLSearchParams(location.search).get('id');
  if (preId) document.getElementById('t-id').value = preId;
});

document.addEventListener('lang:changed', () => location.reload());
