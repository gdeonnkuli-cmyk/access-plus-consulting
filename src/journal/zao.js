// ══════════════════ CAS ZAO IMMO SARL — TENUE COMPTABLE 2021 (corrigé Éco-Campus) ══════════════════
// Exercice de passation des écritures, du bilan d'ouverture aux états financiers (SYSCOHADA révisé).
// Source : travail pratique remis par l'administrateur (énoncé de 31 opérations, journal Sage et états
// financiers), corrigé et rendu cohérent. Les hypothèses retenues sont listées dans HYPOTHESES.
// Tenue en francs congolais : opérations en USD converties à 2 000 FC ; clôture à 2 350 FC pour l'emprunt.
// Une ligne d'écriture : { c: compte, d: débit, cr: crédit, r?: racine acceptée, alt?: autres comptes acceptés }.
//   r : préfixe minimal accepté pour le compte de l'apprenant (par défaut les 3 premiers chiffres).
export const TAUX = 2000, TAUX_CLOTURE = 2350;
const usd = x => Math.round(x * TAUX);
// Montant TTC → HT et TVA (16 %) : HT = TTC ÷ 1,16 arrondi au franc, TVA = le reste
export const ventile = ttc => { const ht = Math.round(ttc / 1.16); return { ht, tva: ttc - ht }; };

export const LIBELLES = {
  "101": "Capital social", "1111": "Réserve légale", "121": "Report à nouveau créditeur", "131": "Résultat net : bénéfice",
  "165": "Dépôts et cautionnements reçus", "1621": "Emprunt bancaire en dollars (Rawbank)", "1662": "Intérêts courus sur emprunts",
  "1911": "Provisions pour litiges", "194": "Provisions pour pertes de change",
  "2111": "Frais de développement", "2122": "Concessions immobilières", "2123": "Licences d'exploitation immobilière (DGRAD)", "2131": "Logiciels (CAST IMMO, Sage)",
  "2221": "Terrain à bâtir", "2248": "Autres travaux sur terrains", "2313": "Bâtiments administratifs et commerciaux", "2324": "Bâtiments affectés au logement",
  "2391": "Bâtiments en cours (nouveau siège)", "2441": "Mobilier de bureau", "2442": "Matériel informatique", "24510": "Véhicules de liaison", "24511": "Véhicules des agents",
  "252": "Avances et acomptes versés sur immobilisations corporelles", "2611": "Participation MALTA FOREST", "2612": "Participation SAFRICAS CONGO",
  "2712": "Prêts aux associés", "2714": "Prêts au personnel", "2718": "Autres prêts et créances",
  "28111": "Amortissements des frais de développement", "28122": "Amortissements des concessions", "28123": "Amortissements des licences", "28131": "Amortissements des logiciels",
  "2831": "Amortissements des bâtiments", "2844": "Amortissements du mobilier", "2845": "Amortissements du matériel de transport",
  "4011": "Fournisseurs", "4111": "Clients", "4161": "Clients douteux", "4211": "Personnel, avances et acomptes",
  "441": "État, impôt sur les bénéfices", "4431": "TVA facturée sur ventes et prestations", "4441": "État, TVA due", "4449": "État, crédit de TVA à reporter",
  "4451": "TVA récupérable sur immobilisations", "4454": "TVA récupérable sur services extérieurs", "4711": "Débiteurs et créditeurs divers",
  "476": "Charges constatées d'avance", "4784": "Écart de conversion actif (augmentation des dettes financières)",
  "481": "Fournisseurs d'investissements", "485": "Créances sur cessions d'immobilisations", "4911": "Dépréciation des comptes clients", "499": "Provisions pour risques à court terme",
  "513": "Chèques à encaisser", "521": "Banques (Rawbank, BCDC, TMB)", "5711": "Caisse principale", "5712": "Caisse secondaire",
  "6047": "Fournitures de bureau", "6051": "Eau (REGIDESO)", "6052": "Électricité (SNEL)", "6242": "Entretien et réparations", "625": "Primes d'assurance", "6271": "Annonces, insertions",
  "633": "Frais de formation du personnel", "6582": "Dons", "6588": "Autres charges diverses", "6712": "Intérêts des emprunts",
  "6813": "Dotations aux amortissements des immobilisations corporelles", "6911": "Dotations aux provisions pour risques et charges", "6971": "Dotations aux provisions financières pour risques et charges",
  "706": "Loyers et prestations de services", "7582": "Indemnités d'assurance reçues", "7594": "Reprises de dépréciations sur créances",
  "812": "Valeur comptable des cessions d'immobilisations corporelles", "822": "Produits des cessions d'immobilisations corporelles", "891": "Impôt sur les bénéfices de l'exercice",
};

