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
    <h2 style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <span>Produits (${CACHE.products.length})</span>
      <span class="row-actions">
        <button class="icon-btn" data-bulk>⬆ Importer en lot</button>
        <button class="btn small accent" data-new-product>+ Nouveau produit</button>
      </span></h2>
    <div class="tbl-scroll"><table class="tbl"><thead><tr>
      <th></th><th>Nom</th><th>Prix</th><th>Stock</th><th>Catégorie</th><th>État</th><th></th>
    </tr></thead><tbody>${rows}</tbody></table></div></div>`;
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

/* ---------- reviews (testimonials) ---------- */
function tabReviews() {
  const revs = Array.isArray(CACHE.settings.reviews) ? CACHE.settings.reviews : [];
  return `<div class="card-panel">
    <h2 style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <span>Avis clients — affichés sur l'accueil (${revs.length})</span>
      <span class="row-actions">
        <button class="icon-btn" data-rev-add>+ Ajouter un avis</button>
        ${revs.length ? '<button class="btn small accent" id="rev-save">Enregistrer</button>' : ''}
      </span></h2>
    <div id="rev-list">
      ${revs.map((r, i) => `
      <div class="rev-card" data-i="${i}">
        <div class="form-grid">
          <input data-rf="name" placeholder="Nom du client" value="${esc(r.name || '')}">
          <input data-rf="zone" placeholder="Wilaya (ex : Alger)" value="${esc(r.zone || '')}">
          <select data-rf="stars">
            ${[5,4,3,2,1].map(n => `<option value="${n}" ${(r.stars || 5) == n ? 'selected' : ''}>${'★'.repeat(n)}</option>`).join('')}
          </select>
          <button class="icon-btn danger" data-rev-del="${i}">Retirer</button>
          <textarea data-rf="text_fr" rows="2" placeholder="Avis (FR)">${esc(r.text_fr || '')}</textarea>
          <textarea data-rf="text_ar" rows="2" dir="rtl" placeholder="الرأي (AR)">${esc(r.text_ar || '')}</textarea>
        </div>
      </div>`).join('') || '<p style="color:var(--ink-soft)">Aucun avis. Ajoutez les retours de vos premiers clients — le meilleur argument de vente.</p>'}
    </div>
  </div>`;
}

document.addEventListener('click', e => {
  if (e.target.closest('[data-rev-add]')) {
    const list = document.getElementById('rev-list');
    const i = list.querySelectorAll('.rev-card').length;
    const div = document.createElement('div');
    div.className = 'rev-card';
    div.dataset.i = i;
    div.innerHTML = `<div class="form-grid">
      <input data-rf="name" placeholder="Nom du client">
      <input data-rf="zone" placeholder="Wilaya">
      <select data-rf="stars">${[5,4,3,2,1].map(n => `<option value="${n}" ${n === 5 ? 'selected' : ''}>${'★'.repeat(n)}</option>`).join('')}</select>
      <button class="icon-btn danger" data-rev-del>Retirer</button>
      <textarea data-rf="text_fr" rows="2" placeholder="Avis (FR)"></textarea>
      <textarea data-rf="text_ar" rows="2" dir="rtl" placeholder="الرأي (AR)"></textarea>
    </div>`;
    list.appendChild(div);
  }
  const del = e.target.closest('[data-rev-del]');
  if (del) del.closest('.rev-card').remove();
  if (e.target.closest('#rev-save')) {
    const reviews = [...document.querySelectorAll('#rev-list .rev-card')].map(card => ({
      name: card.querySelector('[data-rf="name"]').value.trim(),
      zone: card.querySelector('[data-rf="zone"]').value.trim(),
      stars: Number(card.querySelector('[data-rf="stars"]').value) || 5,
      text_fr: card.querySelector('[data-rf="text_fr"]').value.trim(),
      text_ar: card.querySelector('[data-rf="text_ar"]').value.trim(),
    })).filter(r => r.name || r.text_fr || r.text_ar);
    DB.Admin.table('settings')
      .update({ value: reviews, updated_at: new Date().toISOString() })
      .eq('key', 'reviews')
      .then(() => refresh())
      .catch(err => alert(err.message));
  }
});

/* ---------- categories ---------- */
function tabCategories() {
  return `<div class="card-panel">
    <h2 style="display:flex;justify-content:space-between;align-items:center">
      Catégories <button class="btn small accent" data-new-cat>+ Nouvelle</button></h2>
    <div class="tbl-scroll"><table class="tbl"><tbody>
    ${CACHE.categories.map(c => `
      <tr><td><b>${esc(c.name_fr)}</b> — ${esc(c.name_ar)}</td>
        <td><div class="row-actions">
          <button class="icon-btn" data-edit-cat="${c.id}">Modifier</button>
          <button class="icon-btn danger" data-del-cat="${c.id}">Supprimer</button>
        </div></td></tr>`).join('')}
    </tbody></table></div></div>`;
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
    <div class="zone-head"><span>#</span><span>Wilaya</span><span>Stopdesk</span><span>Domicile</span><span></span></div>
    <div class="zones-list">
    ${CACHE.zones.map((z, i) => `
      <div class="zone-row">
        <span style="color:var(--ink-soft);font-size:.8rem">${z.code}</span>
        <span>${esc(z.name)}</span>
        <input data-zone-desk="${i}" type="number" min="0" value="${z.desk ?? z.home ?? z.fee ?? 0}" title="stopdesk">
        <input data-zone-home="${i}" type="number" min="0" value="${z.home ?? z.fee ?? 0}" title="domicile">
        <span style="font-size:.72rem;color:var(--ink-soft)">DA</span>
      </div>`).join('')}
    </div>
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
  const ads = CACHE.settings.ads || {};
  const ver = CACHE.settings.verifications || {};
  const hero = typeof CACHE.settings.hero === 'string' ? CACHE.settings.hero : '';

  const card = (title, body) => `
    <div class="card-panel settings-card">
      <h3>${title}</h3>${body}</div>`;

  return `
  <div class="settings-grid">

    ${card('Identité', `
      <div class="field-s"><label>Nom de la boutique</label><input id="s-name" value="${esc(store.name || '')}"></div>
      <div class="field-s"><label>Téléphone boutique</label><input id="s-phone" value="${esc(store.phone || '')}"></div>
      <div class="field-s"><label>Délai d'échange (jours)</label><input id="s-exchange" type="number" min="1" max="90" value="${CACHE.settings.exchange_days ?? 7}"></div>`)

    + card('WhatsApp', `
      <div class="field-s"><label>Numéro (international, sans +)</label><input id="s-wa" placeholder="213555123456"
        value="${esc(typeof CACHE.settings.whatsapp === 'string' ? CACHE.settings.whatsapp : '')}"></div>
      <p class="hint">Utilisé par le bouton flottant et le partage de commande.</p>`)

    + card('Bandeau d\'annonce', `
      <label class="radio-card" style="margin-bottom:10px"><input type="checkbox" id="s-ann-on" ${announce.active ? 'checked' : ''}> Afficher le bandeau</label>
      <div class="field-s"><label>Texte FR</label><input id="s-ann-fr" placeholder="🔥 Soldes −20% cette semaine" value="${esc(announce.text_fr || '')}"></div>
      <div class="field-s"><label>النص AR</label><input id="s-ann-ar" dir="rtl" value="${esc(announce.text_ar || '')}"></div>`)

    + card('Réseaux sociaux', `
      <div class="field-s"><label>Instagram</label><input id="s-insta" placeholder="https://instagram.com/…" value="${esc(socials.instagram || '')}"></div>
      <div class="field-s"><label>Facebook</label><input id="s-fb" value="${esc(socials.facebook || '')}"></div>
      <div class="field-s"><label>TikTok</label><input id="s-tiktok" value="${esc(socials.tiktok || '')}"></div>`)

    + card('Promotion globale', `
      <label class="radio-card" style="margin-bottom:10px"><input type="checkbox" id="s-promo-on" ${promo.active ? 'checked' : ''}> Solde active sur tout le magasin</label>
      <div class="field-s"><label>Remise (%)</label><input id="s-promo-pct" type="number" min="0" max="90" value="${promo.percent ?? 0}"></div>
      <div class="field-s"><label>Se termine le (compte à rebours sur le site)</label><input id="s-promo-end" type="datetime-local" value="${esc((promo.ends || '').slice(0, 16))}"></div>
      <div class="field-s"><label>Livraison gratuite à partir de (DA)</label><input id="s-free" type="number" min="0" placeholder="vide = jamais" value="${freeFrom == null ? '' : freeFrom}"></div>`)

    + card('Image d\'accueil (héros)', `
      ${hero ? `<img src="${esc(hero)}" alt="" style="width:100%;max-height:130px;object-fit:cover;border-radius:9px;margin-bottom:10px">` : ''}
      <div class="field-s"><label>URL ou fichier</label>
        <div style="display:flex;gap:8px">
          <input id="s-hero" placeholder="URL… (vide = visuel généré)" value="${esc(hero)}">
          <label class="icon-btn" style="cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center">＋<input id="s-hero-file" type="file" accept="image/*" hidden></label>
        </div></div>`)

    + card('Publicité & vérification', `
      <div class="field-s"><label>Meta Pixel ID</label><input id="s-meta-pixel" placeholder="15-16 chiffres" value="${esc(ads.metaPixelId || '')}"></div>
      <div class="field-s"><label>TikTok Pixel ID</label><input id="s-tt-pixel" placeholder="commence par C" value="${esc(ads.tiktokPixelId || '')}"></div>
      <details style="margin-top:6px">
        <summary style="cursor:pointer;color:var(--ink-soft);font-size:.85rem">Tokens de vérification de domaine</summary>
        <div class="field-s" style="margin-top:8px"><label>facebook-domain-verification</label><input id="s-v-fb" value="${esc(ver['facebook-domain-verification'] || '')}"></div>
        <div class="field-s"><label>tiktok-developers-site-verification</label><input id="s-v-tt" value="${esc(ver['tiktok-developers-site-verification'] || '')}"></div>
        <div class="field-s"><label>google-site-verification</label><input id="s-v-g" value="${esc(ver['google-site-verification'] || '')}"></div>
        <p class="hint">Google détecte le tag injecté ; pour Meta/TikTok préférez la méthode DNS.</p>
      </details>`)
  }

  <div class="save-bar">
    <button class="btn accent" id="settings-save">Enregistrer les modifications</button>
    <span class="hint" style="margin-inline-start:auto">Tout est appliqué au site en direct après enregistrement.</span>
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
      ends: document.getElementById('s-promo-end').value || '',
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
    <div class="tbl-scroll"><table class="tbl"><thead><tr><th>Code</th><th>%</th><th>Min. commande</th><th>État</th><th></th></tr></thead><tbody>
    ${PROMO_CODES.map(c => `
      <tr>
        <td><b>${esc(c.code)}</b></td><td>−${c.percent}%</td>
        <td>${money(c.min_order)}</td>
        <td>${c.active ? '<span class="pill delivered">Actif</span>' : '<span class="pill cancelled">Off</span>'}</td>
        <td><div class="row-actions">
          <button class="icon-btn danger" data-del-code="${c.id}">Supprimer</button>
        </div></td>
      </tr>`).join('') || '<tr><td colspan="5" style="color:var(--ink-soft)">Aucun code.</td></tr>'}
    </tbody></table></div></div>`;
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
/* ---------- bulk import (P10): one product per line ---------- */
function bulkModal() {
  const el = document.createElement('div');
  el.className = 'modal-bg';
  el.innerHTML = `<div class="modal">
    <h2 style="margin-bottom:10px">Importation en lot</h2>
    <p style="color:var(--ink-soft);font-size:.85rem;margin-bottom:12px">
      Un produit par ligne, champs séparés par <b>|</b> :<br>
      <code style="background:#f0ebe3;padding:2px 6px;border-radius:6px">Nom FR | Nom AR | Prix | Ancien prix (vide si aucun) | Stock</code><br>
      Exemple : <code style="background:#f0ebe3;padding:2px 6px;border-radius:6px">T-shirt Noir | تيشيرت أسود | 2200 | 2800 | 30</code></p>
    <select id="b-cat" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:9px;background:var(--bg);margin-bottom:12px">
      <option value="">— Catégorie commune à tous —</option>
      ${CACHE.categories.map(c => `<option value="${c.id}">${esc(c.name_fr)}</option>`).join('')}
    </select>
    <textarea id="b-lines" rows="10" class="full"
      placeholder="T-shirt Noir | تيشيرت أسود | 2200 | 2800 | 30&#10;Jean Bleu | جينز أزرق | 4500 | | 15"></textarea>
    <p class="login-err" id="b-msg"></p>
    <div class="row-actions" style="margin-top:14px">
      <button class="btn small accent" id="b-import">Importer</button>
      <button class="icon-btn" id="b-close">Fermer</button>
    </div></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el || e.target.id === 'b-close') el.remove(); });

  el.querySelector('#b-import').onclick = async () => {
    const msg = el.querySelector('#b-msg');
    const btn = el.querySelector('#b-import');
    const lines = el.querySelector('#b-lines').value.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { msg.textContent = 'Aucune ligne à importer.'; return; }
    btn.disabled = true;
    let ok = 0; const errors = [];
    for (const [i, line] of lines.entries()) {
      const [fr = '', ar = '', price = '', compare = '', stock = ''] =
        line.split('|').map(x => x.trim());
      if (!fr && !ar) { errors.push(`Ligne ${i + 1} : nom manquant`); continue; }
      if (!(parseFloat(price) >= 0) || price === '') { errors.push(`Ligne ${i + 1} : prix invalide`); continue; }
      try {
        await DB.Admin.table('products').insert({
          name_fr: fr || ar,
          name_ar: ar || fr,
          description_fr: '', description_ar: '',
          price: parseFloat(price),
          compare_at_price: parseFloat(compare) > 0 ? parseFloat(compare) : null,
          stock: parseInt(stock) >= 0 ? parseInt(stock) : 0,
          category_id: Number(el.querySelector('#b-cat').value) || null,
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          colors: [],
          photos: [''],
          active: true, featured: false,
        });
        ok++;
      } catch (e) {
        errors.push(`Ligne ${i + 1} : ${e.message}`);
      }
    }
    btn.disabled = false;
    if (ok) {
      msg.style.color = 'var(--ok)';
      msg.textContent = `${ok} produit(s) importé(s).` +
        (errors.length ? ` Erreurs : ${errors.join(' · ')}` : '');
      setTimeout(() => { el.remove(); refresh(); }, ok && !errors.length ? 800 : 2500);
    } else {
      msg.style.color = '';
      msg.textContent = errors.join(' · ') || 'Rien importé.';
    }
  };
}

document.addEventListener('click', async e => {
  const q = s => e.target.closest(s);
  let m;
  if (q('#csv-btn')) exportOrdersCsv();
  else if (q('[data-bulk]')) bulkModal();
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
