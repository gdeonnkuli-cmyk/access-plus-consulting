// ── GUIDE : RÈGLES DE MONTAGE ET FONCTIONNEMENT DES COMPTES (SYSCOHADA révisé) ─────
// Aide pédagogique de l'atelier. Le fonctionnement des comptes résume le Plan comptable
// général OHADA (contenu et fonctionnement des comptes) ; il ne remplace pas l'Acte uniforme.
import { mapCompte, LIB, num, fmt } from "./engine";

// sens : "D" solde normalement débiteur, "C" créditeur, "V" variable
// etat : "A" actif, "P" passif, "A-" en déduction de l'actif, "CR-" charge, "CR+" produit
export const COMPTES = {
  // Classe 1 — Comptes de ressources durables
  "10": { l: "Capital", sens: "C", etat: "P", d: "Réductions de capital, amortissement du capital.", c: "Capital souscrit lors de la constitution et des augmentations (apports en numéraire ou en nature, incorporation de réserves).", r: "Le capital non appelé (109) vient en déduction (poste CB)." },
  "109": { l: "Apporteurs, capital souscrit non appelé", sens: "D", etat: "P", d: "Partie du capital souscrite mais non encore appelée.", c: "Appels de fonds (virement au 4613 / 467).", r: "Figure au passif en négatif (CB)." },
  "11": { l: "Réserves", sens: "C", etat: "P", d: "Utilisation des réserves (incorporation au capital, distribution, imputation de pertes).", c: "Affectation du résultat décidée par l'assemblée générale (réserve légale, statutaire, libre).", r: "La réserve légale est obligatoire dans les sociétés commerciales (AUSCGIE) jusqu'au plafond légal." },
  "12": { l: "Report à nouveau", sens: "V", etat: "P", d: "121 : affectation ; 129 : report à nouveau débiteur (pertes antérieures non apurées).", c: "121 : bénéfice laissé en report à nouveau.", r: "Toujours au passif (poste CH), en positif ou en négatif." },
  "13": { l: "Résultat net de l'exercice", sens: "V", etat: "P", d: "139 : perte de l'exercice ; affectation du bénéfice l'année suivante.", c: "131 : bénéfice de l'exercice (solde des classes 6, 7 et 8).", r: "Toujours au passif (poste CJ). Dans une balance avant clôture, les comptes de gestion tiennent lieu de résultat : ne pas compter les deux." },
  "14": { l: "Subventions d'investissement", sens: "C", etat: "P", d: "Quote-part virée au compte de résultat (799) au rythme de l'amortissement du bien financé.", c: "Subventions d'équipement reçues ou acquises.", r: "La quote-part virée au résultat est un produit sans encaissement : elle est neutralisée dans la CAFG." },
  "15": { l: "Provisions réglementées et fonds assimilés", sens: "C", etat: "P", d: "Reprises (861…).", c: "Dotations HAO (851…) : amortissements dérogatoires, provision spéciale de réévaluation (154)…", r: "Ce sont des capitaux propres (poste CM), non des dettes." },
  "16": { l: "Emprunts et dettes assimilées", sens: "C", etat: "P", d: "Remboursements du capital emprunté.", c: "Emprunts obtenus, dépôts et cautionnements reçus (165), intérêts courus (166).", r: "Les intérêts courus (166) sont exclus du flux de financement du TFT." },
  "17": { l: "Dettes de location-acquisition", sens: "C", etat: "P", d: "Part en capital des redevances payées.", c: "Valeur du bien pris en location-acquisition (contrepartie : immobilisation).", r: "La conclusion du contrat n'est pas un flux de trésorerie ; seuls les remboursements le sont." },
  "18": { l: "Dettes liées à des participations et comptes de liaison", sens: "V", etat: "P", d: "Remboursements ; mouvements de liaison.", c: "Dettes envers des entités liées ; comptes de liaison des établissements et succursales.", r: "Les comptes de liaison (185 à 188) doivent se solder au niveau de l'entité ; à défaut, ils sont classés selon leur sens." },
  "19": { l: "Provisions pour risques et charges", sens: "C", etat: "P", d: "Reprises (791, 797, 861) lorsque le risque disparaît ou se réalise.", c: "Dotations (691, 697, 851) pour litiges, garanties, pertes de change, pensions (196)…", r: "Risques à plus d'un an (poste DC) ; les risques à court terme vont en 499 / 599." },
  // Classe 2 — Actif immobilisé
  "21": { l: "Immobilisations incorporelles", sens: "D", etat: "A", d: "Coût d'acquisition ou de production (frais de développement, logiciels, brevets, fonds commercial…).", c: "Sorties d'actif (cessions, mises au rebut) pour la valeur brute.", r: "Amorties via 281 ; dépréciées via 291." },
  "22": { l: "Terrains", sens: "D", etat: "A", d: "Coût d'acquisition des terrains et aménagements de terrains.", c: "Cessions pour la valeur brute.", r: "Les terrains ne s'amortissent pas, sauf gisements et aménagements." },
  "23": { l: "Bâtiments, installations techniques et agencements", sens: "D", etat: "A", d: "Coût des constructions, installations et agencements.", c: "Cessions, mises au rebut.", r: "Approche par composants recommandée par le SYSCOHADA révisé." },
  "24": { l: "Matériel, mobilier et actifs biologiques", sens: "D", etat: "A", d: "Coût du matériel industriel, de bureau, informatique, du mobilier, du matériel de transport (245).", c: "Cessions, mises au rebut.", r: "Le matériel de transport (245) a son propre poste (AN)." },
  "25": { l: "Avances et acomptes versés sur immobilisations", sens: "D", etat: "A", d: "Avances versées aux fournisseurs d'immobilisations.", c: "Imputation sur le prix lors de la réception du bien (virement au compte d'immobilisation).", r: "Ce virement est un mouvement interne, sans flux de trésorerie." },
  "26": { l: "Titres de participation", sens: "D", etat: "A", d: "Coût d'acquisition des titres détenus durablement.", c: "Cessions pour la valeur d'entrée.", r: "Dépréciés via 296." },
  "27": { l: "Autres immobilisations financières", sens: "D", etat: "A", d: "Prêts accordés, prêts au personnel, dépôts et cautionnements versés (275).", c: "Remboursements reçus, restitution des dépôts.", r: "Les remboursements reçus sont des encaissements d'investissement (FJ)." },
  "28": { l: "Amortissements des immobilisations", sens: "C", etat: "A-", d: "Amortissements des éléments cédés ou mis au rebut.", c: "Dotations de l'exercice (681, 852).", r: "En déduction de l'actif, colonne « Amortissements / Dépréciations » : jamais au passif." },
  "29": { l: "Dépréciations des immobilisations", sens: "C", etat: "A-", d: "Reprises (791, 797, 862).", c: "Dotations (691, 697, 853).", r: "En déduction de l'actif." },
  // Classe 3 — Stocks
  "3": { l: "Stocks et encours", sens: "D", etat: "A", d: "Stock final constaté à l'inventaire (contrepartie : variation de stocks 603 ou 73).", c: "Annulation du stock initial (contrepartie : 603 ou 73).", r: "Inventaire intermittent : le compte de stock ne bouge qu'à la clôture. Un stock ne peut pas être créditeur." },
  "39": { l: "Dépréciations des stocks", sens: "C", etat: "A-", d: "Reprises (759).", c: "Dotations (659).", r: "En déduction des stocks (poste BB)." },
  // Classe 4 — Tiers
  "40": { l: "Fournisseurs et comptes rattachés", sens: "C", etat: "P", d: "Règlements, avoirs reçus, effets remis.", c: "Factures d'achats de biens et services.", r: "Un fournisseur débiteur (hors 409) révèle souvent un double paiement ou un avoir non imputé : il passe en BH." },
  "404": { l: "Fournisseurs, acquisitions courantes d'immobilisations", sens: "C", etat: "P", d: "Règlements.", c: "Factures d'immobilisations courantes.", r: "Exclu du BFR dans le TFT : il est rattaché aux investissements." },
  "409": { l: "Fournisseurs débiteurs (avances et acomptes versés)", sens: "D", etat: "A", d: "Avances et acomptes versés sur commandes, emballages à rendre, RRR à obtenir.", c: "Imputation sur les factures.", r: "Poste BH de l'actif." },
  "41": { l: "Clients et comptes rattachés", sens: "D", etat: "A", d: "Factures de ventes TTC.", c: "Encaissements, avoirs accordés, effets reçus.", r: "Les créances douteuses sont isolées en 416 et dépréciées en 491." },
  "414": { l: "Créances sur cessions courantes d'immobilisations", sens: "D", etat: "A", d: "Prix de cession non encore encaissé.", c: "Encaissement.", r: "Exclu du BFR dans le TFT, rattaché aux encaissements sur cessions." },
  "419": { l: "Clients créditeurs (avances et acomptes reçus)", sens: "C", etat: "P", d: "Imputation sur les factures.", c: "Avances et acomptes reçus des clients, RRR à accorder.", r: "Poste DI du passif." },
  "42": { l: "Personnel", sens: "V", etat: "P", d: "Paiement des salaires, avances et acomptes au personnel (421).", c: "Rémunérations dues (422), congés à payer (428).", r: "Solde normalement créditeur ; un solde débiteur correspond à des avances au personnel (poste BJ)." },
  "43": { l: "Organismes sociaux", sens: "C", etat: "P", d: "Versements aux organismes.", c: "Cotisations dues : CNSS, INPP, ONEM pour la RDC, mutuelles.", r: "Rapprocher des déclarations sociales mensuelles." },
  "44": { l: "État et collectivités publiques", sens: "V", etat: "P", d: "TVA récupérable (445), crédits d'impôt, versements à l'État.", c: "IBP dû (441), TVA facturée (443), impôts retenus à la source (447 : IPR…), autres impôts (442).", r: "Les créances (TVA déductible, crédit de TVA) vont à l'actif (BJ), les dettes au passif (DK)." },
  "45": { l: "Organismes internationaux", sens: "V", etat: "P", d: "Subventions ou fonds à recevoir.", c: "Avances reçues.", r: "" },
  "46": { l: "Apporteurs, associés et groupe", sens: "V", etat: "P", d: "Capital appelé non versé (4613 / 467), prélèvements, avances aux associés.", c: "Comptes courants d'associés (462), dividendes à payer (465).", r: "Les dividendes décaissés sont lus sur le 465 dans le TFT (poste FN)." },
  "47": { l: "Débiteurs et créditeurs divers", sens: "V", etat: "P", d: "Charges constatées d'avance (476), écarts de conversion-actif (478).", c: "Produits constatés d'avance (477), écarts de conversion-passif (479), versements restant à effectuer sur titres (472).", r: "Les écarts de conversion sont présentés au pied du Bilan (BU, DV), hors actif et passif circulants." },
  "476": { l: "Charges constatées d'avance", sens: "D", etat: "A", d: "Charges de l'exercice suivant déjà comptabilisées (loyer, assurance payés d'avance).", c: "Reprise à l'ouverture de l'exercice suivant.", r: "Application du principe d'indépendance des exercices." },
  "477": { l: "Produits constatés d'avance", sens: "C", etat: "P", d: "Reprise à l'ouverture de l'exercice suivant.", c: "Produits facturés concernant l'exercice suivant.", r: "Principe d'indépendance des exercices." },
  "478": { l: "Écarts de conversion-Actif", sens: "D", etat: "A", d: "Pertes latentes de change à la clôture (créances en baisse ou dettes en hausse).", c: "Contre-passation à l'ouverture.", r: "Contrepartie d'une provision pour perte de change (194 ou 499). Poste BU." },
  "479": { l: "Écarts de conversion-Passif", sens: "C", etat: "P", d: "Contre-passation à l'ouverture.", c: "Gains latents de change (créances en hausse ou dettes en baisse).", r: "Gains latents : non comptabilisés en produits (prudence). Poste DV." },
  "48": { l: "Créances et dettes hors activités ordinaires", sens: "V", etat: "P", d: "Créances sur cessions d'immobilisations (485), autres créances HAO.", c: "Fournisseurs d'investissements (481, 482), autres dettes HAO.", r: "481 / 482 / 485 sont traités dans les flux d'investissement du TFT." },
  "49": { l: "Dépréciations et provisions pour risques à court terme (tiers)", sens: "C", etat: "A-", d: "Reprises (759).", c: "Dotations (659) : clients douteux (491), autres créances ; 499 : risques à court terme.", r: "491 vient en déduction des clients ; 499 est une dette (DN)." },
  // Classe 5 — Trésorerie
  "50": { l: "Titres de placement", sens: "D", etat: "A", d: "Coût d'acquisition des titres acquis pour être cédés à court terme.", c: "Cessions.", r: "Dépréciés via 590." },
  "51": { l: "Valeurs à encaisser", sens: "D", etat: "A", d: "Effets et chèques remis à l'encaissement.", c: "Encaissement effectif.", r: "" },
  "52": { l: "Banques", sens: "V", etat: "A", d: "Versements, encaissements, virements reçus.", c: "Paiements par chèque, virement, prélèvement.", r: "Un solde créditeur est un découvert : il passe en trésorerie-passif (DR). Le rapprochement bancaire est obligatoire à la clôture." },
  "55": { l: "Instruments de monnaie électronique", sens: "D", etat: "A", d: "Approvisionnements du porte-monnaie électronique (M-Pesa, Airtel Money, Orange Money…).", c: "Paiements et retraits.", r: "Un solde créditeur est impossible." },
  "56": { l: "Banques, crédits de trésorerie et d'escompte", sens: "C", etat: "P", d: "Remboursements.", c: "Crédits de trésorerie, escompte (564, 565).", r: "Trésorerie-passif (DQ, DR)." },
  "57": { l: "Caisse", sens: "D", etat: "A", d: "Encaissements en espèces.", c: "Décaissements en espèces.", r: "La caisse ne peut jamais être créditrice : un solde créditeur révèle une erreur ou une omission d'enregistrement." },
  "58": { l: "Régies d'avances, accréditifs et virements internes", sens: "V", etat: "A", d: "Fonds remis aux régisseurs ; virements de fonds émis (585).", c: "Justification des dépenses ; virements reçus.", r: "Le compte 585 « Virements de fonds » doit être soldé à la clôture." },
  "59": { l: "Dépréciations et provisions pour risques à court terme (trésorerie)", sens: "C", etat: "A-", d: "Reprises (779).", c: "Dotations (679).", r: "590 : titres de placement ; 599 : risques financiers à court terme (DN)." },
  // Classe 6 — Charges des activités ordinaires
  "60": { l: "Achats et variations de stocks", sens: "D", etat: "CR-", d: "Achats hors taxes récupérables (601 marchandises, 602 matières, 604 à 608 autres achats) ; 603 : déstockage.", c: "RRR obtenus (6019…) ; 603 : stockage (stock final supérieur au stock initial).", r: "603 a un solde variable : débiteur en cas de déstockage, créditeur en cas de stockage (postes RB, RD, RF)." },
  "603": { l: "Variations des stocks de biens achetés", sens: "V", etat: "CR-", d: "Stock initial (annulation).", c: "Stock final.", r: "Variation = stock initial − stock final. Elle corrige les achats pour obtenir la consommation." },
  "61": { l: "Transports", sens: "D", etat: "CR-", d: "Transports sur ventes, du personnel, de plis, voyages et déplacements.", c: "Rabais obtenus.", r: "Les transports sur achats sont des frais accessoires d'achat (6015…)." },
  "62": { l: "Services extérieurs A", sens: "D", etat: "CR-", d: "Sous-traitance, locations, entretien, assurances, études, publicité, télécommunications.", c: "Rabais obtenus.", r: "Poste RH avec le 63." },
  "63": { l: "Services extérieurs B", sens: "D", etat: "CR-", d: "Frais bancaires, honoraires, formation, redevances, cotisations, personnel extérieur (637).", c: "Rabais obtenus.", r: "Poste RH avec le 62." },
  "64": { l: "Impôts et taxes", sens: "D", etat: "CR-", d: "Impôts et taxes à la charge de l'entité, hors IBP (impôt foncier, vignettes, droits d'enregistrement, pénalités fiscales 647).", c: "Dégrèvements.", r: "L'IBP n'est pas ici : il va en 89. Les amendes et pénalités (647) ne sont pas déductibles fiscalement." },
  "65": { l: "Autres charges", sens: "D", etat: "CR-", d: "Pertes sur créances irrécouvrables, valeur comptable des cessions courantes (654), dons, charges pour dépréciations à court terme (659).", c: "", r: "Poste RJ." },
  "66": { l: "Charges de personnel", sens: "D", etat: "CR-", d: "Salaires bruts (661, 662), indemnités (663), charges sociales patronales (664 : CNSS, INPP, ONEM…), autres charges sociales (668).", c: "", r: "Poste RK. La masse salariale doit concorder avec les déclarations sociales et fiscales (IPR)." },
  "67": { l: "Frais financiers et charges assimilées", sens: "D", etat: "CR-", d: "Intérêts des emprunts (671), escomptes accordés, pertes de change financières (676).", c: "", r: "Poste RM." },
  "68": { l: "Dotations aux amortissements", sens: "D", etat: "CR-", d: "Dotations aux amortissements d'exploitation (681) et à caractère financier (687).", c: "", r: "Charge calculée, sans décaissement : ajoutée au résultat pour calculer la CAFG." },
  "69": { l: "Dotations aux provisions et aux dépréciations", sens: "D", etat: "CR-", d: "Dotations aux provisions pour risques (691), aux dépréciations des immobilisations et financières (697).", c: "", r: "Charge calculée : neutralisée dans la CAFG." },
  // Classe 7 — Produits des activités ordinaires
  "70": { l: "Ventes", sens: "C", etat: "CR+", d: "RRR accordés (7019…), retours.", c: "Ventes de marchandises (701), de produits fabriqués (702 à 704), travaux et services (705, 706), produits accessoires (707), hors taxes.", r: "Somme TA à TD = chiffre d'affaires (XB)." },
  "71": { l: "Subventions d'exploitation", sens: "C", etat: "CR+", d: "", c: "Subventions reçues pour compenser l'insuffisance de certains produits ou faire face à certaines charges.", r: "Poste TG." },
  "72": { l: "Production immobilisée", sens: "C", etat: "CR+", d: "", c: "Coût des immobilisations créées par l'entité pour elle-même.", r: "Contrepartie d'un débit en classe 2." },
  "73": { l: "Variations des stocks de biens et services produits", sens: "V", etat: "CR+", d: "Stock initial de produits (annulation).", c: "Stock final de produits.", r: "Production stockée (TE) : positive en cas de stockage, négative en cas de déstockage." },
  "75": { l: "Autres produits", sens: "C", etat: "CR+", d: "", c: "Redevances, revenus des immeubles hors exploitation, produits des cessions courantes d'immobilisations (754), gains de change commerciaux.", r: "Poste TH." },
  "77": { l: "Revenus financiers et produits assimilés", sens: "C", etat: "CR+", d: "", c: "Intérêts reçus, revenus de participations, escomptes obtenus (773), gains de change financiers.", r: "Poste TK." },
  "78": { l: "Transferts de charges", sens: "C", etat: "CR+", d: "", c: "781 : transferts de charges d'exploitation ; 787 : financières.", r: "Postes TI et TM : à justifier en note 12." },
  "79": { l: "Reprises de provisions, de dépréciations et autres", sens: "C", etat: "CR+", d: "", c: "Reprises d'exploitation (791), financières (797), d'amortissements (798), de subventions d'investissement (799).", r: "Produits calculés : déduits pour calculer la CAFG." },
  // Classe 8 — Autres charges et produits (HAO)
  "81": { l: "Valeurs comptables des cessions d'immobilisations", sens: "D", etat: "CR-", d: "Valeur nette comptable (brut − amortissements) des immobilisations cédées.", c: "", r: "Poste RO ; à rapprocher du 82 pour la plus ou moins-value (note 3D)." },
  "82": { l: "Produits des cessions d'immobilisations", sens: "C", etat: "CR+", d: "", c: "Prix de cession des immobilisations.", r: "Poste TN ; encaissement d'investissement dans le TFT (FI, FJ)." },
  "83": { l: "Charges hors activités ordinaires", sens: "D", etat: "CR-", d: "Charges exceptionnelles, dons et libéralités accordés, abandons de créances.", c: "", r: "Poste RP." },
  "84": { l: "Produits hors activités ordinaires", sens: "C", etat: "CR+", d: "", c: "Produits exceptionnels, dons et libéralités obtenus, abandons de créances obtenus.", r: "Poste TO." },
  "85": { l: "Dotations hors activités ordinaires", sens: "D", etat: "CR-", d: "Dotations aux provisions réglementées (851), amortissements et dépréciations HAO.", c: "", r: "Poste RP ; neutralisées dans la CAFG." },
  "86": { l: "Reprises de charges, provisions et dépréciations HAO", sens: "C", etat: "CR+", d: "", c: "Reprises de provisions réglementées et HAO.", r: "Poste TO ; neutralisées dans la CAFG." },
  "87": { l: "Participation des travailleurs", sens: "D", etat: "CR-", d: "Participation des salariés aux résultats.", c: "", r: "Poste RQ." },
  "88": { l: "Subventions d'équilibre", sens: "C", etat: "CR+", d: "", c: "Subventions destinées à compenser une perte globale.", r: "Poste TO." },
  "89": { l: "Impôts sur le résultat", sens: "D", etat: "CR-", d: "Impôt sur les bénéfices et profits (IBP) dû au titre de l'exercice (891).", c: "Dégrèvements, régularisations.", r: "Contrepartie : 441. En RDC, l'IBP est le plus élevé de l'impôt au taux légal et du minimum d'imposition." },
};