// ── Bilan d'ouverture au 01/01/2021 (soldes au 31/12/2020, reclassés ; voir HYPOTHESES) ──
const OUV = [
  ["2111", 25052030, 0], ["28111", 0, 12350651], ["2122", 56021152200, 0], ["2123", 311021030, 0], ["28123", 0, 77755258],
  ["2131", 2220020, 0], ["28131", 0, 555005], ["2221", 850122020, 0], ["2248", 5888000, 0],
  ["2313", 133052230, 0], ["2324", 6502305200, 0], ["2831", 0, 461813976], ["2441", 40521050, 0], ["2844", 0, 8104210],
  ["2442", 15230132, 0], ["24510", 150002215, 0], ["24511", 105501500, 0], ["2845", 0, 51100743],
  ["2611", 242145330, 0], ["2612", 140251050, 0], ["2712", 532001205, 0], ["2718", 236325354, 0],
  ["4111", 21000000, 0], ["4161", 16700000, 0], ["4911", 0, 16700000], ["4449", 1440000, 0],
  ["521", 47915902228, 0], ["5711", 7900000, 0], ["5712", 6350000, 0],
  ["101", 0, 61619662280], ["1111", 0, 10000000], ["4011", 0, 33564000], ["499", 0, 567400000],
];
// Résultat 2020 : solde d'équilibre du bilan d'ouverture reclassé (voir hypothèse H3)
const ecartOuv = OUV.reduce((s, [, d, c]) => s + d - c, 0);
const reserve2020 = Math.round(ecartOuv / 10);
export const OUVERTURE = [...OUV, ["131", 0, ecartOuv]].map(([c, d, cr]) => ({ c, l: LIBELLES[c], d, cr }));

// ── Montants des opérations ──
const V = {
  media: ventile(usd(180)), cogA: ventile(usd(1930)), cogB: ventile(usd(75000)), cf: ventile(usd(4500)), nuit: ventile(usd(25000)),
  split: ventile(usd(2500)), njoli: ventile(usd(5000)), form: ventile(usd(1000)), lit: ventile(usd(500)), regi: ventile(usd(120)),
};
export const FACTURES_NOV = [
  ["L000325", "LEDYA", "Loyer de décembre", 21235], ["L000326", "CFAO", "Loyer de décembre", 11236], ["L000327", "CMA", "10 nuitées pour des agents en mission", 2555],
  ["L000328", "LINDACARD", "Loyer de décembre", 33252], ["L000329", "AFRIMA", "Loyer de novembre", 25362], ["L000330", "VLISCO", "Loyer de septembre", 6253.25],
  ["L000331", "TRACTAFRIC", "Loyer de décembre", 50000],
].map(([n, client, objet, ttcUsd]) => ({ n, client, objet, ttcUsd, ttc: usd(ttcUsd), ...ventile(usd(ttcUsd)) }));
const nov = FACTURES_NOV.reduce((s, f) => ({ ttc: s.ttc + f.ttc, ht: s.ht + f.ht, tva: s.tva + f.tva }), { ttc: 0, ht: 0, tva: 0 });
const regles15 = ["VLISCO", "AFRIMA", "CMA"].reduce((s, k) => s + FACTURES_NOV.find(f => f.client === k).ttc, 0);
const tractAvance = Math.round(FACTURES_NOV.find(f => f.client === "TRACTAFRIC").ttc * 0.33);
// Véhicule cédé : acquis le 10/06/2018 pour 9 000 $, amorti en 5 ans (1 800 $ par an), année de 360 jours
const VEH = { brut: usd(9000), dot2021: Math.round(usd(1800) * 160 / 360), cumul: usd(5400) };
// Mazda : coût TTC (TVA non déductible), amorties en 5 ans à partir du 23/06/2021 (187 jours)
const MAZDA = usd(44080), dotMazda = Math.round(MAZDA * 0.2 * 187 / 360);
// Emprunt : 100 000 $, intérêts de 6,5 % sur 6,5 mois, convertis au cours de clôture
const ecartEmprunt = Math.round(100000 * (TAUX_CLOTURE - TAUX)), interets = Math.round(100000 * 0.065 * 6.5 / 12 * TAUX_CLOTURE);

