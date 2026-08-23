/* URBAN DZ — shop page: sidebar categories, search, sort */
const params = new URLSearchParams(location.search);
let state = {
  cat: params.get('cat') || '',
  q: params.get('q') || '',
  sort: 'new',
};

async function loadCats() {
  const cats = await DB.listCategories();
  const list = document.getElementById('cat-list');
  list.innerHTML =
    `<li><a href="shop.html" class="${!state.cat ? 'active' : ''}" data-i18n="filter_all">${t('filter_all')}</a></li>` +
    cats.map(c =>
      `<li><a href="shop.html?cat=${c.id}" class="${state.cat == c.id ? 'active' : ''}">${esc(c.label)}</a></li>`
    ).join('');
}

async function loadGrid() {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const count = document.getElementById('count');
  if (!grid.dataset.loaded) {
    grid.innerHTML = '<div class="skel-card"></div>'.repeat(8);
    grid.dataset.loaded = '1';
  }
  const items = await DB.listProducts({ category: state.cat, search: state.q, sort: state.sort });
  grid.innerHTML = items.map(cardHtml).join('');
  empty.style.display = items.length ? 'none' : 'block';
  count.textContent = `${items.length} ${items.length === 1 ? t('item') : t('items')}`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderChrome('shop');

  document.getElementById('search').value = state.q;
  let debounce;
  document.getElementById('search').addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { state.q = e.target.value.trim(); loadGrid(); }, 250);
  });
  document.getElementById('sort').addEventListener('change', e => {
    state.sort = e.target.value; loadGrid();
  });

  Promise.all([loadCats(), loadGrid()]).then(applyI18n);
});

document.addEventListener('lang:changed', () => location.reload());
