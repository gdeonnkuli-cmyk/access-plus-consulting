// ── CONTEXTE RÉPUBLIQUE DÉMOCRATIQUE DU CONGO ─────────────────────────────────────
// Identification de l'entité (DGI-RDC, RCCM, Id. Nat., NIF…) et détermination de l'IBP.
import { num } from "./engine";

export const DEVISES = [["CDF", "Francs congolais (CDF)"], ["USD", "Dollars américains (USD)"]];
export const FORMES = ["SA", "SARL", "SARLU", "SAS", "SASU", "SNC", "SCS", "GIE", "Société coopérative", "Établissement (entreprise individuelle)", "Succursale"];
export const PROVINCES = ["Kinshasa", "Kongo-Central", "Kwango", "Kwilu", "Mai-Ndombe", "Kasaï", "Kasaï-Central", "Kasaï-Oriental", "Lomami", "Sankuru",
  "Maniema", "Sud-Kivu", "Nord-Kivu", "Ituri", "Haut-Uele", "Bas-Uele", "Tshopo", "Tshuapa", "Mongala", "Nord-Ubangi", "Sud-Ubangi", "Équateur",
  "Haut-Lomami", "Lualaba", "Haut-Katanga", "Tanganyika"];
export const CENTRES = ["DGE — Direction des Grandes Entreprises", "CDI — Centre des Impôts (moyennes entreprises)", "CIS — Centre d'Impôt Synthétique (petites entreprises)"];

// Champs de la fiche d'identification (sections de la page de garde et de la fiche R1)
export const IDENTITE = [
  { t: "Désignation de l'entité" },
  { k: "sigle", l: "Sigle usuel" },
  { k: "forme", l: "Forme juridique", opts: FORMES },
  { k: "capital", l: "Capital social", num: true },
  { k: "activite", l: "Activité principale exercée", wide: true },
  { t: "Adresse" },
  { k: "avenue", l: "Avenue et numéro" },
  { k: "quartier", l: "Quartier" },
  { k: "commune", l: "Commune / Territoire" },
  { k: "ville", l: "Ville" },
  { k: "province", l: "Province", opts: PROVINCES },
  { k: "tel", l: "Téléphone" },
  { k: "email", l: "E-mail" },
  { t: "Immatriculations" },
  { k: "rccm", l: "N° RCCM", ph: "CD/KNG/RCCM/24-B-00000" },
  { k: "idnat", l: "Identification nationale (Id. Nat.)", ph: "01-XXXX-NXXXXXX" },
  { k: "nif", l: "Numéro Impôt (NIF)", ph: "A0000000X" },
  { k: "centre", l: "Centre fiscal de rattachement", opts: CENTRES },
  { k: "cnss", l: "N° d'affiliation CNSS" },
  { k: "inpp", l: "N° INPP" },
  { k: "onem", l: "N° ONEM" },
  { k: "impexp", l: "N° import-export" },
  { t: "Exercice et arrêté des comptes" },
  { k: "dateArrete", l: "Date d'arrêté des comptes", date: true },
  { k: "duree", l: "Durée de l'exercice (mois)", ph: "12" },
  { k: "dureeN1", l: "Durée de l'exercice précédent (mois)", ph: "12" },
  { k: "ago", l: "États financiers approuvés par l'AG", opts: ["Non", "Oui"] },
  { t: "Établissement des états financiers" },
  { k: "comptable", l: "Professionnel ayant établi les états financiers" },
  { k: "onec", l: "N° d'inscription au tableau de l'ONEC" },
  { k: "signataire", l: "Signataire des états financiers" },
  { k: "qualite", l: "Qualité du signataire", ph: "Directeur général" },
  { k: "banques", l: "Domiciliations bancaires (banque — n° de compte)", wide: true, rows: 2 },
  { k: "dirigeants", l: "Dirigeants (nom, qualité, adresse)", wide: true, rows: 3 },
];

