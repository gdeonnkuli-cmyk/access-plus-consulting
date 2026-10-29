// Module F12 — La TVA en pratique : déclaration du mois, tri des factures, prorata et écritures
// Source : fiche C2-tva-2021 (Code des impôts mis à jour au 31 mars 2021 : O.-L. n° 10/001, D. n° 011/42),
// en complément du module F6 (règles de la TVA). Calculs : src/fiscal/tva.js.
export default {
  id: "F12",
  titre: "La TVA en pratique : déclarer son mois sans erreur",
  court: "TVA pratique",
  ico: "calculator",
  col: "#BE123C",
  duree: "30 min",
  resume: "Un mois complet de TVA : trier les factures, gérer l'encaissement, le prorata et le crédit, déclarer et comptabiliser.",
  blocs: [
    {
      type: "essentiel",
      texte:
        "Chaque mois, on suit toujours la même méthode : **1)** recenser la TVA **collectée** (ventes livrées, services **encaissés**, acomptes) ; **2)** **trier** les factures d'achat : déductible, déductible à moitié (carburant), exclue ou perdue (espèces dès 1 000 000 FC) ; **3)** appliquer le **prorata** si l'entreprise a aussi des recettes exonérées ; **4)** retrancher le **crédit du mois précédent** ; **5)** déclarer et payer au plus tard le **15 du mois suivant**, montant arrondi à la centaine ; **6)** passer l'**écriture de liquidation**. Ce module applique les règles du module F6 sur des cas complets, avec un simulateur de déclaration.",
    },
    {
      type: "texte",
      titre: "Étape 1 — Recenser la TVA collectée du mois",
      p: [
        "La TVA collectée ne correspond pas toujours aux factures du mois : tout dépend du **moment où la TVA devient exigible**.",
      ],
      puces: [
        "**Ventes de biens** : la TVA est due le mois de la **livraison** (art. 24-25 O.-L. n° 10/001).",
        "**Prestations de services et travaux immobiliers** : la TVA est due le mois de l'**encaissement** du prix, des acomptes ou des avances, sauf option pour les débits (art. 26).",
        "**Acompte reçu** : il rend la TVA exigible ; une facture doit être établie (art. 58). On calcule la base en divisant l'encaissement TTC par 1,16.",
        "**Remises et rabais figurant sur la facture** : ils réduisent la base imposable (art. 29-30).",
        "**Exportations** : taxées à **0 %** (art. 35) ; elles ne génèrent pas de TVA collectée mais ouvrent droit à déduction.",
        "**Livraisons à soi-même** : biens prélevés pour le personnel, les dirigeants ou une immobilisation ; base = prix de revient (art. 9 à 11).",
      ],
    },
    {
      type: "texte",
      titre: "Étape 2 — Trier les factures d'achat",
      p: [
        "Chaque facture d'achat passe par trois contrôles : la **forme** (facture conforme), le **paiement** (bancaire dès 1 000 000 FC) et la **nature de la dépense** (exclusions).",
      ],
      puces: [
        "**Forme** : facture d'un assujetti avec les mentions obligatoires, dont le **Numéro Impôt** du vendeur et du client (D. art. 100) ; à l'importation, la déclaration de mise à la consommation (art. 38).",
        "**Paiement** : transaction d'**au moins 1 000 000 FC** entre assujettis payée par chèque, virement ou carte ; en espèces, la TVA est **perdue** (art. 59 bis).",
        "**Exclusions** : logement, restauration, réceptions, spectacles ; biens utilisés à plus de 50 % à titre privé ; véhicules de transport de personnes (art. 41-42).",
        "**Carburant** : hors cas particuliers (grossistes revendeurs, électricité, combustibles industriels, aéronefs), déductible à **50 %** (art. 41-3 ter).",
        "**Délai** : une TVA oubliée peut encore être déduite jusqu'au **31 décembre de l'année qui suit** celle de son exigibilité (art. 37).",
        "**Comptabilité** : la TVA non déductible n'est pas une créance sur l'État ; elle reste dans le **coût de la charge ou de l'immobilisation**.",
      ],
    },
    {
      type: "schema",
      kind: "tableau",
      titre: "Grille de tri des factures d'achat",
      entetes: ["Dépense", "TVA déductible ?", "Article"],
      lignes: [
        ["Marchandises, matières, services de l'activité", "Oui, 100 %", "art. 36 et 38"],
        ["Immobilisations (hors véhicules de tourisme)", "Oui, 100 %", "art. 36"],
        ["TVA payée en douane (DMC)", "Oui, 100 %", "art. 38"],
        ["Carburant des véhicules de l'entreprise", "50 % (hors cas particuliers)", "art. 41-3 ter"],
        ["Réceptions, restaurant, hôtel, spectacles", "Non", "art. 41"],
        ["Véhicule de transport de personnes (moins de 10 places)", "Non", "art. 42"],
        ["Facture d'au moins 1 000 000 FC payée en espèces", "Non : droit perdu", "art. 59 bis"],
        ["Frais communs d'un assujetti mixte", "Au prorata", "art. 43"],
      ],
    },
    {
      type: "schema",
      kind: "flux",
      titre: "Du journal des ventes à la déclaration",
      etapes: [
        { op: "", l: "TVA collectée exigible du mois", d: "Ventes livrées + services encaissés + acomptes, × 16 %" },
        { op: "−", l: "TVA déductible retenue", d: "Après tri : exclusions, carburant à 50 %, paiements en espèces écartés" },
        { op: "×", l: "Prorata (assujetti mixte)", d: "Recettes ouvrant droit à déduction ÷ recettes totales, arrondi à l'unité supérieure" },
        { op: "−", l: "Crédit de TVA du mois précédent", d: "Reporté jusqu'à épuisement (D. art. 136)" },
        { op: "=", l: "TVA à payer ou crédit à reporter", d: "Arrondi à la centaine (D. art. 137) ; déclaration au plus tard le 15 du mois suivant", fort: true },
      ],
    },
    {
      type: "schema",
      kind: "tva",
      titre: "Simulateur de déclaration mensuelle",
      defaut: { ventes: 60000000, services: 6000000, achats: 35000000, immobilisations: 5000000, carburant: 3000000, exclus: 2700000, douane: 2400000, credit: 400000 },
      note: "Montants hors taxe, sauf la TVA payée en douane et le crédit antérieur (montants de TVA). Le prorata est calculé sur les recettes du mois saisies ici ; en pratique, il se calcule sur l'année.",
    },
    {
      type: "exemple",
      titre: "Exemple 1 — Le mois de juin de la SARL BOMOKO",
      enonce:
        "En juin, la SARL BOMOKO livre pour 62 000 000 FC HT de matériel de bureau, avec 2 000 000 FC de remises sur factures. Elle facture 10 000 000 FC HT de maintenance, dont 6 960 000 FC TTC encaissés en juin (6 000 000 FC HT). Achats : marchandises 35 000 000 FC HT (virement), TVA de 2 400 000 FC payée en douane sur un conteneur, ordinateurs 5 000 000 FC HT, gasoil 3 000 000 FC HT, réception de clients 1 500 000 FC HT, fournitures 1 200 000 FC HT payées en espèces. Crédit de mai : 400 000 FC.",
      lignes: [
        ["TVA sur livraisons : (62 000 000 − 2 000 000) × 16 %", 9600000],
        ["TVA sur maintenance encaissée : 6 000 000 × 16 %", 960000],
        ["= TVA collectée exigible en juin", 10560000, "total"],
        ["TVA sur marchandises : 35 000 000 × 16 %", 5600000],
        ["TVA payée en douane (DMC)", 2400000],
        ["TVA sur ordinateurs : 5 000 000 × 16 %", 800000],
        ["TVA sur gasoil : 3 000 000 × 16 % × 50 %", 240000],
        ["Réception (240 000) et fournitures payées en espèces (192 000) : non déductibles", 0],
        ["= TVA déductible", 9040000, "total"],
        ["− Crédit de TVA de mai", -400000],
        ["TVA à payer : 10 560 000 − 9 040 000 − 400 000", 1120000, "resultat"],
      ],
      conclusion:
        "La SARL BOMOKO déclare et paie 1 120 000 FC au plus tard le 15 juillet, avec l'état détaillé des déductions. Les 4 000 000 FC HT de maintenance non encaissés seront taxés le mois de leur encaissement (640 000 FC). Les 672 000 FC de TVA non déductible (réception, espèces, moitié du gasoil) restent dans le coût des charges.",
    },
    {
      type: "exemple",
      titre: "Exemple 2 — ETS MAMA NZINGA, assujetti mixte : le prorata",
      enonce:
        "ETS MAMA NZINGA vend des produits d'épicerie taxables (45 000 000 FC HT) et du pain et de la farine exonérés (25 000 000 FC). Toute sa TVA d'amont du mois (4 000 000 FC) porte sur des frais communs aux deux activités : loyer du dépôt, électricité, camionnette de livraison.",
      lignes: [
        ["Recettes ouvrant droit à déduction", 45000000],
        ["Recettes totales : 45 000 000 + 25 000 000", 70000000],
        ["TVA collectée : 45 000 000 × 16 %", 7200000, "total"],
        ["TVA déductible : 4 000 000 × 65 % (prorata 45 ÷ 70 = 64,29 %, arrondi à 65 %)", 2600000, "total"],
        ["TVA à payer : 7 200 000 − 2 600 000", 4600000, "resultat"],
      ],
      conclusion:
        "Le prorata s'arrondit toujours à l'unité supérieure (art. 43) : 64,29 % devient 65 %. Les 1 400 000 FC de TVA non déductible s'ajoutent au coût des frais. La TVA d'un achat affecté uniquement aux ventes taxables resterait déductible à 100 % ; celle d'un achat affecté uniquement au pain exonéré ne le serait pas du tout.",
    },
    {
      type: "exemple",
      titre: "Exemple 3 — BOMOKO CONSEIL : la TVA suit l'encaissement",
      enonce:
        "Le cabinet BOMOKO CONSEIL réalise une mission de 20 000 000 FC HT. Il reçoit un acompte de 5 800 000 FC TTC en août, facture en septembre, et encaisse le solde de 17 400 000 FC TTC en octobre. Il n'a pas opté pour le paiement d'après les débits.",
      lignes: [
        ["Acompte encaissé en août (TTC)", 5800000],
        ["Base HT : 5 800 000 ÷ 1,16", 5000000],
        ["= TVA exigible sur la déclaration d'août", 800000, "total"],
        ["Facture de septembre : aucune TVA exigible ce mois-là", 0],
        ["Solde encaissé en octobre (TTC)", 17400000],
        ["Base HT : 17 400 000 ÷ 1,16", 15000000],
        ["= TVA exigible sur la déclaration d'octobre", 2400000, "total"],
        ["Total de la TVA sur la mission : 20 000 000 × 16 %", 3200000, "resultat"],
      ],
      conclusion:
        "Déclarer la TVA dès la facture de septembre ferait avancer la trésorerie à l'État sans obligation ; oublier l'acompte d'août exposerait à un redressement. L'acompte doit donner lieu à une facture (art. 58).",
    },
    {
      type: "texte",
      titre: "Étape 6 — Comptabiliser la TVA (SYSCOHADA révisé)",
      p: [
        "En cours de mois, la TVA facturée est portée au crédit des comptes **443** et la TVA récupérable au débit des comptes **445**. À la clôture du mois, une **écriture de liquidation** solde ces comptes et fait apparaître la dette (4441) ou le crédit (4449).",
      ],
      puces: [
        "**443 État, TVA facturée** : 4431 sur ventes, 4432 sur prestations de services.",
        "**445 État, TVA récupérable** : 4451 sur immobilisations, 4452 sur achats, 4454 sur services extérieurs et autres charges.",
        "**444 État, TVA due ou crédit de TVA** : 4441 TVA due, 4449 crédit de TVA à reporter.",
        "**Paiement** : débit 4441, crédit 521 Banque, au plus tard le 15 du mois suivant.",
        "**TVA non déductible** : comptabilisée dans le compte de charge concerné (frais de réception, carburant…) ou dans le coût de l'immobilisation, jamais en 445.",
      ],
    },
    {
      type: "schema",
      kind: "tableau",
      titre: "Écriture de liquidation de juin — SARL BOMOKO",
      entetes: ["Compte", "Débit (FC)", "Crédit (FC)"],
      lignes: [
        ["4431 TVA facturée sur ventes", "9 600 000", ""],
        ["4432 TVA facturée sur prestations", "960 000", ""],
        ["4451 TVA récupérable sur immobilisations", "", "800 000"],
        ["4452 TVA récupérable sur achats (marchandises, douane, gasoil)", "", "8 240 000"],
        ["4449 Crédit de TVA à reporter (mai)", "", "400 000"],
        ["4441 État, TVA due", "", "1 120 000"],
      ],
      note: "Total débit = total crédit = 10 560 000 FC. Le 15 juillet au plus tard : débit 4441, crédit 521 Banque, 1 120 000 FC.",
    },
    {
      type: "schema",
      kind: "chronologie",
      titre: "Le calendrier TVA d'un mois",
      jalons: [
        { date: "Au fil du mois", l: "Factures conformes et paiements bancaires", d: "Contrôler les mentions et payer par banque toute facture d'au moins 1 000 000 FC" },
        { date: "Fin du mois", l: "Centralisation et tri", d: "Journaux des ventes, encaissements de services, factures d'achat, état détaillé des déductions" },
        { date: "Au plus tard le 15 du mois suivant", l: "Déclaration et paiement", d: "Même sans opération : déclaration « Néant » (art. 60)" },
        { date: "Avec la déclaration", l: "Demande de remboursement éventuelle", d: "Exportateurs, investissements lourds, cessation d'activités (art. 64)" },
        { date: "Jusqu'au 31 décembre de l'année suivante", l: "Dernier délai pour déduire une TVA oubliée", d: "Au-delà, elle est définitivement perdue (art. 37)" },
      ],
    },
    {
      type: "pieges",
      puces: [
        "Taxer une prestation de services **à la facture** au lieu de l'**encaissement** (sans option) : on avance la TVA à l'État ; à l'inverse, oublier un acompte encaissé.",
        "Porter en 445 une TVA **non déductible** : elle gonfle le crédit et sera redressée ; elle doit rester dans le coût de la charge.",
        "Payer en **espèces** une facture d'au moins 1 000 000 FC : la TVA est perdue même si la facture est parfaite.",
        "Arrondir le prorata **au plus près** : il s'arrondit toujours à l'unité supérieure (64,29 % → 65 %).",
        "Oublier de **reporter le crédit** du mois précédent, ou l'imputer alors qu'on en a demandé le remboursement (art. 66).",
        "Déposer en retard une déclaration créditrice : **1 500 000 FC** d'amende et perte de **10 % du crédit**.",
      ],
    },
    {
      type: "maj",
      texte:
        "Ce module applique le **Code des impôts mis à jour au 31 mars 2021** (O.-L. n° 10/001 et D. n° 011/42) : taux de 16 % et 0 %, carburant déductible à 50 %, paiement bancaire dès 1 000 000 FC, prorata arrondi à l'unité supérieure, arrondi de la déclaration à la centaine. Les règles détaillées (assujettissement, exonérations, remboursement, sanctions) sont dans le module **F6**.",
    },
    {
      type: "maj",
      texte:
        "**Facture normalisée** : depuis le 1er décembre 2025, la TVA déductible se justifie par une facture normalisée émise par un DEF, ou un document admis en tenant lieu (Décret n° 23/010) : voir le module F13. Vérifiez aussi les lois de finances postérieures à 2021. Les intitulés de comptes suivent le plan SYSCOHADA révisé : adaptez-les au plan de comptes de votre entité.",
    },
    {
      type: "articles",
      refs: [
        "Art. 9 à 11 et 24 à 30 — O.-L. n° 10/001 : livraisons à soi-même, exigibilité (services à l'encaissement), base imposable",
        "Art. 35 — O.-L. n° 10/001 : taux de 16 % et 0 %",
        "Art. 36 à 38 — O.-L. n° 10/001 : droit à déduction, délai, pièces justificatives",
        "Art. 41 à 43 — O.-L. n° 10/001 : exclusions, carburant à 50 %, véhicules, prorata",
        "Art. 58 à 60 et 59 bis — O.-L. n° 10/001 : factures, acomptes, déclaration mensuelle, paiement bancaire",
        "Art. 63 à 66 — O.-L. n° 10/001 : crédit de TVA et remboursement",
        "Art. 100, 136 et 137 — D. n° 011/42 : mentions des factures, ordre de liquidation, arrondi",
        "L.F. n° 14/002, art. 17 : déclaration créditrice déposée hors délai",
      ],
    },
  ],
  qcm: [
    { q: "Un cabinet facture une prestation en mars et l'encaisse en mai, sans option pour les débits. Sur quelle déclaration figure la TVA ?", r: ["Celle de mars", "Celle d'avril", "Celle de mai", "Celle de juin"], b: 2, e: "Pour les prestations de services, la TVA est exigible à l'encaissement (art. 26) : elle va sur la déclaration de mai, à déposer au plus tard le 15 juin.", art: "art. 26 O.-L. n° 10/001" },
    { q: "Un acompte de 2 320 000 FC TTC est encaissé sur une prestation. Quelle TVA est exigible ?", r: ["371 200 FC", "320 000 FC", "232 000 FC", "Aucune avant la facture finale"], b: 1, e: "Base HT : 2 320 000 ÷ 1,16 = 2 000 000 FC ; TVA : 2 000 000 × 16 % = 320 000 FC. L'acompte rend la TVA exigible.", art: "art. 26 et 58 O.-L. n° 10/001" },
    { q: "Une facture de carburant de 1 000 000 FC HT (TVA 160 000 FC) concerne les camionnettes de livraison d'un commerçant. Quelle TVA déduire ?", r: ["160 000 FC", "0 FC", "80 000 FC", "120 000 FC"], b: 2, e: "Hors cas particuliers, la TVA sur les produits pétroliers n'est déductible qu'à 50 % : 160 000 × 50 % = 80 000 FC.", art: "art. 41-3 ter O.-L. n° 10/001" },
    { q: "Une facture de fournitures de 1 500 000 FC HT est réglée en espèces. Que devient sa TVA de 240 000 FC ?", r: ["Elle est déductible à 50 %", "Elle est déductible le mois suivant", "Elle est entièrement déductible", "Elle n'est pas déductible"], b: 3, e: "Toute transaction d'au moins 1 000 000 FC entre assujettis doit être payée par banque ; à défaut, le droit à déduction est perdu.", art: "art. 59 bis O.-L. n° 10/001" },
    { q: "Recettes taxables 38 000 000 FC, recettes exonérées 12 000 000 FC. Quel est le prorata de déduction ?", r: ["76 %", "75 %", "77 %", "100 %"], b: 0, e: "38 000 000 ÷ 50 000 000 = 76 % exactement : pas d'arrondi nécessaire. Un résultat de 75,2 % aurait été arrondi à 76 %.", art: "art. 43 O.-L. n° 10/001" },
    { q: "Un prorata calculé à 81,3 % est retenu pour :", r: ["81 %", "82 %", "80 %", "81,3 %"], b: 1, e: "Le prorata est arrondi à l'unité supérieure : 81,3 % devient 82 %.", art: "art. 43 O.-L. n° 10/001" },
    { q: "TVA collectée 5 000 000 FC, TVA déductible 3 200 000 FC, crédit du mois précédent 600 000 FC. Combien payer ?", r: ["1 800 000 FC", "2 400 000 FC", "1 200 000 FC", "600 000 FC"], b: 2, e: "5 000 000 − 3 200 000 − 600 000 = 1 200 000 FC, à payer au plus tard le 15 du mois suivant.", art: "art. 136 D. n° 011/42" },
    { q: "TVA collectée 2 000 000 FC, TVA déductible 2 700 000 FC, sans crédit antérieur ni export. Quel est le résultat ?", r: ["Remboursement de 700 000 FC", "TVA à payer de 700 000 FC", "Rien : les montants se compensent", "Crédit de 700 000 FC reporté sur le mois suivant"], b: 3, e: "L'excédent forme un crédit de TVA, en principe reportable et non remboursable hors cas de l'art. 64 (exportateurs, investissements lourds…).", art: "art. 63-64 O.-L. n° 10/001" },
    { q: "Une TVA à payer de 1 234 560 FC est déclarée pour :", r: ["1 234 600 FC", "1 234 500 FC", "1 235 000 FC", "1 234 560 FC"], b: 0, e: "Arrondi à la centaine : la tranche de 60 FC atteint 50 FC, on passe à la centaine supérieure : 1 234 600 FC.", art: "art. 137 D. n° 011/42" },
    { q: "Dans quel compte enregistre-t-on la TVA facturée sur les ventes de marchandises ?", r: ["4452 TVA récupérable sur achats", "4431 TVA facturée sur ventes", "4441 État, TVA due", "701 Ventes de marchandises"], b: 1, e: "La TVA facturée aux clients est une dette envers l'État : crédit du compte 4431, jamais un produit (701).", art: "SYSCOHADA révisé, compte 443" },
    { q: "Où comptabilise-t-on une TVA non déductible, par exemple sur des frais de réception ?", r: ["En 4452 TVA récupérable", "En 4449 crédit de TVA", "Dans le coût de la charge de réception", "En 4441 État, TVA due"], b: 2, e: "Une TVA non déductible n'est pas une créance sur l'État : elle fait partie du coût de la dépense.", art: "art. 41 O.-L. n° 10/001 ; SYSCOHADA révisé" },
    { q: "À l'écriture de liquidation, une TVA à payer apparaît au crédit de quel compte ?", r: ["4441 État, TVA due", "4449 Crédit de TVA à reporter", "4431 TVA facturée sur ventes", "521 Banque"], b: 0, e: "La liquidation solde les comptes 443 et 445 ; le solde à payer est porté au crédit de 4441, puis réglé par la banque.", art: "SYSCOHADA révisé, compte 444" },
    { q: "Jusqu'à quand peut-on déduire une TVA exigible en mars N et oubliée ?", r: ["Le 15 avril N", "Le 31 décembre N", "Le 31 mars N+1", "Le 31 décembre N+1"], b: 3, e: "La déduction peut être opérée jusqu'au 31 décembre de l'année qui suit celle de l'exigibilité ; au-delà, la TVA est perdue.", art: "art. 37 O.-L. n° 10/001" },
    { q: "Une entreprise assujettie n'a réalisé aucune opération en août. Que doit-elle faire ?", r: ["Rien", "Déposer une déclaration « Néant » au plus tard le 15 septembre", "Attendre la déclaration de septembre", "Écrire au service des impôts en fin d'année"], b: 1, e: "La déclaration mensuelle est obligatoire même sans opération ; le dépôt tardif d'une déclaration nulle coûte 500 000 FC.", art: "art. 60 O.-L. n° 10/001 ; L.F. n° 14/002" },
    { q: "Des ventes de 30 000 000 FC sont facturées avec 1 500 000 FC de remises sur les mêmes factures. Quelle TVA collecter ?", r: ["4 800 000 FC", "4 560 000 FC", "4 320 000 FC", "5 040 000 FC"], b: 1, e: "Les remises figurant sur la facture réduisent la base : (30 000 000 − 1 500 000) × 16 % = 4 560 000 FC.", art: "art. 29-30 O.-L. n° 10/001" },
  ],
};
