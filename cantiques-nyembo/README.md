# Cantiques Nyembo — application

Application web installable (PWA) du recueil **Nyembo**: 450 cantiques, le logo de l'église, la recherche, les favoris, le mode hors-ligne et l'**envoi d'enregistrements audio** (solo, chorale, pupitre, instrumental, accompagnement) liés à chaque cantique.

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
index.html, styles.css, app.js   interface
store.js                          stockage des sons (Firebase ou local)
firebase-config.js                configuration du partage (à remplir)
data/cantiques.json               recueil (généré)
icons/                            logo et icônes d'application
sw.js, manifest.webmanifest       PWA / hors-ligne
firestore.rules, storage.rules    sécurité Firebase
tools/extract_cantiques.py        conversion du Word en JSON
```

## Essayer en local

```bash
cd cantiques-nyembo
python3 -m http.server 8000
# ouvrir http://localhost:8000
```

Tant que `firebase-config.js` n'est pas rempli, l'application tourne en **mode local** : les sons envoyés restent sur l'appareil.

## Activer le partage des sons (Firebase, offre gratuite)

1. Sur <https://console.firebase.google.com>, créer un projet (ex. `cantiques-nyembo`).
2. **Authentication** → Méthodes de connexion : activer **Anonyme** (pour les contributeurs) et **E-mail/Mot de passe** (pour les responsables). Créer ensuite le compte de chaque responsable dans l'onglet *Users*.
3. Créer une base **Firestore** et activer **Storage**.
4. Paramètres du projet → *Vos applications* → Web : copier l'objet `firebaseConfig` dans `firebase-config.js`.
5. Remplacer `admin@exemple.com` par les e-mails des responsables dans **trois fichiers** : `firebase-config.js`, `firestore.rules` et `storage.rules`.
6. Publier les règles et l'application :
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add          # choisir le projet
   firebase deploy             # hébergement + règles
   ```
   L'application sera en ligne sur `https://<projet>.web.app`. Les utilisateurs l'ajoutent à l'écran d'accueil depuis le menu du navigateur (« Installer l'application »).

> Le projet Firebase `access-plus-consulting` existant peut aussi servir, mais un projet séparé est préférable pour isoler les données et les quotas.

**Garde-fous dans les règles**: un son ne peut être publié que par un responsable. Les fichiers sont limités à 25 Mo et aux formats audio, et un contributeur ne peut ni modifier ni supprimer un envoi.

## Mettre à jour le recueil

Après correction du fichier Word :

```bash
pip install python-docx
python3 tools/extract_cantiques.py chemin/NYEMBO_Cantiques.docx data/cantiques.json
```

Incrémenter ensuite `VERSION` dans `sw.js` (ex. `nyembo-v2`) pour que les téléphones téléchargent la nouvelle version.

## Point à vérifier dans la source

- **Cantique 110**: dans le Word, il commence à la strophe 2. La strophe 1 manque.
