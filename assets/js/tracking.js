/* URBAN DZ — ad pixels (Meta & TikTok).
   Loads NOTHING until a pixel ID is configured (dashboard → Boutique, or
   window.ADS in config.js as fallback). Events sent:
     PageView            every page
     ViewContent         product page opened
     AddToCart           added (product page, quick-add, upsell)
     InitiateCheckout    checkout form shown
     Purchase / CompletePayment   order placed (value = total to collect)
   Note for COD: Purchase fires when the order is PLACED; refused parcels
   still count. Don't read pixel revenue as takings. */
const Ads = (() => {
  let metaLoaded = false;
  let ttqReady = false;

  function ids() {
    const a = (window.SETTINGS_CACHE && window.SETTINGS_CACHE.ads) || {};
    return {
      meta: String(a.metaPixelId || (window.ADS && window.ADS.metaPixelId) || '').trim(),
      tiktok: String(a.tiktokPixelId || (window.ADS && window.ADS.tiktokPixelId) || '').trim(),
    };
  }

  function ensureMeta(id) {
    if (!id) return;
    if (!window.fbq) {
      const n = window.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(s);
    }
    if (!metaLoaded) {
      window.fbq('init', id);
      window.fbq('track', 'PageView');
      metaLoaded = true;
    }
  }

  function ensureTiktok(id) {
    if (!id || ttqReady) return;
    if (!window.ttq) {
      window.TiktokAnalyticsObject = 'ttq';
      const ttq = window.ttq = window.ttq || [];
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off',
        'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
      ttq.setAndDefer = function (t, e) {
        t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); };
      };
      for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.load = function (e) {
        ttq._i = ttq._i || {};
        ttq._i[e] = [];
        ttq._i[e]._u = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
        ttq._o = ttq._o || {}; ttq._o[e] = {};
      };
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${id}&lib=ttq`;
      document.head.appendChild(s);
    }
    window.ttq.load(id);
    window.ttq.page();
    ttqReady = true;
  }

  /* fire an event on whichever pixels are live */
  function event(name, data = {}) {
    const payload = { currency: 'DZD', ...data };
    try {
      if (metaLoaded && window.fbq) window.fbq('track', name, payload);
      if (ttqReady && window.ttq) {
        const map = {
          ViewContent: 'ViewContent',
          AddToCart: 'AddToCart',
          InitiateCheckout: 'InitiateCheckout',
          Purchase: 'CompletePayment',
        };
        window.ttq.track(map[name] || name, payload);
      }
    } catch { /* analytics must never break the shop */ }
  }

  function refresh() {
    const { meta, tiktok } = ids();
    ensureMeta(meta);
    ensureTiktok(tiktok);
  }
  refresh(); // config.js IDs work immediately

  return { event, refresh };
})();

window.Ads = Ads;
