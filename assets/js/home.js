/* URBAN DZ — home page */
async function initHome() {
  renderChrome('home');

  const heroImg = document.getElementById('hero-img');
  if (heroImg) {
    let hero = '';
    try { hero = (await DB.getSettings()).hero || ''; } catch { /* demo fallback below */ }
    heroImg.src = hero || window.HERO_IMAGE
      || placeholder(LANG === 'ar' ? 'تشكيلة جديدة' : 'NOUVELLE COLLECTION', 38);
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
