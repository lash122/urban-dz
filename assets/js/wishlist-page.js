/* URBAN DZ — wishlist page */
async function renderWishlist() {
  const root = document.getElementById('wish-root');
  if (!Wish.ids.length) {
    root.innerHTML = `
      <div style="text-align:center;padding:60px 0">
        <p style="color:var(--ink-soft);font-size:1.6rem;margin-bottom:12px">♥</p>
        <p style="color:var(--ink-soft);margin-bottom:24px">${t('wish_empty')}</p>
        <a class="btn" href="shop.html" data-i18n="cart_continue">${t('cart_continue')}</a>
      </div>`;
    applyI18n();
    return;
  }
  const all = await DB.listProducts();
  const items = Wish.ids.map(id => all.find(p => p.id === id)).filter(Boolean);
  if (!items.length) {
    Wish.ids = []; Wish.save();
    return renderWishlist();
  }
  root.innerHTML = `<div class="grid-products" style="padding-bottom:50px">
    ${items.map(cardHtml).join('')}
  </div>`;
  applyI18n();
}

document.addEventListener('DOMContentLoaded', () => {
  renderChrome('');
  renderWishlist();
  document.addEventListener('wish:changed', renderWishlist);
});
document.addEventListener('lang:changed', () => location.reload());
