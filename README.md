# Invoice Bank — démonstration

Application bancaire mobile pour la zone CEMAC. Web mobile-first, installable
en PWA, déployable sur GitHub Pages.

**Données entièrement fictives.** Aucune information client réelle.

---

## Démarrer

```bash
npm install
npm run dev        # développement
npm test           # tests du noyau métier (38 vérifications)
npm run build      # build de production
npm run preview    # vérifier le build localement
```

## Déployer sur GitHub Pages

1. Créez un dépôt et poussez ce dossier sur la branche `main`.
2. Dans **Settings → Pages**, choisissez **GitHub Actions** comme source.
3. Le workflow `.github/workflows/deploy.yml` construit et publie à chaque push.

Le chemin de base est déduit du nom du dépôt. Pour un domaine personnalisé,
passez `BASE_PATH=/` au build.

L'URL finale ressemble à `https://<compte>.github.io/<dépôt>/`.

## Installation sur téléphone

- **Android / Chrome** — une invite d'installation apparaît ; le bouton est
  aussi disponible dans le mode présentateur. L'icône se pose sur l'écran d'accueil.
- **iPhone / Safari** — Apple ne permet pas l'invite automatique :
  bouton *Partager* → *Sur l'écran d'accueil*.

Une fois installée, l'application fonctionne **hors ligne**.

---

## Mode présentateur

Accès : ajoutez `#/studio` à l'URL, puis saisissez le code.

Le code par défaut est dans `src/core/config.ts` (`STUDIO_CODE`).
**Changez-le avant de diffuser le lien.**

Aucun bouton de l'application ne mène à cet écran : un banquier qui explore
ne tombera jamais sur les commandes de démonstration.

Ce que le mode présentateur permet :

| Commande | Effet |
|---|---|
| Réseau | En ligne / faible / hors ligne |
| **Coupure de courant** | Tue l'application en pleine opération. Rouvrez : la file a survécu. |
| Profil de banque | Bascule entre 4 identités, dont celle créée dans le configurateur |
| Parcours | Saute à n'importe quelle étape de la démonstration |
| Langue, réinitialisation, installation | — |

---

## Photos

Les emplacements photo sont vides par défaut et remplacés par un repli
graphique. Pour utiliser de vraies images :

1. Déposez-les dans `public/img/`
2. Référencez-les dans `PHOTOS`, fichier `src/core/config.ts` :

```ts
export const PHOTOS = {
  welcome: 'img/welcome.jpg',
  login: 'img/login.jpg',
  platform: '',
};
```

Format portrait, 1200×1600 minimum. **Images libres de droits uniquement**
(Unsplash, Pexels, ou vos propres photos).

- `welcome` — façade d'agence, immeuble, skyline urbaine
- `login` — texture sobre, architecture. Pas de visage : il détourne l'œil
  au moment de saisir le code.

---

## Architecture

```
src/
  core/       Logique métier en TypeScript pur — aucune dépendance à React
    types.ts      Modèle de données
    ledger.ts     Soldes, plafonds, machine à états
    seed.ts       Jeux de démonstration
    qr.ts         Générateur QR (mode octet, correction L)
    sign.ts       Signature de reçu
    config.ts     Profils de banque, palettes, photos, code présentateur
  state/      Magasin observable (useSyncExternalStore)
  i18n/       Français / anglais, vérifiés par le compilateur
  ui/         Composants et châssis
  screens/    Écrans
```

**Le dossier `core/` est le produit.** Il ne touche jamais le DOM et se
transporte tel quel vers une application native. `ui/` et `screens/` ne sont
que la peau.

### Le point d'intégration

En démonstration, les données viennent d'un cœur simulé. En production, seule
la couche d'accès aux données change — l'application, elle, ne bouge pas.
C'est ce qui rend le modèle white-label possible : un seul code, N banques.

---

## Machine à états d'une transaction

```
DRAFT → PENDING → (QUEUED) → SENT → SETTLED | FAILED
```

- `PENDING` **réserve immédiatement** le montant : le solde disponible baisse,
  le solde comptable ne bouge pas. C'est ce qui empêche d'empiler des virements
  hors ligne au-delà du solde.
- `SETTLED` déplace le montant du réservé vers le comptable.
- Une opération `QUEUED` **reste visible** dans l'historique. Elle ne disparaît jamais.
- Chaque opération porte une **clé d'idempotence** générée à la validation :
  rejouée après une coupure, elle ne se duplique pas.

---

## Limites assumées — à annoncer soi-même en rendez-vous

Ces points sont signalés dans l'interface. Ne les cachez pas : un DSI à qui on
annonce une limite avant qu'il la découvre fait confiance.

- **Signature du reçu** — de démonstration. En production : signature
  cryptographique, clé détenue par la banque, jamais embarquée dans l'application.
- **Caméra de vérification** — simulée.
- **USSD** — le code est correctement formé et ouvre le composeur, mais
  n'est raccordé à aucun opérateur. Raccordement en phase d'intégration.
- **KYC** — parcours complet, vérification simulée.
- **Core banking** — simulé (voir « point d'intégration » ci-dessus).

---

## Tests

`npm test` couvre le noyau : formatage monétaire, calcul des soldes, plafonds
par banque et par palier, machine à états, virement interne, code USSD,
signature et altération de reçu, générateur QR, profils white-label, wallet.

Le générateur QR a par ailleurs été vérifié module par module contre une
implémentation de référence, puis ses codes testés au décodage par un lecteur réel.

---

## Avant de diffuser le lien

- [ ] Changer `STUDIO_CODE` dans `src/core/config.ts`
- [ ] Déposer les photos dans `public/img/`
- [ ] Ajuster les profils de banque (`BANKS`) aux prospects visés
- [ ] Tester sur un Android d'entrée de gamme, pas seulement sur un ordinateur
- [ ] Se rappeler qu'une page GitHub Pages est **publique** : tout le monde
      peut la voir, concurrents compris
