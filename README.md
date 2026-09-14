# Éco-Campus RDC

Plateforme de services et de formations en République démocratique du Congo.
Application React (Create React App) adossée à Firebase, déployée sur Vercel.

## Stack

| Brique | Choix |
|---|---|
| Interface | React 18 (CRA `react-scripts` 5) |
| Authentification | Firebase Auth (e-mail/mot de passe, Google, Facebook) |
| Base de données | Cloud Firestore |
| Fichiers | Firebase Storage |
| PDF (attestations) | jsPDF, chargé à la demande depuis un CDN |
| Déploiement | Vercel (build automatique sur `main`, preview sur chaque PR) |

## Démarrer

```bash
npm install     # Node >= 18
npm start       # http://localhost:3000
npm run build   # build de production dans build/
```

## Structure

```
public/
  index.html              squelette HTML (métadonnées, icônes, polices)
  manifest.json           manifeste PWA
  favicon.ico|.svg        icônes du site
  icon-192|512.png        icônes PWA
  apple-touch-icon.png    icône iOS
  logo.png                logo Access Plus Consulting
  robots.txt
  inscription-access-plus-v2-2.html   pages d'inscription autonomes (hors application React)
  inscription-access-plus-v3.html
src/
  index.js                point d'entrée React
  App.jsx                 application complète (thèmes, rôles, modules)
```

`src/App.jsx` regroupe toute l'application dans un seul fichier : palettes de thèmes
(`TH`, `ACC`), primitives d'interface, puis les trois espaces par rôle — administrateur,
formateur, apprenant — montés selon le rôle lu dans Firestore.

## Configuration Firebase

La configuration client se trouve en tête de `src/App.jsx` (`FB_CONFIG`). Ces valeurs
sont **publiques par conception** chez Firebase : elles identifient le projet, elles
n'autorisent rien par elles-mêmes. Ce qui protège réellement les données, ce sont les
**règles de sécurité Firestore et Storage** — c'est là que doivent vivre les
restrictions par rôle (`admin`, `formateur`, `user`), et non côté interface.

## Polices

Les trois familles (Outfit, Fraunces, JetBrains Mono) sont chargées dans
`public/index.html` avec `preconnect`. Ne pas les réintroduire via `@import` dans le CSS
injecté à l'exécution : la requête ne partirait qu'après l'exécution du bundle.

## Déploiement

Vercel détecte Create React App automatiquement — aucune configuration n'est nécessaire.
Un `package-lock.json` est versionné : Vercel l'utilise (`npm ci`) pour des builds
reproductibles.
