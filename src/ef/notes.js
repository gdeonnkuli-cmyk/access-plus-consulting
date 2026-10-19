// ── NOTES ANNEXES SYSCOHADA RÉVISÉ (Système Normal) — génération automatique ─────
// Structure reprise de la liasse « Logiciel des états financiers » (fiche R4, notes 1 à 39),
// adaptée au contexte de la République Démocratique du Congo. Chaque ligne chiffrée est
// calculée à partir des comptes de la balance (N, N-1 et, s'ils sont saisis, mouvements N).
import { mapCompte, num, fmt, ACTIF } from "./engine";

// ── Petit langage de description des lignes ───────────────────────────────────────
// Spécification "MODE:préfixes" — D : comptes débiteurs, C : comptes créditeurs,
// S : solde algébrique débiteur, -S : solde algébrique créditeur. "!419" exclut un préfixe.
const L = (l, spec, k) => ({ l, spec, k });
const G = (l, k) => ({ l, g: true, k });          // total des lignes de détail depuis le total précédent
const F = (l, f, k) => ({ l, f, k });             // formule sur des clés : "brut-dep"
const H = l => ({ l, h: true });                  // intertitre
const val = (P, spec) => {
  const i = spec.indexOf(":"), m = spec.slice(0, i), ps = spec.slice(i + 1).split(",");
  return m === "D" ? P.sD(ps) : m === "C" ? P.sC(ps) : m === "S" ? P.s(ps) : -P.s(ps);
};
// Ventilation géographique (subdivisions x1 à x5 du plan OHADA), présentée pour la RDC
const geo = (mode, roots, total) => {
  const sub = d => roots.map(r => r + d).join(",");
  const autres = ["2", "3", "4", "5", "9"].flatMap(d => roots.map(r => "!" + r + d)).join(",");
  return [
    L("Ventes en RDC", `${mode}:${roots.join(",")},${autres}`),
    L("Ventes à l'exportation (hors RDC)", `${mode}:${sub("2")}`),
    L("Ventes aux entités du groupe", `${mode}:${sub("3")},${sub("4")}`),
    L("Ventes sur internet", `${mode}:${sub("5")}`),
    L("Rabais, remises et ristournes accordés", `${mode}:${sub("9")}`),
    G(total),
  ];
};
const geoAchats = (root, total) => [
  L("Achats en RDC", `S:${root},!${root}2,!${root}3,!${root}4,!${root}5,!${root}9`),
  L("Achats à l'importation (hors RDC)", `S:${root}2`),
  L("Achats groupe", `S:${root}3,${root}4`),
  L("Frais sur achats", `S:${root}5`),
  L("Rabais, remises et ristournes obtenus", `S:${root}9`),
  G(total),
];

