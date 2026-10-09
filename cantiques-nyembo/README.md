# Cantiques Nyembo — application

Application **Android et iPhone** (et web) du recueil **Nyembo**: 450 cantiques, le logo de l'église, la recherche, les favoris, le mode hors-ligne et l'**envoi d'enregistrements audio** (solo, chorale, pupitre, instrumental, accompagnement) liés à chaque cantique.

## Fonctions

| Fonction | Détail |
|---|---|
| Recueil | 450 cantiques extraits du fichier Word : mélodie, strophes, refrains, auteur, rubrique |
| Recherche | Par numéro, titre ou paroles, sans tenir compte des accents ni des apostrophes |
| Navigation | Accès direct au numéro (`#`), cantique précédent ou suivant, balayage gauche/droite |
| Lecture | Taille du texte réglable, thème clair ou sombre, partage d'un cantique |
| Favoris | Gardés sur le téléphone |
| Hors-ligne | Paroles disponibles sans connexion une fois l'application ouverte |
| **Sons** | Envoi d'un fichier audio (MP3, M4A, WAV, OGG, note vocale WhatsApp…) ou enregistrement direct au micro, avec le type, la voix, le nom du contributeur et une remarque |
| **Modération** | Chaque son envoyé reste **en attente** jusqu'à sa validation par un responsable (onglet *Gestion*) : il est alors publié pour tous, ou rejeté |

## Structure

```
www/                              l'application (commune Android, iPhone, web)
  index.html, styles.css, app.js  interface
  store.js                        stockage des sons (Firebase ou local)
  firebase-config.js              configuration du partage (à remplir)
  data/cantiques.json             recueil (généré)
  icons/, sw.js, manifest         icônes, version web hors-ligne
android/                          projet Android natif (Capacitor)
ios/                              projet iPhone natif (Capacitor, Xcode)
assets/                           logo source des icônes et écrans de démarrage
capacitor.config.json             identifiant de l'app : com.nyembo.cantiques
firestore.rules, storage.rules    sécurité Firebase
tools/extract_cantiques.py        conversion du Word en JSON
```

## Installer sur Android (immédiat, sans Play Store)

À chaque modification poussée sur GitHub, l'action **« Nyembo – Android »** compile l'application
et publie un fichier `Nyembo-1.0.N.apk` dans l'onglet **Releases** du dépôt.

1. Sur le téléphone, ouvrir la page *Releases* du dépôt et télécharger le dernier `Nyembo-….apk`.
2. L'ouvrir ; autoriser « Installer des applications inconnues » si Android le demande.
3. L'icône **Nyembo** apparaît sur l'écran d'accueil. Les versions suivantes s'installent par-dessus.

Le fichier peut aussi être partagé par WhatsApp aux membres de la chorale.

## Publier sur le Play Store (comme les applis officielles)

1. Créer un compte **Google Play Console** (frais unique de 25 $).
2. Créer la clé officielle de signature (une seule fois, à conserver précieusement : sans elle, plus de mise à jour possible) :
   ```bash
   keytool -genkeypair -v -keystore nyembo-release.jks -alias nyembo -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 nyembo-release.jks   # copier le résultat
   ```
3. Dans GitHub → *Settings → Secrets and variables → Actions*, créer :
   `NYEMBO_KEYSTORE_BASE64` (résultat ci-dessus), `NYEMBO_KEYSTORE_PASSWORD`, `NYEMBO_KEY_ALIAS` (`nyembo`), `NYEMBO_KEY_PASSWORD`.
4. La compilation suivante produit aussi `Nyembo-1.0.N-playstore.aab` : c'est le fichier à téléverser dans la Play Console
   (fiche : nom, description, captures d'écran, politique de confidentialité, classification du contenu).

> L'APK d'installation directe est signé avec une clé « test » commune (`android/app/nyembo-debug.keystore`) :
> parfait pour la diffusion interne, mais seule la version `.aab` signée par la clé officielle va sur le Play Store.

## iPhone (App Store / TestFlight)

Apple n'autorise pas l'installation hors App Store : il faut un compte **Apple Developer** (99 $/an) et un Mac avec Xcode.

1. Sur le Mac : `npm ci && npx cap sync ios && npx cap open ios`.
2. Dans Xcode : *Signing & Capabilities* → choisir l'équipe Apple, puis *Product → Archive* → *Distribute App*.
3. Diffuser d'abord via **TestFlight** (jusqu'à 10 000 testeurs par lien), puis soumettre à l'App Store.

L'action **« Nyembo – iOS (vérification) »** (lancement manuel) vérifie que le projet iPhone compile.

En attendant, sur iPhone : ouvrir la version web dans Safari → *Partager* → **« Sur l'écran d'accueil »**.

## Modifier l'application

```bash
cd cantiques-nyembo
npm ci
npm run serve        # tester dans le navigateur : http://localhost:8000
npx cap sync         # recopier www/ dans les projets Android et iPhone
npm run assets       # régénérer icônes et écrans de démarrage depuis assets/
```

Tant que `www/firebase-config.js` n'est pas rempli, l'application tourne en **mode local** : les sons envoyés restent sur l'appareil.

## Activer le partage des sons (Firebase, offre gratuite)

1. Sur <https://console.firebase.google.com>, créer un projet (ex. `cantiques-nyembo`).
2. **Authentication** → Méthodes de connexion : activer **Anonyme** (pour les contributeurs) et **E-mail/Mot de passe** (pour les responsables). Créer ensuite le compte de chaque responsable dans l'onglet *Users*.
3. Créer une base **Firestore** et activer **Storage**.
4. Paramètres du projet → *Vos applications* → Web : copier l'objet `firebaseConfig` dans `www/firebase-config.js`.
5. Remplacer `admin@exemple.com` par les e-mails des responsables dans **trois fichiers** : `www/firebase-config.js`, `firestore.rules` et `storage.rules`.
6. Publier les règles et l'application :
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add          # choisir le projet
   firebase deploy             # hébergement + règles
   ```
   La version web sera en ligne sur `https://<projet>.web.app`. Les applications Android/iPhone utilisent la même configuration : recompiler après l'avoir remplie.

> Le projet Firebase `access-plus-consulting` existant peut aussi servir, mais un projet séparé est préférable pour isoler les données et les quotas.

**Garde-fous dans les règles**: un son ne peut être publié que par un responsable. Les fichiers sont limités à 25 Mo et aux formats audio, et un contributeur ne peut ni modifier ni supprimer un envoi.

## Mettre à jour le recueil

Après correction du fichier Word :

```bash
pip install python-docx
python3 tools/extract_cantiques.py chemin/NYEMBO_Cantiques.docx www/data/cantiques.json
```

Incrémenter ensuite `VERSION` dans `www/sw.js` (ex. `nyembo-v3`) pour que les téléphones téléchargent la nouvelle version.

## Point à vérifier dans la source

- **Cantique 110**: dans le Word, il commence à la strophe 2. La strophe 1 manque.
