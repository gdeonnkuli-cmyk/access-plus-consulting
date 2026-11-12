// ══════════════════ EXAMENS FINAUX DES PARCOURS ══════════════════
// Chaque parcours se termine par un examen (règles dans src/attest/regles.js : EXAMENS, coefficient 2) :
// - FISC et FIN : banque formée des QCM de tous les modules (m = module d'origine, affiché dans le corrigé) ;
// - SYS-N1 : banque dédiée aux fondamentaux du SYSCOHADA révisé (c = comptes cités, vérifiés dans le plan par les tests) ;
// - SYS-N2 : examen pratique « quelle écriture ? » construit à partir des écritures types du guide des comptes ;
// - SYCEBNL : banque dédiée (src/sycebnl/examen.js) ;
// - EDUF : banque formée des QCM des 8 modules d'éducation financière.
import { MODULES_FISC } from "../fiscal/modules";
import { MODULES_FIN } from "../finance/modules";
import { EXAMEN_SYC } from "../sycebnl/examen";
import { BANQUE_BQ } from "../banque/examen";
import { MODULES_EDUF } from "../eduf/modules";
import { enonce } from "../ef/syscohada/exercice";

const avecModule = mods => mods.flatMap(m => m.qcm.map(q => ({ ...q, m: m.id })));