const L = (c, d = 0, cr = 0, x = {}) => ({ c, d, cr, ...x });
const BANQUE = { r: "52" }, CAISSE = { r: "57" };

// ── Opérations de l'exercice ──
// date, enonce (texte remis à l'apprenant), lignes (corrigé), expl (explication), aide (indice facultatif)
const OPS = [
  { date: "22/02/2021", enonce: "Le ministère de l'Urbanisme et Habitat délivre l'autorisation de construire le nouveau bâtiment de 5 niveaux du siège social. Frais payés par la banque : 3 000 $ (taxe, sans TVA).",
    lignes: [L("2391", usd(3000), 0, { r: "23" }), L("521", 0, usd(3000), BANQUE)],
    expl: "Les frais directement attribuables à la construction (autorisation de bâtir) font partie du coût du bâtiment : on les porte en immobilisation en cours (2391), pas en charge ni en 212. 3 000 $ × 2 000 = 6 000 000 FC." },
  { date: "28/02/2021", enonce: "Appel d'offres publié sur Médias Congo pour le projet de construction. Facture FA000456 de 180 $ TTC ; 65 % payés en espèces le jour même.",
    lignes: [L("6271", V.media.ht, 0, { r: "627" }), L("4454", V.media.tva, 0, { r: "445" }), L("4011", usd(117), usd(180), { r: "401" }), L("5711", 0, usd(117), CAISSE)],
    expl: `La publicité de l'appel d'offres n'est pas directement attribuable au bâtiment : c'est une charge (6271). TVA = TTC × 16/116 : 360 000 → HT ${V.media.ht.toLocaleString("fr-FR")} et TVA ${V.media.tva.toLocaleString("fr-FR")} FC (et non 16 % du TTC). Paiement : 65 % × 180 $ = 117 $, soit 234 000 FC en caisse.`,
    aide: "Le montant est TTC : retrouvez d'abord le hors taxe." },
  { date: "05/03/2021", enonce: "Recrutement de COGECO SARL (étude et construction de bâtiments) et règlement en espèces du solde de la facture de Médias Congo (bon de sortie de caisse n° 0025).",
    lignes: [L("4011", usd(63), 0, { r: "401" }), L("5711", 0, usd(63), CAISSE)],
    expl: "Le recrutement d'un prestataire ne donne lieu à aucune écriture. Solde : 180 − 117 = 63 $, soit 126 000 FC." },
  { date: "10/03/2021", enonce: "COGECO remet sa facture FA-COG00251-03-2021 de 220 000 $ TTC pour réaliser le bâtiment en 3 ans. Un acompte de 1 930 $ lui est payé par chèque Rawbank pour la conception.",
    lignes: [L("252", V.cogA.ht, 0, { r: "25" }), L("4451", V.cogA.tva, 0, { r: "445" }), L("521", 0, usd(1930), BANQUE)],
    expl: `Le marché de 220 000 $ porte sur des travaux à réaliser pendant 3 ans : tant qu'ils ne sont pas exécutés, ce n'est ni une immobilisation ni une dette (engagement à mentionner en note annexe). Seul l'acompte versé se comptabilise en 252, hors taxe ; sa TVA est récupérable sur immobilisation (4451) : 3 860 000 → HT ${V.cogA.ht.toLocaleString("fr-FR")} et TVA ${V.cogA.tva.toLocaleString("fr-FR")} FC.`,
    aide: "Que doit-on vraiment à COGECO aujourd'hui ?" },
  { date: "15/03/2021", enonce: "Chèque Rawbank de 75 000 $ remis à COGECO pour le début des travaux de construction.",
    lignes: [L("252", V.cogB.ht, 0, { r: "25" }), L("4451", V.cogB.tva, 0, { r: "445" }), L("521", 0, usd(75000), BANQUE)],
    expl: `Nouvel acompte sur le marché : 150 000 000 FC TTC, dont HT ${V.cogB.ht.toLocaleString("fr-FR")} en 252 et TVA ${V.cogB.tva.toLocaleString("fr-FR")} en 4451. Les acomptes seront virés en 2391 au fur et à mesure de l'avancement constaté.` },
  { date: "19/03/2021", enonce: "Le client Congo Futur règle par banque ses factures de décembre 2020, janvier 2021 (émise le 20/01) et février 2021 (émise le 19/02), à 4 500 $ TTC chacune. Passez les factures de 2021 et le règlement.",
    lignes: [L("4111", 2 * usd(4500), 3 * usd(4500), { r: "411" }), L("706", 0, 2 * V.cf.ht, { r: "706" }), L("4431", 0, 2 * V.cf.tva, { r: "443" }), L("521", 3 * usd(4500), 0, BANQUE)],
    expl: `La facture de décembre 2020 est déjà dans le bilan d'ouverture (4111) : on ne la recomptabilise pas en ventes 2021. Factures de janvier et février : 9 000 000 FC TTC chacune, soit HT ${V.cf.ht.toLocaleString("fr-FR")} et TVA ${V.cf.tva.toLocaleString("fr-FR")}. Règlement des trois factures : 27 000 000 FC.`,
    aide: "Une des trois factures date de 2020 : où se trouve-t-elle déjà ?" },
  { date: "25/03/2021", enonce: "Après relance du gestionnaire BOLA, Trace Congo paie par banque 8 350 $ pour ses factures de 2020 en souffrance (L000747 à L000749), classées en clients douteux et dépréciées à 100 % au 31/12/2020.",
    lignes: [L("521", usd(8350), 0, BANQUE), L("4161", 0, usd(8350), { r: "41" }), L("4911", usd(8350), 0, { r: "491" }), L("7594", 0, usd(8350), { r: "759", alt: ["7959", "79"] })],
    expl: "Le règlement solde la créance douteuse (4161) ; la dépréciation devenue sans objet est reprise (D 4911 / C 7594). Les factures de 2020 ne sont pas une vente de 2021 : les repasser en 706 gonflerait le chiffre d'affaires." },
  { date: "10/04/2021", enonce: "Contrat de 4 ans avec Total RDC pour loger ses agents en mission à Kinshasa. Total verse une caution de 20 000 $ (avis de crédit BCDC n° 000025).",
    lignes: [L("521", usd(20000), 0, BANQUE), L("165", 0, usd(20000), { r: "165" })],
    expl: "La caution reçue est une dette envers le locataire, remboursable en fin de contrat : 165 Dépôts et cautionnements reçus (dettes financières). Ce n'est ni un produit ni une créance client." },
  { date: "15/04/2021", enonce: "Cinq clients occasionnels ayant passé dix nuits paient en espèces leur séjour : 25 000 $ TTC (500 $ par jour).",
    lignes: [L("5711", usd(25000), 0, CAISSE), L("706", 0, V.nuit.ht, { r: "706" }), L("4431", 0, V.nuit.tva, { r: "443" })],
    expl: `5 × 10 × 500 $ = 25 000 $ TTC, soit 50 000 000 FC : HT ${V.nuit.ht.toLocaleString("fr-FR")} et TVA ${V.nuit.tva.toLocaleString("fr-FR")}. La location meublée est une prestation de services taxable à 16 %. Le passage par un compte client (411) est possible ; il se solde aussitôt.` },
  { date: "16/04/2021", enonce: "Facture FACT-00565 pour l'entretien des splits de 10 appartements : 2 500 $ TTC, à payer.",
    lignes: [L("6242", V.split.ht, 0, { r: "624" }), L("4454", V.split.tva, 0, { r: "445" }), L("4011", 0, usd(2500), { r: "401" })],
    expl: `Entretien et réparations (6242) : 5 000 000 FC TTC, soit HT ${V.split.ht.toLocaleString("fr-FR")} et TVA ${V.split.tva.toLocaleString("fr-FR")} récupérable sur services (4454). La facture reste due : l'énoncé ne mentionne pas de règlement.` },
  { date: "18/05/2021", enonce: "Achat de fournitures de bureau pour 1 350 $ TTC, payées en espèces le jour même.",
    lignes: [L("6047", usd(1350), 0, { r: "604", alt: ["6055", "605"] }), L("5711", 0, usd(1350), CAISSE)],
    expl: "1 350 $ = 2 700 000 FC payés en espèces : toute facture d'au moins 1 000 000 FC entre assujettis doit être réglée par banque, sinon la TVA n'est pas déductible (art. 59 bis O.-L. n° 10/001). La charge est donc enregistrée TTC.",
    aide: "Regardez le mode de paiement et le montant en francs." },
  { date: "10/06/2021", enonce: "Vente par banque, au prix de 4 500 $, d'un véhicule de liaison acquis le 10/06/2018 pour 9 000 $ et amorti en 5 ans (1 800 $ par an). Passez la dotation complémentaire, la sortie et la cession.",
    lignes: [L("6813", VEH.dot2021, 0, { r: "681" }), L("2845", VEH.cumul, VEH.dot2021, { r: "284" }), L("812", VEH.brut - VEH.cumul, 0, { r: "812", alt: ["81"] }), L("24510", 0, VEH.brut, { r: "245" }),
      L("521", usd(4500), 0, BANQUE), L("822", 0, usd(4500), { r: "822", alt: ["82"] })],
    expl: `Dotation 2021 du 01/01 au 10/06 : 1 800 $ × 160/360 = 800 $, soit ${VEH.dot2021.toLocaleString("fr-FR")} FC (et non une année pleine). Cumul à la cession : 5 400 $ ; valeur comptable : 3 600 $ (7 200 000 FC en 812). Prix de cession : 4 500 $ en 822, sans TVA : un véhicule de transport de personnes n'ouvre pas droit à déduction à l'achat (art. 42), et sa revente par l'utilisateur est exonérée (art. 15, point 1). Le passage par le 485 est possible ; il se solde au règlement.`,
    aide: "Trois temps : compléter l'amortissement, sortir le bien, constater la vente." },
  { date: "15/06/2021", enonce: "Emprunt Rawbank de 100 000 $ sur 5 ans au taux de 6,5 %, pour accélérer les travaux du nouveau siège. Les fonds sont versés sur le compte Rawbank.",
    lignes: [L("521", usd(100000), 0, BANQUE), L("1621", 0, usd(100000), { r: "162", alt: ["16"] })],
    expl: "Les fonds reçus sont à la banque (débit) ; la dette envers Rawbank est un emprunt (crédit 162). Le corrigé initial inversait ces deux comptes. 100 000 $ × 2 000 = 200 000 000 FC." },
  { date: "22/06/2021", enonce: "Le client Njoli, logé dix jours, paie ses frais de 5 000 $ TTC par chèque Rawbank n° 0663254.",
    lignes: [L("513", usd(5000), 0, { r: "51" }), L("706", 0, V.njoli.ht, { r: "706" }), L("4431", 0, V.njoli.tva, { r: "443" })],
    expl: `Le chèque reçu non encore remis en banque va en 513 Chèques à encaisser. 10 000 000 FC TTC : HT ${V.njoli.ht.toLocaleString("fr-FR")} et TVA collectée ${V.njoli.tva.toLocaleString("fr-FR")} (compte 443, et non 445 qui sert à la TVA récupérable).` },
  { date: "23/06/2021", enonce: "Achat de deux véhicules de liaison Mazda à 19 000 $ HT chacun (TVA 16 %), payés par Rawbank le même jour.",
    lignes: [L("24510", MAZDA, 0, { r: "245" }), L("521", 0, MAZDA, BANQUE)],
    expl: "38 000 $ HT + 6 080 $ de TVA = 44 080 $, soit 88 160 000 FC. Des véhicules de transport de personnes (moins de 10 places) n'ouvrent pas droit à déduction de la TVA (art. 42) : la TVA fait partie du coût immobilisé. Le passage par le 481 (fournisseur d'immobilisations) est possible ; il se solde au paiement.",
    aide: "La TVA de ces véhicules est-elle récupérable ?" },
  { date: "25/06/2021", enonce: "Le chèque n° 0663254 du client Njoli est remis à l'encaissement sur le compte Rawbank.",
    lignes: [L("521", usd(5000), 0, BANQUE), L("513", 0, usd(5000), { r: "51" })], expl: "Le chèque passe du 513 à la banque : 10 000 000 FC." },
  { date: "30/06/2021", enonce: "L'assemblée générale approuve les comptes 2020 et affecte le bénéfice : 10 % à la réserve légale, le solde en report à nouveau.",
    lignes: [L("131", ecartOuv, 0, { r: "13" }), L("1111", 0, reserve2020, { r: "111", alt: ["11"] }), L("121", 0, ecartOuv - reserve2020, { r: "121", alt: ["12"] })],
    expl: `Au moins un dixième du bénéfice va à la réserve légale tant qu'elle n'atteint pas le cinquième du capital (Acte uniforme OHADA sur les sociétés commerciales) : ${reserve2020.toLocaleString("fr-FR")} FC ; le reste, ${(ecartOuv - reserve2020).toLocaleString("fr-FR")} FC, en report à nouveau (121). Le compte 131 est ainsi soldé avant de recevoir le résultat 2021.`,
    aide: "Le résultat 2020 doit quitter le compte 131." },
  { date: "28/06/2021", enonce: "Souscription auprès d'ACTIVA de l'assurance annuelle des deux véhicules : 1 500 $, payés en espèces.",
    lignes: [L("625", usd(1500), 0, { r: "625" }), L("5711", 0, usd(1500), CAISSE)],
    expl: "3 000 000 FC payés en espèces : au-delà de 1 000 000 FC, aucune TVA n'est déductible (art. 59 bis). La part couvrant 2022 sera régularisée à l'inventaire (charge constatée d'avance)." },
  { date: "02/07/2021", enonce: "L'employée Gloria obtient un crédit de la société de 1 000 $ pour la layette de son enfant, versé par banque et remboursable par retenue de 100 $ par mois sur son salaire.",
    lignes: [L("4211", usd(1000), 0, { r: "421" }), L("521", 0, usd(1000), BANQUE)],
    expl: "Avance remboursable à moins d'un an : créance sur le personnel (4211). Les retenues mensuelles se passent avec la paie, qui ne fait pas partie de cet exercice." },
  { date: "05/07/2021", enonce: "L'employé Johny obtient un prêt de la société de 3 000 $ pour la mise en valeur de son terrain, versé par banque.",
    lignes: [L("2714", usd(3000), 0, { r: "271", alt: ["4211", "421"] }), L("521", 0, usd(3000), BANQUE)],
    expl: "Prêt au personnel sans échéance courte : immobilisation financière (2714). S'il était remboursable dans l'année, le 4211 conviendrait aussi." },
  { date: "10/07/2021", enonce: "ENGEN règle par chèque, remis aussitôt en banque, une créance de 6 000 $ figurant au bilan d'ouverture.",
    lignes: [L("521", usd(6000), 0, BANQUE), L("4111", 0, usd(6000), { r: "411" })], expl: "6 000 $ × 2 000 = 12 000 000 FC (le corrigé initial portait 13 920 000 FC)." },
  { date: "12/07/2021", enonce: "Paiement par banque d'une facture de 1 000 $ TTC pour la formation des hôtesses.",
    lignes: [L("633", V.form.ht, 0, { r: "633", alt: ["63"] }), L("4454", V.form.tva, 0, { r: "445" }), L("521", 0, usd(1000), BANQUE)],
    expl: `Frais de formation du personnel (633) : 2 000 000 FC TTC payés par banque, donc TVA déductible : HT ${V.form.ht.toLocaleString("fr-FR")} et TVA ${V.form.tva.toLocaleString("fr-FR")}.` },
  { date: "21/07/2021", enonce: "Dans le cadre de sa communication, la société décaisse en espèces 1 000 $ pour financer la construction de la route qui mène à ses installations.",
    lignes: [L("6582", usd(1000), 0, { r: "658", alt: ["65", "6588"] }), L("5711", 0, usd(1000), CAISSE)],
    expl: "La route n'appartient pas à ZAO : ce n'est pas une immobilisation. C'est une contribution assimilable à un don (6582). Sa déductibilité pour l'IBP est à examiner au regard des règles sur les libéralités." },
  { date: "09/08/2021", enonce: "Réparation par AFROMOSIA d'un lit cassé dans la chambre 10 : facture de 500 $ TTC, payable dans deux semaines.",
    lignes: [L("6242", V.lit.ht, 0, { r: "624" }), L("4454", V.lit.tva, 0, { r: "445" }), L("4011", 0, usd(500), { r: "401" })],
    expl: `1 000 000 FC TTC à crédit : HT ${V.lit.ht.toLocaleString("fr-FR")} et TVA ${V.lit.tva.toLocaleString("fr-FR")}. Le paiement à venir n'est pas encore comptabilisé.` },
  { date: "10/08/2021", enonce: "Pour régler la facture SNEL de juillet (1 000 $ TTC), le responsable de la société avance l'argent de ses fonds propres et paie en espèces.",
    lignes: [L("6052", usd(1000), 0, { r: "605" }), L("4711", 0, usd(1000), { r: "47", alt: ["462", "46"] })],
    expl: "La société doit 2 000 000 FC à son responsable (4711, ou 462 s'il est associé). La facture d'au moins 1 000 000 FC ayant été payée en espèces, sa TVA n'est pas déductible (art. 59 bis) : la charge d'électricité (6052) est enregistrée TTC." },
  { date: "12/08/2021", enonce: "La société rembourse en espèces les 1 000 $ du responsable et paie en espèces la facture REGIDESO de juillet : 120 $ TTC.",
    lignes: [L("4711", usd(1000), 0, { r: "47", alt: ["462", "46"] }), L("6051", V.regi.ht, 0, { r: "605" }), L("4454", V.regi.tva, 0, { r: "445" }), L("5711", 0, usd(1120), CAISSE)],
    expl: `Remboursement : 2 000 000 FC. Eau (6051) : 240 000 FC TTC (et non 2 400 000), payés en espèces mais sous le seuil de 1 000 000 FC : TVA déductible, HT ${V.regi.ht.toLocaleString("fr-FR")} et TVA ${V.regi.tva.toLocaleString("fr-FR")}.` },
  { date: "05/10/2021", enonce: "Un incendie touche un appartement loué (un blessé, dégâts matériels). L'assureur SFA verse par banque une indemnité de 2 550 $ couvrant tout le sinistre.",
    lignes: [L("521", usd(2550), 0, BANQUE), L("7582", 0, usd(2550), { r: "758", alt: ["75", "84"] })],
    expl: "Indemnité d'assurance reçue : 5 100 000 FC en produit (7582). Si les biens détruits avaient une valeur comptable connue, on les sortirait de l'actif ; l'énoncé ne la donne pas." },
  { date: "11/11/2021", enonce: `Émission de 7 factures de loyers et nuitées (montants TTC, 1 $ = 2 000 FC) : ${FACTURES_NOV.map(f => `${f.n} ${f.client}, ${f.objet}, ${f.ttcUsd.toLocaleString("fr-FR")} $`).join(" ; ")}.`,
    lignes: [L("4111", nov.ttc, 0, { r: "411" }), L("706", 0, nov.ht, { r: "706" }), L("4431", 0, nov.tva, { r: "443" })],
    expl: `Total TTC ${nov.ttc.toLocaleString("fr-FR")} FC, soit HT ${nov.ht.toLocaleString("fr-FR")} et TVA ${nov.tva.toLocaleString("fr-FR")} (facture par facture : TTC × 16/116). Les loyers de décembre sont des produits de 2021. En TVA, pour une location, la taxe est exigible à chaque échéance : celle des loyers de décembre se déclare en décembre. LEDYA : 21 235 $ × 2 000 = 42 470 000 FC (l'énoncé indique 42 427 000).`,
    aide: "Calculez la TVA facture par facture, puis additionnez." },
  { date: "15/11/2021", enonce: "VLISCO, AFRIMA et CMA règlent leurs factures en totalité via Rawbank. TRACTAFRIC verse une avance de 33 % du montant facturé via TMB (OP 3402352).",
    lignes: [L("521", regles15 + tractAvance, 0, BANQUE), L("4111", 0, regles15 + tractAvance, { r: "411" })],
    expl: `Règlements complets : ${regles15.toLocaleString("fr-FR")} FC ; TRACTAFRIC : 33 % × 100 000 000 = ${tractAvance.toLocaleString("fr-FR")} FC. Le corrigé initial inversait le sens de deux règlements (AFRIMA et CMA).` },
  // ── Opérations d'inventaire au 31/12/2021 ──
  { date: "31/12/2021", inventaire: true, enonce: "Inventaire de caisse : 100 $ de billets impropres à la circulation (échangeables auprès de la BCC) et 200 $ de faux billets.",
    lignes: [L("6588", usd(200), 0, { r: "658", alt: ["65", "83"] }), L("4711", usd(100), 0, { r: "47", alt: ["58"] }), L("5711", 0, usd(300), CAISSE)],
    expl: "Les faux billets sont une perte définitive : 400 000 FC en charge (6588). Les billets impropres gardent leur valeur : on les sort de la caisse vers un compte d'attente (4711) jusqu'à leur échange, pour 200 000 FC." },
  { date: "31/12/2021", inventaire: true, enonce: "Sur avis de l'avocat, une provision de 2 500 $ est constituée pour le litige, vieux de deux ans, qui oppose ZAO à un ancien employé.",
    lignes: [L("6911", usd(2500), 0, { r: "691", alt: ["69"] }), L("1911", 0, usd(2500), { r: "191", alt: ["19"] })],
    expl: "Provision pour litige : 5 000 000 FC (D 6911 / C 1911). Elle n'est pas déductible pour l'IBP (art. 46-6°) : elle sera réintégrée." },
  { date: "31/12/2021", inventaire: true, enonce: "Au 31/12/2021, 1 $ = 2 350 FC. Actualisez l'emprunt Rawbank de 100 000 $ et couvrez la perte latente ; constatez les intérêts courus depuis le 15/06 (6,5 % l'an, 6,5 mois).",
    lignes: [L("4784", ecartEmprunt, 0, { r: "478" }), L("1621", 0, ecartEmprunt, { r: "162", alt: ["16"] }), L("6971", ecartEmprunt, 0, { r: "697" }), L("194", 0, ecartEmprunt, { r: "194", alt: ["19"] }),
      L("6712", interets, 0, { r: "671", alt: ["67"] }), L("1662", 0, interets, { r: "166" })],
    expl: `Dette : 100 000 $ × (2 350 − 2 000) = ${ecartEmprunt.toLocaleString("fr-FR")} FC de perte latente : écart de conversion actif (D 4784 / C 1621) couvert par une provision pour perte de change (D 6971 / C 194). Intérêts courus : 100 000 × 6,5 % × 6,5/12 = 3 520,83 $ × 2 350 = ${interets.toLocaleString("fr-FR")} FC (D 6712 / C 1662).`,
    aide: "Deux sujets : le change de l'emprunt, puis les intérêts." },
  { date: "31/12/2021", inventaire: true, enonce: "Régularisations : assurance des véhicules payée le 28/06 pour un an (6 mois concernent 2022) ; amortissement des deux Mazda en 5 ans depuis le 23/06 (187 jours sur 360).",
    lignes: [L("476", usd(750), 0, { r: "476" }), L("625", 0, usd(750), { r: "625" }), L("6813", dotMazda, 0, { r: "681" }), L("2845", 0, dotMazda, { r: "284" })],
    expl: `Charge constatée d'avance : 3 000 000 × 6/12 = 1 500 000 FC (D 476 / C 625). Dotation Mazda sur le coût TTC : 88 160 000 × 20 % × 187/360 = ${dotMazda.toLocaleString("fr-FR")} FC.` },
];

