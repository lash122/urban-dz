/* URBAN DZ — database layer.
   Live mode talks to Supabase; DEMO mode serves sample data from memory
   and keeps demo orders in localStorage, so the whole site works offline. */

/* ---------- demo catalogue ---------- */
const DEMO_CATEGORIES = [
  { id: 1, name_fr: 'T-shirts',   name_ar: 'تيشيرتات' },
  { id: 2, name_fr: 'Chemises',   name_ar: 'قمصان' },
  { id: 3, name_fr: 'Jeans',      name_ar: 'جينز' },
  { id: 4, name_fr: 'Vestes',     name_ar: 'جاكيتات' },
  { id: 5, name_fr: 'Hoodies',    name_ar: 'هوديز' },
  { id: 6, name_fr: 'Jogging',    name_ar: 'ملابس رياضية' },
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
let _demoId = 100;

function dp(name_fr, name_ar, price, compare_at_price, category_id, hue, colors) {
  return {
    id: ++_demoId,
    name_fr, name_ar,
    description_fr: 'Coupe moderne et tissu respirant. Lavable en machine à 30°. Le mannequin porte la taille L.',
    description_ar: 'قصة عصرية ونسيج مريح. قابل للغسل في الغسالة على 30 درجة. العارض يرتدي مقاس L.',
    price, compare_at_price, photos: [''], sizes: SIZES.slice(),
    colors: colors || [], category_id, stock: 25, featured: false, active: true,
    _hue: hue,
  };
}

const DEMO_PRODUCTS = [
  Object.assign(dp('T-shirt Essentiel Coton',   'تيشيرت قطن أساسي',        1800, 2400, 1, 205, ['Noir', 'Blanc', 'Marine']), { featured: true }),
  Object.assign(dp('T-shirt Oversize Noir',     'تيشيرت أوفرسايز أسود',    2200, 0,    1, 260, ['Noir', 'Gris']), { featured: true }),
  Object.assign(dp('Chemise Lin Beige',         'قمصة كتان بيج',           3500, 4200, 2, 40,  ['Beige', 'Bleu']), { featured: true }),
  Object.assign(dp('Chemise Carreaux Flanelle','قمصة كاروهات فلانيل',     3900, 0,    2, 15,  ['Bordeaux', 'Vert'])),
  Object.assign(dp('Jean Slim Bleu Brut',       'جينز سليم أزرق',          4500, 5500, 3, 220, ['Bleu', 'Noir']), { featured: true }),
  Object.assign(dp('Jean Cargo Noir',           'جينز كارغو أسود',         5200, 0,    3, 0,   ['Noir', 'Kaki'])),
  Object.assign(dp('Veste Bomber Kaki',         'جاكيت بومبر خاكي',        7500, 9000, 4, 90,  ['Kaki', 'Noir']), { featured: true }),
  Object.assign(dp('Veste Denim Classic',       'جاكيت جينز كلاسيكي',      6800, 0,    4, 210, ['Bleu'])),
  Object.assign(dp('Hoodie Grinché Gris',       'هودي رمادي',              3800, 4600, 5, 200, ['Gris', 'Noir']), { featured: true }),
  Object.assign(dp('Hoodie Zip Marine',         'هودي بسحاب كحلي',         4200, 0,    5, 230, ['Marine', 'Noir'])),
  Object.assign(dp('Survêtement Jogging Noir',  'طقم رياضي أسود',          5900, 7200, 6, 0,   ['Noir', 'Gris'])),
  Object.assign(dp('Pantalon Jogging Taupe',    'بنطلون رياضيرمادي',       2800, 0,    6, 35,  ['Taupe', 'Noir'])),
];
DEMO_PRODUCTS.forEach((p, i) => { if (i % 3 === 0) p.featured = true; });

const DEFAULT_ZONES = [
  ['Adrar',900,1400],['Chlef',400,600],['Laghouat',500,800],['Oum El Bouaghi',500,750],
  ['Batna',500,750],['Béjaïa',450,650],['Biskra',550,850],['Béchar',800,1200],
  ['Blida',400,500],['Bouira',450,650],['Tamanrasset',900,1600],['Tébessa',500,800],
  ['Tlemcen',450,700],['Tiaret',500,750],['Tizi Ouzou',450,650],['Alger',400,500],
  ['Djelfa',500,800],['Jijel',450,700],['Sétif',450,700],['Saïda',500,750],
  ['Skikda',450,700],['Sidi Bel Abbès',450,700],['Annaba',450,700],['Guelma',450,700],
  ['Constantine',450,650],['Médéa',450,650],['Mostaganem',450,700],["M'Sila",500,750],
  ['Mascara',450,700],['Ouargla',700,1100],['Oran',450,650],['El Bayadh',700,1100],
  ['Illizi',900,1600],['Bordj Bou Arréridj',450,700],['Boumerdès',400,550],['El Tarf',500,750],
  ['Tindouf',900,1600],['Tissemsilt',500,800],['El Oued',600,950],['Khenchela',500,750],
  ['Souk Ahras',500,750],['Tipaza',400,550],['Mila',450,700],['Aïn Defla',450,650],
  ['Naâma',700,1100],['Aïn Témouchent',450,700],['Ghardaïa',600,950],['Relizane',450,650],
  ['Timimoun',900,1400],['Bordj Badji Mokhtar',900,1600],['Ouled Djellal',550,850],
  ['Béni Abbès',800,1200],['In Salah',900,1600],['In Guezzam',900,1600],
  ['Touggourt',600,950],['Djanet',900,1600],["El M'Ghair",600,950],['El Meniaa',700,1100],
].map(([name, desk, home], i) => ({ code: i + 1, name, desk, home }));

const DEMO_SETTINGS = {
  store: { name: 'URBAN DZ', phone: '', email: '' },
  zones: DEFAULT_ZONES,
  promo: { active: false, percent: 0 },
  free_delivery_from: null,
  hero: '',
  whatsapp: '',
  announce: { active: false, text_fr: '', text_ar: '' },
  socials: { instagram: '', facebook: '', tiktok: '' },
  exchange_days: 7,
  ads: { metaPixelId: '', tiktokPixelId: '' },
  verifications: {
    'facebook-domain-verification': '',
    'tiktok-developers-site-verification': '',
    'google-site-verification': '',
  },
};

function demoOrders() {
  try { return JSON.parse(localStorage.getItem('ud_demo_orders')) || []; }
  catch { return []; }
}
function saveDemoOrders(o) { localStorage.setItem('ud_demo_orders', JSON.stringify(o)); }

/* ---------- the DB facade ---------- */
const DB = (() => {
  let client = null;
  if (!window.IS_DEMO && window.supabase) {
    client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  }
  const live = () => !!client;

  function catName(c) { return LANG === 'ar' ? c.name_ar : c.name_fr; }

  async function listCategories() {
    if (!live()) return DEMO_CATEGORIES.map((c, i) => ({
      ...c,
      label: catName(c),
      // demo tiles get generated artwork; real shops upload photos via admin
      image: typeof placeholder === 'function' ? placeholder(catName(c), 30 + i * 40) : '',
    }));
    const { data, error } = await client.from('categories').select('*').order('sort');
    if (error) throw error;
    return (data || []).map(c => ({ ...c, label: catName(c) }));
  }

  function decorate(p) {
    return { ...p, photo: p.photos && p.photos[0] ? p.photos[0] : '' };
  }

  async function listProducts({ category, search = '', sort = 'new' } = {}) {
    let items;
    if (!live()) items = DEMO_PRODUCTS.filter(p => p.active);
    else {
      let q = client.from('products').select('*').eq('active', true);
      const { data, error } = await q;
      if (error) throw error;
      items = data || [];
    }
    if (category) items = items.filter(p => p.category_id === Number(category));
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(p =>
        [p.name_fr, p.name_ar, p.name_en].some(n => (n || '').toLowerCase().includes(s)));
    }
    switch (sort) {
      case 'asc':  items.sort((a, b) => a.price - b.price); break;
      case 'desc': items.sort((a, b) => b.price - a.price); break;
      case 'pop':  items.sort((a, b) => (b.compare_at_price > b.price ? 1 : 0) - (a.compare_at_price > a.price ? 1 : 0)); break;
      default:     items.sort((a, b) => b.id - a.id);
    }
    return items.map(decorate);
  }

  async function getFeatured() {
    if (!live()) return DEMO_PRODUCTS.filter(p => p.active && p.featured).map(decorate);
    const { data, error } = await client.from('products').select('*').eq('active', true).eq('featured', true);
    if (error) throw error;
    return (data || []).map(decorate);
  }

  async function getProduct(id) {
    if (!live()) return decorate(DEMO_PRODUCTS.find(p => p.id === Number(id)) || null);
    const { data, error } = await client.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? decorate(data) : null;
  }

  async function getSettings() {
    if (!live()) return JSON.parse(JSON.stringify(DEMO_SETTINGS));
    const rows = await Promise.all(['store', 'zones', 'promo', 'free_delivery_from',
      'hero', 'whatsapp', 'announce', 'socials', 'exchange_days', 'ads', 'verifications']
      .map(k => client.from('settings').select('key,value').eq('key', k).maybeSingle()));
    const out = {};
    rows.forEach(r => { if (r.data) out[r.data.key] = r.data.value; });
    out.store = out.store || { name: 'URBAN DZ', phone: '' };
    out.zones = Array.isArray(out.zones) ? out.zones : [];
    out.hero = typeof out.hero === 'string' ? out.hero : '';
    out.whatsapp = typeof out.whatsapp === 'string' ? out.whatsapp : '';
    out.announce = out.announce && typeof out.announce === 'object'
      ? out.announce : { active: false, text_fr: '', text_ar: '' };
    out.socials = out.socials && typeof out.socials === 'object'
      ? out.socials : { instagram: '', facebook: '', tiktok: '' };
    out.exchange_days = Number(out.exchange_days) || 7;
    out.ads = out.ads && typeof out.ads === 'object'
      ? out.ads : { metaPixelId: '', tiktokPixelId: '' };
    out.verifications = out.verifications && typeof out.verifications === 'object'
      ? out.verifications
      : { 'facebook-domain-verification': '', 'tiktok-developers-site-verification': '', 'google-site-verification': '' };
    return out;
  }

  function validDzPhone(phone) {
    const d = String(phone || '').replace(/\D/g, '').replace(/^00/, '').replace(/^213/, '').replace(/^0/, '');
    return /^[567]\d{8}$/.test(d) ? '0' + d : null;
  }

  async function checkPromo(code, subtotal) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return null;
    if (!live()) {
      if (code === 'URBAN10' && subtotal >= 3000) return { code, percent: 10 };
      throw new Error(code === 'URBAN10' ? 'PROMO_MIN_ORDER' : 'INVALID_PROMO');
    }
    const { data, error } = await client.rpc('check_promo', { p_code: code, p_sub: subtotal });
    if (error) throw new Error(error.message.includes('MIN_ORDER') ? 'PROMO_MIN_ORDER' : 'INVALID_PROMO');
    return data;
  }

  async function placeOrder({ name, phone, address, zone, deliveryType, items, promoCode }) {
    const cleanPhone = validDzPhone(phone);
    if (!cleanPhone) throw new Error('INVALID_PHONE');

    if (!live()) {
      // demo: simulate place_order() pricing
      const s = JSON.parse(JSON.stringify(DEMO_SETTINGS));
      const z = s.zones.find(z => z.name === zone);
      if (!z) throw new Error('UNKNOWN_ZONE');
      let fee = deliveryType === 'desk' ? z.desk : z.home;
      let sub = 0;
      const lines = [];
      for (const it of items) {
        const p = DEMO_PRODUCTS.find(p => p.id === it.id);
        if (!p) throw new Error('PRODUCT_UNAVAILABLE');
        sub += p.price * it.qty;
        lines.push({
          product_id: p.id, name_fr: p.name_fr, name_ar: p.name_ar,
          size: it.size || '', color: it.color || '', qty: it.qty, price: p.price,
          base_price: p.compare_at_price || p.price,
          photo: '',
        });
      }
      let discount = 0, usedCode = '';
      if (promoCode) {
        const c = await checkPromo(promoCode, sub);
        discount = Math.round(sub * c.percent / 100);
        usedCode = c.code;
      }
      if (s.free_delivery_from > 0 && sub - discount >= s.free_delivery_from) fee = 0;
      const orders = demoOrders();
      const order = {
        id: 1000 + orders.length + 1,
        customer_name: name, phone: cleanPhone, address, zone,
        delivery_fee: fee, items: lines, subtotal: sub,
        discount, promo_code: usedCode, total: sub - discount + fee,
        status: 'new', delivery_type: deliveryType,
        carrier: '', tracking_number: '',
        created_at: new Date().toISOString(),
      };
      orders.unshift(order);
      saveDemoOrders(orders);
      return order;
    }

    const payload = {
      p_name: name, p_phone: phone, p_address: address || '', p_zone: zone,
      p_items: items.map(i => ({ product_id: i.id, size: i.size || '', color: i.color || '', qty: i.qty })),
      p_promo_code: promoCode || '', p_delivery_type: deliveryType || 'home',
    };
    const { data, error } = await client.rpc('place_order', payload);
    if (error) {
      const msg = error.message || '';
      if (msg.includes('INVALID_PHONE')) throw new Error('INVALID_PHONE');
      if (msg.includes('UNKNOWN_ZONE')) throw new Error('UNKNOWN_ZONE');
      if (msg.includes('OUT_OF_STOCK')) throw new Error(msg.split(':').pop());
      if (msg.includes('INVALID_PROMO')) throw new Error('INVALID_PROMO');
      if (msg.includes('TOO_MANY_ORDERS')) throw new Error('TOO_MANY_ORDERS');
      throw new Error('ORDER_FAILED');
    }
    return data;
  }

  async function trackOrder(id, phone) {
    if (!live()) {
      const o = demoOrders().find(o =>
        o.id === Number(id) &&
        o.phone.replace(/\D/g, '').slice(-8) === String(phone).replace(/\D/g, '').slice(-8));
      if (!o) throw new Error('NOT_FOUND');
      return o;
    }
    const { data, error } = await client.rpc('track_order', { p_id: Number(id), p_phone: phone });
    if (error) throw new Error('NOT_FOUND');
    return data;
  }

  /* ----- admin-only operations (live mode only) ----- */
  const Admin = {
    active() { return live(); },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signOut() { await client.auth.signOut(); },
    onAuth(cb) {
      client.auth.onAuthStateChange((_e, session) => cb(!!session));
    },
    async isOwner() {
      const { count } = await client.from('owners').select('*', { count: 'exact', head: true });
      return count === 1;
    },
    table(name) { return client.from(name); },

    /* Shrink a photo in the browser before uploading: long edge ≤ maxDim,
       re-encoded JPEG. Big difference on mobile data — and Storage bills
       egress. Falls back to the original file when smaller/better as-is. */
    async compressImage(file, maxDim = 1400, quality = 0.82) {
      try {
        if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
        const img = await new Promise((res, rej) => {
          const url = URL.createObjectURL(file);
          const i = new Image();
          i.onload = () => { URL.revokeObjectURL(url); res(i); };
          i.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')); };
          i.src = url;
        });
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
        if (!blob || blob.size >= file.size) return file;
        return new File([blob], String(file.name).replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
      } catch { return file; }
    },

    async uploadPhoto(file) {
      const compressed = await this.compressImage(file);
      const path = `p-${Date.now()}-${String(compressed.name).replace(/[^\w.-]/g, '_')}`;
      const { error } = await client.storage.from('products').upload(path, compressed);
      if (error) throw error;
      return client.storage.from('products').getPublicUrl(path).data.publicUrl;
    },
  };

  return { live, validDzPhone, listCategories, listProducts, getFeatured, getProduct,
           getSettings, checkPromo, placeOrder, trackOrder, Admin };
})();
