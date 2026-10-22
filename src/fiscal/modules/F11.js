// Module F11 — La paie en RDC : du brut au net, cotisations et comptabilisation
// Sources : Code des impôts mis à jour au 31 mars 2021 (IPR : art. 47, 48, 50, 84, 88, 89 O.-L. n° 69/009 ;
// art. 17 L. n° 004/2003), Loi n° 16/009 du 15 juillet 2016 et Décret n° 18/04 du 24 novembre 2018 (CNSS),
// Décret n° 25/22 du 30 mai 2025 (SMIG), arrêté ONEM de 2025 et barème INPP 2026 (voir les blocs « maj »).
export default {
  id: "F11",
  titre: "La paie en RDC : du brut au net, cotisations et écritures",
  court: "Paie",
  ico: "cash",
  col: "#B45309",
  duree: "30 min",
  resume: "Établir un bulletin de paie congolais : CNSS, IPR, INPP, ONEM, SMIG, coût employeur et écritures SYSCOHADA, avec un simulateur.",
  blocs: [
    {
      type: "essentiel",
      texte:
        "Chaque mois, l'employeur part de la **rémunération brute**, met de côté les **éléments immunisés** (logement dans la limite de 30 % du salaire de base, transport, allocations familiales légales), retient la **cotisation CNSS du salarié (5 %)** puis l'**IPR**, et verse le **net à payer**. Il paie en plus ses propres charges : **CNSS employeur (13 %)**, **INPP** (3,5 %, 3 % ou 2 % selon l'effectif) et **ONEM (0,5 %)**. Tout se déclare et se paie au plus tard le **15 du mois suivant**. Aucun salaire ne peut être inférieur au **SMIG**, porté à **21 500 FC par jour** depuis la paie de janvier 2026.",
    },
    {
      type: "texte",
      titre: "Les éléments du bulletin de paie",
      p: [
        "Le bulletin récapitule ce que l'employeur doit au travailleur pour le mois, ce qu'il retient pour le compte de l'État et de la CNSS, et ce qu'il verse réellement.",
      ],
      puces: [
        "**Salaire de base** : la rémunération convenue au contrat, jamais inférieure au SMIG de la catégorie.",
        "**Primes et gratifications** (rendement, ancienneté, 13e mois…) : imposables et soumises aux cotisations (art. 47).",
        "**Indemnité de logement** : immunisée jusqu'à **30 % du salaire de base** ; l'excédent devient imposable et cotisable (art. 48).",
        "**Indemnité de transport** : immunisée si elle couvre le coût réel du déplacement, dans la limite fixée par l'administration (art. 48).",
        "**Allocations familiales** : immunisées dans la limite des taux légaux ; leur minimum est fixé par le même décret que le SMIG.",
        "**Retenues** : CNSS salarié (5 %), IPR, et le cas échéant avances ou acomptes déjà versés (compte 421).",
      ],
    },
    {
      type: "schema",
      kind: "flux",
      titre: "Du brut au net à payer",
      etapes: [
        { op: "", l: "Rémunération brute du mois", d: "Salaire de base, primes, logement, transport, allocations familiales" },
        { op: "−", l: "Éléments immunisés", d: "Logement ≤ 30 % du salaire de base, transport, allocations familiales légales" },
        { op: "=", l: "Assiette des cotisations et de l'IPR", d: "Salaire de base + primes + excédent de logement", fort: true },
        { op: "−", l: "CNSS salarié : 5 %", d: "Cotisation de pension obligatoire, déductible pour l'IPR (art. 50)" },
        { op: "=", l: "Revenu imposable du mois", d: "Arrondi à la dizaine de FC (art. 88)" },
        { op: "→", l: "IPR : barème, plafond, charges de famille", d: "3 %, 15 %, 30 %, 40 % ; plafond 30 % ; − 2 % par personne à charge (9 au plus) ; minimum 2 000 FC" },
        { op: "=", l: "Net à payer", d: "Brut − CNSS salarié − IPR − avances éventuelles", fort: true },
      ],
    },
    {
      type: "texte",
      titre: "Les cotisations sociales : CNSS, INPP et ONEM",
      p: [
        "Depuis le Décret n° 18/04 du 24 novembre 2018, la CNSS perçoit **18 %** de l'assiette : **5 %** à la charge du travailleur et **13 %** à la charge de l'employeur. L'INPP (formation professionnelle) et l'ONEM (emploi) sont des charges **uniquement patronales**.",
      ],
      puces: [
        "**Pensions** : 10 %, partagés à égalité, **5 % travailleur et 5 % employeur**.",
        "**Risques professionnels** : **1,5 %**, à la seule charge de l'employeur.",
        "**Prestations familiales** : **6,5 %**, à la seule charge de l'employeur.",
        "**INPP** (barème 2026) : **3,5 %** de 1 à 50 travailleurs, **3 %** de 51 à 300, **2 %** au-delà de 300, **4 %** pour les entreprises publiques.",
        "**ONEM** : **0,5 %** de la rémunération, à la charge de l'employeur, depuis le 5 août 2025.",
        "**Assiette retenue dans ce module** : la rémunération soumise à l'IPR avant déduction de la CNSS, c'est-à-dire hors éléments immunisés. Vérifiez auprès de la CNSS les cas particuliers (avantages en nature, indemnités de fin de contrat).",
      ],
    },
    {
      type: "schema",
      kind: "tableau",
      titre: "Qui paie quoi, à quel taux (2026)",
      entetes: ["Prélèvement", "Salarié", "Employeur", "Échéance"],
      lignes: [
        ["CNSS : pensions", "5 %", "5 %", "15 du mois suivant"],
        ["CNSS : risques professionnels", "—", "1,5 %", "15 du mois suivant"],
        ["CNSS : prestations familiales", "—", "6,5 %", "15 du mois suivant"],
        ["IPR", "Barème (retenu sur le salaire)", "—", "15 du mois suivant"],
        ["INPP", "—", "3,5 % · 3 % · 2 % (public : 4 %)", "15 du mois suivant"],
        ["ONEM", "—", "0,5 %", "15 du mois suivant"],
      ],
      note: "Total CNSS : 18 % (5 % salarié + 13 % employeur). L'IPR est un impôt du salarié, mais c'est l'employeur qui le retient et le reverse.",
    },
    {
      type: "texte",
      titre: "L'IPR sur un bulletin mensuel",
      p: [
        "Le barème de l'IPR est **annuel** (art. 84). Sur la paie, on raisonne au mois en divisant les bornes par 12 : on obtient le même impôt que si l'on calculait sur l'année puis divisait par 12.",
      ],
      puces: [
        "**Tranches mensuelles** : 3 % jusqu'à **162 000 FC**, 15 % jusqu'à **1 800 000 FC**, 30 % jusqu'à **3 600 000 FC**, 40 % au-delà.",
        "**Plafond** : l'IPR ne peut dépasser **30 % du revenu imposable** (art. 84 par. 2).",
        "**Charges de famille** : − **2 %** de l'impôt par personne à charge au 1er janvier, **9 personnes au plus** (art. 89).",
        "**Minimum** : **2 000 FC par mois** après réduction (art. 84 par. 4).",
        "Le détail des immunités, des personnes à charge et de l'IERE des expatriés est dans le module **F3 (IPR)**.",
      ],
    },
    {
      type: "schema",
      kind: "paie",
      titre: "Simulateur de bulletin de paie",
      defaut: { base: 1200000, primes: 150000, logement: 300000, transport: 120000, allocations: 90000, charges: 4, taille: "1-50" },
      note: "Taux 2026 : CNSS 5 % + 13 %, INPP selon l'effectif, ONEM 0,5 %, IPR du Code des impôts mis à jour au 31 mars 2021. Résultat indicatif : vérifiez les cas particuliers de votre convention collective.",
    },
    {
      type: "exemple",
      titre: "Exemple 1 — Le bulletin du comptable de la SARL BOMOKO",
      enonce:
        "M. KABASELE est comptable à la SARL BOMOKO (35 travailleurs). Il est marié et a trois enfants : **4 personnes à charge**. Pour le mois, il reçoit un salaire de base de 1 200 000 FC, une prime de rendement de 150 000 FC, une indemnité de logement de 300 000 FC (moins que 30 % × 1 200 000 = 360 000 FC), une indemnité de transport de 120 000 FC et 90 000 FC d'allocations familiales légales. Brut total : **1 860 000 FC**.",
      lignes: [
        ["Salaire de base", 1200000],
        ["+ Prime de rendement", 150000],
        ["= Assiette CNSS et IPR (logement, transport et allocations immunisés)", 1350000, "total"],
        ["− CNSS salarié : 5 % × 1 350 000", -67500],
        ["= Revenu imposable du mois", 1282500, "total"],
        ["IPR, tranche 1 : 162 000 × 3 %", 4860],
        ["IPR, tranche 2 : (1 282 500 − 162 000) = 1 120 500 × 15 %", 168075],
        ["= IPR selon le barème", 172935, "total"],
        ["− Réduction : 4 × 2 % = 8 % × 172 935 (13 834,80)", -13835],
        ["= IPR retenu", 159100, "total"],
        ["Net à payer : 1 860 000 − 67 500 − 159 100", 1633400, "resultat"],
      ],
      conclusion:
        "Le plafond de 30 % (384 750 FC) n'est pas atteint et le minimum de 2 000 FC est dépassé. M. KABASELE reçoit 1 633 400 FC. La SARL BOMOKO reverse 67 500 FC à la CNSS (part salariale) et 159 100 FC d'IPR à la DGI, au plus tard le 15 du mois suivant.",
    },
    {
      type: "exemple",
      titre: "Exemple 2 — Ce que ce salarié coûte à la SARL BOMOKO",
      enonce:
        "On reprend M. KABASELE. L'assiette des charges patronales est de 1 350 000 FC. La SARL BOMOKO emploie 35 travailleurs : son taux INPP est de 3,5 %.",
      lignes: [
        ["Brut versé (salaire, prime, logement, transport, allocations)", 1860000],
        ["+ CNSS employeur : 13 % × 1 350 000", 175500],
        ["+ INPP : 3,5 % × 1 350 000", 47250],
        ["+ ONEM : 0,5 % × 1 350 000", 6750],
        ["= Coût total employeur du mois", 2089500, "resultat"],
      ],
      conclusion:
        "Le coût employeur dépasse le brut de 229 500 FC, soit environ 12 %. Avec 51 à 300 travailleurs, l'INPP serait de 40 500 FC (3 %) ; au-delà de 300, de 27 000 FC (2 %) ; dans une entreprise publique, de 54 000 FC (4 %).",
    },
    {
      type: "exemple",
      titre: "Exemple 3 — Un logement trop généreux : l'excédent est imposé",
      enonce:
        "Mme NSIMBA, assistante administrative chez ETS MAMA NZINGA, a un salaire de base de 800 000 FC, une indemnité de logement de 400 000 FC et 60 000 FC de transport. Elle a **2 personnes à charge**. Le logement n'est immunisé que jusqu'à 30 % × 800 000 = 240 000 FC.",
      lignes: [
        ["Salaire de base", 800000],
        ["+ Excédent de logement imposable : 400 000 − 240 000", 160000],
        ["= Assiette CNSS et IPR", 960000, "total"],
        ["− CNSS salarié : 5 % × 960 000", -48000],
        ["= Revenu imposable du mois", 912000, "total"],
        ["IPR selon le barème : 4 860 + (912 000 − 162 000) × 15 %", 117360],
        ["− Réduction : 2 × 2 % = 4 % × 117 360 (4 694,40)", -4694],
        ["= IPR retenu", 112666, "total"],
        ["Net à payer : 1 260 000 − 48 000 − 112 666", 1099334, "resultat"],
      ],
      conclusion:
        "Sans le dépassement, l'assiette serait de 800 000 FC. Les 160 000 FC excédentaires supportent à la fois la CNSS, l'IPR et les charges patronales : mieux vaut caler l'indemnité de logement sur 30 % du salaire de base.",
    },
    {
      type: "exemple",
      titre: "Exemple 4 — Un manœuvre payé au SMIG",
      enonce:
        "Un manœuvre ordinaire de la SA KIVU TRANS est payé au SMIG de 21 500 FC par jour, sur 26 jours de travail dans le mois (hypothèse de l'exemple). Il est célibataire, sans personne à charge, et ne reçoit pas d'autre élément de paie.",
      lignes: [
        ["Salaire du mois : 21 500 × 26 jours", 559000],
        ["− CNSS salarié : 5 % × 559 000", -27950],
        ["= Revenu imposable du mois", 531050, "total"],
        ["IPR : 4 860 + (531 050 − 162 000) × 15 % = 60 217,50", 60218],
        ["Net à payer : 559 000 − 27 950 − 60 218", 470832, "resultat"],
      ],
      conclusion:
        "Même au SMIG, l'IPR n'est pas négligeable depuis la suppression de la tranche exonérée : la première tranche est imposée à 3 %. Avec des personnes à charge, l'impôt baisse de 2 % par personne.",
    },
    {
      type: "texte",
      titre: "Comptabiliser la paie (SYSCOHADA révisé)",
      p: [
        "La paie se comptabilise en deux écritures à la fin du mois : la **constatation des salaires et des retenues**, puis les **charges patronales**. Le règlement suit, au plus tard le 15 du mois suivant.",
      ],
      puces: [
        "**Charges de personnel** : 6611 appointements et salaires, 6612 primes et gratifications, 663 indemnités forfaitaires (logement, transport), 6616 supplément familial (allocations familiales).",
        "**Charges sociales** : 664 charges sociales (CNSS employeur). **Taxes sur salaires** : 641 impôts et taxes directs (INPP, ONEM).",
        "**Dettes** : 422 personnel, rémunérations dues (net) ; 431 sécurité sociale (CNSS des deux parts) ; 447 État, impôts retenus à la source (IPR) ; 442 État, autres impôts et taxes (INPP, ONEM).",
        "**Règlement** : débit des comptes 422, 431, 447 et 442 par le crédit de la banque (521) ou de la caisse (571).",
      ],
    },
    {
      type: "schema",
      kind: "tableau",
      titre: "Écriture 1 — Salaires du mois de M. KABASELE",
      entetes: ["Compte", "Débit (FC)", "Crédit (FC)"],
      lignes: [
        ["6611 Appointements et salaires", "1 200 000", ""],
        ["6612 Primes et gratifications", "150 000", ""],
        ["663 Indemnités forfaitaires (logement, transport)", "420 000", ""],
        ["6616 Supplément familial", "90 000", ""],
        ["422 Personnel, rémunérations dues", "", "1 633 400"],
        ["431 Sécurité sociale (CNSS salarié)", "", "67 500"],
        ["447 État, impôts retenus à la source (IPR)", "", "159 100"],
      ],
      note: "Total débit = total crédit = 1 860 000 FC.",
    },
    {
      type: "schema",
      kind: "tableau",
      titre: "Écriture 2 — Charges patronales du mois",
      entetes: ["Compte", "Débit (FC)", "Crédit (FC)"],
      lignes: [
        ["664 Charges sociales (CNSS employeur 13 %)", "175 500", ""],
        ["641 Impôts et taxes directs (INPP 47 250 + ONEM 6 750)", "54 000", ""],
        ["431 Sécurité sociale (CNSS employeur)", "", "175 500"],
        ["442 État, autres impôts et taxes (INPP, ONEM)", "", "54 000"],
      ],
      note: "Le compte 431 totalise 243 000 FC à verser à la CNSS (67 500 + 175 500).",
    },
    {
      type: "schema",
      kind: "chronologie",
      titre: "Le calendrier de la paie",
      jalons: [
        { date: "Fin du mois M", l: "Calcul de la paie et remise des bulletins", d: "Paiement du net au travailleur ; comptabilisation des écritures 1 et 2" },
        { date: "Au plus tard le 15 de M+1", l: "IPR : déclaration et versement à la DGI", d: "Retenues du mois M (art. 17 L. n° 004/2003)" },
        { date: "Au plus tard le 15 de M+1", l: "CNSS, INPP et ONEM : déclarations et paiements", d: "Parts salariale et patronale de la CNSS ; INPP et ONEM à la charge de l'employeur" },
        { date: "Le 15 du mois qui suit chaque trimestre", l: "IPR forfaitaire", d: "Domestiques et salariés des micro-entreprises (art. 84 par. 3)" },
      ],
    },
    {
      type: "pieges",
      puces: [
        "Calculer l'IPR sur le brut **sans déduire la CNSS salariale de 5 %** : l'impôt est alors surévalué.",
        "Oublier que le logement **au-delà de 30 % du salaire de base** devient imposable et cotisable.",
        "Utiliser en 2026 les **anciens taux** : INPP 3 % / 2 % / 1 %, ONEM 0,2 %, SMIG 7 075 ou 14 500 FC.",
        "Appliquer le barème annuel de l'IPR à un salaire mensuel **sans diviser les tranches par 12**.",
        "Compter plus de **9 personnes à charge**, ou une réduction sur l'IPR forfaitaire des micro-entreprises.",
        "Payer la CNSS ou l'IPR **après le 15 du mois suivant** : majorations et pénalités de retard.",
      ],
    },
    {
      type: "maj",
      texte:
        "**Taux en vigueur en 2026, à vérifier à chaque loi de finances.** IPR : barème du Code des impôts mis à jour au 31 mars 2021 (3 %, 15 %, 30 %, 40 %). SMIG : **21 500 FC par jour** à partir de la paie de janvier 2026 (Décret n° 25/22 du 30 mai 2025), après 14 500 FC en 2025 et 7 075 FC depuis 2018. ONEM : **0,5 %** depuis le 5 août 2025, au lieu de 0,2 %. INPP : nouveau barème à compter de janvier 2026 (3,5 %, 3 %, 2 %, 4 % pour le public), au lieu de 3 %, 2 %, 1 %.",
    },
    {
      type: "maj",
      texte:
        "Une **cotisation santé** (2 % employeur, 0,5 % salarié) a été annoncée mais n'était pas publiée au Journal officiel lors de la rédaction de ce module : elle n'est pas appliquée ici. Les taux INPP et ONEM proviennent d'avis publiés par des éditeurs de paie : confirmez-les avec les textes officiels avant toute déclaration.",
    },
    {
      type: "articles",
      refs: [
        "Art. 47 et 48 — O.-L. n° 69/009 : rémunérations imposables et immunités (logement ≤ 30 %, transport, allocations familiales)",
        "Art. 50 — O.-L. n° 69/009 : déduction des cotisations de pension obligatoires",
        "Art. 84, 88 et 89 — O.-L. n° 69/009 : barème, plafond de 30 %, minimum, arrondi, charges de famille",
        "Art. 17 — L. n° 004/2003 : déclaration et versement de l'IPR retenu",
        "Loi n° 16/009 du 15 juillet 2016 : régime général de la sécurité sociale (CNSS)",
        "Décret n° 18/04 du 24 novembre 2018 : taux des cotisations sociales dues à la CNSS",
        "Décret n° 25/22 du 30 mai 2025 : SMIG, allocations familiales minima et contre-valeur du logement",
        "Arrêté n° 30/CAB/MIN.ET/EAN/JDO/8/2025 : taux de la contribution ONEM",
      ],
    },
  ],
  qcm: [
    { q: "Quel est le taux de la cotisation CNSS retenue sur le salaire du travailleur ?", r: ["3,5 %", "5 %", "13 %", "18 %"], b: 1, e: "Le travailleur cotise 5 % (branche des pensions). L'employeur paie 13 % : 5 % de pensions, 1,5 % de risques professionnels et 6,5 % de prestations familiales.", art: "Décret n° 18/04 du 24 novembre 2018" },
    { q: "Quel est le taux global de la part patronale CNSS ?", r: ["13 %", "10 %", "6,5 %", "18 %"], b: 0, e: "5 % (pensions) + 1,5 % (risques professionnels) + 6,5 % (prestations familiales) = 13 %.", art: "Décret n° 18/04 du 24 novembre 2018" },
    { q: "Quelle branche de la CNSS est financée à la fois par le travailleur et par l'employeur ?", r: ["Les risques professionnels", "Les prestations familiales", "Les pensions", "Les trois branches"], b: 2, e: "Seule la branche des pensions est partagée (5 % + 5 %). Les risques professionnels et les prestations familiales sont à la seule charge de l'employeur.", art: "Loi n° 16/009 du 15 juillet 2016" },
    { q: "Une entreprise privée de 40 travailleurs paie l'INPP en 2026 à quel taux ?", r: ["2 %", "3 %", "4 %", "3,5 %"], b: 3, e: "Barème 2026 : 3,5 % de 1 à 50 travailleurs, 3 % de 51 à 300, 2 % au-delà ; 4 % pour les entreprises publiques.", art: "Barème INPP 2026" },
    { q: "Quel est le taux de la contribution ONEM depuis le 5 août 2025 ?", r: ["0,2 %", "0,5 %", "1 %", "1,5 %"], b: 1, e: "L'ONEM est passé de 0,2 % à 0,5 % de la rémunération, à la seule charge de l'employeur.", art: "Arrêté n° 30/CAB/MIN.ET/EAN/JDO/8/2025" },
    { q: "Quel est le SMIG journalier du manœuvre ordinaire à partir de la paie de janvier 2026 ?", r: ["7 075 FC", "14 500 FC", "21 500 FC", "25 000 FC"], b: 2, e: "Le Décret n° 25/22 du 30 mai 2025 a fixé le SMIG à 21 500 FC par jour à partir de la paie de janvier 2026.", art: "Décret n° 25/22 du 30 mai 2025" },
    { q: "Avant d'appliquer le barème de l'IPR, que retire-t-on de l'assiette du salarié ?", r: ["Sa cotisation CNSS de 5 %", "La CNSS employeur de 13 %", "L'INPP et l'ONEM", "Rien : l'IPR se calcule sur le brut"], b: 0, e: "Les cotisations de pension obligatoires versées par le salarié sont déductibles (art. 50). Les charges patronales ne concernent pas le salarié.", art: "art. 50 O.-L. n° 69/009" },
    { q: "Salaire de base de 1 000 000 FC et indemnité de logement de 350 000 FC : quelle part du logement est imposable ?", r: ["0 FC", "50 000 FC", "350 000 FC", "300 000 FC"], b: 1, e: "Le logement est immunisé jusqu'à 30 % × 1 000 000 = 300 000 FC. L'excédent de 50 000 FC est imposable et cotisable.", art: "art. 48 O.-L. n° 69/009" },
    { q: "Sur une paie mensuelle, jusqu'à quel montant de revenu imposable s'applique le taux de 3 % ?", r: ["1 944 000 FC", "162 000 FC", "1 800 000 FC", "524 160 FC"], b: 1, e: "La 1re tranche annuelle (1 944 000 FC) divisée par 12 donne 162 000 FC par mois.", art: "art. 84 O.-L. n° 69/009" },
    { q: "Revenu imposable mensuel de 662 000 FC, sans personne à charge : quel est l'IPR du mois ?", r: ["19 860 FC", "75 000 FC", "79 860 FC", "99 300 FC"], b: 2, e: "162 000 × 3 % = 4 860 FC ; (662 000 − 162 000) × 15 % = 75 000 FC ; total 79 860 FC.", art: "art. 84 O.-L. n° 69/009" },
    { q: "Un salarié a 4 personnes à charge et un IPR de 100 000 FC selon le barème. Quel IPR est retenu ?", r: ["92 000 FC", "96 000 FC", "100 000 FC", "60 000 FC"], b: 0, e: "Réduction de 4 × 2 % = 8 %, soit 8 000 FC : 100 000 − 8 000 = 92 000 FC.", art: "art. 89 O.-L. n° 69/009" },
    { q: "Assiette de 2 000 000 FC dans une entreprise de 120 travailleurs : quelles charges patronales CNSS, INPP et ONEM au total ?", r: ["260 000 FC", "330 000 FC", "340 000 FC", "360 000 FC"], b: 1, e: "CNSS 13 % = 260 000 ; INPP 3 % = 60 000 ; ONEM 0,5 % = 10 000 ; total 330 000 FC.", art: "Décret n° 18/04 ; barème INPP 2026 ; arrêté ONEM 2025" },
    { q: "Dans quel compte SYSCOHADA enregistre-t-on l'IPR retenu sur les salaires ?", r: ["422 Personnel, rémunérations dues", "431 Sécurité sociale", "641 Impôts et taxes directs", "447 État, impôts retenus à la source"], b: 3, e: "L'IPR est un impôt du salarié retenu par l'employeur : c'est une dette envers l'État, au compte 447, et non une charge de l'entreprise.", art: "SYSCOHADA révisé, compte 447" },
    { q: "Dans quel compte de charges enregistre-t-on la part patronale de la CNSS ?", r: ["664 Charges sociales", "6611 Appointements et salaires", "447 État, impôts retenus à la source", "663 Indemnités forfaitaires"], b: 0, e: "La CNSS employeur est une charge sociale (664) ; sa contrepartie est la dette envers la CNSS au compte 431.", art: "SYSCOHADA révisé, compte 664" },
    { q: "Quelle est la date limite de versement de l'IPR et des cotisations CNSS de la paie de mars ?", r: ["Le 31 mars", "Le 10 avril", "Le 15 avril", "Le 30 avril"], b: 2, e: "IPR, CNSS, INPP et ONEM se déclarent et se paient au plus tard le 15 du mois qui suit le paiement des salaires.", art: "art. 17 L. n° 004/2003" },
  ],
};