export const OPERATIONS = OPS.map((o, i) => ({ ...o, n: i + 1 }));

// La liquidation de la TVA (centralisation au 31/12, hypothèse H9) et l'IBP sont calculés par le moteur (moteur.js).
export const HYPOTHESES = [
  "H1 — Tenue en francs congolais : toutes les opérations de 2021 au taux de 2 000 FC pour 1 $ ; le taux de clôture (2 350) ne s'applique qu'à l'emprunt en dollars, les autres soldes étant en francs.",
  "H2 — Les montants des factures sont TTC, sauf les véhicules Mazda (19 000 $ HT) : TVA = TTC × 16/116, arrondie au franc.",
  "H3 — Bilan d'ouverture conservé et reclassé : provision pour risques (4990, 567 400 000) passée de l'actif au passif (499) ; clients détaillés en Congo Futur (déc. 2020 : 9 000 000), ENGEN (12 000 000) et Trace Congo, douteux et déprécié à 100 % (16 700 000) ; montants arrondis au franc. Le résultat 2020 (131) est le solde d'équilibre.",
  "H4 — Une seule banque comptable 521 (Rawbank, BCDC, TMB) et la caisse principale 5711.",
  "H5 — Emprunt Rawbank sur 5 ans (tableau de l'énoncé), intérêts à 6,5 % l'an non encore payés au 31/12.",
  "H6 — Marché COGECO (220 000 $) : seuls les acomptes versés sont comptabilisés (252), hors taxe avec TVA récupérable sur immobilisation.",
  "H7 — Factures du 11/11 : 7 factures (et non 10), montants en FC = USD × 2 000 (LEDYA 42 470 000). Assureur : SFA ; indemnité encaissée par banque.",
  "H8 — Amortissements : véhicules en 5 ans, année de 360 jours ; l'énoncé ne fournissant pas de plan pour les autres immobilisations, seules les dotations liées aux opérations décrites sont passées.",
  "H9 — TVA liquidée en une écriture de centralisation au 31/12 (dans la réalité, une déclaration par mois).",
  "H10 — Affectation du résultat 2020 par l'assemblée du 30/06/2021 : 10 % en réserve légale, le solde en report à nouveau. IBP 2021 : le plus élevé de 30 % du résultat fiscal et de 1 % du chiffre d'affaires, provisions réintégrées.",
];
