# Passage à ecocampus-rdc.com et séparation des comptes personnels

Objectif : Éco-Campus RDC a son propre domaine (**ecocampus-rdc.com**), est hébergé sur **Firebase Hosting**
(usage commercial autorisé), et ne dépend plus des comptes personnels de Gédéon NKULI, qui reste **auteur et
propriétaire** (voir `NOTICE.md`).

Le code est prêt : rien ne bascule tant que les étapes ci-dessous ne sont pas faites. Le site Vercel reste en
service jusqu'à la fin.

## Où en est-on (26/11/2026)

| Étape | État |
|---|---|
| A. Compte dédié ecocampus.rdc@gmail.com, propriétaire du projet Firebase | Fait |
| A. Formule Blaze et alerte de budget à 5 $ | Fait, **provisoirement** sur le compte de facturation personnel (01B6EF-…) : le compte Éco-Campus (0178A3-…) attend son prépaiement. Dès qu'il est actif : Google Cloud › Facturation › Gérer les comptes › Vos projets › access-plus-consulting › Modifier la facturation. |
| A. Nom du projet « Eco-Campus RDC », nom public « Éco-Campus RDC », e-mail associé ecocampus.rdc@gmail.com | Fait |
| B. Organisation **eco-campus-rdc** (2 propriétaires : ecocampusrdc-coder, gdeonnkuli-cmyk) et dépôt **eco-campus-rdc/eco-campus** | Fait |
| B. Applications GitHub **Claude** et **Vercel** installées sur l'organisation ; organisation rattachée à l'équipe Vercel (Team Settings › Git › Connect) et projet relié à eco-campus-rdc/eco-campus | Fait |
| D. Compte de service `ecocampus-deploy`, secret `FIREBASE_DEPLOY_KEY`, premier déploiement | Fait : https://access-plus-consulting.web.app (site, API et 4 tâches planifiées, Node.js 22) |
| C. Domaine **ecocampus-rdc.com** acheté chez Cloudflare (compte ecocampus.rdc@gmail.com, renouvellement automatique) | Fait |
| E. Firebase Hosting : domaine ajouté, DNS saisis (A 199.36.158.100 et TXT, nuage gris) | En attente de détection et du certificat HTTPS |
| F. Bascule dans le code (adresse, contact, pages légales, redirection Vercel, Android 1.1.0) | Prête, à publier quand https://ecocampus-rdc.com répond et que contact@ reçoit les e-mails |

## Ce qui est déjà prêt dans le code

| Élément | Fichier | État |
|---|---|---|
| Adresse du site et e-mail de contact, à un seul endroit | `src/site.js` (`BASCULE`) | Prêt, valeur actuelle conservée |
| Connexion Google/Facebook par le domaine professionnel (fiable sur iPhone) | `src/App.jsx` (`authDomain`) | S'active seule sur ecocampus-rdc.com |
| Fonctions serveur (attestation, filleuls, push, tableau) sur Firebase | `functions/`, `api/_admin.js` | Prêt, testé hors ligne |
| Hébergement (pages, `/api/…`, `.well-known` pour Android) | `firebase.json` | Prêt |
| Déploiement automatique depuis GitHub | `.github/workflows/firebase.yml` | Actif : à chaque mise à jour de main |
| Mention d'auteur | `NOTICE.md`, `package.json` | Fait |

## Étape A — Un compte dédié à Éco-Campus (30 min)

1. Créer une adresse Google dédiée, par exemple **ecocampus.rdc@gmail.com** (mot de passe fort, double authentification).
   C'est elle qui portera les services d'Éco-Campus ; votre adresse personnelle reste en secours.
2. **Firebase** : console Firebase › projet *access-plus-consulting* › Paramètres du projet › **Utilisateurs et autorisations** ›
   *Ajouter un membre* : l'adresse dédiée, rôle **Propriétaire**. Gardez votre compte personnel propriétaire jusqu'à la fin de la bascule,
   puis décidez : le retirer, ou le garder comme accès de secours.
3. **Facturation** : passez le projet en formule **Blaze** avec un compte de facturation créé par l'adresse dédiée,
   et une **alerte de budget à 5 $ par mois** (Google Cloud › Facturation › Budgets et alertes).

## Étape B — Le code dans une organisation GitHub (15 min)

1. Sur GitHub, avec votre compte : *Your organizations* › **New organization** (gratuite), par exemple **eco-campus-rdc**.
   Vous en êtes **propriétaire** : vous restez maître du code.
2. Dépôt *access-plus-consulting* › Settings › **Transfer ownership** › vers l'organisation.
   L'historique et vos contributions sont conservés ; l'ancienne adresse redirige automatiquement.
3. Installez l'application GitHub **Claude** sur l'organisation, puis dites-le-moi : je rattache le nouveau dépôt à la session.
4. Vérifiez dans Settings › Secrets que les secrets sont toujours là. Au transfert (26/11/2026), seul `FIREBASE_DEPLOY_KEY`
   existait : les secrets Android de signature (`ANDROID_KEYSTORE_…`) seront à créer avant la publication sur le Play Store.
5. Vercel : équipe › Settings › Git › **Connect** sur l'organisation, puis projet › Settings › Git › **Disconnect** et
   **Connect** sur `eco-campus-rdc/eco-campus` (la liaison antérieure au transfert ne reçoit plus les commits).

## Étape C — Le domaine (1 h)

1. Créez un compte **Cloudflare** avec l'adresse dédiée, puis **Registrar** › achetez **ecocampus-rdc.com**
   (environ 10 à 12 $ par an, prix coûtant, renouvellement automatique).
2. **E-mail professionnel gratuit** : Cloudflare › Email › **Email Routing** › créez **contact@ecocampus-rdc.com**
   qui transfère vers votre boîte. Envoyez-vous un essai.