// ── Impôt sur les Bénéfices et Profits (IBP) ─────────────────────────────────────
// Taux et minimum d'imposition paramétrables : à aligner sur la loi de finances de l'exercice.
export const FISC_DEFAUT = { tauxIBP: 30, tauxMin: 1, plafondDef: 60, provAdmises: false, reint: [], deduc: [], deficits: 0, acomptes: 0 };
// Provisions non déductibles (art. 46-6°) : dotations réintégrées, reprises déduites (déjà taxées à la dotation).
// Exception : provisions minières et provisions pour créances douteuses des établissements de crédit (provAdmises).
export const PROV_DOTATIONS = [["659", "Charges pour dépréciations et provisions à court terme d'exploitation (659)"], ["679", "Charges pour dépréciations et provisions financières à court terme (679)"],
  ["691", "Dotations aux provisions et dépréciations d'exploitation (691)"], ["697", "Dotations aux provisions et dépréciations financières (697)"],
  ["853", "Dotations aux dépréciations HAO (853)"], ["854", "Dotations aux provisions pour risques HAO (854)"]];
export const PROV_REPRISES = [["759", "Reprises de charges pour dépréciations et provisions à court terme d'exploitation (759)"], ["779", "Reprises de charges pour dépréciations et provisions financières à court terme (779)"],
  ["791", "Reprises de provisions et dépréciations d'exploitation (791)"], ["797", "Reprises de provisions et dépréciations financières (797)"],
  ["863", "Reprises de dépréciations HAO (863)"], ["864", "Reprises de provisions pour risques HAO (864)"]];
// Impôt forfaitaire des entreprises en activité sans chiffre d'affaires (art. 92, par. 2, O.-L. n° 69/009)
export const FORFAIT_SANS_CA = { GE: 2500000, ME: 750000, PE: 30000 };
export const CATEGORIES = [["GE", "Grande entreprise (DGE)"], ["ME", "Moyenne entreprise (CDI)"], ["PE", "Entreprise de petite taille (CIS)"]];
export const categorieDe = centre => /^DGE/.test(centre || "") ? "GE" : /^CIS/.test(centre || "") ? "PE" : "ME";

export function computeIBP(R, f = {}) {
  const N = R.N, cfg = { ...FISC_DEFAUT, ...f };
  const ibpCompta = N.cr.RS;
  const rai = N.cr.XI + ibpCompta; // résultat comptable avant impôt
  const prov = !cfg.provAdmises;
  const auto = [{ lib: "Amendes et pénalités (647)", m: Math.max(N.s("647"), 0), auto: true },
    ...(prov ? PROV_DOTATIONS.map(([c, lib]) => ({ lib: `${lib}, art. 46-6°`, m: Math.max(N.s(c), 0), auto: true })) : [])].filter(x => x.m);
  const autoD = prov ? PROV_REPRISES.map(([c, lib]) => ({ lib: `${lib}, provisions déjà réintégrées`, m: Math.max(-N.s(c), 0), auto: true })).filter(x => x.m) : [];
  const reint = [...auto, ...(cfg.reint || []).map(x => ({ lib: x.lib, m: num(x.m) }))];
  const deduc = [...autoD, ...(cfg.deduc || []).map(x => ({ lib: x.lib, m: num(x.m) }))];
  const tR = reint.reduce((s, x) => s + x.m, 0), tD = deduc.reduce((s, x) => s + x.m, 0);
  const avantDef = rai + tR - tD;
  // Imputation des déficits antérieurs plafonnée à 60 % du bénéfice fiscal avant imputation (art. 42)
  const plafondImput = Math.max(avantDef, 0) * num(cfg.plafondDef) / 100;
  const imput = Math.min(Math.max(num(cfg.deficits), 0), plafondImput);
  const rf = avantDef - imput;
  const ibpTheo = Math.max(rf, 0) * num(cfg.tauxIBP) / 100;
  // Art. 92 : impôt minimum de 1 % du CA déclaré lorsque le résultat est déficitaire ou que l'IBP
  // calculé lui est inférieur ; impôt forfaitaire selon la catégorie si aucun chiffre d'affaires
  const ca = Math.max(N.cr.XB, 0), sansCA = !ca && !N.vide;
  const minimum = sansCA ? FORFAIT_SANS_CA[cfg.categorie] ?? FORFAIT_SANS_CA.ME : ca * num(cfg.tauxMin) / 100;
  const enPerte = rf <= 0;
  const ibp = Math.max(ibpTheo, minimum);
  const acomptes = num(cfg.acomptes);
  return { rai, reint, deduc, tR, tD, avantDef, imput, rf, ibpTheo, minimum, ibp, minApplique: minimum > ibpTheo, enPerte, sansCA, ibpCompta, plafondImput, defReport: Math.max(num(cfg.deficits), 0) - imput, ecart: ibp - ibpCompta, acomptes, solde: ibp - acomptes, cfg };
}