export const BANQUE_SYS1 = [
  { m: "Cadre", q: "Le SYSCOHADA révisé s'applique aux comptes personnels des entités depuis le :", r: ["1er janvier 2018", "1er janvier 2024", "26 janvier 2017", "1er janvier 2001"], b: 0, e: "L'AUDCIF a été adopté le 26 janvier 2017 ; il s'applique aux comptes personnels depuis le 1er janvier 2018 (comptes consolidés : 1er janvier 2019)." },
  { m: "Cadre", q: "Les états financiers du système normal comprennent :", r: ["Bilan, compte de résultat, tableau des flux de trésorerie et notes annexes", "Bilan et compte de résultat seulement", "Balance et grand livre", "Bilan, budget et rapport de gestion"], b: 0, e: "Quatre documents indissociables : bilan, compte de résultat, TFT et notes annexes." },
  { m: "Cadre", q: "Le bilan d'ouverture d'un exercice doit correspondre au bilan de clôture de l'exercice précédent. C'est le principe :", r: ["D'intangibilité du bilan d'ouverture", "De prudence", "De permanence des méthodes", "D'importance significative"], b: 0, e: "Toute correction passe par les comptes de l'exercice, jamais par une modification du bilan d'ouverture." },
  { m: "Cadre", q: "Un bien utilisé en location-acquisition est inscrit à l'actif du preneur au nom du principe :", r: ["De prééminence de la réalité sur l'apparence", "De coût historique", "De prudence", "De spécialisation des exercices"], b: 0, e: "Le preneur contrôle le bien : il l'inscrit à l'actif et la dette en 17 Dettes de location-acquisition.", c: ["17"] },
  { m: "Cadre", q: "Le système minimal de trésorerie (SMT) est réservé :", r: ["Aux très petites entités dont le chiffre d'affaires ne dépasse pas les seuils fixés par l'AUDCIF", "À toutes les sociétés anonymes", "Aux entités à but non lucratif", "Aux filiales de groupes étrangers"], b: 0, e: "Le SMT est une comptabilité de trésorerie simplifiée pour les très petites entités." },
  { m: "Bases", q: "L'équation fondamentale du bilan :", r: ["Actif = capitaux propres + dettes", "Actif = charges + produits", "Capitaux propres = actif + dettes", "Résultat = actif − passif circulant"], b: 0, e: "Les emplois (actif) sont financés par les ressources (capitaux propres et dettes)." },
  { m: "Bases", q: "La balance permet avant tout de vérifier :", r: ["L'égalité du total des débits et des crédits", "Que chaque opération est autorisée", "La valeur de marché des immobilisations", "L'exactitude des taux de TVA"], b: 0, e: "Une balance équilibrée peut encore cacher une mauvaise imputation ou une omission." },
  { m: "Bases", q: "Produits de l'exercice 50 000 000 FC, charges 42 000 000 FC. Le résultat s'inscrit :", r: ["Au crédit du 131, pour 8 000 000 FC", "Au débit du 139, pour 8 000 000 FC", "Au crédit du 121, pour 8 000 000 FC", "Au crédit du 101, pour 8 000 000 FC"], b: 0, e: "Bénéfice de 8 000 000 FC : 131 Résultat net, bénéfice.", c: ["131", "139", "121", "101"] },
  { m: "Bases", q: "La classe 8 du SYSCOHADA révisé regroupe :", r: ["Les autres charges et autres produits (HAO, cessions, impôt sur le résultat)", "Les engagements hors bilan", "Les comptes de trésorerie", "Les stocks"], b: 0, e: "Classe 8 : 81/82 cessions, 83/84 HAO, 89 impôts sur le résultat, notamment.", c: ["81", "82", "83", "84"] },
  { m: "Bases", q: "Le compte 521 enregistre :", r: ["Les banques locales", "La caisse", "Les virements de fonds", "Les effets à recevoir"], b: 0, e: "521 Banques locales ; 571 Caisse ; 585 Virements de fonds.", c: ["521", "571", "585"] },
  { m: "Bases", q: "Un transfert d'espèces de la caisse vers la banque transite par le compte :", r: ["585 Virements de fonds", "471 Débiteurs et créditeurs divers", "521 Banques uniquement", "409 Fournisseurs débiteurs"], b: 0, e: "Le 585 est débité à la sortie et crédité à l'arrivée : il doit être soldé.", c: ["585"] },
  { m: "Bases", q: "Les soldes de mobile money de l'entité se suivent en :", r: ["55 Instruments de monnaie électronique", "571 Caisse", "521 Banques", "585 Virements de fonds"], b: 0, e: "Le compte 55, créé par la révision, se rapproche des relevés de l'opérateur.", c: ["55", "571", "521", "585"] },
  { m: "Achats et ventes", q: "Achat de marchandises à crédit : 1 000 000 FC HT, TVA 16 %. Montant crédité au fournisseur :", r: ["1 160 000 FC", "1 000 000 FC", "160 000 FC", "840 000 FC"], b: 0, e: "D 6011 : 1 000 000 ; D 4452 : 160 000 ; C 4011 : 1 160 000.", c: ["6011", "4452", "4011"] },
  { m: "Achats et ventes", q: "La TVA facturée sur une vente s'enregistre :", r: ["Au crédit du 4431", "Au débit du 4452", "Au crédit du 4441", "Au débit du 4431"], b: 0, e: "La TVA collectée est une dette envers l'État : C 4431 TVA facturée sur ventes.", c: ["4431", "4452", "4441"] },
  { m: "Achats et ventes", q: "La TVA récupérable sur l'achat d'un véhicule de livraison va au compte :", r: ["4451 TVA récupérable sur immobilisations", "4452 TVA récupérable sur achats", "4431 TVA facturée", "245 Matériel de transport"], b: 0, e: "La TVA sur immobilisations a son propre compte : 4451.", c: ["4451", "4452", "4431", "245"] },
  { m: "Achats et ventes", q: "TVA facturée 800 000 FC, TVA récupérable 500 000 FC. À la liquidation :", r: ["4441 TVA due : 300 000 FC au crédit", "4449 Crédit de TVA : 300 000 FC au débit", "4431 au crédit : 300 000 FC", "Aucune écriture"], b: 0, e: "D 4431 800 000 / C 4452 500 000, C 4441 300 000.", c: ["4441", "4449", "4431", "4452"] },
  { m: "Achats et ventes", q: "TVA récupérable supérieure à la TVA facturée : l'excédent va au compte :", r: ["4449 État, crédit de TVA à reporter", "4441 État, TVA due", "4431 TVA facturée", "441 État, impôt sur les bénéfices"], b: 0, e: "Le crédit est reporté sur les déclarations suivantes (ou remboursé selon les textes).", c: ["4449", "4441", "4431", "441"] },
  { m: "Achats et ventes", q: "Les frais de transport payés sur un achat de marchandises s'enregistrent en :", r: ["6015 Frais sur achats", "61 Transports sur ventes", "6011 Achats de marchandises, avec les marchandises", "24 Matériel"], b: 0, e: "Les frais accessoires d'achat ont leur sous-compte : 6015.", c: ["6015", "6011"] },
  { m: "Achats et ventes", q: "Un rabais obtenu hors facture d'un fournisseur :", r: ["Crédit du 6019 Rabais, remises et ristournes obtenus", "Débit du 6019", "Crédit du 7011", "Crédit du 773 Escomptes obtenus"], b: 0, e: "Les réductions commerciales obtenues hors facture diminuent les achats : C 6019.", c: ["6019", "7011", "773"] },
  { m: "Achats et ventes", q: "Un escompte de règlement accordé à un client est :", r: ["Une charge financière (673)", "Une réduction commerciale sur ventes (7011)", "Un produit financier (773)", "Une charge HAO (83)"], b: 0, e: "673 Escomptes accordés ; 773 Escomptes obtenus.", c: ["673", "773", "83"] },
  { m: "Tiers", q: "Une avance versée à un fournisseur avant livraison :", r: ["409 Fournisseurs débiteurs", "419 Clients créditeurs", "4011 au crédit", "476 Charges constatées d'avance"], b: 0, e: "C'est une créance sur le fournisseur : 409.", c: ["409", "419", "4011", "476"] },
  { m: "Tiers", q: "Une avance reçue d'un client avant livraison :", r: ["419 Clients créditeurs", "4111 au débit", "7011 Ventes", "477 Produits constatés d'avance"], b: 0, e: "C'est une dette envers le client tant que la vente n'est pas réalisée.", c: ["419", "4111", "7011", "477"] },
  { m: "Tiers", q: "Une facture d'électricité de décembre reçue en janvier s'enregistre à la clôture en :", r: ["408 Fournisseurs, factures non parvenues", "476 Charges constatées d'avance", "418 Clients, produits à recevoir", "4011 en janvier seulement"], b: 0, e: "La charge appartient à décembre : D 605 / C 408.", c: ["408", "476", "418", "605"] },
  { m: "Tiers", q: "Un client en difficulté : sa créance est d'abord reclassée en :", r: ["416 Créances clients litigieuses ou douteuses", "491 Dépréciations des comptes clients", "418 Clients, produits à recevoir", "412 Effets à recevoir"], b: 0, e: "Reclassement en 416, puis dépréciation (659 / 491).", c: ["416", "491", "418", "412"] },
  { m: "Tiers", q: "Dans le SYSCOHADA révisé, la dépréciation d'une créance client se constate :", r: ["D 6594 / C 491", "D 691 / C 491", "D 6813 / C 491", "D 491 / C 759"], b: 0, e: "Les dépréciations des créances à court terme passent par 659 (et leurs reprises par 759).", c: ["6594", "491", "691", "6813", "759"] },
  { m: "Tiers", q: "Les dividendes votés par l'assemblée et non encore payés :", r: ["465 Associés, dividendes à payer", "121 Report à nouveau créditeur", "131 Résultat net", "111 Réserve légale"], b: 0, e: "Après l'affectation, les dividendes sont une dette envers les associés.", c: ["465", "121", "131", "111"] },
  { m: "Personnel", q: "Salaires bruts du personnel national :", r: ["Débit du 661", "Crédit du 422", "Débit du 431", "Débit du 447"], b: 0, e: "661 au débit (brut) ; 422 net à payer, 431 et 447 retenues au crédit.", c: ["661", "422", "431", "447"] },
  { m: "Personnel", q: "L'impôt retenu sur les salaires, à reverser à l'État, figure au crédit du :", r: ["447 État, impôts retenus à la source", "441 État, impôt sur les bénéfices", "431 Sécurité sociale", "661 Rémunérations"], b: 0, e: "L'entreprise collecte l'impôt pour le compte de l'État.", c: ["447", "441", "431", "661"] },
  { m: "Immobilisations", q: "Véhicule de 24 000 000 FC, amortissable sur 5 ans en linéaire, mis en service le 1er juillet N. Dotation de N :", r: ["2 400 000 FC", "4 800 000 FC", "1 200 000 FC", "24 000 000 FC"], b: 0, e: "24 000 000 / 5 = 4 800 000 par an, × 6/12 = **2 400 000 FC**." },
  { m: "Immobilisations", q: "L'amortissement d'un véhicule s'enregistre :", r: ["D 6813 / C 2845", "D 2845 / C 6813", "D 245 / C 2845", "D 6813 / C 245"], b: 0, e: "Dotation aux amortissements des immobilisations corporelles / amortissements du matériel de transport.", c: ["6813", "2845", "245"] },
  { m: "Immobilisations", q: "Lors de la cession d'un matériel, la valeur nette comptable sortie va au débit du :", r: ["812 Valeurs comptables des cessions d'immobilisations corporelles", "822 Produits des cessions", "245 Matériel de transport", "6813 Dotations"], b: 0, e: "81 pour la VNC sortie ; 82 pour le prix de cession.", c: ["812", "822", "245", "6813"] },
  { m: "Immobilisations", q: "Le fournisseur d'un équipement acheté à crédit est crédité au compte :", r: ["481 Fournisseurs d'investissements", "4011 Fournisseurs", "402 Fournisseurs, effets à payer", "409 Fournisseurs débiteurs"], b: 0, e: "Fournisseurs d'immobilisations : 481 (4812 pour les immobilisations corporelles).", c: ["481", "4812", "4011", "402", "409"] },
  { m: "Immobilisations", q: "Dans le SYSCOHADA révisé, les frais d'établissement :", r: ["Sont comptabilisés en charges", "Sont immobilisés en compte 20", "Sont amortis sur 5 ans obligatoirement", "Sont portés en capitaux propres"], b: 0, e: "Le compte 20 (charges immobilisées) n'est pas repris par la révision." },
  { m: "Stocks", q: "Inventaire intermittent : stock initial de marchandises 2 000 000, stock final 2 500 000. Le 6031 :", r: ["Est créditeur de 500 000 FC (stockage)", "Est débiteur de 500 000 FC", "Est débiteur de 2 500 000 FC", "N'est pas mouvementé"], b: 0, e: "D 6031 / C 31 : 2 000 000 (annulation du SI) ; D 31 / C 6031 : 2 500 000 (SF). Solde créditeur 500 000.", c: ["6031"] },
  { m: "Stocks", q: "Achats de marchandises 10 000 000, stock initial 3 000 000, stock final 4 000 000. Coût d'achat des marchandises vendues :", r: ["9 000 000 FC", "11 000 000 FC", "10 000 000 FC", "17 000 000 FC"], b: 0, e: "Achats + SI − SF = 10 + 3 − 4 = **9 000 000 FC**." },
  { m: "Stocks", q: "Les achats de matières premières et leur variation de stocks :", r: ["602 et 6032", "601 et 6031", "605 et 6031", "73 et 602"], b: 0, e: "Matières premières : 602 Achats, 6032 Variations des stocks.", c: ["602", "6032", "6031", "605", "73"] },
  { m: "Stocks", q: "La variation des stocks de produits fabriqués figure en :", r: ["73 Variations des stocks de biens et services produits", "6031 Variations des stocks de marchandises", "602 Achats de matières", "71 Subventions d'exploitation"], b: 0, e: "La production stockée est un élément des produits (classe 7).", c: ["73", "6031", "602", "71"] },
  { m: "Clôture", q: "Un loyer payé en décembre pour janvier suivant :", r: ["Charge constatée d'avance : D 476 / C 622", "Produit constaté d'avance : 477", "Facture non parvenue : 408", "Charge de décembre, sans régularisation"], b: 0, e: "La part future est retirée des charges de l'exercice par le 476.", c: ["476", "477", "408", "622"] },
  { m: "Clôture", q: "Un abonnement encaissé d'avance par l'entreprise pour l'exercice suivant :", r: ["477 Produits constatés d'avance", "476 Charges constatées d'avance", "418 Clients, produits à recevoir", "419 Clients créditeurs à long terme"], b: 0, e: "Le produit n'est pas encore acquis : D 70 / C 477 à la clôture.", c: ["477", "476", "418", "419"] },
  { m: "Clôture", q: "Une prestation réalisée en décembre, facturée en janvier :", r: ["418 Clients, produits à recevoir", "477 Produits constatés d'avance", "408 Factures non parvenues", "4111 Clients en janvier seulement"], b: 0, e: "Le produit est acquis en décembre : D 418 / C 70.", c: ["418", "477", "408", "4111"] },
  { m: "Clôture", q: "Une provision pour un litige probable avec un ancien salarié :", r: ["D 6911 / C 19 Provisions pour risques et charges", "D 6594 / C 491", "D 19 / C 6911", "D 83 / C 19 toujours"], b: 0, e: "Dotation aux provisions d'exploitation pour risques et charges, contre le compte 19.", c: ["6911", "19", "6594", "491"] },
  { m: "Clôture", q: "L'impôt sur les bénéfices de l'exercice s'enregistre :", r: ["D 891 / C 441", "D 441 / C 891", "D 641 / C 441", "D 891 / C 521"], b: 0, e: "891 Impôts sur les bénéfices de l'exercice ; 441 État, impôt sur les bénéfices.", c: ["891", "441", "521"] },
  { m: "Clôture", q: "Les intérêts d'un emprunt bancaire sont une charge du compte :", r: ["671 Intérêts des emprunts", "631 Frais bancaires", "17 Dettes de location-acquisition", "773 Escomptes obtenus"], b: 0, e: "Les intérêts relèvent des frais financiers (67).", c: ["671", "17", "773"] },
  { m: "Capitaux propres", q: "La réserve légale se constitue au crédit du :", r: ["111 Réserve légale", "121 Report à nouveau créditeur", "101 Capital social", "131 Résultat net"], b: 0, e: "Dotée lors de l'affectation du résultat, selon l'Acte uniforme sur les sociétés commerciales.", c: ["111", "121", "101", "131"] },
  { m: "Capitaux propres", q: "Une perte non encore apurée, reportée sur les exercices suivants :", r: ["129 Report à nouveau débiteur", "121 Report à nouveau créditeur", "139 Résultat net : perte, sans limite de durée", "111 Réserve légale"], b: 0, e: "Après affectation, la perte passe de 139 à 129.", c: ["129", "121", "139", "111"] },
  { m: "Capitaux propres", q: "Le capital souscrit, appelé et versé figure en :", r: ["1013", "1011", "1012", "101 et 4011"], b: 0, e: "1011 non appelé ; 1012 appelé non versé ; 1013 appelé, versé, non amorti.", c: ["1013", "1011", "1012"] },
];

