/* URBAN DZ — owner dashboard, part 1: shell, login, orders */
const root = document.getElementById('admin-root');
let TAB = 'orders';
let CACHE = { products: [], categories: [], orders: [], zones: [], settings: {} };

const STATUS_FR = {
  new: 'Reçue', confirmed: 'Confirmée', shipped: 'Expédiée',
  delivered: 'Livrée', cancelled: 'Annulée',
};

/* ---------- login ---------- */
function renderLogin() {
  root.innerHTML = `
  <form class="login-box" id="login-form">
    <a class="logo" href="index.html">URBAN<span>DZ</span></a>
    <h1 style="margin-top:18px">${t('admin')}</h1>
    <input id="l-email" type="email" placeholder="Email" required autocomplete="username">
    <input id="l-pass" type="password" placeholder="${LANG === 'ar' ? 'كلمة المرور' : 'Mot de passe'}" required autocomplete="current-password">
    <p class="login-err" id="l-err"></p>
    <button class="btn accent block">${t('login')}</button>
  </form>`;
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await DB.Admin.signIn(
        document.getElementById('l-email').value.trim(),
        document.getElementById('l-pass').value);
      boot();
    } catch (err) {
      document.getElementById('l-err').textContent =
        /invalid/i.test(err.message) ? 'Email ou mot de passe incorrect.' : err.message;
    }
  });
}

/* ---------- shell ---------- */
function renderShell() {
  const tabs = [
    ['stats', 'Statistiques'], ['orders', 'Commandes'], ['products', 'Produits'],
    ['categories', 'Catégories'], ['zones', 'Zones'], ['settings', 'Boutique'], ['promos', 'Codes promo'],
  ];
  root.innerHTML = `
  <div class="admin-top">
    <a class="logo" href="index.html">URBAN<span>DZ</span></a>
    <span class="spacer"></span>
    <button class="icon-btn" id="alerts-btn">🔔 ${LANG === 'ar' ? 'تفعيل التنبيهات' : 'Activer les alertes'}</button>
    <a class="btn ghost small" href="index.html">${t('nav_home')}</a>
    <button class="btn small" id="btn-out">${t('logout')}</button>
  </div>
  <div class="tabs">${tabs.map(([id, label]) =>
    `<button class="tab-btn${TAB === id ? ' active' : ''}" data-tab="${id}">${label}</button>`).join('')}</div>
  <div id="tab-body"></div>`;

  root.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
    TAB = b.dataset.tab;
    renderShell();
  }));
  document.getElementById('btn-out').onclick = async () => {
    await DB.Admin.signOut(); location.reload();
  };

  const body = document.getElementById('tab-body');
  const views = {
    stats: tabStats, orders: tabOrders, products: tabProducts,
    categories: tabCategories, zones: tabZones, settings: tabSettings, promos: tabPromos,
  };
  const out = views[TAB]();
  if (out instanceof Promise) out.then(html => { body.innerHTML = html; });
  else body.innerHTML = out;
}

async function loadAll() {
  const T = DB.Admin.table;
  const [prod, cat, ord, set] = await Promise.all([
    T('products').select('*').order('id', { ascending: false }),
    T('categories').select('*').order('sort'),
    T('orders').select('*').order('created_at', { ascending: false }),
    T('settings').select('*'),
  ]);
  const err = prod.error || cat.error || ord.error || set.error;
  if (err) throw err;
  CACHE.products = prod.data;
  CACHE.categories = cat.data;
  CACHE.orders = ord.data;
  CACHE.settings = {};
  set.data.forEach(r => { CACHE.settings[r.key] = r.value; });
  CACHE.zones = CACHE.settings.zones || [];
}

async function refresh() {
  try { await loadAll(); } catch (e) { alert(e.message); }
  renderShell();
}

async function setStatus(id, status) {
  await DB.Admin.table('orders').update({ status }).eq('id', id);
  refresh();
}