// ── Catalogue des notes ──────────────────────────────────────────────────────────
// t : "var" (N / N-1 / variation), "mvt" (tableau de mouvements), "txt" (narrative), "auto" (calcul spécifique)
export const NOTES = [
  { id: "1", titre: "DETTES GARANTIES PAR DES SÛRETÉS RÉELLES", t: "txt", aide: "Pour chaque dette garantie (emprunts, dettes de location-acquisition, fournisseurs, autres) : montant brut, nature de la sûreté (hypothèque, nantissement, gage) et montant de la sûreté. Mentionner aussi les engagements financiers donnés et reçus (avals, cautions)." },
  { id: "2", titre: "INFORMATIONS OBLIGATOIRES", t: "auto" },
  { id: "3A", titre: "IMMOBILISATIONS (BRUTES)", t: "mvt" },
  { id: "3B", titre: "BIENS PRIS EN LOCATION-ACQUISITION", t: "var", lignes: [
    L("Crédit-bail immobilier (dette)", "C:172"), L("Crédit-bail mobilier (dette)", "C:173"), L("Location-vente (dette)", "C:174"),
    L("Intérêts courus", "C:176"), L("Autres dettes de location-acquisition", "C:178"), G("TOTAL DETTES DE LOCATION-ACQUISITION", "tot")],
    aide: "Préciser pour chaque contrat la nature (I : crédit-bail immobilier, M : crédit-bail mobilier, A : autres), la valeur d'origine du bien, les redevances payées et restant à payer." },
  { id: "3C", titre: "IMMOBILISATIONS (AMORTISSEMENTS)", t: "mvt" },
  { id: "3D", titre: "IMMOBILISATIONS : PLUS-VALUES ET MOINS-VALUES DE CESSION", t: "auto" },
  { id: "3E", titre: "INFORMATIONS SUR LES RÉÉVALUATIONS EFFECTUÉES PAR L'ENTITÉ", t: "var", lignes: [
    L("Écarts de réévaluation (106)", "-S:106"), L("Provision spéciale de réévaluation (154)", "-S:154"), G("TOTAL RÉÉVALUATIONS", "tot")],
    aide: "Indiquer la nature et la date des réévaluations, les éléments réévalués par poste du bilan (coût historique, montant réévalué, écart, amortissements supplémentaires), la méthode utilisée et le traitement fiscal de l'écart." },
  { id: "4", titre: "IMMOBILISATIONS FINANCIÈRES", t: "var", lignes: [
    L("Titres de participation", "D:26"), L("Prêts et créances", "D:271"), L("Prêts au personnel", "D:272"), L("Créances sur l'État", "D:273"),
    L("Titres immobilisés", "D:274"), L("Dépôts et cautionnements versés", "D:275"), L("Intérêts courus", "D:276"), L("Autres immobilisations financières", "D:277,278"),
    G("TOTAL BRUT", "brut"), L("Dépréciations des titres de participation", "C:296", "d1"), L("Dépréciations des autres immobilisations financières", "C:297", "d2"),
    F("TOTAL NET DE DÉPRÉCIATIONS", "brut-d1-d2", "net")],
    ctrl: [["net", "Poste AQ du bilan", R => R.N.act.AQ.n]] },
  { id: "5", titre: "ACTIF CIRCULANT ET DETTES CIRCULANTES HAO", t: "var", lignes: [
    H("Actif circulant HAO"), L("Créances sur cessions d'immobilisations", "D:485"), L("Autres créances hors activités ordinaires", "D:48,!481,!482,!483,!484,!485,!489"),
    G("TOTAL BRUT", "brut"), L("Dépréciations des créances HAO", "C:498", "dep"), F("TOTAL NET DE DÉPRÉCIATIONS", "brut-dep", "net"),
    H("Dettes circulantes HAO"), L("Fournisseurs d'investissements", "C:481"), L("Fournisseurs d'investissements, effets à payer", "C:482"),
    L("Versements restant à effectuer sur titres", "C:483"), L("Autres dettes hors activités ordinaires", "C:484"), G("TOTAL DETTES HAO", "dettes")],
    ctrl: [["net", "Poste BA du bilan", R => R.N.act.BA.n], ["dettes", "Poste DH du bilan", R => R.N.pas.DH]] },
  { id: "6", titre: "STOCKS ET ENCOURS", t: "var", lignes: [
    L("Marchandises", "D:31"), L("Matières premières et fournitures liées", "D:32"), L("Autres approvisionnements", "D:33"), L("Produits en cours", "D:34"),
    L("Services en cours", "D:35"), L("Produits finis", "D:36"), L("Produits intermédiaires et résiduels", "D:37"), L("Stocks en cours de route, en consignation ou en dépôt", "D:38"),
    G("TOTAL BRUT STOCKS ET ENCOURS", "brut"), L("Dépréciations des stocks", "C:39", "dep"), F("TOTAL NET DE DÉPRÉCIATIONS", "brut-dep", "net")],
    ctrl: [["net", "Poste BB du bilan", R => R.N.act.BB.n]] },
  { id: "7", titre: "CLIENTS", t: "var", lignes: [
    L("Clients (hors groupe)", "D:411,!4112"), L("Clients, effets à recevoir et effets impayés", "D:412,413"), L("Clients groupe", "D:4112"),
    L("Créances sur cessions courantes d'immobilisations", "D:414"), L("Clients, effets escomptés non échus", "D:415"), L("Créances litigieuses ou douteuses", "D:416"),
    L("Clients, produits à recevoir", "D:417,418"), G("TOTAL BRUT CLIENTS", "brut"), L("Dépréciations des comptes clients", "C:491", "dep"),
    F("TOTAL NET DE DÉPRÉCIATIONS", "brut-dep", "net"),
    H("Clients créditeurs"), L("Clients, avances et acomptes reçus", "C:419"), L("Autres clients créditeurs", "C:41,!419"), G("TOTAL CLIENTS CRÉDITEURS", "cred")],
    ctrl: [["net", "Poste BI du bilan", R => R.N.act.BI.n], ["cred", "Poste DI du bilan", R => R.N.pas.DI]] },
  { id: "8", titre: "AUTRES CRÉANCES", t: "var", lignes: [
    L("Personnel", "D:42"), L("Organismes sociaux (CNSS, INPP, ONEM…)", "D:43"), L("État et collectivités publiques", "D:44"), L("Organismes internationaux", "D:45"),
    L("Apporteurs, associés et groupe", "D:46"), L("Compte transitoire, ajustement spécial lié à la révision du SYSCOHADA", "D:4751"),
    L("Autres débiteurs divers (471 à 477)", "D:47,!4751,!478,!479"), L("Comptes de liaison (185 à 188)", "D:18"), G("TOTAL BRUT AUTRES CRÉANCES", "brut"),
    L("Dépréciations des autres créances", "C:49,!490,!491,!498,!499", "dep"), F("TOTAL NET DE DÉPRÉCIATIONS", "brut-dep", "net")],
    ctrl: [["net", "Poste BJ du bilan", R => R.N.act.BJ.n]] },
  { id: "9", titre: "TITRES DE PLACEMENT", t: "var", lignes: [
    L("Titres du Trésor et bons de caisse à court terme", "D:501"), L("Actions", "D:502"), L("Obligations", "D:503"), L("Bons de souscription", "D:504"),
    L("Titres négociables hors région", "D:505"), L("Intérêts courus", "D:506"), L("Autres valeurs assimilées", "D:50,!501,!502,!503,!504,!505,!506"),
    G("TOTAL BRUT TITRES", "brut"), L("Dépréciations des titres", "C:590", "dep"), F("TOTAL NET DE DÉPRÉCIATIONS", "brut-dep", "net")],
    ctrl: [["net", "Poste BQ du bilan", R => R.N.act.BQ.n]] },
  { id: "10", titre: "VALEURS À ENCAISSER", t: "var", lignes: [
    L("Effets à encaisser", "D:511"), L("Effets à l'encaissement", "D:512"), L("Chèques à encaisser", "D:513"), L("Chèques à l'encaissement", "D:514"),
    L("Cartes de crédit à encaisser", "D:515"), L("Autres valeurs à encaisser", "D:51,!511,!512,!513,!514,!515"), G("TOTAL BRUT VALEURS À ENCAISSER", "brut"),
    L("Dépréciations des valeurs à encaisser", "C:591", "dep"), F("TOTAL NET DE DÉPRÉCIATIONS", "brut-dep", "net")],
    ctrl: [["net", "Poste BR du bilan", R => R.N.act.BR.n]] },
  { id: "11", titre: "DISPONIBILITÉS", t: "var", lignes: [
    L("Banques locales (RDC)", "D:521"), L("Banques à l'étranger", "D:522,523,524"), L("Banques, dépôts à terme", "D:525"), L("Banques, intérêts courus", "D:526"),
    L("Autres banques", "D:52,!521,!522,!523,!524,!525,!526"), L("Chèques postaux et autres établissements financiers", "D:53"), L("Instruments de trésorerie", "D:54"),
    L("Monnaie électronique (mobile money : M-Pesa, Airtel Money, Orange Money…)", "D:55"), L("Caisse", "D:57"), L("Régies d'avances, accréditifs et virements internes", "D:58"),
    L("Banques, crédits de trésorerie (soldes débiteurs)", "D:56"), G("TOTAL BRUT DISPONIBILITÉS", "brut"),
    L("Dépréciations", "C:592,593,594", "dep"), F("TOTAL NET DE DÉPRÉCIATIONS", "brut-dep", "net")],
    ctrl: [["net", "Poste BS du bilan", R => R.N.act.BS.n]] },
  { id: "12", titre: "ÉCARTS DE CONVERSION ET TRANSFERTS DE CHARGES", t: "var", lignes: [
    H("Écarts de conversion"), L("Écart de conversion-Actif (pertes latentes)", "D:478", "eca"), L("Écart de conversion-Passif (gains latents)", "C:479", "ecp"),
    H("Transferts de charges"), L("Transferts de charges d'exploitation (781)", "-S:781"), L("Transferts de charges financières (787)", "-S:787"),
    L("Transferts de charges HAO (848)", "-S:848"), G("TOTAL TRANSFERTS DE CHARGES")],
    ctrl: [["eca", "Poste BU du bilan", R => R.N.act.BU.n], ["ecp", "Poste DV du bilan", R => R.N.pas.DV]],
    aide: "Détailler les écarts de conversion par devise (USD, EUR…) : montant en devises, cours de la Banque Centrale du Congo à la date d'acquisition et au 31/12, variation." },
  { id: "13", titre: "CAPITAL : VALEUR NOMINALE DES ACTIONS OU PARTS", t: "var", lignes: [
    L("Capital souscrit, non appelé (1011)", "-S:1011"), L("Capital souscrit, appelé, non versé (1012)", "-S:1012"), L("Capital souscrit, appelé, versé, non amorti (1013)", "-S:1013"),
    L("Capital souscrit, appelé, versé, amorti (1014)", "-S:1014"), L("Capital par dotation, personnel, compte de l'exploitant (102 à 104)", "-S:102,103,104"),
    L("Autres comptes de capital", "-S:10,!1011,!1012,!1013,!1014,!102,!103,!104,!105,!106,!109"), G("CAPITAL SOCIAL", "cap"),
    L("Apporteurs, capital non appelé (109)", "-S:109", "app"), F("TOTAL", "cap+app", "tot")],
    ctrl: [["tot", "Postes CA + CB du bilan", R => R.N.pas.CA + R.N.pas.CB]],
    aide: "Indiquer la valeur nominale des actions ou parts et, pour chaque associé : nom ou raison sociale, nationalité, pays de résidence, nature des titres, nombre et montant total." },
  { id: "14", titre: "PRIMES ET RÉSERVES", t: "var", lignes: [
    L("Primes d'apport", "-S:1051"), L("Primes d'émission", "-S:1052"), L("Primes de fusion", "-S:1053"), L("Primes de conversion", "-S:1054"), L("Autres primes", "-S:105,!1051,!1052,!1053,!1054"),
    G("TOTAL PRIMES", "pri"), L("Réserve légale", "-S:111"), L("Réserves statutaires ou contractuelles", "-S:112"), L("Réserves réglementées", "-S:113"),
    G("TOTAL RÉSERVES INDISPONIBLES", "ri"), L("Réserves libres", "-S:118,11,!111,!112,!113", "rl"), L("Report à nouveau", "-S:12", "ran")],
    ctrl: [["pri", "Poste CD du bilan", R => R.N.pas.CD], ["ri", "Poste CF du bilan", R => R.N.pas.CF], ["ran", "Poste CH du bilan", R => R.N.pas.CH]] },
  { id: "15A", titre: "SUBVENTIONS ET PROVISIONS RÉGLEMENTÉES", t: "var", lignes: [
    L("État", "-S:1411"), L("Provinces et entités territoriales décentralisées", "-S:1412,1413,1414"), L("Entités publiques ou mixtes", "-S:1415"),
    L("Entités et organismes privés", "-S:1416"), L("Organismes internationaux", "-S:1417"), L("Autres", "-S:14,!1411,!1412,!1413,!1414,!1415,!1416,!1417"), G("TOTAL SUBVENTIONS", "sub"),
    L("Amortissements dérogatoires", "-S:151"), L("Plus-values de cession à réinvestir", "-S:152"), L("Fonds réglementés", "-S:153"), L("Provision spéciale de réévaluation", "-S:154"),
    L("Provisions réglementées relatives aux immobilisations", "-S:155"), L("Provisions réglementées relatives aux stocks", "-S:156"), L("Provisions pour investissement", "-S:157"),
    L("Autres provisions et fonds réglementés", "-S:158"), G("TOTAL PROVISIONS RÉGLEMENTÉES", "prov"), F("TOTAL SUBVENTIONS ET PROVISIONS RÉGLEMENTÉES", "sub+prov")],
    ctrl: [["sub", "Poste CL du bilan", R => R.N.pas.CL], ["prov", "Poste CM du bilan", R => R.N.pas.CM]] },
  { id: "16A", titre: "DETTES FINANCIÈRES ET RESSOURCES ASSIMILÉES", t: "var", lignes: [
    L("Emprunts obligataires", "C:161"), L("Emprunts et dettes auprès des établissements de crédit", "C:162"), L("Avances reçues de l'État", "C:163"),
    L("Avances reçues et comptes courants bloqués", "C:164"), L("Dépôts et cautionnements reçus", "C:165"), L("Intérêts courus", "C:166"),
    L("Avances assorties de conditions particulières", "C:167"), L("Autres emprunts et dettes", "C:168"), L("Dettes liées à des participations et comptes permanents bloqués", "C:181,182,183,184"),
    G("TOTAL EMPRUNTS ET DETTES FINANCIÈRES", "emp"),
    L("Crédit-bail immobilier", "C:172"), L("Crédit-bail mobilier", "C:173"), L("Location-vente", "C:174"), L("Intérêts courus", "C:176"), L("Autres dettes de location-acquisition", "C:178"),
    G("TOTAL DETTES DE LOCATION-ACQUISITION", "loc"),
    L("Provisions pour litiges", "C:191"), L("Provisions pour garanties données aux clients", "C:192"), L("Provisions pour pertes sur marchés à achèvement futur", "C:193"),
    L("Provisions pour pertes de change", "C:194"), L("Provisions pour impôts", "C:195"), L("Provisions pour pensions et obligations similaires", "C:196"),
    L("Provisions pour restructuration", "C:197"), L("Autres provisions pour risques et charges", "C:198,199"), G("TOTAL PROVISIONS POUR RISQUES ET CHARGES", "prov")],
    ctrl: [["emp", "Poste DA du bilan", R => R.N.pas.DA], ["loc", "Poste DB du bilan", R => R.N.pas.DB], ["prov", "Poste DC du bilan", R => R.N.pas.DC]],
    aide: "Pour chaque emprunt : prêteur, montant initial, taux, durée, échéances à un an au plus, entre un et deux ans, à plus de deux ans, et garanties données." },
  { id: "16B", titre: "ENGAGEMENTS DE RETRAITE ET AVANTAGES ASSIMILÉS (MÉTHODE ACTUARIELLE)", t: "txt", aide: "Hypothèses actuarielles (augmentation des salaires, actualisation, inflation, probabilités de présence et de survie), variation de la valeur de l'engagement (coût des services, coût financier, écarts actuariels, prestations payées) et analyse de sensibilité. Le solde de la provision figure au compte 196." },
  { id: "16C", titre: "ACTIFS ET PASSIFS ÉVENTUELS", t: "txt", aide: "Décrire les litiges et autres actifs ou passifs éventuels (procédures en cours devant les juridictions de la RDC, redressements fiscaux contestés…), avec une estimation de leur effet financier." },
  { id: "17", titre: "FOURNISSEURS D'EXPLOITATION", t: "var", lignes: [
    L("Fournisseurs, dettes en compte (hors groupe)", "C:401,!4012"), L("Fournisseurs, effets à payer", "C:402"), L("Fournisseurs groupe", "C:4012"),
    L("Fournisseurs, acquisitions courantes d'immobilisations", "C:404"), L("Fournisseurs, factures non parvenues", "C:408"), L("Autres fournisseurs", "C:40,!401,!402,!404,!408,!409"),
    G("TOTAL FOURNISSEURS", "four"), H("Fournisseurs débiteurs"), L("Fournisseurs, avances et acomptes versés", "D:409"), L("Autres fournisseurs débiteurs", "D:40,!409"),
    G("TOTAL FOURNISSEURS DÉBITEURS", "deb")],
    ctrl: [["four", "Poste DJ du bilan", R => R.N.pas.DJ], ["deb", "Poste BH du bilan (brut)", R => R.N.act.BH.b]] },
  { id: "18", titre: "DETTES FISCALES ET SOCIALES", t: "var", lignes: [
    L("Personnel, avances et acomptes", "C:421"), L("Personnel, rémunérations dues", "C:422"), L("Autres dettes envers le personnel (423 à 428)", "C:42,!421,!422"),
    L("CNSS — Caisse nationale de sécurité sociale", "C:431"), L("Caisse de retraite", "C:432"), L("Autres organismes sociaux (INPP, ONEM, mutuelles…)", "C:43,!431,!432"),
    G("TOTAL DETTES SOCIALES", "soc"), L("État, impôt sur les bénéfices et profits (IBP)", "C:441"), L("État, autres impôts et taxes", "C:442"),
    L("État, TVA (443 à 445)", "C:443,444,445"), L("État, impôts retenus à la source (IPR, IERE…)", "C:447"), L("Autres dettes envers l'État", "C:44,!441,!442,!443,!444,!445,!447"),
    G("TOTAL DETTES FISCALES", "fisc"), F("TOTAL DETTES FISCALES ET SOCIALES", "soc+fisc", "tot")],
    ctrl: [["tot", "Poste DK du bilan", R => R.N.pas.DK]] },
  { id: "19", titre: "AUTRES DETTES ET PROVISIONS POUR RISQUES À COURT TERME", t: "var", lignes: [
    L("Organismes internationaux", "C:45"), L("Apporteurs, opérations sur le capital", "C:461"), L("Associés, comptes courants", "C:462"), L("Associés, dividendes à payer", "C:465"),
    L("Groupe, comptes courants", "C:466"), L("Autres dettes envers les associés", "C:46,!461,!462,!465,!466"), G("TOTAL DETTES ASSOCIÉS", "ass"),
    L("Créditeurs divers", "C:471,473,474"), L("Versements restant à effectuer sur titres de placement non libérés", "C:472"),
    L("Compte transitoire, ajustement spécial lié à la révision du SYSCOHADA", "C:4752"), L("Produits constatés d'avance et autres créditeurs", "C:47,!471,!472,!473,!474,!4752,!478,!479"),
    G("TOTAL CRÉDITEURS DIVERS", "cre"), L("Comptes de liaison", "C:18,!181,!182,!183,!184"), G("TOTAL COMPTES DE LIAISON", "lia"),
    F("TOTAL AUTRES DETTES", "ass+cre+lia", "tot"), L("Provisions pour risques à court terme", "C:499,599", "prov")],
    ctrl: [["tot", "Poste DM du bilan", R => R.N.pas.DM], ["prov", "Poste DN du bilan", R => R.N.pas.DN]] },
  { id: "20", titre: "BANQUES, CRÉDITS D'ESCOMPTE ET DE TRÉSORERIE", t: "var", lignes: [
    L("Escomptes de crédits de campagne", "C:564"), L("Escomptes de crédits ordinaires", "C:565"), G("TOTAL BANQUES, CRÉDITS D'ESCOMPTE", "esc"),
    L("Banques locales (RDC), découverts", "C:521"), L("Banques à l'étranger, découverts", "C:522,523,524"), L("Autres banques et établissements financiers", "C:52,53,54,55,57,58,!521,!522,!523,!524"),
    L("Crédits de trésorerie et intérêts courus", "C:561,566,56,!564,!565"), G("TOTAL BANQUES, CRÉDITS DE TRÉSORERIE", "tre"), F("TOTAL GÉNÉRAL", "esc+tre", "tot")],
    ctrl: [["tot", "Poste DT du bilan", R => R.N.pas.DT]] },
  { id: "21", titre: "CHIFFRE D'AFFAIRES ET AUTRES PRODUITS", t: "var", lignes: [
    H("Ventes de marchandises"), ...geo("-S", ["701"], "TOTAL : VENTES DE MARCHANDISES"),
    H("Ventes de produits fabriqués"), ...geo("-S", ["702", "703", "704"], "TOTAL : VENTES DE PRODUITS FABRIQUÉS"),
    H("Travaux et services vendus"), ...geo("-S", ["705", "706"], "TOTAL : VENTES DE TRAVAUX ET SERVICES"),
    L("Produits accessoires", "-S:707"), F("TOTAL : CHIFFRE D'AFFAIRES", "", "ca"),
    L("Production immobilisée", "-S:72"), L("Subventions d'exploitation", "-S:71"), L("Autres produits", "-S:75"), G("TOTAL : AUTRES PRODUITS")],
    ca: ["701", "702", "703", "704", "705", "706", "707"],
    ctrl: [["ca", "Chiffre d'affaires (XB)", R => R.N.cr.XB]] },
  { id: "22", titre: "ACHATS", t: "var", lignes: [
    H("Achats de marchandises"), ...geoAchats("601", "TOTAL : ACHATS DE MARCHANDISES"),
    H("Achats de matières premières et fournitures liées"), ...geoAchats("602", "TOTAL : ACHATS DE MATIÈRES PREMIÈRES"),
    H("Autres achats"), L("Matières consommables", "S:6041"), L("Matières combustibles", "S:6042"), L("Produits d'entretien", "S:6043"), L("Fournitures d'atelier, d'usine et de magasin", "S:6044"),
    L("Eau (REGIDESO…)", "S:6051"), L("Électricité (SNEL…)", "S:6052"), L("Autres énergies", "S:6053"), L("Fournitures d'entretien non stockables", "S:6054"), L("Fournitures de bureau", "S:6055"),
    L("Petit matériel et outillage", "S:6056"), L("Achats d'études et prestations de services", "S:6057"), L("Achats d'emballages", "S:608"),
    L("Autres achats non ventilés", "S:604,605,!6041,!6042,!6043,!6044,!6051,!6052,!6053,!6054,!6055,!6056,!6057"), G("TOTAL : AUTRES ACHATS")] },
  { id: "23", titre: "TRANSPORTS", t: "var", lignes: [
    L("Transports sur achats", "S:611"), L("Transports sur ventes", "S:612"), L("Transports pour le compte de tiers", "S:613"), L("Transports du personnel", "S:614"),
    L("Transports de plis", "S:616"), L("Voyages et déplacements", "S:6181"), L("Transports entre établissements ou chantiers", "S:6182"), L("Transports administratifs", "S:6183"),
    L("Autres transports", "S:61,!611,!612,!613,!614,!616,!6181,!6182,!6183"), G("TOTAL", "tot")],
    ctrl: [["tot", "Poste RG du compte de résultat", R => R.N.cr.RG]] },
  { id: "24", titre: "SERVICES EXTÉRIEURS", t: "var", lignes: [
    L("Sous-traitance générale", "S:621"), L("Locations et charges locatives", "S:622"), L("Redevances de location-acquisition", "S:623"), L("Entretien, réparations et maintenance", "S:624"),
    L("Primes d'assurance", "S:625"), L("Études, recherches et documentation", "S:626"), L("Publicité, publications, relations publiques", "S:627"), L("Frais de télécommunications", "S:628"),
    L("Frais bancaires", "S:631"), L("Rémunérations d'intermédiaires et de conseils", "S:632"), L("Frais de formation du personnel", "S:633"),
    L("Redevances pour brevets, licences, logiciels", "S:634"), L("Cotisations", "S:635"), L("Autres charges externes", "S:63,620,629,!631,!632,!633,!634,!635"), G("TOTAL", "tot")],
    ctrl: [["tot", "Poste RH du compte de résultat", R => R.N.cr.RH]] },
  { id: "25", titre: "IMPÔTS ET TAXES", t: "var", lignes: [
    L("Impôts et taxes directs (impôt foncier, vignettes, taxes provinciales…)", "S:641"), L("Impôts et taxes indirects", "S:645"), L("Droits d'enregistrement", "S:646"),
    L("Pénalités et amendes fiscales", "S:647"), L("Autres impôts et taxes", "S:64,!641,!645,!646,!647"), G("TOTAL", "tot")],
    ctrl: [["tot", "Poste RI du compte de résultat", R => R.N.cr.RI]] },
  { id: "26", titre: "AUTRES CHARGES", t: "var", lignes: [
    L("Pertes sur créances clients et autres débiteurs", "S:651"), L("Quote-part de résultat sur opérations faites en commun", "S:652"),
    L("Valeur comptable des cessions courantes d'immobilisations", "S:654"), L("Pertes de change sur créances et dettes commerciales", "S:656"), L("Pénalités et amendes pénales", "S:657"),
    L("Indemnités de fonction et autres rémunérations d'administrateurs", "S:6581"), L("Dons et mécénat", "S:6582,6583"), L("Autres charges diverses", "S:658,653,655,!6581,!6582,!6583"),
    L("Charges pour dépréciations et provisions pour risques à court terme", "S:659"), G("TOTAL", "tot")],
    ctrl: [["tot", "Poste RJ du compte de résultat", R => R.N.cr.RJ]] },
  { id: "27A", titre: "CHARGES DE PERSONNEL", t: "var", lignes: [
    L("Rémunérations directes versées au personnel national", "S:661"), L("Rémunérations directes versées au personnel non national", "S:662"),
    L("Indemnités forfaitaires versées au personnel", "S:663"), L("Charges sociales (personnel national)", "S:664,!6642"), L("Charges sociales (personnel non national)", "S:6642"),
    L("Rémunérations et charges sociales de l'exploitant individuel", "S:666"), L("Rémunération transférée de personnel extérieur", "S:667"), L("Autres charges sociales", "S:668,665,669"),
    G("TOTAL", "tot")],
    ctrl: [["tot", "Poste RK du compte de résultat", R => R.N.cr.RK]] },
  { id: "27B", titre: "EFFECTIFS, MASSE SALARIALE ET PERSONNEL EXTÉRIEUR", t: "txt", aide: "Effectifs et masse salariale par qualification (cadres supérieurs ; techniciens supérieurs et cadres moyens ; techniciens, agents de maîtrise et ouvriers qualifiés ; employés, manœuvres, apprentis), par nationalité (nationaux, autres États de l'OHADA, hors OHADA) et par sexe, permanents et saisonniers ; personnel extérieur facturé. Rapprocher la masse salariale des déclarations CNSS, INPP, ONEM et IPR." },
  { id: "28A", titre: "PROVISIONS POUR RISQUES ET CHARGES", t: "mvt" },
  { id: "28B", titre: "DÉPRÉCIATIONS DES IMMOBILISATIONS", t: "mvt" },
  { id: "28C", titre: "AUTRES DÉPRÉCIATIONS", t: "mvt" },
  { id: "29", titre: "CHARGES ET REVENUS FINANCIERS", t: "var", lignes: [
    L("Intérêts des emprunts", "S:671"), L("Intérêts dans loyers de location-acquisition", "S:672"), L("Escomptes accordés", "S:673"), L("Autres intérêts", "S:674"),
    L("Escomptes des effets de commerce", "S:675"), L("Pertes de change financières", "S:676"), L("Pertes sur cessions de titres de placement", "S:677"),
    L("Pertes sur risques financiers et malis", "S:678"), L("Charges pour dépréciations et provisions financières à court terme", "S:679"),
    L("Dotations aux provisions et dépréciations financières", "S:687,697"), G("SOUS-TOTAL : FRAIS FINANCIERS (A)", "fra"),
    L("Intérêts de prêts et créances diverses", "-S:771"), L("Revenus de participations", "-S:772"), L("Escomptes obtenus", "-S:773"), L("Revenus de placement", "-S:774"),
    L("Gains de change financiers", "-S:776"), L("Gains sur cessions de titres de placement", "-S:777"), L("Gains sur risques financiers", "-S:778"),
    L("Reprises de charges pour dépréciations financières", "-S:779"), L("Autres revenus financiers", "-S:775"), L("Transferts de charges et reprises financières", "-S:787,797"),
    G("SOUS-TOTAL : REVENUS FINANCIERS (B)", "rev"), F("RÉSULTAT FINANCIER (B − A)", "rev-fra", "res")],
    ctrl: [["res", "Poste XF du compte de résultat", R => R.N.cr.XF]] },
  { id: "30", titre: "AUTRES CHARGES ET PRODUITS HAO", t: "var", lignes: [
    L("Charges HAO constatées", "S:831"), L("Pertes sur créances HAO", "S:834"), L("Dons et libéralités accordés", "S:835"), L("Abandons de créances consentis", "S:836"),
    L("Charges provisionnées HAO", "S:839"), L("Autres charges HAO", "S:83,!831,!834,!835,!836,!839"), L("Dotations hors activités ordinaires", "S:85"),
    G("SOUS-TOTAL : AUTRES CHARGES HAO (RP)", "ch"), L("Participation des travailleurs", "S:87"),
    L("Produits HAO constatés", "-S:841"), L("Dons et libéralités obtenus", "-S:845"), L("Abandons de créances obtenus", "-S:846"), L("Transferts de charges HAO", "-S:848"),
    L("Reprises des charges provisionnées HAO", "-S:849"), L("Autres produits HAO", "-S:84,!841,!845,!846,!848,!849"), L("Reprises hors activités ordinaires", "-S:86"),
    L("Subventions d'équilibre", "-S:88"), G("SOUS-TOTAL : AUTRES PRODUITS HAO (TO)", "pr")],
    ctrl: [["ch", "Poste RP du compte de résultat", R => R.N.cr.RP], ["pr", "Poste TO du compte de résultat", R => R.N.cr.TO]] },
  { id: "31", titre: "RÉPARTITION DU RÉSULTAT ET AUTRES ÉLÉMENTS CARACTÉRISTIQUES DES DERNIERS EXERCICES", t: "auto" },
  { id: "32", titre: "PRODUCTION DE L'EXERCICE", t: "txt", aide: "Par produit : unité de quantité, production vendue en RDC, dans les autres pays de l'OHADA et hors OHADA, production immobilisée, stock d'ouverture et de clôture (quantités et valeurs). Le total non ventilé doit rester inférieur à 10 % de la production." },
  { id: "33", titre: "ACHATS DESTINÉS À LA PRODUCTION", t: "txt", aide: "Par matière ou produit : unité de quantité, achats de produits fabriqués en RDC, achats de produits importés, variation des stocks (en valeur)." },
  { id: "34", titre: "FICHE DE SYNTHÈSE DES PRINCIPAUX INDICATEURS FINANCIERS", t: "auto" },
  { id: "35", titre: "INFORMATIONS SOCIALES, ENVIRONNEMENTALES ET SOCIÉTALES", t: "txt", aide: "Emploi, relations sociales, santé et sécurité, formation, égalité de traitement ; politique environnementale, pollution et déchets, utilisation des ressources (eau, énergie), changement climatique, biodiversité ; impact territorial (emploi local, communautés riveraines), sous-traitance. Note obligatoire pour les entités de plus de 250 salariés." },
  { id: "37", titre: "ÉVÉNEMENTS POSTÉRIEURS À LA CLÔTURE DE L'EXERCICE", t: "txt", aide: "Date d'arrêté des états financiers et organe ayant autorisé leur publication ; événements donnant lieu à ajustement ; événements ne donnant pas lieu à ajustement (estimation de l'impact) ; événements remettant en cause la continuité d'exploitation." },
  { id: "38", titre: "CHANGEMENTS DE MÉTHODES COMPTABLES, D'ESTIMATIONS COMPTABLES ET CORRECTIONS D'ERREURS", t: "txt", aide: "Nature et justification du changement, impact sur les capitaux propres d'ouverture et sur les postes concernés, application rétrospective ou prospective ; corrections d'erreurs d'exercices antérieurs." },
  { id: "39", titre: "NOTES SUPPLÉMENTAIRES", t: "txt", aide: "Toute information complémentaire utile à la compréhension des états financiers." },
];

