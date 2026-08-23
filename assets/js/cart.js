/* URBAN DZ — shared basket (localStorage), used by every page */
const Cart = {
  KEY: 'ud_cart_v1',
  items: [],
  load() {
    try { this.items = JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { this.items = []; }
    return this.items;
  },
  save() {
    localStorage.setItem(this.KEY, JSON.stringify(this.items));
    document.dispatchEvent(new CustomEvent('cart:changed'));
  },
  count() { return this.items.reduce((n, i) => n + i.qty, 0); },
  subtotal() { return this.items.reduce((s, i) => s + i.price * i.qty, 0); },
  add(product, size, color, qty = 1) {
    const key = item => item.id === product.id
      && item.size === (size || '') && item.color === (color || '');
    const line = this.items.find(key);
    if (line) line.qty = Math.min(line.qty + qty, 20);
    else this.items.push({
      id: product.id,
      name_fr: product.name_fr, name_ar: product.name_ar,
      price: product.price, size: size || '', color: color || '', qty,
      photo: product.photos && product.photos[0] ? product.photos[0] : '',
    });
    this.save();
  },
  updateQty(index, qty) {
    if (!this.items[index]) return;
    this.items[index].qty = Math.max(1, Math.min(20, qty));
    this.save();
  },
  remove(index) {
    this.items.splice(index, 1);
    this.save();
  },
  clear() { this.items = []; this.save(); },
};
Cart.load();
