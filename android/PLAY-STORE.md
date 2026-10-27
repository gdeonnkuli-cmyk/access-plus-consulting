# Publication de l'application Android « Éco-Campus RDC » sur Google Play

L'application est une **Trusted Web Activity** (TWA) : elle ouvre https://eco-campus-rdc.vercel.app en plein écran, sans barre de navigateur, avec la bibliothèque officielle Google `androidbrowserhelper`. Toute mise à jour du site est immédiatement disponible dans l'application ; une nouvelle version Android n'est nécessaire que pour changer l'icône, le nom ou la configuration.

| Élément | Valeur |
|---|---|
| Nom affiché | Éco-Campus RDC |
| Identifiant (package) | `cd.ecocampus.rdc` (définitif après la première publication) |
| Version | 1.0.0 (versionCode 1) |
| Android minimum / cible | 6.0 (API 23) / API 36 |
| Empreinte SHA-256 de la clé d'importation | `C3:A8:8F:93:BA:C1:5B:53:2D:F5:06:B0:B0:72:15:2B:86:15:0A:48:60:F9:69:AB:30:B6:94:DE:E6:44:5F:AD` |

## 1. Construire l'application (GitHub Actions)
Le workflow `.github/workflows/android.yml` construit le fichier **.aab** (Play Store) et un **.apk** (test direct) à chaque modification du dossier `android/`, ou à la demande (onglet **Actions → Application Android → Run workflow**). Les fichiers se téléchargent dans l'onglet **Actions**, section **Artifacts**, sous le nom `ecocampus-rdc-android`.

Pour que les fichiers soient **signés** (obligatoire pour le Play Store), ajouter ces 4 secrets dans GitHub : **Settings → Secrets and variables → Actions → New repository secret** :

| Nom du secret | Valeur |
|---|---|
| `ANDROID_KEYSTORE_B64` | contenu du fichier `keystore.b64` remis séparément |
| `ANDROID_KEYSTORE_PASSWORD` | mot de passe remis séparément |
| `ANDROID_KEY_ALIAS` | `ecocampus-upload` |
| `ANDROID_KEY_PASSWORD` | même mot de passe que le keystore |

La clé (`upload-keystore.jks`) et son mot de passe ne sont **jamais** placés dans le dépôt : les conserver en lieu sûr (deux copies). Avec la signature d'application Play (Play App Signing), une clé d'importation perdue peut être réinitialisée via l'assistance Google, mais cela prend plusieurs jours.

## 2. Créer l'application dans la Play Console
1. Compte développeur : https://play.google.com/console (frais uniques de 25 USD, vérification d'identité).
2. **Créer une application** : nom « Éco-Campus RDC », langue par défaut **Français**, type **Application**, **Gratuite**.
3. **Signature de l'application** : accepter **Play App Signing** (Google conserve la clé de distribution).
4. Envoyer le fichier `app-release.aab` dans **Tests → Test interne** (recommandé pour commencer), puis **Production**.