// ── Calcul d'une note « var » ─────────────────────────────────────────────────────
function computeVar(note, R) {
  const rows = [], keys = { n: {}, n1: {} };
  let acc = { n: 0, n1: 0 };
  for (const x of note.lignes) {
    if (x.h) { rows.push({ l: x.l, h: true }); continue; }
    let n, n1;
    if (x.spec) {
      n = val(R.N, x.spec); n1 = val(R.P1, x.spec);
      acc.n += n; acc.n1 += n1;
    } else if (x.g) {
      n = acc.n; n1 = acc.n1; acc = { n: 0, n1: 0 };
    } else if (x.f !== undefined) {
      if (x.k === "ca") { n = -R.N.s(note.ca); n1 = -R.P1.s(note.ca); acc = { n: 0, n1: 0 }; }
      else {
        const ev = per => x.f.split(/(?=[+-])/).reduce((s, t) => s + (t[0] === "-" ? -1 : 1) * (keys[per][t.replace(/^[+-]/, "")] || 0), 0);
        n = ev("n"); n1 = ev("n1");
      }
      acc = { n: 0, n1: 0 };
    }
    if (x.k) { keys.n[x.k] = n; keys.n1[x.k] = n1; }
    rows.push({ l: x.l, k: x.k, n, n1, tot: !x.spec, var: n1 ? (n - n1) / Math.abs(n1) * 100 : null });
  }
  const ctrl = (note.ctrl || []).map(([k, lib, f]) => { const a = keys.n[k] || 0, b = f(R); return { lib, note: a, etat: b, ok: Math.abs(a - b) < 0.5 }; });
  return { cols: ["Libellés", "Année N", "Année N-1", "Variation %"], rows, ctrl };
}

