# Notifications, suggestions et À propos — Éco-Campus RDC

## Ce qui existe
- **Cloche** (apprenant, formateur, admin) : notifications en temps réel, badge des non-lues, « Tout marquer comme lu », ouverture de la page liée. Rappel local quand l'accès expire dans 7 jours ou moins.
- **Notifications automatiques** :
  - nouveau module, cours ou vidéo publié ;
  - annonce ;
  - message reçu ;
  - copie à corriger (formateur) ou corrigée (apprenant) ;
  - accès activé ;
  - espace formateur activé ;
  - contenu ou document approuvé ou à revoir (formateur) ;
  - nouvelle suggestion (admin) ;
  - réponse à une suggestion.
- **Envoi par l'admin** (onglet Notifications) : à tout le monde, aux apprenants, aux formateurs ou à une personne. On choisit le type, le titre, le message et la page ouverte. Le push est optionnel, tout comme la copie par e-mail (une personne seulement). L'onglet propose aussi l'historique et une purge au-delà de 90 jours.
- **Copie par e-mail** (EmailJS, modèle « Notification ») : pour les notifications importantes adressées à une personne, si sa préférence « Copie par e-mail » est activée.
- **Boîte à suggestions** (page « Suggestions ») :
  - l'utilisateur choisit une catégorie (idée, problème, contenu, autre), écrit son message et suit ses envois ;
  - l'admin traite les suggestions dans l'onglet Suggestions (statut, réponse) ;
  - la réponse est notifiée à l'auteur.
- **Pour vous** (accueil apprenant) : jusqu'à 3 recommandations :
  - accès à activer ;
  - QCM à refaire (< 60 %) ;
  - module suivant ;
  - module du Code des impôts ;
  - atelier États financiers.
- **À propos** : mission, contenus, sources (SYSCOHADA révisé, Code des impôts mis à jour au 31 mars 2021), version, contact, confidentialité.

## Données Firestore
| Collection | Contenu | Accès |
|---|---|---|
| `notifications` | `dest` (uid ou all / apprenants / formateurs / admin), `type`, `titre`, `texte`, `vue`, `ts`, `auteur`, `auteurNom` | lecture : destinataire ou groupe ; écriture : admin (tout), formateur (une personne), apprenant (admin ou formateur, message ou suggestion) |
| `notifEtat/{uid}` | `vu` (ms), `lues` | l'utilisateur lui-même |
| `pushTokens/{jeton}` | `uid`, `role`, `ts`, `appareil` | l'utilisateur pour son jeton ; le serveur d'envoi lit tout |
| `suggestions` | `uid`, `nom`, `mail`, `role`, `cat`, `texte`, `ts`, `statut`, `reponse`, `reponseTs` | auteur (lecture), admin (traitement) |
| `config/push` | `vapid` (clé publique Web Push) | lecture : connectés ; écriture : admin |

## Activer les notifications push (une seule fois)
1. **Clé publique Web Push**.
   - Console Firebase → ⚙️ Paramètres du projet → onglet **Cloud Messaging** → section *Configuration Web* → **Certificats Web Push** → **Générer une paire de clés**.
   - Copier la clé, puis la coller dans l'application : Admin → **Notifications** → « Clé publique Web Push (VAPID) » → **Enregistrer la clé**.
2. **Clé du compte de service**, pour le serveur d'envoi.
   - Console Firebase → ⚙️ Paramètres du projet → **Comptes de service** → **Générer une nouvelle clé privée**. Un fichier JSON est téléchargé : il est secret, ne le partagez jamais.
3. **Variable sur Vercel**.
   - Projet → **Settings** → **Environment Variables** → nom `FIREBASE_SERVICE_ACCOUNT`, valeur : tout le contenu du fichier JSON, environnement *Production*.
   - Redéployer.
4. Chaque utilisateur active ensuite « Notifications sur ce téléphone » dans **Paramètres**. Sur iPhone, l'application doit d'abord être installée sur l'écran d'accueil (iOS 16.4 ou plus).

L'envoi passe par la fonction `api/push.js`, qui :
- vérifie l'identité de l'expéditeur ;
- n'envoie qu'une fois par notification, et seulement dans les 10 minutes qui suivent sa création ;
- supprime les jetons d'appareil devenus invalides.

Firebase Cloud Messaging est gratuit et fonctionne avec la formule Spark.
