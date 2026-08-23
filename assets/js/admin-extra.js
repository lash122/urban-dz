/* URBAN DZ — owner dashboard, part 2: products, categories, zones, settings, promos */

/* ---------- products ---------- */
function tabProducts() {
  const rows = CACHE.products.map(p => `
    <tr>
      <td><img class="thumb" src="${esc((p.photos && p.photos[0]) || placeholder(p.name_fr))}" alt=""></td>
      <td><b>${esc(p.name_fr)}</b><br><small>${esc(p.name_ar)}</small></td>
      <td>${money(p.price)}${p.compare_at_price > p.price
        ? `<br><s style="color:var(--ink-soft)">${money(p.compare_at_price)}</s>` : ''}</td>
      <td>${p.stock}</td>
      <td>${(CACHE.categories.find(c => c.id === p.category_id) || {}).name_fr || '—'}</td>
      <td>${p.active ? '<span class="pill delivered">Actif</span>' : '<span class="pill cancelled">Masqué</span>'}
        ${p.featured ? '<br><small style="color:var(--accent-dark)">★ Sélection</small>' : ''}</td>
      <td><div class="row-actions">
        <button class="icon-btn" data-edit-product="${p.id}">Modifier</button>
        <button class="icon-btn danger" data-del-product="${p.id}">Supprimer</button>
      </div></td>
    </tr>`).join('');
  return `<div class="card-panel">
    <h2 style="display:flex;justify-content:space-between;align-items:center">
      Produits (${CACHE.products.length})
      <button class="btn small accent" data-new-product>+ Nouveau produit</button></h2>
    <table class="tbl"><thead><tr>
      <th></th><th>Nom</th><th>Prix</th><th>Stock</th><th>Catégorie</th><th>État</th><th></th>
    </tr></thead><tbody>${rows}</tbody></table></div>`;
}