// ── Tableaux de mouvements (3A, 3C, 28A, 28B, 28C) ───────────────────────────────
const IMMO_REFS = ["AE", "AF", "AG", "AH", "AJ", "AK", "AL", "AM", "AN", "AP", "AR", "AS"];
const GROUPES = [["AD", "IMMOBILISATIONS INCORPORELLES", ["AE", "AF", "AG", "AH"]], ["AI", "IMMOBILISATIONS CORPORELLES", ["AJ", "AK", "AL", "AM", "AN"]],
  ["AP", "AVANCES ET ACOMPTES VERSÉS SUR IMMOBILISATIONS", ["AP"]], ["AQ", "IMMOBILISATIONS FINANCIÈRES", ["AR", "AS"]]];
const libActif = Object.fromEntries(ACTIF.map(x => [x.ref, x.lib]));

// Mouvements d'un ensemble de comptes : ouverture (N-1), augmentations, diminutions, clôture (N).
// sens = +1 pour un compte d'actif (débit), -1 pour un compte de passif ou d'amortissement (crédit).
function mouvements(R, filtre, sens) {
  const comptes = new Set([...Object.keys(R.N.acc), ...Object.keys(R.P1.acc)]);
  const out = { o: 0, a: 0, d: 0, c: 0 };
  for (const c of comptes) {
    if (!filtre(c)) continue;
    const o = sens * (R.P1.acc[c] || 0), cl = sens * (R.N.acc[c] || 0);
    let a, d;
    if (R.N.hasMvt) { const md = R.N.mD(c), mc = R.N.mC(c); a = sens > 0 ? md : mc; d = sens > 0 ? mc : md; }
    else { a = Math.max(cl - o, 0); d = Math.max(o - cl, 0); }
    out.o += o; out.a += a; out.d += d; out.c += cl;
  }
  return out;
}
const refOf = (c, amort) => { const m = mapCompte(c); return m && m.amort === amort && typeof m.r === "string" ? m.r : null; };