## Étape D — Déployer sur Firebase (30 min, puis je prends le relais)

0. Activez les services utilisés par les fonctions et les tâches planifiées :
   https://console.cloud.google.com/flows/enableapi?apiid=cloudfunctions.googleapis.com,cloudbuild.googleapis.com,artifactregistry.googleapis.com,run.googleapis.com,eventarc.googleapis.com,cloudscheduler.googleapis.com,firestore.googleapis.com&project=access-plus-consulting
1. Google Cloud › IAM › **Comptes de service** › créez *github-deploy* avec les rôles :
   *Administrateur Firebase*, *Utilisateur du compte de service*, *Administrateur Cloud Functions*,
   *Administrateur Cloud Run*, *Administrateur Artifact Registry*, *Éditeur Cloud Build*, *Administrateur Cloud Scheduler*.
   Créez une **clé JSON** pour ce compte (téléchargée sur votre ordinateur, à ne jamais envoyer par message ni par e-mail).
2. GitHub › dépôt › Settings › Secrets and variables › Actions › **New repository secret** :
   nom `FIREBASE_DEPLOY_KEY`, valeur : le contenu du fichier JSON. Supprimez ensuite le fichier de votre ordinateur.
3. Dites-moi « clé ajoutée » : je lance le déploiement et je vérifie l'application sur **access-plus-consulting.web.app**
   (adresse Firebase provisoire), fonctions comprises. Si un droit manque, le journal GitHub le dit et je vous indique le rôle à ajouter.

## Étape E — Brancher le domaine (1 h, plus la propagation)

1. Firebase › Hosting › **Ajouter un domaine personnalisé** : `ecocampus-rdc.com`, puis `www.ecocampus-rdc.com` (redirigé vers le premier).
2. Recopiez dans Cloudflare › DNS les enregistrements donnés par Firebase, **proxy désactivé** (nuage gris). Le certificat HTTPS arrive seul (quelques heures).
3. Firebase › Authentication › Paramètres › **Domaines autorisés** : ajoutez `ecocampus-rdc.com` et `www.ecocampus-rdc.com`.
4. Google Cloud › API et services › **Identifiants** › client OAuth « Web client » : ajoutez
   l'origine `https://ecocampus-rdc.com` et l'URI de redirection `https://ecocampus-rdc.com/__/auth/handler`.
5. Facebook for Developers › votre application › Connexion Facebook › Paramètres : ajoutez la même URI de redirection.
6. EmailJS › Account › Security : si une liste de domaines autorisés est réglée, ajoutez `ecocampus-rdc.com`.

## Étape F — La bascule (je m'en charge)

1. `src/site.js` : `BASCULE = true` (adresse et contact passent à ecocampus-rdc.com) ; pages `public/confidentialite.html`
   et `public/suppression-compte.html` mises à jour.
2. Vercel : redirection permanente de eco-campus-rdc.vercel.app vers ecocampus-rdc.com (liens partagés, QR codes et
   attestations déjà imprimées continuent de fonctionner).
3. Application Android : `android/app/build.gradle` › `siteHost = "ecocampus-rdc.com"`, nouvelle version à envoyer au Play Store.
4. Visuels, vidéos, messages de partage et catalogue PDF régénérés avec la nouvelle adresse.
   Modèles EmailJS (`docs/emails/`) : recopier dans EmailJS les versions à jour (logo et bouton vers ecocampus-rdc.com).
5. Après quelques semaines sans trafic sur Vercel : suppression du projet Vercel (votre compte personnel n'héberge plus rien).

## Ce qui ne change pas

- Les comptes, scores, abonnements et attestations des apprenants (même base Firebase).
- Le service EmailJS `access_plus_service` et l'adresse d'administration `admin@accessplus.com`.
- Votre qualité d'auteur : `NOTICE.md`, signature des certificats, historique GitHub.

## Automatisations (actives dès le premier déploiement Firebase)

Code : `functions/taches.js` (exécution) et `src/auto/automatisations.js` (règles, testées). Heure de Kinshasa.

| Tâche | Quand | Ce qu'elle fait |
|---|---|---|
| `tacheQuotidienne` | Chaque jour à 8 h | Passe en « expiré » les abonnements échus ; rappels J-7 et J-1 avant expiration ; rappel J-2 avant la fin de l'essai ; relance des apprenants inactifs depuis 7 jours (une fois, jusqu'à 30 jours). |
| `tacheHoraire` | Toutes les heures (h+15) | Récompense automatiquement le parrain quand un filleul s'abonne par un vrai paiement (pas un code offert), une seule fois ; alerte l'administrateur si une demande d'accès attend depuis la veille ou si une référence de paiement est déclarée par plusieurs comptes. |
| `rapportHebdo` | Lundi à 7 h | Rapport de la semaine dans la cloche de l'administrateur (et en push) ; chiffres conservés dans la collection `rapports`. |
| `sauvegardeNocturne` | Chaque nuit à 2 h | Export complet de Firestore dans le stockage du projet (`sauvegardes/AAAA-MM-JJ/`), sauvegardes de plus de 30 jours supprimées. |

- Chaque passage est noté dans la collection `journalTaches` ; les relances déjà envoyées sont mémorisées dans `users/{uid}.relances`.
- La durée offerte au parrain est celle réglée dans Admin › Essai et parrainage (« Jours offerts au parrain »).
- Messages envoyés dans l'application (cloche) et en notification push ; l'envoi d'e-mails depuis le serveur viendra dans un second temps.
- Sauvegarde : si le journal signale un refus de droits, ajoutez au compte de service par défaut de Compute Engine
  (`…-compute@developer.gserviceaccount.com`) le rôle *Administrateur de l'importation/exportation Cloud Datastore*.
