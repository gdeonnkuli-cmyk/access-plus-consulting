# Atelier États financiers SYSCOHADA — notes techniques

Module de formation intégré à Éco-Campus (`src/EtatsFinanciers.jsx`, moteur `src/ef/engine.js`).

## Fonctionnement
- **Balance** (N et N-1) saisie ou collée depuis Excel → rattachement automatique de chaque compte à une rubrique SYSCOHADA révisé (Système Normal), avec les comptes à solde variable classés selon leur sens (ex. 52 débiteur → BS, créditeur → DR).
- **États générés** : Bilan (Brut / Amort.-Dépréc. / Net N / Net N-1), Compte de résultat avec soldes intermédiaires (XA à XI), Tableau des flux de trésorerie (ZA à ZH).
- **Contrôles** : équilibre des balances, comptes non rattachés, équilibre Actif = Passif, double comptage du résultat (13 + classes 6-8), soldes anormaux, rapprochement ZH = trésorerie nette du bilan.
- **TFT** : variations calculées sur valeurs nettes (logique du SYSCOHADA révisé, dépréciations de l'actif circulant en 659/759). CAFG = résultat net + dotations (68, 69, 85) − reprises (79, 86) + VCC (81) − produits de cession (82). Les informations non déductibles de la balance (valeurs brutes cédées, nouveaux emprunts…) sont saisies dans « Informations complémentaires ».
- **Multi-utilisateurs** : un dossier = un document Firestore `ef_dossiers/{id}` partagé en temps réel entre ses membres (invitation par e-mail). Circuit : Brouillon → Soumis → Validé / À corriger, avec fil de commentaires. Formateurs et administrateur voient tous les dossiers.

## Règles Firestore à ajouter (console Firebase)
```
match /ef_dossiers/{id} {
  function isStaff() {
    return request.auth.token.email == "admin@accessplus.com"
      || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "formateur";
  }
  allow read, update: if request.auth != null && (request.auth.uid in resource.data.membres || isStaff());
  allow create: if request.auth != null && request.auth.uid in request.resource.data.membres;
  allow delete: if request.auth != null && (resource.data.ownerUid == request.auth.uid || isStaff());
}
```
L'invitation d'un collaborateur recherche son compte dans `users` par e-mail : les apprenants doivent donc pouvoir lire `users` (filtre `mail ==`).