function computeMvt(note, R) {
  const est = !R.N.hasMvt;
  const mk = (l, v, tot) => ({ l, cells: [v.o, v.a, v.d, v.c], tot });
  const sum = vs => vs.reduce((s, v) => ({ o: s.o + v.o, a: s.a + v.a, d: s.d + v.d, c: s.c + v.c }), { o: 0, a: 0, d: 0, c: 0 });
  const rows = [];
  const immo = (amort, prefix, refs) => {
    const tot = [];
    for (const [g, lib, rs] of GROUPES) {
      const sel = rs.filter(r => refs.includes(r));
      if (!sel.length) continue;
      const vs = sel.map(r => mouvements(R, c => c.startsWith(prefix ? prefix : "2") && (!prefix ? !/^2[89]/.test(c) : true) && refOf(c, amort) === r, amort ? -1 : 1));
      if (sel.length > 1) sel.forEach((r, i) => rows.push(mk(libActif[r], vs[i])));
      const t = sum(vs); tot.push(t); rows.push(mk(lib, t, true));
    }
    rows.push(mk("TOTAL GÉNÉRAL", sum(tot), true));
    return sum(tot);
  };
  let cols, ctrl = [];
  if (note.id === "3A") {
    cols = ["Rubriques", "Montant brut à l'ouverture (A)", "Augmentations : acquisitions, apports, créations (B)", "Diminutions : cessions, mises hors service (C)", "Montant brut à la clôture (D = A + B − C)"];
    const t = immo(false, "", IMMO_REFS);
    ctrl.push({ lib: "Brut de l'actif immobilisé (AZ)", note: t.c, etat: R.N.act.AZ.b, ok: Math.abs(t.c - R.N.act.AZ.b) < 0.5 });
  } else if (note.id === "3C") {
    cols = ["Rubriques", "Amortissements cumulés à l'ouverture (A)", "Augmentations : dotations de l'exercice (B)", "Diminutions : amortissements des éléments sortis (C)", "Cumul à la clôture (D = A + B − C)"];
    const t = immo(true, "28", IMMO_REFS.slice(0, 9));
    ctrl.push({ lib: "Dotations aux amortissements (681)", note: t.a, etat: R.N.s("681"), ok: est || Math.abs(t.a - R.N.s("681")) < 0.5 });
  } else if (note.id === "28B") {
    cols = ["Rubriques", "Dépréciations cumulées à l'ouverture (A)", "Augmentations : dotations (B)", "Diminutions : reprises (C)", "Cumul à la clôture (D = A + B − C)"];
    immo(true, "29", IMMO_REFS);
  } else {
    cols = ["Nature", "À l'ouverture (A)", "Augmentations : dotations (B)", "Diminutions : reprises (C)", "À la clôture (D = A + B − C)"];
    const lignes = note.id === "28A" ? [
      ["Provisions pour litiges", "191"], ["Provisions pour garanties données aux clients", "192"], ["Provisions pour pertes sur marchés à achèvement futur", "193"],
      ["Provisions pour pertes de change", "194"], ["Provisions pour impôts", "195"], ["Provisions pour pensions et obligations similaires", "196"],
      ["Provisions pour restructuration", "197"], ["Autres provisions pour risques et charges", "198,199"], ["=TOTAL PROVISIONS POUR RISQUES ET CHARGES"],
      ["Provisions pour risques à court terme (exploitation)", "499"], ["Provisions pour risques à court terme (financières)", "599"], ["=TOTAL PROVISIONS POUR RISQUES À COURT TERME"]]
      : [["Dépréciations des stocks", "39"], ["Dépréciations de l'actif circulant HAO", "498"], ["Dépréciations des fournisseurs", "490"], ["Dépréciations des clients", "491"],
        ["Dépréciations des autres créances", "492,493,494,495,496,497"], ["Dépréciations des titres de placement", "590"], ["Dépréciations des valeurs à encaisser", "591"],
        ["Dépréciations des disponibilités", "592,593,594"], ["=TOTAL DES AUTRES DÉPRÉCIATIONS"]];
    let grp = [], all = [];
    for (const [l, ps] of lignes) {
      if (l[0] === "=") { const t = sum(grp); all.push(t); rows.push(mk(l.slice(1), t, true)); grp = []; continue; }
      const pre = ps.split(",");
      const v = mouvements(R, c => pre.some(p => c.startsWith(p)), -1);
      grp.push(v); rows.push(mk(l, v));
    }
    if (all.length > 1) rows.push(mk("TOTAL PROVISIONS ET DÉPRÉCIATIONS", sum(all), true));
  }
  return { cols, rows, ctrl, estime: est };
}