function productModal(p = {}) {
  const el = document.createElement('div');
  el.className = 'modal-bg';
  // photo manager state: array of URL strings and/or File objects
  const photos = (p.photos || []).filter(Boolean).slice();
  el.innerHTML = `<div class="modal">
    <h2 style="margin-bottom:16px">${p.id ? `Modifier #${p.id}` : 'Nouveau produit'}</h2>
    <div class="form-grid">
      <input id="p-fr" placeholder="Nom (FR)" value="${esc(p.name_fr || '')}">
      <input id="p-ar" placeholder="الاسم (AR)" value="${esc(p.name_ar || '')}">
      <textarea id="p-dfr" class="full" rows="2" placeholder="Description FR">${esc(p.description_fr || '')}</textarea>
      <textarea id="p-dar" class="full" rows="2" placeholder="الوصف AR">${esc(p.description_ar || '')}</textarea>
      <input id="p-price" type="number" min="0" placeholder="Prix DA" value="${p.price ?? ''}">
      <input id="p-compare" type="number" min="0" placeholder="Ancien prix (optionnel)" value="${p.compare_at_price ?? ''}">
      <input id="p-stock" type="number" min="0" placeholder="Stock" value="${p.stock ?? 10}">
      <select id="p-cat">
        <option value="">— Catégorie —</option>
        ${CACHE.categories.map(c =>
          `<option value="${c.id}" ${p.category_id == c.id ? 'selected' : ''}>${esc(c.name_fr)}</option>`).join('')}
      </select>
      <input id="p-sizes" class="full" placeholder="Tailles (S,M,L,XL)" value="${(p.sizes || []).join(',')}">
      <input id="p-colors" class="full" placeholder="Couleurs (Noir,Blanc,Kaki)" value="${(p.colors || []).join(',')}">
    </div>

    <label class="opt-label" style="margin-top:14px">Photos (la première est la photo principale)</label>
    <div class="thumb-strip" id="p-thumbs"></div>
    <div class="row-actions" style="margin-top:8px;align-items:center">
      <label class="icon-btn" style="cursor:pointer">＋ Fichiers
        <input id="p-file" type="file" accept="image/*" multiple hidden>
      </label>
      <input id="p-url-add" style="flex:1;border:1px solid var(--line);border-radius:8px;padding:7px 10px;background:var(--bg)"
        placeholder="…ou coller une URL puis +">
      <button type="button" class="icon-btn" id="p-url-btn">+</button>
    </div>

    <div class="form-grid" style="margin-top:14px">
      <label class="radio-card"><input type="checkbox" id="p-active" ${p.active !== false ? 'checked' : ''}> Actif (visible)</label>
      <label class="radio-card"><input type="checkbox" id="p-feat" ${p.featured ? 'checked' : ''}> ★ Sélection</label>
    </div>
    <p class="login-err" id="p-err"></p>
    <div class="row-actions" style="margin-top:14px">
      <button class="btn small accent" id="p-save">Enregistrer</button>
      <button class="icon-btn" id="p-close">Fermer</button>
    </div></div>`;
  document.body.appendChild(el);
  const thumbs = el.querySelector('#p-thumbs');

  function renderThumbs() {
    thumbs.innerHTML = photos.length ? '' : '<span style="color:var(--ink-soft);font-size:.82rem">Aucune photo — un visuel généré sera affiché.</span>';
    photos.forEach((entry, i) => {
      const src = typeof entry === 'string' ? entry : URL.createObjectURL(entry);
      const item = document.createElement('span');
      item.className = 'thumb-item';
      item.innerHTML = `<img src="${esc(src)}" alt=""><button type="button" title="Retirer">✕</button>`;
      item.querySelector('button').onclick = () => { photos.splice(i, 1); renderThumbs(); };
      thumbs.appendChild(item);
    });
  }
  renderThumbs();

  el.querySelector('#p-file').addEventListener('change', e => {
    [...e.target.files].forEach(f => photos.push(f));
    e.target.value = '';
    renderThumbs();
  });
  el.querySelector('#p-url-btn').onclick = () => {
    const input = el.querySelector('#p-url-add');
    const url = input.value.trim();
    if (!url) return;
    photos.push(url); input.value = ''; renderThumbs();
  };
  el.querySelector('#p-close').onclick = () => el.remove();
  el.addEventListener('click', e => { if (e.target === el) el.remove(); });

  el.querySelector('#p-save').onclick = async () => {
    const btn = el.querySelector('#p-save');
    try {
      btn.disabled = true;
      btn.textContent = 'Enregistrement…';
      const uploaded = [];
      for (const entry of photos) {
        uploaded.push(typeof entry === 'string' ? entry : await DB.Admin.uploadPhoto(entry));
      }
      if (!uploaded.length) uploaded.push('');
      const row = {
        name_fr: el.querySelector('#p-fr').value.trim(),
        name_ar: el.querySelector('#p-ar').value.trim(),
        description_fr: el.querySelector('#p-dfr').value.trim(),
        description_ar: el.querySelector('#p-dar').value.trim(),
        price: Number(el.querySelector('#p-price').value) || 0,
        compare_at_price: Number(el.querySelector('#p-compare').value) || null,
        stock: Number(el.querySelector('#p-stock').value) || 0,
        category_id: Number(el.querySelector('#p-cat').value) || null,
        sizes: el.querySelector('#p-sizes').value.split(',').map(s => s.trim()).filter(Boolean),
        colors: el.querySelector('#p-colors').value.split(',').map(s => s.trim()).filter(Boolean),
        photos: uploaded, active: el.querySelector('#p-active').checked,
        featured: el.querySelector('#p-feat').checked,
      };
      if (!row.name_fr && !row.name_ar) throw new Error('Nom requis');
      if (p.id) await DB.Admin.table('products').update(row).eq('id', p.id);
      else await DB.Admin.table('products').insert(row);
      el.remove(); refresh();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = 'Enregistrer';
      el.querySelector('#p-err').textContent = e.message;
    }
  };
}

/* ---------- categories ---------- */
function tabCategories() {
  return `<div class="card-panel">
    <h2 style="display:flex;justify-content:space-between;align-items:center">
      Catégories <button class="btn small accent" data-new-cat>+ Nouvelle</button></h2>
    <table class="tbl"><tbody>
    ${CACHE.categories.map(c => `
      <tr><td><b>${esc(c.name_fr)}</b> — ${esc(c.name_ar)}</td>
        <td><div class="row-actions">
          <button class="icon-btn" data-edit-cat="${c.id}">Modifier</button>
          <button class="icon-btn danger" data-del-cat="${c.id}">Supprimer</button>
        </div></td></tr>`).join('')}
    </tbody></table></div>`;
}

function categoryModal(c = {}) {
  const el = document.createElement('div');
  el.className = 'modal-bg';
  let catFile = null;
  el.innerHTML = `<div class="modal"><h2 style="margin-bottom:14px">${c.id ? 'Modifier' : 'Nouvelle catégorie'}</h2>
    <div class="form-grid">
      <input id="c-fr" placeholder="Nom (FR)" value="${esc(c.name_fr || '')}">
      <input id="c-ar" placeholder="الاسم (AR)" value="${esc(c.name_ar || '')}">
      <input id="c-sort" type="number" placeholder="Ordre" value="${c.sort ?? 0}">
      <span></span>
    </div>
    <label class="opt-label" style="margin-top:10px">Photo de la tuile</label>
    ${c.image ? `<img src="${esc(c.image)}" alt="" style="width:110px;border-radius:8px;margin-bottom:8px">` : ''}
    <div class="row-actions" style="align-items:center">
      <label class="icon-btn" style="cursor:pointer">＋ Fichier
        <input id="c-file" type="file" accept="image/*" hidden>
      </label>
      <input id="c-img" style="flex:1;border:1px solid var(--line);border-radius:8px;padding:7px 10px;background:var(--bg)"
        placeholder="…ou URL photo" value="${esc(c.image || '')}">
    </div>
    <p class="login-err" id="c-err"></p>
    <div class="row-actions" style="margin-top:14px">
      <button class="btn small accent" id="c-save">Enregistrer</button>
      <button class="icon-btn" id="c-close">Fermer</button>
    </div></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el || e.target.id === 'c-close') el.remove(); });
  el.querySelector('#c-file').addEventListener('change', e => { catFile = e.target.files[0] || null; });

  el.querySelector('#c-save').onclick = async () => {
    const btn = el.querySelector('#c-save');
    try {
      btn.disabled = true; btn.textContent = 'Enregistrement…';
      let image = el.querySelector('#c-img').value.trim();
      if (catFile) image = await DB.Admin.uploadPhoto(catFile);
      const row = {
        name_fr: el.querySelector('#c-fr').value.trim() || '—',
        name_ar: el.querySelector('#c-ar').value.trim() || '—',
        sort: Number(el.querySelector('#c-sort').value) || 0,
        image,
      };
      if (c.id) await DB.Admin.table('categories').update(row).eq('id', c.id);
      else await DB.Admin.table('categories').insert(row);
      el.remove(); refresh();
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Enregistrer';
      el.querySelector('#c-err').textContent = e.message;
    }
  };
}

