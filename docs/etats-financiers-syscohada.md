# Atelier États financiers SYSCOHADA — notes techniques

Module de formation intégré à Éco-Campus (`src/EtatsFinanciers.jsx`, moteur `src/ef/engine.js`, contexte RDC `src/ef/rdc.js`), conçu pour la **République Démocratique du Congo** (et non la zone UEMOA) : francs congolais, DGI-RDC, RCCM / Id. Nat. / NIF, CNSS-INPP-ONEM, ONEC, IBP.

Référence : manuel « Montage des états financiers du SYSCOHADA révisé ». Son cas pratique (balances N-1 et N) est intégré sous le nom « SA MEUBLES DU FLEUVE » et le moteur reproduit à l'identique le Bilan, le Compte de résultat et le TFT publiés dans le manuel (test `src/ef/engine.test.js`, `npm test`).

## Fonctionnement
- **Balance** (N et N-1) saisie ou collée depuis Excel → rattachement automatique de chaque compte à une rubrique SYSCOHADA révisé (Système Normal), avec les comptes à solde variable classés selon leur sens (ex. 52 débiteur → BS, créditeur → DR).
- **États générés** : Bilan (Brut / Amort.-Dépréc. / Net N / Net N-1), Compte de résultat avec soldes intermédiaires (XA à XI), Tableau des flux de trésorerie (ZA à ZH).
- **Contrôles** : équilibre des balances, comptes non rattachés, équilibre Actif = Passif, double comptage du résultat (13 + classes 6-8), soldes anormaux, rapprochement ZH = trésorerie nette du bilan.
- **TFT** (méthode du guide d'application, section 4.2.3 du manuel) :
  - CAFG = résultat net + dotations (68, 69, 85) − reprises (79, 86) + VCC (81, 654) − produits de cession (82, 754) ;
  - BFR sur valeurs nettes, hors 485 (BA), hors 414, 4613/467, 458, 4494, 4751 (BG), hors 404, 481, 482, 467, 4752, 472 (DP), après annulation des écarts de conversion 4781/4791 (créances) et 4782/4792 (dettes) ;
  - acquisitions = Δ immobilisations nettes + dotations − reprises + VCC − réévaluations (106, 154) − location-acquisition, décaissements = acquisitions − Δ dettes sur immobilisations (404, 481, 482) ;
  - cessions encaissées = 82 + 754 − Δ créances sur cessions (485, 414) ;
  - capital = Δ (CA + CB + CD) − Δ apporteurs restant dû ; subventions = Δ 14 + 799 − Δ subventions à recevoir ; dividendes = résultat N-1 − Δ réserves/report − Δ 465 ;
  - emprunts = Δ (16, 18) hors 166, corrigée des autres écarts de conversion 478x/479x ;
  - trésorerie (ZA, ZH) corrigée du compte 472.
  - Compléments saisis : nouveaux emprunts, remboursements encaissés d'immobilisations financières, contrats de location-acquisition, prélèvements.
- **Identification RDC** : page de garde imprimable (République Démocratique du Congo, Ministère des Finances, DGI, centre DGE / CDI / CIS), RCCM, Id. Nat., NIF, CNSS, INPP, ONEM, n° import-export, province, professionnel inscrit à l'ONEC.
- **Fiscalité (IBP)** : résultat avant impôt + réintégrations (dont 647 amendes et pénalités, automatique) − déductions − déficits antérieurs ; IBP = max(taux × résultat fiscal ; minimum × chiffre d'affaires) ; comparaison avec le compte 89 et solde après acomptes. Taux par défaut 30 % et minimum 1 % du CA, **paramétrables** : à vérifier selon la loi de finances de l'exercice.
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