// ── Notes calculées spécifiquement ──────────────────────────────────────────────
function note3D(R) {
  const types = [["Immobilisations incorporelles", "21", "281", "811", "821"], ["Immobilisations corporelles", "22,23,24,25", "282,283,284", "812,654", "822,754"], ["Immobilisations financières", "26,27", "", "816", "826"]];
  const rows = [], t = [0, 0, 0, 0, 0];
  for (const [l, br, am, vc, pc] of types) {
    const brut = R.N.hasMvt ? R.N.mC(br.split(",")) : null;
    const amort = R.N.hasMvt && am ? R.N.mD(am.split(",")) : null;
    const vnc = R.N.s(vc.split(",")), prix = -R.N.s(pc.split(","));
    const cells = [brut, amort, vnc, prix, prix - vnc];
    cells.forEach((v, i) => { t[i] += v || 0; });
    rows.push({ l, cells });
  }
  rows.push({ l: "TOTAL GÉNÉRAL", cells: t, tot: true });
  const vcc = R.N.s(["81", "654"]);
  return { cols: ["Rubriques", "Montant brut (A)", "Amortissements pratiqués (B)", "Valeur comptable nette (C)", "Prix de cession (D)", "Plus-value ou moins-value (E = D − C)"], rows,
    ctrl: [{ lib: "Valeurs comptables des cessions (81 + 654)", note: t[2], etat: vcc, ok: Math.abs(t[2] - vcc) < 0.5 }],
    remarque: R.N.hasMvt ? "Montant brut et amortissements pratiqués : mouvements crédit des comptes d'immobilisations et mouvements débit des comptes d'amortissements (y compris d'éventuels virements de poste à poste, à retraiter)." : "Saisissez les mouvements N de la balance pour obtenir le montant brut et les amortissements des éléments cédés." };
}