/* ---------- zones ---------- */
function tabZones() {
  return `<div class="card-panel">
    <h2>Zones de livraison (${CACHE.zones.length} wilayas)</h2>
    <p style="color:var(--ink-soft);font-size:.85rem;margin-bottom:14px">
      Deux prix par wilaya : <b>stopdesk</b> (agence) et <b>domicile</b>.</p>
    ${CACHE.zones.map((z, i) => `
      <div class="zone-row">
        <span style="color:var(--ink-soft);font-size:.8rem">${z.code}</span>
        <span>${esc(z.name)}</span>
        <input data-zone-desk="${i}" type="number" min="0" value="${z.desk ?? z.home ?? z.fee ?? 0}" title="stopdesk">
        <input data-zone-home="${i}" type="number" min="0" value="${z.home ?? z.fee ?? 0}" title="domicile">
        <span style="font-size:.72rem;color:var(--ink-soft)">DA</span>
      </div>`).join('')}
    <button class="btn accent small" id="zones-save" style="margin-top:12px">Enregistrer les zones</button>
  </div>`;
}

function saveZones() {
  const zones = CACHE.zones.map((z, i) => ({
    code: z.code, name: z.name,
    desk: Number(document.querySelector(`[data-zone-desk="${i}"]`).value) || 0,
    home: Number(document.querySelector(`[data-zone-home="${i}"]`).value) || 0,
  }));
  return DB.Admin.table('settings')
    .update({ value: zones, updated_at: new Date().toISOString() })
    .eq('key', 'zones');
}