## 3. Lier l'application au site (indispensable pour le plein écran)
Le site publie `/.well-known/assetlinks.json` avec l'empreinte de la clé d'importation (valable pour l'APK de test). Après le premier envoi dans la Play Console :
1. Ouvrir **Test et publication → Configuration → Intégrité de l'application → Signature de l'application**.
2. Copier l'**empreinte du certificat SHA-256 de la clé de signature d'application**.
3. L'ajouter dans `public/.well-known/assetlinks.json` (liste `sha256_cert_fingerprints`), à côté de l'empreinte actuelle, puis redéployer le site.

Sans cette étape, l'application installée depuis le Play Store affiche une barre d'adresse en haut de l'écran.

## 4. Fiche du Play Store
- **Nom** : Éco-Campus RDC
- **Description courte** (80 caractères max.) : Formations SYSCOHADA, cours, QCM et atelier États financiers pour la RDC.
- **Description complète** :

> Éco-Campus RDC est la plateforme de formation Éco-Campus RDC, pensée pour la République Démocratique du Congo.
>
> • Modules de comptabilité SYSCOHADA révisé, avec leçons, QCM et exercices pratiques
> • Présentations, vidéos et sessions en direct avec les formateurs
> • Atelier États financiers : saisissez ou importez une balance et obtenez automatiquement le Bilan, le Compte de résultat, le Tableau des flux de trésorerie, les notes annexes et le calcul de l'IBP
> • Cas pratiques corrigés (négoce, industrie, services) et guide du fonctionnement des comptes
> • Dossiers partagés en temps réel entre apprenants, corrigés et validés par les formateurs
> • Suivi de progression, badges, tests psychotechniques et offres de stages
>
> L'accès aux contenus de formation est réservé aux apprenants disposant d'un abonnement actif, délivré par Éco-Campus RDC.

- **Catégorie** : Enseignement · **Tags** : formation, comptabilité, finance
- **Coordonnées** : gnkuli@outlook.fr · WhatsApp +243 979 075 970
- **Règles de confidentialité** : https://eco-campus-rdc.vercel.app/confidentialite.html
- **Graphiques** (dossier `android/store/`) : icône `icone-512.png` (512×512), bannière `banniere-1024x500.png`, captures `capture-1-accueil.png`, `capture-2-formations.png`, `capture-3-services.png` (1082×1922). Ajouter de préférence 2 ou 3 captures prises dans l'application (tableau de bord, cours, atelier États financiers).

## 5. Questionnaires de la Play Console (réponses proposées)
- **Accès à l'application** : une partie des fonctionnalités est réservée aux comptes. Fournir à Google un **compte apprenant de test actif** (e-mail et mot de passe) pour l'examen.
- **Annonces** : l'application ne contient pas d'annonces.
- **Classification du contenu** : catégorie Référence / Éducation ; aucune violence, aucun contenu sensible. Les messages échangés avec les formateurs sont modérés par l'organisme de formation.
- **Public cible** : 18 ans et plus (formation professionnelle).
- **Sécurité des données** :
  - Données collectées : nom, adresse e-mail (informations personnelles) ; activité dans l'application (progression, scores) ; messages ; contenus créés par l'utilisateur (dossiers d'états financiers).
  - Finalités : fonctionnement de l'application, gestion du compte, communications avec l'utilisateur.
  - Aucune donnée partagée avec des tiers ; données chiffrées en transit (HTTPS) ; collecte obligatoire pour utiliser le service.
  - Suppression des données : https://eco-campus-rdc.vercel.app/suppression-compte.html
- **Application gouvernementale / financière** : non (application éducative ; elle n'effectue aucune opération financière).

## 5 bis. Paiements : version sans tarifs ni Mobile Money
Les règles de Google Play interdisent de proposer dans l'application un paiement extérieur (Mobile Money) pour des contenus numériques. L'application ouvre le site sur `/?source=android` : le site reconnaît alors la version Play Store (`src/acces/plateforme.js`) et
- remplace la fenêtre « Obtenir l'accès » (offres, prix, numéros Mobile Money, référence de transaction) par **« Activer mon accès »** : saisie du code uniquement ;
- retire de la bannière d'accueil les messages qui citent un prix ou mènent aux offres ;
- remplace les libellés « Obtenir l'accès » et « Renouveler » par « Activer mon accès » et « Saisir un code ».

Le site web et l'application installée depuis Chrome gardent la page d'offres complète. Pour quitter le mode Play Store sur un navigateur, ouvrir une fois `/?source=web`. Questionnaire « Accès à l'application » : indiquer que l'accès complet se fait par **code d'activation** et fournir un compte de test déjà actif.

## 6. Nouvelles versions
Augmenter `versionCode` (et `versionName`) dans `android/app/build.gradle`, pousser, récupérer le nouvel `.aab` dans Actions et l'envoyer dans la Play Console. Pour les contenus du site, aucune nouvelle version Android n'est nécessaire.