function note2(R, ident = {}, devise = "CDF") {
  return { texte: [
    "A. DÉCLARATION DE CONFORMITÉ AU SYSCOHADA",
    `Les états financiers de ${ident.denomination || "l'entité"} sont établis conformément à l'Acte uniforme relatif au droit comptable et à l'information financière (AUDCIF) et au Système comptable OHADA révisé (SYSCOHADA), applicables en République Démocratique du Congo depuis le 1er janvier 2018. Ils sont présentés selon le Système Normal.`,
    "B. RÈGLES ET MÉTHODES COMPTABLES",
    `Les comptes sont tenus et présentés en ${devise === "USD" ? "dollars américains (USD)" : "francs congolais (CDF)"}. Les opérations en devises sont converties au cours de la Banque Centrale du Congo à la date de l'opération ; les créances et dettes en devises sont réévaluées au cours de clôture, les écarts étant inscrits en écarts de conversion (478/479). Les immobilisations sont évaluées à leur coût d'acquisition ou de production et amorties selon leur durée d'utilité. Les stocks sont évalués au coût d'acquisition ou de production selon la méthode du coût moyen pondéré ou du premier entré, premier sorti (à préciser).`,
    "C. DÉROGATIONS AUX POSTULATS ET CONVENTIONS COMPTABLES",
    "Néant (à compléter le cas échéant : nature de la dérogation, justification, incidence sur le patrimoine, la situation financière et le résultat).",
  ] };
}

function note31(R, ident = {}, eff = null) {
  const N = R.N, P = R.P1;
  const ln = (l, f) => ({ l, cells: [f(N), P.vide ? null : f(P)] });
  return { cols: ["Nature des indications", "Exercice N", "Exercice N-1"], rows: [
    { l: "STRUCTURE DU CAPITAL À LA CLÔTURE DE L'EXERCICE", h: true },
    ln("Capital social", x => x.pas.CA),
    { l: "OPÉRATIONS ET RÉSULTATS DE L'EXERCICE", h: true },
    ln("Chiffre d'affaires hors taxes", x => x.cr.XB), ln("Résultat des activités ordinaires (RAO)", x => x.cr.XG), ln("Participation des travailleurs aux bénéfices", x => x.cr.RQ),
    ln("Impôt sur les bénéfices et profits (IBP)", x => x.cr.RS), ln("Résultat net", x => x.cr.XI),
    { l: "RÉSULTAT ET DIVIDENDES DISTRIBUÉS", h: true },
    { l: "Résultat distribué au cours de l'exercice", cells: [R.tft ? -R.tft.FN : null, null] },
    { l: "PERSONNEL ET POLITIQUE SALARIALE", h: true },
    ln("Masse salariale distribuée (661, 662, 663)", x => x.s(["661", "662", "663"])), ln("Avantages sociaux versés (664, 668)", x => x.s(["664", "668"])),
    ln("Personnel extérieur facturé à l'entité (637, 667)", x => x.s(["637", "667"])),
    ...(eff ? [{ l: "Effectif du personnel propre (note 27B)", cells: [eff.tot.YE.te, null], u: "n" }, { l: "Effectif du personnel extérieur (note 27B)", cells: [eff.tot.YL.te, null], u: "n" }] : []),
  ], ctrl: [] };
}

function note34(R) {
  const N = R.N, P = R.P1;
  const cafg = x => x.cr.XI + x.s(["68", "69", "85"]) + x.s(["79", "86"]) + x.s(["81", "654"]) + x.s(["82", "754"]);
  const fr = x => x.pas.DF - x.act.AZ.n, bfg = x => x.act.BK.n + x.act.BU.n - x.pas.DP - x.pas.DV, tn = x => fr(x) - bfg(x);
  const pct = (a, b) => b ? a / b * 100 : null;
  const ln = (l, f, u) => ({ l, cells: [f(N), P.vide ? null : f(P)], u });
  return { cols: ["Indicateurs", "Année N", "Année N-1", "Variation %"], var: true, rows: [
    { l: "ANALYSE DE L'ACTIVITÉ — SOLDES INTERMÉDIAIRES DE GESTION", h: true },
    ln("Chiffre d'affaires", x => x.cr.XB), ln("Marge commerciale", x => x.cr.XA), ln("Valeur ajoutée", x => x.cr.XC), ln("Excédent brut d'exploitation (EBE)", x => x.cr.XD),
    ln("Résultat d'exploitation", x => x.cr.XE), ln("Résultat financier", x => x.cr.XF), ln("Résultat des activités ordinaires", x => x.cr.XG),
    ln("Résultat hors activités ordinaires", x => x.cr.XH), ln("Résultat net", x => x.cr.XI),
    ln("Capacité d'autofinancement globale (CAFG)", cafg),
    { l: "ANALYSE DE LA RENTABILITÉ", h: true },
    ln("Rentabilité économique = Résultat d'exploitation / (Capitaux propres + dettes financières) (%)", x => pct(x.cr.XE, x.pas.CP + x.pas.DD), "%"),
    ln("Rentabilité financière = Résultat net / Capitaux propres (%)", x => pct(x.cr.XI, x.pas.CP), "%"),
    ln("Taux de marge nette = Résultat net / Chiffre d'affaires (%)", x => pct(x.cr.XI, x.cr.XB), "%"),
    { l: "ANALYSE DE LA STRUCTURE FINANCIÈRE", h: true },
    ln("Capitaux propres et ressources assimilées", x => x.pas.CP), ln("Dettes financières et autres ressources assimilées", x => x.pas.DD),
    ln("Ressources stables (1)", x => x.pas.DF), ln("Actif immobilisé net (2)", x => x.act.AZ.n), ln("FONDS DE ROULEMENT (3) = (1) − (2)", fr),
    ln("Actif circulant et écart de conversion-actif (4)", x => x.act.BK.n + x.act.BU.n), ln("Passif circulant et écart de conversion-passif (5)", x => x.pas.DP + x.pas.DV), ln("BESOIN DE FINANCEMENT GLOBAL (6) = (4) − (5)", bfg),
    ln("TRÉSORERIE NETTE (7) = (3) − (6)", tn), ln("Contrôle : trésorerie actif − trésorerie passif", x => x.act.BT.n - x.pas.DT),
    { l: "ANALYSE DE LA VARIATION DE LA TRÉSORERIE", h: true },
    { l: "Flux de trésorerie des activités opérationnelles", cells: [R.tft ? R.tft.ZB : null, null] },
    { l: "Flux de trésorerie des activités d'investissement", cells: [R.tft ? R.tft.ZC : null, null] },
    { l: "Flux de trésorerie des activités de financement", cells: [R.tft ? R.tft.ZF : null, null] },
    { l: "ANALYSE DE L'ENDETTEMENT", h: true },
    ln("Endettement financier brut (dettes financières + trésorerie passif)", x => x.pas.DA + x.pas.DB + x.pas.DT),
    ln("Endettement financier net (brut − trésorerie actif)", x => x.pas.DA + x.pas.DB + x.pas.DT - x.act.BT.n),
    ln("Ratio d'autonomie financière = Dettes financières / Capitaux propres", x => x.pas.CP ? (x.pas.DA + x.pas.DB) / x.pas.CP : null, "x"),
  ].map(r => r.h || !r.cells ? r : { ...r, cells: [...r.cells, r.u || r.cells[1] == null || !r.cells[1] ? null : (r.cells[0] - r.cells[1]) / Math.abs(r.cells[1]) * 100] }),
  ctrl: [{ lib: "Trésorerie nette (FR − BFG) = BT − DT", note: tn(N), etat: N.act.BT.n - N.pas.DT, ok: Math.abs(tn(N) - (N.act.BT.n - N.pas.DT)) < 0.5 }] };
}