/* ---------- settings ---------- */
function tabSettings() {
  const store = CACHE.settings.store || {};
  const promo = CACHE.settings.promo || {};
  const freeFrom = CACHE.settings.free_delivery_from;
  const announce = CACHE.settings.announce || {};
  const socials = CACHE.settings.socials || {};
  return `<div class="card-panel"><h2>Boutique</h2>
    <div class="form-grid">
      <input id="s-name" placeholder="Nom de la boutique" value="${esc(store.name || '')}">
      <input id="s-phone" placeholder="Téléphone / WhatsApp" value="${esc(store.phone || '')}">
    </div>

    <h2 style="margin-top:24px">WhatsApp (bouton + partage de commande)</h2>
    <div class="form-grid">
      <input id="s-wa" placeholder="Ex : 213555123456 (sans +, chiffres seuls)"
        value="${esc(typeof CACHE.settings.whatsapp === 'string' ? CACHE.settings.whatsapp : '')}">
      <input id="s-exchange" type="number" min="1" max="90" placeholder="Délai d'échange (jours)"
        value="${CACHE.settings.exchange_days ?? 7}">
    </div>

    <h2 style="margin-top:24px">Bandeau d'annonce</h2>
    <div class="form-grid">
      <label class="radio-card"><input type="checkbox" id="s-ann-on" ${announce.active ? 'checked' : ''}> Afficher le bandeau</label>
      <span></span>
      <input id="s-ann-fr" placeholder="Texte (FR) — ex : 🔥 Soldes −20% cette semaine" value="${esc(announce.text_fr || '')}">
      <input id="s-ann-ar" placeholder="النص (AR)" value="${esc(announce.text_ar || '')}">
    </div>

    <h2 style="margin-top:24px">Réseaux sociaux</h2>
    <div class="form-grid">
      <input id="s-insta" placeholder="URL Instagram" value="${esc(socials.instagram || '')}">
      <input id="s-fb" placeholder="URL Facebook" value="${esc(socials.facebook || '')}">
      <input id="s-tiktok" placeholder="URL TikTok" value="${esc(socials.tiktok || '')}">
      <span></span>
    </div>

    <h2 style="margin-top:24px">Image d'accueil (héros)</h2>
    <div class="form-grid">
      <label class="icon-btn" style="cursor:pointer;justify-self:start">＋ Fichier
        <input id="s-hero-file" type="file" accept="image/*" hidden>
      </label>
      <input id="s-hero" placeholder="…ou URL de l'image (vide = visuel généré)"
        value="${esc(typeof CACHE.settings.hero === 'string' ? CACHE.settings.hero : '')}">
      ${CACHE.settings.hero
        ? `<img src="${esc(CACHE.settings.hero)}" alt="" id="s-hero-preview" style="width:120px;border-radius:8px;grid-column:1/-1">` : ''}
    </div>

    <h2 style="margin-top:24px">Pixels publicitaires</h2>
    <div class="form-grid">
      <input id="s-meta-pixel" placeholder="Meta Pixel ID (15-16 chiffres)"
        value="${esc((CACHE.settings.ads || {}).metaPixelId || '')}">
      <input id="s-tt-pixel" placeholder="TikTok Pixel ID (commence par C)"
        value="${esc((CACHE.settings.ads || {}).tiktokPixelId || '')}">
    </div>
    <p style="color:var(--ink-soft);font-size:.8rem;margin-top:-6px">
      Événements envoyés : PageView, ViewContent, AddToCart, InitiateCheckout,
      Purchase. Vide = aucun script tiers n'est chargé.</p>

    <h2 style="margin-top:24px">Vérification de domaine</h2>
    <div class="form-grid">
      <input id="s-v-fb" placeholder="facebook-domain-verification"
        value="${esc((CACHE.settings.verifications || {})['facebook-domain-verification'] || '')}">
      <input id="s-v-tt" placeholder="tiktok-developers-site-verification"
        value="${esc((CACHE.settings.verifications || {})['tiktok-developers-site-verification'] || '')}">
      <input id="s-v-g" placeholder="google-site-verification"
        value="${esc((CACHE.settings.verifications || {})['google-site-verification'] || '')}">
    </div>
    <p style="color:var(--ink-soft);font-size:.8rem;margin-top:-6px">
      Coller uniquement la valeur du token (pas la balise entière). Google
      détecte le tag injecté ; si Meta/TikTok ne le voient pas, utilisez leur
      méthode DNS.</p>

    <h2 style="margin-top:24px">Promotion globale</h2>
    <div class="form-grid">
      <label class="radio-card"><input type="checkbox" id="s-promo-on" ${promo.active ? 'checked' : ''}> Solde active</label>
      <input id="s-promo-pct" type="number" min="0" max="90" placeholder="% de remise" value="${promo.percent ?? 0}">
      <input id="s-free" type="number" min="0" placeholder="Livraison gratuite à partir de (DA, vide = jamais)"
        value="${freeFrom == null ? '' : freeFrom}">
    </div>
    <button class="btn accent small" id="settings-save" style="margin-top:14px">Enregistrer</button>
  </div>`;
}

