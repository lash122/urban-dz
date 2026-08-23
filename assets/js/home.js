/* URBAN DZ — home page */
async function initHome() {
  renderChrome('home');

  const heroImg = document.getElementById('hero-img');
  if (heroImg) {
    let hero = '';
    let reviews = [];
    try {
      const st = await DB.getSettings();
      hero = st.hero || '';
      reviews = Array.isArray(st.reviews) ? st.reviews : [];
    } catch { /* demo fallback below */ }
    heroImg.src = hero || window.HERO_IMAGE
      || placeholder(LANG === 'ar' ? 'تشكيلة جديدة' : 'NOUVELLE COLLECTION', 38);
    if (reviews.length) {
      document.getElementById('reviews-wrap').style.display = '';
      document.getElementById('reviews-grid').innerHTML = reviews.slice(0, 6).map(r => `
        <div class="review-card">
          <div class="review-stars">${'★'.repeat(Math.min(5, Math.max(1, Number(r.stars) || 5)))}</div>
          <p class="review-text" dir="auto">${esc(LANG === 'ar' ? (r.text_ar || r.text_fr) : (r.text_fr || r.text_ar))}</p>
          <div class="review-meta"><b>${esc(r.name || '')}</b>${r.zone ? ` — ${esc(r.zone)}` : ''}
            · ${esc(t('verified_buyer'))}</div>
        </div>`).join('');
    }
  }

  document.getElementById('feat-grid').innerHTML =
    '<div class="skel-card"></div>'.repeat(8);

  try {
    const [cats, featured] = await Promise.all([DB.listCategories(), DB.getFeatured()]);
    const all = await DB.listProducts();

    document.getElementById('cat-grid').innerHTML = cats.map(c => {
      const n = all.filter(p => p.category_id === c.id).length;
      const img = c.image
        ? `<img class="cat-img" src="${esc(c.image)}" alt="${esc(c.label)}" loading="lazy">`
        : '';
      return `<a class="cat-tile${img ? ' has-img' : ''}" href="shop.html?cat=${c.id}">
        ${img}
        <div class="cat-name">${esc(c.label)}</div>
        <div class="cat-count">${n} ${n === 1 ? t('item') : t('items')}</div>
      </a>`;
    }).join('');

    document.getElementById('feat-grid').innerHTML =
      featured.slice(0, 8).map(cardHtml).join('');
  } catch (e) {
    console.error(e);
  }

  applyI18n();
}
document.addEventListener('DOMContentLoaded', () => {
  initHome();
  document.addEventListener('lang:changed', () => { location.reload(); });
});