/* ---------- stats ---------- */
function tabStats() {
  const valid = CACHE.orders.filter(o => o.status !== 'cancelled');
  const revenue = valid.reduce((s, o) => s + Number(o.total), 0);

  // best sellers — by quantity sold
  const byProduct = {};
  valid.forEach(o => (o.items || []).forEach(it => {
    const id = it.product_id;
    if (!byProduct[id]) byProduct[id] = { name: it.name_fr || it.name_ar || `#${id}`, qty: 0, rev: 0 };
    byProduct[id].qty += Number(it.qty) || 0;
    byProduct[id].rev += (Number(it.price) || 0) * (Number(it.qty) || 0);
  }));
  const best = Object.values(byProduct).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const bestMax = Math.max(1, ...best.map(b => b.qty));

  // revenue per day — last 14 days
  const days = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const byDay = {};
  valid.forEach(o => {
    const d = String(o.created_at).slice(0, 10);
    byDay[d] = (byDay[d] || 0) + Number(o.total);
  });
  const dayMax = Math.max(1, ...days.map(d => byDay[d] || 0));

  // top wilayas
  const byZone = {};
  valid.forEach(o => {
    if (!byZone[o.zone]) byZone[o.zone] = { n: 0, rev: 0 };
    byZone[o.zone].n += 1;
    byZone[o.zone].rev += Number(o.total);
  });
  const zones = Object.entries(byZone).sort((a, b) => b[1].rev - a[1].rev).slice(0, 5);
  const zoneMax = Math.max(1, ...zones.map(z => z[1].rev));

  return `<div class="card-panel"><h2>Statistiques</h2>
    <div class="stat-grid">
      <div class="stat-card"><div class="v">${CACHE.orders.length}</div><div class="k">Commandes</div></div>
      <div class="stat-card"><div class="v">${valid.length}</div><div class="k">Valides</div></div>
      <div class="stat-card"><div class="v">${money(revenue)}</div><div class="k">Chiffre (COD)</div></div>
      <div class="stat-card"><div class="v">${CACHE.products.length}</div><div class="k">Produits</div></div>
      <div class="stat-card"><div class="v">${valid.filter(o => o.status === 'new').length}</div><div class="k">À confirmer</div></div>
    </div>

    <h2 style="margin-top:26px">Chiffre des 14 derniers jours</h2>
    <div class="bars">
      ${days.map(d => `
        <div class="bar-col" title="${d} : ${money(byDay[d] || 0)}">
          <span class="bar-v">${byDay[d] ? Math.round(byDay[d] / 1000) + 'k' : ''}</span>
          <div class="bar-track"><div class="bar-fill" style="height:${Math.round((byDay[d] || 0) / dayMax * 100)}%"></div></div>
          <span class="bar-l">${d.slice(8)}</span>
        </div>`).join('')}
    </div>

    <div class="stats-two-col">
      <div>
        <h2 style="margin-top:26px">Meilleures ventes</h2>
        ${best.length ? best.map(b => `
          <div class="rank-row">
            <span class="rank-name">${esc(b.name)}</span>
            <div class="rank-bar"><div class="bar-fill h" style="width:${Math.round(b.qty / bestMax * 100)}%"></div></div>
            <b>${b.qty}</b><small>${money(b.rev)}</small>
          </div>`).join('') : '<p style="color:var(--ink-soft)">Pas encore de ventes.</p>'}
      </div>
      <div>
        <h2 style="margin-top:26px">Top wilayas</h2>
        ${zones.length ? zones.map(([name, z]) => `
          <div class="rank-row">
            <span class="rank-name">${esc(name)}</span>
            <div class="rank-bar"><div class="bar-fill h" style="width:${Math.round(z.rev / zoneMax * 100)}%"></div></div>
            <b>${z.n}</b><small>${money(z.rev)}</small>
          </div>`).join('') : '<p style="color:var(--ink-soft)">Pas encore de commandes.</p>'}
      </div>
    </div>
  </div>`;
}

/* ---------- orders ---------- */
function tabOrders() {
  const rows = CACHE.orders.map(o => `
    <tr>
      <td><b>#${o.id}</b>${o.promo_code ? `<br><small style="color:var(--accent-dark)">${esc(o.promo_code)}</small>` : ''}</td>
      <td>${new Date(o.created_at).toLocaleDateString('fr-DZ')}</td>
      <td>${esc(o.customer_name)}<br><small>${esc(o.phone)}</small></td>
      <td>${esc(o.zone)}<br><small>${o.delivery_type === 'desk' ? 'stopdesk' : 'domicile'}</small></td>
      <td><b>${money(o.total)}</b></td>
      <td><span class="pill ${o.status}">${STATUS_FR[o.status]}</span></td>
      <td><div class="row-actions">
        <button class="icon-btn" data-view="${o.id}">Voir</button>
        ${o.status === 'new' ? `<button class="icon-btn" data-advance="${o.id}" data-next="confirmed">→ Confirmée</button>` : ''}
        ${o.status === 'confirmed' ? `<button class="icon-btn" data-advance="${o.id}" data-next="shipped">→ Expédiée</button>` : ''}
        ${o.status === 'shipped' ? `<button class="icon-btn" data-advance="${o.id}" data-next="delivered">→ Livrée</button>` : ''}
        ${(o.status !== 'cancelled' && o.status !== 'delivered')
          ? `<button class="icon-btn danger" data-cancel="${o.id}">Annuler</button>` : ''}
      </div></td>
    </tr>`).join('');
  return `<div class="card-panel"><h2>Commandes (${CACHE.orders.length})</h2>
  <table class="tbl"><thead><tr>
    <th>N°</th><th>Date</th><th>Client</th><th>Zone</th><th>Total</th><th>Statut</th><th></th>
  </tr></thead><tbody>
  ${rows || '<tr><td colspan="7" style="text-align:center;color:var(--ink-soft)">Aucune commande.</td></tr>'}
  </tbody></table></div>`;
}