// Recherche du fonctionnement d'un compte (préfixe le plus long)
export function ficheCompte(compte) {
  const c = String(compte || "").replace(/\s/g, "");
  for (let n = Math.min(c.length, 3); n > 0; n--) { const f = COMPTES[c.slice(0, n)]; if (f) return { prefixe: c.slice(0, n), ...f }; }
  return null;
}
export const CLASSES = [
  ["1", "Comptes de ressources durables"], ["2", "Comptes d'actif immobilisé"], ["3", "Comptes de stocks"], ["4", "Comptes de tiers"],
  ["5", "Comptes de trésorerie"], ["6", "Comptes de charges des activités ordinaires"], ["7", "Comptes de produits des activités ordinaires"],
  ["8", "Comptes des autres charges et des autres produits (HAO)"],
];

// Comptes dont le solde est dans le sens anormal (N)
export function anomaliesSens(lignes = []) {
  const out = [];
  for (const x of lignes) {
    const f = ficheCompte(x.c);
    if (!f || f.sens === "V") continue;
    if (/^[67]\d{2}9/.test(String(x.c))) continue; // rabais, remises, ristournes (6019, 7019…) : sens inverse de leur classe
    const s = num(x.dn) - num(x.cn);
    if (Math.abs(s) < 0.5) continue;
    if ((f.sens === "D" && s < 0) || (f.sens === "C" && s > 0))
      out.push({ c: x.c, l: x.l || f.l, solde: s, attendu: f.sens === "D" ? "débiteur" : "créditeur", fiche: f });
  }
  return out;
}

