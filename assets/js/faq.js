/* URBAN DZ — FAQ page (edit the Q&A below; FR and AR stay side by side) */
const FAQ_DATA = {
  fr: [
    ['Comment puis-je payer ma commande ?',
     'Le paiement se fait à la livraison uniquement (espèces). Vous ne payez rien en ligne : le livreur vous remet le colis, vous le payez sur place.'],
    ['Quels sont les délais de livraison ?',
     'Alger et grandes villes : 24 à 48 h. Autres wilayas : 2 à 4 jours ouvrables. Vous pouvez suivre votre commande à tout moment depuis la page « Suivi commande » avec votre numéro de commande et votre téléphone.'],
    ['C\'est quoi la différence entre domicile et stopdesk ?',
     'À domicile : le livreur vient jusqu\'à votre adresse. Stopdesk : vous récupérez le colis à l\'agence du transporteur la plus proche — c\'est moins cher. Le prix exact de votre wilaya s\'affiche au moment de la commande.'],
    ['Et si la taille ne convient pas ?',
     'Vous avez {d} jours pour demander un échange : le produit doit être neuf, non porté, avec son emballage. Contactez-nous sur WhatsApp avec votre numéro de commande et nous organisons l\'échange. Consultez le guide des tailles sur chaque fiche produit avant de commander.'],
    ['Comment choisir ma taille ?',
     'Chaque fiche produit a un « Guide des tailles » avec poitrine et longueur en cm, mesurées à plat (tolérance ±2 cm). En cas d\'hésitation entre deux tailles, prenez la plus grande.'],
    ['Comment contacter le service client ?',
     'Le plus rapide : le bouton WhatsApp vert en bas de l\'écran. Nous répondons de 9h à 18h, 7 jours sur 7.'],
  ],
  ar: [
    ['كيف أدفع ثمن طلبي؟',
     'الدفع عند الاستلام فقط (نقداً). لا يوجد أي دفع عبر الإنترنت: يسلم لك عامل التوصيل الطلب وتدفعه في نفس اللحظة.'],
    ['كم تستغرق مدة التوصيل؟',
     'الجزائر والمدن الكبرى: 24 إلى 48 ساعة. باقي الولايات: 2 إلى 4 أيام عمل. يمكنك تتبع طلبك في أي وقت من صفحة «تتبع الطلب» برقم الطلب ورقم هاتفك.'],
    ['ما الفرق بين التوصيل للمنزل وستوب ديسك؟',
     'إلى المنزل: يأتي عامل التوصيل إلى عنوانك. ستوب ديسك: تستلم طلبك من أقرب وكالة توصيل — والسعر أرخص. يظهر السعر الدقيق لولايتك عند إتمام الطلب.'],
    ['وإذا لم يناسبني المقاس؟',
     'لديك {d} أيام لطلب التبديل: يجب أن يكون المنتج جديداً وغير مستعمل وبغلافه الأصلي. تواصل معنا عبر واتساب مع رقم طلبك وسنرتب التبديل. راجع دليل المقاسات في صفحة كل منتج قبل الشراء.'],
    ['كيف أختار مقاسي؟',
     'كل صفحة منتج تحتوي على «دليل المقاسات» بالسنتيمتر (الصدر والطول)، القياسات مسطحة بفارق ±2 سم. إذا كنت محتاراً بين مقاسين، اختر الأكبر.'],
    ['كيف أتواصل مع خدمة العملاء؟',
     'الأسرع: زر واتساب الأخضر أسفل الشاشة. نرد من 9 صباحاً إلى 6 مساءً، سبعة أيام في الأسبوع.'],
  ],
};

async function renderFaq() {
  try { window.EXCHANGE_DAYS = (await DB.getSettings()).exchange_days || 7; } catch { /* keep default */ }
  const items = FAQ_DATA[LANG] || FAQ_DATA.fr;
  document.getElementById('faq-root').innerHTML = items.map(([q, a]) => `
    <details class="acc" style="background:var(--surface);border:1px solid var(--line);
      border-radius:12px;padding:0 18px;margin-bottom:12px">
      <summary>${esc(q)}</summary>
      <div class="acc-body" style="padding-bottom:16px">${esc(a).replace(/\{d\}/g, window.EXCHANGE_DAYS)}</div>
    </details>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderChrome('faq');
  renderFaq();
});
document.addEventListener('lang:changed', () => location.reload());