/* ---------- new-order alerts: chime + notification + tab counter ---------- */
const Alerts = {
  KEY: 'ud_admin_seen',
  timer: null,
  seen: null,
  armed: false,          // false until first poll — no chime storm on login

  init() {
    try { this.seen = JSON.parse(localStorage.getItem(this.KEY)); } catch { this.seen = null; }
    if (!Array.isArray(this.seen)) this.seen = CACHE.orders.map(o => o.id);
    this.timer = setInterval(() => this.check(), 30000);
    this.check();
  },

  async check() {
    try {
      const T = DB.Admin.table;
      const { data, error } = await T('orders').select('id').order('id', { ascending: false }).limit(30);
      if (error || !data) return;
      const ids = data.map(o => o.id);
      const fresh = ids.filter(id => !this.seen.includes(id));

      // pill in the tab title: every order still awaiting confirmation
      const { count } = await T('orders').select('id', { count: 'exact', head: true }).eq('status', 'new');
      document.title = (count ? `(${count}) ` : '') + 'Admin — URBAN DZ';

      if (fresh.length && this.armed) {
        this.chime();
        this.notify(fresh.length);
        refresh();
      }
      if (fresh.length) {
        this.seen = ids;
        localStorage.setItem(this.KEY, JSON.stringify(this.seen));
      }
      this.armed = true;
    } catch { /* offline tick — retry next interval */ }
  },

  chime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      o.start(); o.stop(ctx.currentTime + 0.75);
    } catch { /* audio needs a prior user gesture in some browsers */ }
  },

  notify(n) {
    if (window.Notification && Notification.permission === 'granted') {
      new Notification('URBAN DZ', { body: `${n} nouvelle(s) commande(s) !` });
    }
  },
};

document.addEventListener('click', e => {
  if (!e.target.closest('#alerts-btn')) return;
  if (window.Notification && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  toast(LANG === 'ar' ? 'تم تفعيل التنبيهات ✓' : 'Alertes activées ✓');
});

function orderModal(o) {
  const el = document.createElement('div');
  el.className = 'modal-bg';
  el.innerHTML = `<div class="modal">
    <h2 style="margin-bottom:14px">Commande #${o.id} — <span class="pill ${o.status}">${STATUS_FR[o.status]}</span></h2>
    <p><b>${esc(o.customer_name)}</b> — ${esc(o.phone)}</p>
    <p style="color:var(--ink-soft);font-size:.9rem;margin-bottom:12px">
      ${esc(o.zone)} · ${o.delivery_type === 'desk' ? 'Stopdesk' : 'À domicile'}<br>${esc(o.address)}</p>
    ${(o.items || []).map(it => `
      <div class="sum-row"><span>${esc(it.name_fr || it.name_ar)} × ${it.qty}${it.color ? ` · ${esc(it.color)}` : ''}${it.size ? ` (${esc(it.size)})` : ''}</span>
        <b>${money(it.price * it.qty)}</b></div>`).join('')}
    ${o.discount ? `<div class="sum-row"><span>Remise ${esc(o.promo_code)}</span><b>−${money(o.discount)}</b></div>` : ''}
    <div class="sum-row"><span>Livraison</span><b>${money(o.delivery_fee)}</b></div>
    <div class="sum-row total"><span>Total à encaisser</span><b>${money(o.total)}</b></div>
    <div style="border-top:1px solid var(--line);margin-top:16px;padding-top:14px">
      <label style="font-size:.85rem;font-weight:600">Expédition</label>
      <div class="form-grid" style="margin-top:8px">
        <input id="m-carrier" placeholder="Transporteur (Yalidine, ZR…)" value="${esc(o.carrier)}">
        <input id="m-track" placeholder="N° du colis / tracking" value="${esc(o.tracking_number)}">
      </div>
      <div class="row-actions" style="margin-top:12px">
        <button class="btn small accent" id="m-save">Enregistrer expédition</button>
        <button class="icon-btn" id="m-close">Fermer</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(el);
  el.querySelector('#m-close').onclick = () => el.remove();
  el.addEventListener('click', e => { if (e.target === el) el.remove(); });
  el.querySelector('#m-save').onclick = async () => {
    await DB.Admin.table('orders').update({
      carrier: el.querySelector('#m-carrier').value.trim(),
      tracking_number: el.querySelector('#m-track').value.trim(),
    }).eq('id', o.id);
    el.remove(); refresh();
  };
}
