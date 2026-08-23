# URBAN DZ — boutique homme (paiement à la livraison)

Boutique de vêtements pour homme : vitrine, panier, commande avec paiement à
la livraison (COD), suivi de commande et panneau d'administration.

- Sans build, sans serveur — n'importe quel hébergeur statique (Netlify, GitHub Pages…)
- Bilingue **FR / AR** (arabe en RTL)
- Frais de livraison par wilaya : **stopdesk** et **domicile** (58 wilayas)
- Codes promo, solde globale, livraison gratuite au-delà d'un montant
- Base de données : Supabase (gratuit)

## 1. Essayer tout de suite (mode démo)

Ouvrez `index.html` dans un navigateur : le site tourne avec des produits
d'exemple tant que Supabase n'est pas connecté. Les commandes démo restent
locales au navigateur.

## 2. Créer la base de données (10 min, gratuit)

1. [supabase.com](https://supabase.com) → créer un projet.
2. **SQL Editor → New query** → coller tout `supabase/schema.sql` → **Run**.
3. Créer le compte propriétaire : **Authentication → Users → Add user**
   (email + mot de passe fort, cocher *Auto Confirm*).
   **Le premier compte créé devient le propriétaire.**
4. **Authentication → Sign In / Providers → Email** → désactiver
   *Allow new users to sign up*.
5. Vérifier : `select * from owners;` doit renvoyer une seule ligne.

## 3. Connecter le site

Éditer `assets/js/config.js` :

```js
const SUPABASE_CONFIG = {
  url: 'https://xxxx.supabase.co',
  anonKey: 'eyJ...',
};
window.WHATSAPP = '213555123456'; // bouton WhatsApp + partage de commande
```

La bandeau « mode démo » disparaît. Connectez-vous sur `admin.html`.

## 4. Mettre en ligne (GitHub → Netlify)

1. Créer un repo GitHub, puis pousser ce dossier :
   ```bash
   cd urban-dz
   git init
   git add .
   git commit -m "URBAN DZ store"
   git remote add origin https://github.com/<vous>/urban-dz.git
   git push -u origin main
   ```
2. Sur [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project → GitHub** → choisir le repo.
3. Réglages : **Build command** = vide, **Publish directory** = `.` → Deploy.
4. Chaque `git push` redéploie automatiquement.
5. Site settings → Domain management → ajouter votre domaine.

Alternative sans Git : glisser-déposer le dossier sur [app.netlify.com/drop](https://app.netlify.com/drop).

## Pages

```
index.html        Accueil (héros, catégories, sélection)
shop.html         Catalogue : filtres latéraux, recherche, tri
product.html      Fiche produit ?id=…  (galerie, tailles, quantité)
cart.html         Panier
checkout.html     Commande COD (wilaya, stopdesk/domicile, code promo)
track.html        Suivi de commande (n° + téléphone)
faq.html          FAQ : livraison, paiement, échanges, tailles (FR/AR)
admin.html        Panneau propriétaire (connexion requise)
assets/js/        config.js ← à éditer ; i18n, db, cart, ui + scripts par page
supabase/schema.sql  Tables, règles de sécurité, place_order() — à exécuter dans Supabase
```

## Utilisation quotidienne

| Quoi | Où |
|---|---|
| Produits & photos | admin → Produits |
| Commandes, statuts, colis | admin → Commandes |
| Prix par wilaya (stopdesk / domicile) | admin → Zones |
| Nom, téléphone, solde, livraison gratuite | admin → Boutique |
| Codes promo | admin → Codes promo |

## Sécurité

Le site est statique : la vraie sécurité vit dans `supabase/schema.sql` :
les visiteurs lisent le catalogue et rien d'autre ; les commandes passent
uniquement par `place_order()`, qui recalcule tous les prix côté base ;
seul le compte listé dans `owners` peut administrer la boutique.

Paiement : **à la livraison uniquement** — aucun paiement en ligne dans le code.
Devise : DZD (`DA` / `دج`).
