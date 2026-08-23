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
function rankRows(items, max) {
  return items.map(([label, sub, val, rev]) => `
    <div class="rank-row">
      <span class="rank-name">${esc(label)}</span>
      <div class="rank-bar"><div class="bar-fill h" style="width:${Math.round(val / max * 100)}%"></div></div>
      <b>${sub}</b><small>${money(rev)}</small>
    </div>`).join('');
}

function tabStats() {
  const valid = CACHE.orders.filter(o => o.status !== 'cancelled');
  const revenue = valid.reduce((sum, o) => sum + Number(o.total), 0);

  /* best sellers by quantity */
  const byProduct = {};
  valid.forEach(o => (o.items || []).forEach(it => {
    const id = it.product_id;
    if (!byProduct[id]) byProduct[id] = { name: it.name_fr || it.name_ar || ('#' + id), qty: 0, rev: 0 };
    byProduct[id].qty += Number(it.qty) || 0;
    byProduct[id].rev += (Number(it.price) || 0) * (Number(it.qty) || 0);
  }));
  const best = Object.values(byProduct).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const bestMax = Math.max(1, ...best.map(b => b.qty));

  /* revenue per day, last 14 days */
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

  /* top wilayas by revenue */
  const byZone = {};
  valid.forEach(o => {
    if (!byZone[o.zone]) byZone[o.zone] = { n: 0, rev: 0 };
    byZone[o.zone].n += 1;
    byZone[o.zone].rev += Number(o.total);
  });
  const topZones = Object.entries(byZone)
    .sort((a, b) => b[1].rev - a[1].rev).slice(0, 5);
  const zoneMax = Math.max(1, ...topZones.map(z => z[1].rev));

  return `
  <div class="stat-grid">
    <div class="stat-card"><div class="v">${valid.filter(o => o.status === 'new').length}</div><div class="k">À confirmer</div></div>
    <div class="stat-card"><div class="v">${CACHE.orders.length}</div><div class="k">Commandes</div></div>
    <div class="stat-card"><div class="v">${valid.length}</div><div class="k">Valides</div></div>
    <div class="stat-card"><div class="v">${money(revenue)}</div><div class="k">Chiffre (COD)</div></div>
  </div>

  <div class="stats-layout">
    <div class="card-panel">
      <h3>Chiffre — 14 derniers jours</h3>
      <div class="bars">
        ${days.map(d => `
          <div class="bar-col" title="${d} : ${money(byDay[d] || 0)}">
            <span class="bar-v">${byDay[d] ? Math.round(byDay[d] / 1000) + 'k' : ''}</span>
            <div class="bar-track"><div class="bar-fill" style="height:${Math.round((byDay[d] || 0) / dayMax * 100)}%"></div></div>
            <span class="bar-l">${d.slice(8)}</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="card-panel">
      <h3>Meilleures ventes</h3>
      ${rankRows(best.map(b => [b.name, b.qty, b.qty, b.rev]), bestMax)}
      <h3 style="margin-top:24px">Top wilayas</h3>
      ${rankRows(topZones.map(([name, z]) => [name, z.n + ' cmd', z.rev, z.rev]), zoneMax)}
    </div>
  </div>`;
}

/* ---------- orders ---------- */