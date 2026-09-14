# ECC Kingasani 2 — Refonte de l'environnement visuel (UI/UX v3)

Fichier livré : `finance-app/index.html` (application complète, autonome, un seul fichier).

## Principe de la refonte

**Aucune ligne de logique métier n'a été modifiée.** Le calcul des recettes/dépenses,
la distribution, les cotisations, la synchronisation Firebase, les exports XLSX et les
impressions sont strictement identiques à la version d'origine.

Deux couches ont été ajoutées en fin de `<head>` et en fin de `<body>` :

| Bloc | Emplacement | Rôle |
|---|---|---|
| `<style id="ui-v3">` | dernier bloc de styles | design system de surcharge (~600 lignes) |
| `<script id="ux-v3">` | dernier bloc de script | fonctions UX additives, encapsulées (IIFE) |

Les sélecteurs existants, les `id`, les classes et les `onclick` sont inchangés :
la surcharge se fait uniquement par cascade CSS. Retirer les deux blocs restitue
exactement l'application d'origine.

## 1. Identité visuelle

- Palette retravaillée autour du couple **marine / or** d'origine, avec des contrastes
  relevés : bleu `#2b83d6`, or `#e2b563`, vert `#12805c`, rouge `#c3352b`, ambre `#b8760a`.
- Fond applicatif en dégradé profond avec deux halos radiaux (or + azur) au lieu d'un
  aplat linéaire.
- Échelle cohérente de rayons (8 / 12 / 16 / 22 px) et trois niveaux d'ombre portée.
- Chiffres monétaires en **chiffres tabulaires** (`font-variant-numeric: tabular-nums`)
  partout : les montants s'alignent verticalement dans les tableaux et les KPI.

## 2. Navigation

- **En-tête en verre dépoli** (`backdrop-filter`), filet doré, ombre portée ; toutes les
  pastilles du header (sync, cloche, taux, thème, profil, quitter) ramenées au même
  gabarit 32 px arrondi.
- **Onglets et barre de modules en pilules** : l'onglet actif est une pastille dorée
  pleine au lieu d'un simple soulignement — repère beaucoup plus lisible sur mobile.
- Le bouton `← Accueil` injecté en ligne dans chaque barre d'onglets a été harmonisé
  avec les pilules.
- **Palette de commandes (Ctrl/Cmd + K)** : recherche instantanée des 13 modules, des
  onglets du module courant et de 3 actions (thème, synchronisation, impression).
  Navigation clavier ↑ ↓ / Entrée / Échap. Bouton « Rechercher » dans l'en-tête.
  Les contrôles de permission existants restent maîtres : la palette appelle
  `switchModule()`, qui refuse l'accès comme auparavant.
- **Bouton « retour en haut »** flottant, apparaît au-delà de 320 px de défilement.

## 3. Écran d'accueil (menu par tuiles)

- Fond dédié avec halo doré, sections mieux séparées.
- Tuiles en verre : pastille d'icône en dégradé, élévation au survol, liseré doré,
  badge de notification avec ombre.
- Bandeau de résumé financier en carte vitrée, montants agrandis ;
  **passage en grille 2 × 2 sur téléphone** (auparavant 4 colonnes écrasées).

## 4. Saisie et lecture des données

- Champs de formulaire : fond, bordure et **anneau de focus** homogènes
  (`box-shadow` bleu), état survolé, hauteur de frappe confortable.
- Lignes de recettes/dépenses : séparateurs adoucis, surlignage au survol,
  bouton de suppression plus lisible.
- Barres de totaux et « grand box » retravaillées (dégradé, halo doré).
- Tableaux (`.dtable`, `.cotis-table`) : en-têtes dégradés, zébrage,
  survol de ligne, coins arrondis, densité de lecture augmentée.
- KPI (`.stat`, `.stat-card`, `.dc2`, `.sc`) : valeur portée à ~1,2 rem,
  libellés en petites capitales espacées, liseré de couleur épaissi, élévation au survol.
- Graphiques : barres arrondies à dégradé vertical, réaction au survol,
  hauteur portée à 130 px.

## 5. Mode sombre

Le mode sombre d'origine ne couvrait qu'une quinzaine de sélecteurs ; il est désormais
piloté par variables et couvre : cartes, en-têtes de cartes, tableaux, KPI, historique,
fiches membres, modales, notifications, panneaux de validation, boutons secondaires,
palette de commandes, écran de connexion, ainsi que **les conteneurs stylés en ligne**
(`background:#fff` codé en dur dans le HTML), qui restaient blancs.

Ajout : au premier lancement, si aucun choix n'est enregistré, le thème suit la
préférence système (`prefers-color-scheme`). Le choix manuel reste prioritaire et
persistant (`localStorage: ecc_dark_mode`).

## 6. Accessibilité et confort

- Anneau de focus visible (`:focus-visible`) sur tous les éléments interactifs.
- Respect de `prefers-reduced-motion` : animations neutralisées si l'utilisateur
  le demande au niveau système.
- `viewport-fit=cover` + `env(safe-area-inset-*)` : plus de chevauchement avec la barre
  gestuelle iPhone (toast et bouton flottant).
- Métadonnées ajoutées : `theme-color`, `color-scheme`, `description`.
- Impression : masquage des éléments d'interface ajoutés, cartes sans ombre,
  en-têtes lisibles en noir.

## 7. Zoom et taille de frappe sur mobile (correctif WCAG 1.4.4)

- `maximum-scale=1.0` a été **retiré** du `<meta viewport>` : le zoom manuel
  (pincement) est de nouveau possible, ce qui lève l'échec au critère WCAG 1.4.4.
- Pour éviter le zoom automatique de Safari iOS à la prise de focus, tous les champs
  de saisie passent à **16 px sur les appareils tactiles uniquement**, via
  `@media (max-width:1024px) and (pointer:coarse)` : champs de formulaire, montants
  CDF/USD, notes, codes, recherche, connexion, taux de change.
  Hauteurs de frappe ajustées en conséquence (42 px pour les champs de formulaire,
  40 px pour les montants, 46 px pour la connexion).
- **Le poste de travail n'est pas touché** : `pointer:fine` conserve la densité
  compacte d'origine (13,4 px pour les champs, 12,6 px pour les montants).
- En **paysage tactile**, les colonnes de montants passent de 100 à 124 px et la
  colonne Note est resserrée, pour absorber la taille de frappe sans troncature :
  un montant à 8 chiffres (12 500 000) s'affiche intégralement.

## Vérifications effectuées

Rendu contrôlé sous Chromium (Playwright), thèmes clair et sombre, sur les modules
Accueil, Finances (Recettes, Dashboard) et Membres :

- 1280 px (pointeur fin) : densité de saisie inchangée par rapport à l'original ;
- 390 × 844 px tactile (portrait) et 844 × 390 px tactile (paysage) : champs à 16 px,
  **aucun débordement horizontal**, aucune troncature de montant ;
- aucune erreur JavaScript, aucun élément masqué ou déplacé par rapport à l'original.