// Rubrique d'un compte telle que le moteur la rattache
export function rubriqueDe(compte, solde = 0) {
  const m = mapCompte(compte);
  if (!m) return null;
  const r = typeof m.r === "object" ? (solde >= 0 ? m.r.d : m.r.c) : m.r;
  return { ref: r, lib: LIB[r], amort: m.amort, variable: typeof m.r === "object", alt: typeof m.r === "object" ? m.r : null };
}

// ── Règles de montage des états financiers ───────────────────────────────────────
export const REGLES = [
  { t: "Les états financiers annuels", p: [
    "Le SYSCOHADA révisé prescrit quatre états financiers formant un tout indissociable : le Bilan (postes AD à DZ), le Compte de résultat (postes TA à RS et XA à XI), le Tableau des flux de trésorerie (postes ZA à ZH) et les Notes annexes (art. 8 de l'Acte uniforme relatif au droit comptable et à l'information financière).",
    "Ils sont arrêtés au plus tard dans les quatre mois qui suivent la date de clôture de l'exercice (art. 23).",
    "Les Notes annexes sont un état financier à part entière, et non un appendice. Elles comportent une déclaration explicite de conformité au SYSCOHADA. Les notes non applicables ne sont pas jointes.",
    "Chaque état rappelle les montants de l'exercice précédent (N-1) pour permettre la comparaison.",
  ] },
  { t: "Avant le montage : la balance", p: [
    "Partir de la balance générale après inventaire : amortissements, dépréciations, provisions, variations de stocks, charges et produits constatés d'avance, écarts de conversion et IBP doivent être comptabilisés.",
    "Contrôler l'équilibre : total des débits = total des crédits, pour les soldes comme pour les mouvements.",
    "Intangibilité du bilan d'ouverture : les soldes d'ouverture de N doivent être égaux aux soldes de clôture de N-1. L'atelier le vérifie avec le contrôle « solde N-1 + mouvements = solde N ».",
    "Vérifier le sens des soldes : une caisse, un stock ou une immobilisation ne peuvent pas être créditeurs. Les comptes d'attente (471) et de virements internes (585) doivent être soldés.",
    "Effectuer le rapprochement bancaire et justifier les comptes de tiers (fournisseurs, clients, État, organismes sociaux).",
  ] },
  { t: "Règles de présentation du Bilan", p: [
    "L'actif présente les soldes débiteurs, le passif les soldes créditeurs, classés dans un ordre fonctionnel : actif immobilisé, actif circulant, trésorerie-actif ; capitaux propres, dettes financières, passif circulant, trésorerie-passif.",
    "Les amortissements (28) et les dépréciations (29, 39, 49, 59) figurent à l'actif, en déduction de la valeur brute, et non au passif.",
    "Le report à nouveau (12) et le résultat (13) figurent toujours au passif : en addition s'ils sont créditeurs, en soustraction s'ils sont débiteurs.",
    "Les comptes de tiers et de banque à solde variable sont classés selon leur sens. Exemple : une banque créditrice est un découvert (trésorerie-passif, DR) ; un fournisseur débiteur passe en BH.",
    "Les écarts de conversion (478, 479) sont présentés au pied du Bilan (BU, DV), hors masses circulantes, en raison de leur caractère probable.",
    "Non-compensation : on ne compense pas une créance et une dette, ni un actif et un passif, sauf disposition expresse.",
  ] },
  { t: "Règles de présentation du Compte de résultat", p: [
    "Le Compte de résultat est présenté en liste et fait apparaître en cascade les soldes significatifs : marge commerciale (XA), chiffre d'affaires (XB), valeur ajoutée (XC), EBE (XD), résultat d'exploitation (XE), résultat financier (XF), résultat des activités ordinaires (XG), résultat HAO (XH) et résultat net (XI).",
    "Chaque solde est affiché avec le signe + en cas d'excédent (solde créditeur) et le signe − en cas de déficit (solde débiteur).",
    "Les variations de stocks (603, 73) s'ajoutent en cas de déstockage et se retranchent en cas de stockage.",
    "Les opérations hors activités ordinaires (classe 8) sont isolées sous le résultat des activités ordinaires.",
  ] },
  { t: "Règles du Tableau des flux de trésorerie", p: [
    "Trois étapes : (1) déterminer la variation comptable des postes du bilan entre N et N-1 ; (2) en exclure les éléments sans caractère monétaire (amortissements, provisions, dépréciations, réévaluations) ; (3) corriger les décalages de trésorerie (créances et dettes).",
    "CAFG : résultat net + dotations − reprises + valeur comptable des cessions − produits des cessions. C'est une trésorerie potentielle, corrigée ensuite de la variation du BFR.",
    "Le BFR exclut les créances et dettes liées aux immobilisations (414, 485, 404, 481, 482), au capital (467) et aux titres non libérés (472). Il est corrigé des écarts de conversion.",
    "Acquisitions = variation des immobilisations nettes + dotations + valeur comptable des cessions − réévaluations (106, 154) ; décaissements = acquisitions − variation des dettes sur immobilisations.",
    "Contrôle final : la trésorerie au 31/12 (ZH) doit égaler la trésorerie-actif moins la trésorerie-passif du bilan N.",
  ] },
  { t: "Principes comptables à respecter", p: [
    "Prudence : les pertes probables sont provisionnées, les gains latents ne sont pas comptabilisés (écart de conversion-passif).",
    "Indépendance des exercices : rattacher à l'exercice les charges et produits qui le concernent, et seulement eux (476, 477, 408, 418, 428…).",
    "Permanence des méthodes : tout changement de méthode est justifié et son incidence décrite en note 38.",
    "Continuité d'exploitation : les états sont établis dans une perspective de poursuite de l'activité. Les événements qui la remettent en cause sont décrits en note 37.",
    "Coût historique, importance significative, prééminence de la réalité économique sur l'apparence juridique (exemple : location-acquisition inscrite à l'actif).",
  ] },
  { t: "Spécificités pour la RDC", p: [
    "Comptabilité tenue et états financiers présentés en francs congolais (CDF) ; les opérations en devises sont converties au cours de la Banque Centrale du Congo.",
    "L'IBP (impôt sur les bénéfices et profits) est comptabilisé en 891 / 441 : en cas de bénéfice, il est égal au taux légal (30 %) appliqué au résultat fiscal ; en cas de perte ou de résultat fiscal nul, l'entreprise doit le minimum d'imposition de 1 % du chiffre d'affaires. Le calcul figure dans l'onglet Fiscalité de l'atelier.",
    "Les états financiers sont joints à la déclaration fiscale déposée à la DGI (DGE, CDI ou CIS selon l'entité) ; vérifier les échéances du calendrier fiscal en vigueur.",
    "Les cotisations sociales (CNSS, INPP, ONEM) et l'IPR doivent concorder avec les charges de personnel et les dettes sociales et fiscales (notes 18 et 27).",
    "Les états sont établis ou visés par un professionnel inscrit au tableau de l'ONEC.",
  ] },
  { t: "Liste de contrôle avant soumission", p: [
    "Balance N et N-1 équilibrées, mouvements cohérents, aucun compte non rattaché.",
    "Bilan équilibré : total actif (BZ) = total passif (DZ).",
    "Résultat du Compte de résultat (XI) = poste CJ du Bilan.",
    "TFT : ZH = trésorerie nette du bilan.",
    "Notes annexes concordantes avec les postes (contrôles verts dans l'onglet Notes).",
    "IBP comptabilisé (89) = IBP dû (onglet Fiscalité).",
    "Fiche d'identification complète (RCCM, Id. Nat., NIF, signataire, professionnel ONEC).",
  ] },
];
export { fmt };