async function saveSettings() {
  const T = DB.Admin.table;
  await T('settings').update({
    value: {
      name: document.getElementById('s-name').value.trim(),
      phone: document.getElementById('s-phone').value.trim(), email: '',
    },
  }).eq('key', 'store');
  await T('settings').update({ value: document.getElementById('s-hero').value.trim() }).eq('key', 'hero');
  const heroFile = document.getElementById('s-hero-file').files[0];
  if (heroFile) {
    await T('settings').update({ value: await DB.Admin.uploadPhoto(heroFile) }).eq('key', 'hero');
  }
  await T('settings').update({
    value: document.getElementById('s-wa').value.replace(/\D/g, ''),
  }).eq('key', 'whatsapp');
  await T('settings').update({
    value: Number(document.getElementById('s-exchange').value) || 7,
  }).eq('key', 'exchange_days');
  await T('settings').update({
    value: {
      active: document.getElementById('s-ann-on').checked,
      text_fr: document.getElementById('s-ann-fr').value.trim(),
      text_ar: document.getElementById('s-ann-ar').value.trim(),
    },
  }).eq('key', 'announce');
  await T('settings').update({
    value: {
      instagram: document.getElementById('s-insta').value.trim(),
      facebook: document.getElementById('s-fb').value.trim(),
      tiktok: document.getElementById('s-tiktok').value.trim(),
    },
  }).eq('key', 'socials');
  await T('settings').update({
    value: {
      metaPixelId: document.getElementById('s-meta-pixel').value.trim(),
      tiktokPixelId: document.getElementById('s-tt-pixel').value.trim(),
    },
  }).eq('key', 'ads');
  await T('settings').update({
    value: {
      'facebook-domain-verification': document.getElementById('s-v-fb').value.trim(),
      'tiktok-developers-site-verification': document.getElementById('s-v-tt').value.trim(),
      'google-site-verification': document.getElementById('s-v-g').value.trim(),
    },
  }).eq('key', 'verifications');
  await T('settings').update({
    value: {
      active: document.getElementById('s-promo-on').checked,
      percent: Number(document.getElementById('s-promo-pct').value) || 0,
    },
  }).eq('key', 'promo');
  const freeRaw = document.getElementById('s-free').value;
  await T('settings').update({ value: freeRaw === '' ? null : Number(freeRaw) }).eq('key', 'free_delivery_from');
}

/* ---------- promo codes ---------- */
let PROMO_CODES = [];
async function tabPromos() {
  const { data, error } = await DB.Admin.table('promo_codes').select('*').order('id');
  if (!error) PROMO_CODES = data || [];
  return `<div class="card-panel">
    <h2 style="display:flex;justify-content:space-between;align-items:center">
      Codes promo <button class="btn small accent" data-new-code>+ Nouveau code</button></h2>
    <table class="tbl"><thead><tr><th>Code</th><th>%</th><th>Min. commande</th><th>État</th><th></th></tr></thead><tbody>
    ${PROMO_CODES.map(c => `
      <tr>
        <td><b>${esc(c.code)}</b></td><td>−${c.percent}%</td>
        <td>${money(c.min_order)}</td>
        <td>${c.active ? '<span class="pill delivered">Actif</span>' : '<span class="pill cancelled">Off</span>'}</td>
        <td><div class="row-actions">
          <button class="icon-btn danger" data-del-code="${c.id}">Supprimer</button>
        </div></td>
      </tr>`).join('') || '<tr><td colspan="5" style="color:var(--ink-soft)">Aucun code.</td></tr>'}
    </tbody></table></div>`;
}