// ── SYS-N2 : examen pratique tiré des écritures types du guide (une seule écriture par opération)
// Propositions : la bonne écriture, la même inversée (débit ↔ crédit) et deux écritures d'autres opérations.
// Construction déterministe (même banque d'une visite à l'autre : le tirage mémorise les indices).
const libCompte = (n, titre) => `${n} ${titre(n)}`.trim();
export function construireBanqueSys2(complements, titre = () => "") {
  const ops = [];
  for (const [c, x] of Object.entries(complements || {})) for (const e of (x.ecr || [])) {
    if (!e.l || e.l.length !== 1) continue;
    const [D, C] = e.l[0];
    ops.push({ c, e, D, C, txt: `Débit ${D.map(n => libCompte(n, titre)).join(", ")} — Crédit ${C.map(n => libCompte(n, titre)).join(", ")}`,
      inv: `Débit ${C.map(n => libCompte(n, titre)).join(", ")} — Crédit ${D.map(n => libCompte(n, titre)).join(", ")}` });
  }
  const vus = new Set();
  const uniques = ops.filter(o => { const k = enonce(o.e); if (vus.has(k)) return false; vus.add(k); return true; });
  return uniques.map((o, i) => {
    const autres = [];
    for (let k = 1; autres.length < 2 && k < uniques.length; k++) {
      const a = uniques[(i + k * 37) % uniques.length];
      if (a.txt !== o.txt && a.txt !== o.inv && !autres.includes(a.txt)) autres.push(a.txt);
    }
    const r = [o.txt, o.inv === o.txt ? `Débit ${o.D.map(n => libCompte(n, titre)).join(", ")} — Crédit 4711 Débiteurs divers` : o.inv, ...autres];
    return { q: `Quelle écriture pour : ${enonce(o.e)} ?`, r, b: 0, m: `Classe ${o.c[0]}`,
      e: `Écriture type du compte ${o.c}${titre(o.c) ? ` (${titre(o.c)})` : ""}.${o.e.n ? ` ${o.e.n}` : ""}` };
  }).filter(q => new Set(q.r).size === 4);
}
let sys2P = null;
export const chargerBanqueSys2 = () => sys2P || (sys2P = Promise.all([import("../ef/syscohada/complements.json"), import("../ef/syscohada/plan.json")])
  .then(([c, p]) => { const plan = new Map(p.default || p); const t = n => String(plan.get(n) || "").replace(/\s*\(\d\)/g, "");
    const minus = s => (s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s);
    return construireBanqueSys2(c.default || c, n => minus(t(n))); }));

// Examen d'un parcours : { titre, col, charger() → banque (tableau ou promesse) }
export const EXAMENS_FINAUX = {
  "SYS-N1": { titre: "Examen final SYSCOHADA — Niveau 1 : fondamentaux", col: "#0A2A5C", charger: () => BANQUE_SYS1 },
  FISC: { titre: "Examen final — Fiscalité congolaise", col: "#A3122A", charger: () => avecModule(MODULES_FISC) },
  "SYS-N2": { titre: "Examen final SYSCOHADA — Niveau 2 : passer les écritures", col: "#1D4ED8", charger: chargerBanqueSys2 },
  FIN: { titre: "Examen final — Finance d'entreprise", col: "#B7791F", charger: () => avecModule(MODULES_FIN) },
  BANQUE: { titre: "Examen final — Comptabilité bancaire (GCEC)", col: "#0A2A5C", charger: () => BANQUE_BQ },
  SYCEBNL: { titre: EXAMEN_SYC.titre, col: EXAMEN_SYC.col, charger: () => EXAMEN_SYC.qcm },
  EDUF: { titre: "Examen final — Éducation financière", col: "#15803D", charger: () => avecModule(MODULES_EDUF) },
};