// ── Saisies structurées : échéanciers, actionnaires, effectifs ────────────────────
// Échéancier : l'apprenant ventile deux tranches, la troisième est déduite du solde N (colonne « reste »).
export const ECHEANCES = { "4": "c", "7": "a", "8": "a", "16A": "c", "17": "a", "18": "a", "19": "a" };
export const TRANCHES = [["a", "À un an au plus"], ["b", "À plus d'un an et à deux ans au plus"], ["c", "À plus de deux ans"]];
function computeEch(note, saisie = {}) {
  const rest = ECHEANCES[note.id], inp = saisie.ech || {};
  const rows = [];
  const tot = { n: 0, a: 0, b: 0, c: 0 };
  note.rows.forEach((r, i) => {
    if (r.h || r.tot || ["dep", "d1", "d2"].includes(r.k) || !(Math.abs(r.n) > 0.5)) return;
    const e = inp[i] || {}, v = { a: num(e.a), b: num(e.b), c: num(e.c) };
    v[rest] = r.n - TRANCHES.filter(([k]) => k !== rest).reduce((t, [k]) => t + v[k], 0);
    rows.push({ i, l: r.l, n: r.n, ...v, neg: v[rest] < -0.5 });
    tot.n += r.n; tot.a += v.a; tot.b += v.b; tot.c += v.c;
  });
  return { rest, rows, tot, ok: !rows.some(r => r.neg) };
}

export const NATURES_TITRES = ["Actions ordinaires", "Actions de préférence", "Parts sociales", "Certificats d'investissement"];
function computeActionnaires(R, saisie = {}) {
  const a = saisie.act || {}, nominal = num(a.nominal);
  const rows = (a.rows || []).map(x => ({ ...x, montant: num(x.nb) * nominal }));
  const total = rows.reduce((t, x) => t + x.montant, 0), nb = rows.reduce((t, x) => t + num(x.nb), 0);
  rows.forEach(x => { x.pct = total ? x.montant / total * 100 : null; });
  const capital = -R.N.s(["10", "!105", "!106", "!109"]);
  return { nominal, rows, total, nb, capital, ok: !rows.length || Math.abs(total - capital) < 0.5 };
}

// Effectifs : 6 colonnes (Nationaux, autres États de l'OHADA, hors OHADA × M / F) pour les effectifs et la masse salariale
export const EFF_COLS = ["Nationaux M", "Nationaux F", "OHADA M", "OHADA F", "Hors OHADA M", "Hors OHADA F"];
export const EFF_PROPRE = [["YA", "1. Cadres supérieurs"], ["YB", "2. Techniciens supérieurs et cadres moyens"], ["YC", "3. Techniciens, agents de maîtrise et ouvriers qualifiés"],
  ["YD", "4. Employés, manœuvres, ouvriers et apprentis"]];
export const EFF_STATUT = [["YF", "Permanents"], ["YG", "Saisonniers"]];
export const EFF_EXT = [["YH", "1. Cadres supérieurs"], ["YI", "2. Techniciens supérieurs et cadres moyens"], ["YJ", "3. Techniciens, agents de maîtrise et ouvriers qualifiés"],
  ["YK", "4. Employés, manœuvres, ouvriers et apprentis"]];
function computeEffectifs(R, saisie = {}) {
  const e = saisie.eff || {};
  const line = code => { const x = e[code] || {}; const ef = EFF_COLS.map((_, i) => num((x.e || [])[i])), ms = EFF_COLS.map((_, i) => num((x.m || [])[i]));
    return { e: ef, m: ms, te: ef.reduce((a, b) => a + b, 0), tm: ms.reduce((a, b) => a + b, 0), f: num(x.f) }; };
  const sum = codes => { const ls = codes.map(line); return { e: EFF_COLS.map((_, i) => ls.reduce((t, l) => t + l.e[i], 0)), m: EFF_COLS.map((_, i) => ls.reduce((t, l) => t + l.m[i], 0)),
    te: ls.reduce((t, l) => t + l.te, 0), tm: ls.reduce((t, l) => t + l.tm, 0), f: ls.reduce((t, l) => t + l.f, 0) }; };
  const lines = Object.fromEntries([...EFF_PROPRE, ...EFF_STATUT, ...EFF_EXT].map(([c]) => [c, line(c)]));
  const tot = { YE: sum(EFF_PROPRE.map(x => x[0])), YL: sum(EFF_EXT.map(x => x[0])), ST: sum(EFF_STATUT.map(x => x[0])) };
  tot.YO = { te: tot.YE.te + tot.YL.te, tm: tot.YE.tm, f: tot.YL.f };
  const masseCompta = R.N.s(["661", "662", "663"]), saisi = tot.YE.te + tot.YL.te > 0;
  const ctrl = saisi ? [
    { lib: "Permanents + saisonniers (YF + YG) = total du personnel propre (YE)", note: tot.ST.te, etat: tot.YE.te, ok: Math.abs(tot.ST.te - tot.YE.te) < 0.5, n: true },
    { lib: "Masse salariale déclarée (YE) = rémunérations comptabilisées (661 à 663)", note: tot.YE.tm, etat: masseCompta, ok: Math.abs(tot.YE.tm - masseCompta) < 0.5 },
  ] : [];
  return { lines, tot, masseCompta, ctrl, saisi };
}

// ── Point d'entrée ─────────────────────────────────────────────────────────────
// saisies : { [id]: { a: "A" | "NA" | undefined (auto), txt: "commentaire" } }
export function computeNotes(R, saisies = {}, ident = {}, devise = "CDF") {
  return NOTES.map(n => {
    let res;
    if (n.t === "var") res = computeVar(n, R);
    else if (n.t === "mvt") res = computeMvt(n, R);
    else if (n.id === "2") res = note2(R, ident, devise);
    else if (n.id === "3D") res = note3D(R);
    else if (n.id === "31") { const ef = computeEffectifs(R, saisies["27B"]); res = note31(R, ident, ef.saisi ? ef : null); }
    else if (n.id === "34") res = note34(R);
    else res = {};
    const s = saisies[n.id] || {};
    if (ECHEANCES[n.id]) res.ech = computeEch({ ...n, ...res }, s);
    if (n.id === "13") res.act = computeActionnaires(R, s);
    if (n.id === "27B") { res.eff = computeEffectifs(R, s); res.ctrl = res.eff.ctrl; }
    const chiffres = (res.rows || []).some(r => (r.cells || [r.n, r.n1]).some(v => v && Math.abs(v) > 0.5));
    const auto = n.t === "txt" ? !!(s.txt && s.txt.trim()) || !!(res.eff && res.eff.saisi) : n.id === "2" || chiffres;
    if (res.ech && !res.ech.ok) res.ctrl = [...(res.ctrl || []), { lib: "Échéancier : tranches supérieures au solde", note: 0, etat: 0, ok: false, info: true }];
    if (res.act && res.act.rows.length) res.ctrl = [...(res.ctrl || []), { lib: "Répartition du capital entre associés = capital social", note: res.act.total, etat: res.act.capital, ok: res.act.ok }];
    return { ...n, ...res, txt: s.txt || "", applicable: s.a ? s.a === "A" : auto, auto, force: s.a || null };
  });
}

export const fmtPct = v => v == null || !isFinite(v) ? "" : `${v >= 0 ? "+" : ""}${v.toFixed(1).replace(".", ",")} %`;
export { fmt, num };