function promoModal() {
  const el = document.createElement('div');
  el.className = 'modal-bg';
  el.innerHTML = `<div class="modal"><h2 style="margin-bottom:14px">Nouveau code promo</h2>
    <div class="form-grid">
      <input id="pc-code" placeholder="CODE (ex: BIENVENUE10)">
      <input id="pc-percent" type="number" min="1" max="90" placeholder="% remise">
      <input id="pc-min" type="number" min="0" placeholder="Min. commande (0 = aucun)">
    </div>
    <div class="row-actions" style="margin-top:14px">
      <button class="btn small accent" id="pc-save">Créer</button>
      <button class="icon-btn" id="pc-close">Fermer</button>
    </div></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el || e.target.id === 'pc-close') el.remove(); });
  el.querySelector('#pc-save').onclick = async () => {
    try {
      await DB.Admin.table('promo_codes').insert({
        code: el.querySelector('#pc-code').value.trim().toUpperCase(),
        percent: Number(el.querySelector('#pc-percent').value),
        min_order: Number(el.querySelector('#pc-min').value) || 0,
      });
      el.remove(); refresh();
    } catch (e) { alert(e.message); }
  };
}

/* ---------- global click delegation ---------- */
document.addEventListener('click', async e => {
  const q = s => e.target.closest(s);
  let m;
  if (q('#csv-btn')) exportOrdersCsv();
  else if ((m = q('[data-view]'))) orderModal(CACHE.orders.find(o => o.id == m.dataset.view));
  else if ((m = q('[data-advance]'))) setStatus(+m.dataset.advance, m.dataset.next);
  else if ((m = q('[data-cancel]')))
    confirm('Annuler cette commande ? Le stock sera restauré.') && setStatus(+m.dataset.cancel, 'cancelled');
  else if (q('[data-new-product]')) productModal();
  else if ((m = q('[data-edit-product]'))) productModal(CACHE.products.find(p => p.id == m.dataset.editProduct));
  else if ((m = q('[data-del-product]')))
    confirm('Supprimer ce produit ?') &&
      DB.Admin.table('products').delete().eq('id', +m.dataset.delProduct).then(refresh);
  else if (q('[data-new-cat]')) categoryModal();
  else if ((m = q('[data-edit-cat]'))) categoryModal(CACHE.categories.find(c => c.id == m.dataset.editCat));
  else if ((m = q('[data-del-cat]')))
    confirm('Supprimer cette catégorie ?') &&
      DB.Admin.table('categories').delete().eq('id', +m.dataset.delCat).then(refresh);
  else if (q('#zones-save'))
    saveZones().then(() => toast('Zones enregistrées ✓')).catch(e => alert(e.message));
  else if (q('#settings-save'))
    saveSettings().then(() => toast('Boutique enregistrée ✓')).catch(e => alert(e.message));
  else if (q('[data-new-code]')) promoModal();
  else if ((m = q('[data-del-code]')))
    DB.Admin.table('promo_codes').delete().eq('id', +m.dataset.delCode).then(refresh);
});

/* ---------- boot ---------- */
function boot() {
  loadAll()
    .then(() => { renderShell(); Alerts.init(); })
    .catch(err => {
      root.innerHTML = `<div class="demo-note">
        <p><b>Connexion impossible.</b></p><p style="margin-top:8px">${esc(err.message)}</p></div>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!DB.Admin.active()) {
    root.innerHTML = `<div class="demo-note">
      <a class="logo" href="index.html">URBAN<span>DZ</span></a>
      <p style="margin-top:20px">Le panneau d'administration nécessite une connexion Supabase.<br>
      Renseignez vos clés dans <code>assets/js/config.js</code>, puis exécutez <code>supabase/schema.sql</code>.</p></div>`;
    return;
  }
  DB.Admin.onAuth(session => { session ? boot() : renderLogin(); });
});
