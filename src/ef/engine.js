// ── MOTEUR ÉTATS FINANCIERS SYSCOHADA RÉVISÉ (Système Normal) ─────────────────
// Balance → rattachement des comptes aux rubriques → Bilan, Compte de résultat, TFT, contrôles.
// Une ligne de balance : {c:"5211", l:"Banque", dn, cn, dn1, cn1} (soldes débit/crédit N et N-1).

// ── Rattachement compte → rubrique (le préfixe le plus long l'emporte) ─────────
// Valeur : "REF" (rubrique fixe) ou {d:"REF actif si solde débiteur", c:"REF passif si solde créditeur"}.
const RULES = {
  // Classe 1 — Ressources durables
  "10": "CA", "101": "CA", "102": "CA", "103": "CA", "104": "CA", "105": "CD", "106": "CE", "109": "CB",
  "11": "CG", "111": "CF", "112": "CF", "113": "CF", "118": "CG",
  "12": "CH", "13": "CJ", "14": "CL", "15": "CM",
  "16": "DA", "17": "DB", "18": { d: "BJ", c: "DM" }, "181": "DA", "182": "DA", "183": "DA", "184": "DA",
  "19": "DC",
  // Classe 2 — Actif immobilisé
  "21": "AH", "211": "AE", "2181": "AE", "2191": "AE", "212": "AF", "213": "AF", "214": "AF", "2193": "AF",
  "215": "AG", "216": "AG", "217": "AH", "218": "AH", "2198": "AH",
  "22": "AJ",
  "23": "AK", "231": "AK", "232": "AK", "233": "AK", "237": "AK", "2391": "AK",
  "234": "AL", "235": "AL", "238": "AL", "2392": "AL", "2393": "AL",
  "24": "AM", "245": "AN", "2495": "AN",
  "25": "AP", "26": "AR", "27": "AS",
  // Classe 3 — Stocks
  "3": "BB",
  // Classe 4 — Tiers (soldes variables)
  "40": { d: "BH", c: "DJ" }, "41": { d: "BI", c: "DI" },
  "42": { d: "BJ", c: "DK" }, "43": { d: "BJ", c: "DK" }, "44": { d: "BJ", c: "DK" },
  "45": { d: "BJ", c: "DM" }, "46": { d: "BJ", c: "DM" }, "47": { d: "BJ", c: "DM" },
  "478": "BU", "479": "DV",
  "48": { d: "BA", c: "DH" }, "499": "DN",
  // Classe 5 — Trésorerie
  "50": "BQ", "51": "BR", "5": { d: "BS", c: "DR" }, "56": { d: "BS", c: "DR" }, "564": "DQ", "565": "DQ",
  "599": "DN",
  // Classe 6 — Charges
  "60": "RE", "601": "RA", "602": "RC", "603": "RB", "6031": "RB", "6032": "RD", "6033": "RF",
  "604": "RE", "605": "RE", "608": "RE",
  "61": "RG", "62": "RH", "63": "RH", "64": "RI", "65": "RJ", "66": "RK", "67": "RM",
  "68": "RL", "687": "RN", "69": "RL", "697": "RN",
  // Classe 7 — Produits
  "70": "TD", "701": "TA", "702": "TB", "703": "TB", "704": "TB", "705": "TC", "706": "TC", "707": "TD",
  "71": "TG", "72": "TF", "73": "TE", "75": "TH", "77": "TK",
  "78": "TI", "781": "TI", "787": "TM", "79": "TJ", "797": "TL",
  // Classe 8 — Autres charges et produits (HAO)
  "81": "RO", "82": "TN", "83": "RP", "84": "TO", "85": "RP", "86": "TO", "87": "RQ", "88": "TO", "89": "RS",
};

const lookup = c => {
  for (let n = c.length; n > 0; n--) { const r = RULES[c.slice(0, n)]; if (r) return r; }
  return null;
};

// Rattachement d'un compte. amort=true : colonne « Amortissements / Dépréciations » de l'actif.
export function mapCompte(compte) {
  const c = String(compte || "").replace(/\s/g, "");
  if (!/^[1-8]\d*$/.test(c)) return null;
  if (/^2[89]/.test(c)) { const r = lookup("2" + c.slice(2)); return r ? { r, amort: true } : null; }
  if (c.startsWith("39")) return { r: "BB", amort: true };
  if (c.startsWith("49") && !c.startsWith("499")) return { r: c.startsWith("490") ? "BH" : c.startsWith("491") ? "BI" : "BJ", amort: true };
  if (c.startsWith("59") && !c.startsWith("599")) return { r: c.startsWith("590") ? "BQ" : c.startsWith("591") ? "BR" : "BS", amort: true };
  const r = lookup(c);
  return r ? { r, amort: false } : null;
}

// ── Structure des états ─────────────────────────────────────────────────────────
// t: "d" détail, "s" sous-total, "t" total ; f: formule [[signe, ref], …]
const S = (...refs) => refs.map(r => [1, r]);
export const ACTIF = [
  { ref: "AD", lib: "IMMOBILISATIONS INCORPORELLES", t: "s", f: S("AE", "AF", "AG", "AH") },
  { ref: "AE", lib: "Frais de développement et de prospection", t: "d" },
  { ref: "AF", lib: "Brevets, licences, logiciels et droits similaires", t: "d" },
  { ref: "AG", lib: "Fonds commercial et droit au bail", t: "d" },
  { ref: "AH", lib: "Autres immobilisations incorporelles", t: "d" },
  { ref: "AI", lib: "IMMOBILISATIONS CORPORELLES", t: "s", f: S("AJ", "AK", "AL", "AM", "AN") },
  { ref: "AJ", lib: "Terrains", t: "d" },
  { ref: "AK", lib: "Bâtiments", t: "d" },
  { ref: "AL", lib: "Aménagements, agencements et installations", t: "d" },
  { ref: "AM", lib: "Matériel, mobilier et actifs biologiques", t: "d" },
  { ref: "AN", lib: "Matériel de transport", t: "d" },
  { ref: "AP", lib: "AVANCES ET ACOMPTES VERSÉS SUR IMMOBILISATIONS", t: "s", f: [] },
  { ref: "AQ", lib: "IMMOBILISATIONS FINANCIÈRES", t: "s", f: S("AR", "AS") },
  { ref: "AR", lib: "Titres de participation", t: "d" },
  { ref: "AS", lib: "Autres immobilisations financières", t: "d" },
  { ref: "AZ", lib: "TOTAL ACTIF IMMOBILISÉ (I)", t: "t", f: S("AD", "AI", "AP", "AQ") },
  { ref: "BA", lib: "ACTIF CIRCULANT HAO", t: "s", f: [] },
  { ref: "BB", lib: "STOCKS ET ENCOURS", t: "s", f: [] },
  { ref: "BG", lib: "CRÉANCES ET EMPLOIS ASSIMILÉS", t: "s", f: S("BH", "BI", "BJ") },
  { ref: "BH", lib: "Fournisseurs, avances versées", t: "d" },
  { ref: "BI", lib: "Clients", t: "d" },
  { ref: "BJ", lib: "Autres créances", t: "d" },
  { ref: "BK", lib: "TOTAL ACTIF CIRCULANT (II)", t: "t", f: S("BA", "BB", "BG") },
  { ref: "BQ", lib: "Titres de placement", t: "d" },
  { ref: "BR", lib: "Valeurs à encaisser", t: "d" },
  { ref: "BS", lib: "Banques, chèques postaux, caisse et assimilés", t: "d" },
  { ref: "BT", lib: "TOTAL TRÉSORERIE-ACTIF (III)", t: "t", f: S("BQ", "BR", "BS") },
  { ref: "BU", lib: "Écart de conversion-Actif (IV)", t: "d" },
  { ref: "BZ", lib: "TOTAL GÉNÉRAL (I+II+III+IV)", t: "t", f: S("AZ", "BK", "BT", "BU") },
];
export const PASSIF = [
  { ref: "CA", lib: "Capital", t: "d" },
  { ref: "CB", lib: "Apporteurs capital non appelé (-)", t: "d" },
  { ref: "CD", lib: "Primes liées au capital social", t: "d" },
  { ref: "CE", lib: "Écarts de réévaluation", t: "d" },
  { ref: "CF", lib: "Réserves indisponibles", t: "d" },
  { ref: "CG", lib: "Réserves libres", t: "d" },
  { ref: "CH", lib: "Report à nouveau (+ ou -)", t: "d" },
  { ref: "CJ", lib: "Résultat net de l'exercice (bénéfice + ou perte -)", t: "d" },
  { ref: "CL", lib: "Subventions d'investissement", t: "d" },
  { ref: "CM", lib: "Provisions réglementées", t: "d" },
  { ref: "CP", lib: "TOTAL CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES (I)", t: "t", f: S("CA", "CB", "CD", "CE", "CF", "CG", "CH", "CJ", "CL", "CM") },
  { ref: "DA", lib: "Emprunts et dettes financières diverses", t: "d" },
  { ref: "DB", lib: "Dettes de location-acquisition", t: "d" },
  { ref: "DC", lib: "Provisions pour risques et charges", t: "d" },
  { ref: "DD", lib: "TOTAL DETTES FINANCIÈRES ET RESSOURCES ASSIMILÉES (II)", t: "t", f: S("DA", "DB", "DC") },
  { ref: "DF", lib: "TOTAL RESSOURCES STABLES (I+II)", t: "t", f: S("CP", "DD") },
  { ref: "DH", lib: "Dettes circulantes HAO", t: "d" },
  { ref: "DI", lib: "Clients, avances reçues", t: "d" },
  { ref: "DJ", lib: "Fournisseurs d'exploitation", t: "d" },
  { ref: "DK", lib: "Dettes fiscales et sociales", t: "d" },
  { ref: "DM", lib: "Autres dettes", t: "d" },
  { ref: "DN", lib: "Provisions pour risques à court terme", t: "d" },
  { ref: "DP", lib: "TOTAL PASSIF CIRCULANT (III)", t: "t", f: S("DH", "DI", "DJ", "DK", "DM", "DN") },
  { ref: "DQ", lib: "Banques, crédits d'escompte", t: "d" },
  { ref: "DR", lib: "Banques, établissements financiers et crédits de trésorerie", t: "d" },
  { ref: "DT", lib: "TOTAL TRÉSORERIE-PASSIF (IV)", t: "t", f: S("DQ", "DR") },
  { ref: "DV", lib: "Écart de conversion-Passif (V)", t: "d" },
  { ref: "DZ", lib: "TOTAL GÉNÉRAL (I+II+III+IV+V)", t: "t", f: S("DF", "DP", "DT", "DV") },
];
const M = r => [-1, r];
export const CR = [
  { ref: "TA", lib: "Ventes de marchandises", t: "d", s: "+" },
  { ref: "RA", lib: "Achats de marchandises", t: "d", s: "-" },
  { ref: "RB", lib: "Variation de stocks de marchandises", t: "d", s: "-/+" },
  { ref: "XA", lib: "MARGE COMMERCIALE (Somme TA à RB)", t: "s", f: [[1, "TA"], M("RA"), M("RB")] },
  { ref: "TB", lib: "Ventes de produits fabriqués", t: "d", s: "+" },
  { ref: "TC", lib: "Travaux, services vendus", t: "d", s: "+" },
  { ref: "TD", lib: "Produits accessoires", t: "d", s: "+" },
  { ref: "XB", lib: "CHIFFRE D'AFFAIRES (A + B + C + D)", t: "s", f: S("TA", "TB", "TC", "TD") },
  { ref: "TE", lib: "Production stockée (ou déstockage)", t: "d", s: "-/+" },
  { ref: "TF", lib: "Production immobilisée", t: "d", s: "+" },
  { ref: "TG", lib: "Subventions d'exploitation", t: "d", s: "+" },
  { ref: "TH", lib: "Autres produits", t: "d", s: "+" },
  { ref: "TI", lib: "Transferts de charges d'exploitation", t: "d", s: "+" },
  { ref: "RC", lib: "Achats de matières premières et fournitures liées", t: "d", s: "-" },
  { ref: "RD", lib: "Variation de stocks de matières premières et fournitures liées", t: "d", s: "-/+" },
  { ref: "RE", lib: "Autres achats", t: "d", s: "-" },
  { ref: "RF", lib: "Variation de stocks d'autres approvisionnements", t: "d", s: "-/+" },
  { ref: "RG", lib: "Transports", t: "d", s: "-" },
  { ref: "RH", lib: "Services extérieurs", t: "d", s: "-" },
  { ref: "RI", lib: "Impôts et taxes", t: "d", s: "-" },
  { ref: "RJ", lib: "Autres charges", t: "d", s: "-" },
  { ref: "XC", lib: "VALEUR AJOUTÉE (XB + RA + RB) + (Somme TE à RJ)", t: "s", f: [[1, "XA"], ...S("TB", "TC", "TD", "TE", "TF", "TG", "TH", "TI"), ...["RC", "RD", "RE", "RF", "RG", "RH", "RI", "RJ"].map(M)] },
  { ref: "RK", lib: "Charges de personnel", t: "d", s: "-" },
  { ref: "XD", lib: "EXCÉDENT BRUT D'EXPLOITATION (XC + RK)", t: "s", f: [[1, "XC"], M("RK")] },
  { ref: "TJ", lib: "Reprises d'amortissements, de provisions et dépréciations", t: "d", s: "+" },
  { ref: "RL", lib: "Dotations aux amortissements, aux provisions et dépréciations", t: "d", s: "-" },
  { ref: "XE", lib: "RÉSULTAT D'EXPLOITATION (XD + TJ + RL)", t: "s", f: [[1, "XD"], [1, "TJ"], M("RL")] },
  { ref: "TK", lib: "Revenus financiers et assimilés", t: "d", s: "+" },
  { ref: "TL", lib: "Reprises de provisions et dépréciations financières", t: "d", s: "+" },
  { ref: "TM", lib: "Transferts de charges financières", t: "d", s: "+" },
  { ref: "RM", lib: "Frais financiers et charges assimilées", t: "d", s: "-" },
  { ref: "RN", lib: "Dotations aux provisions et aux dépréciations financières", t: "d", s: "-" },
  { ref: "XF", lib: "RÉSULTAT FINANCIER (Somme TK à RN)", t: "s", f: [[1, "TK"], [1, "TL"], [1, "TM"], M("RM"), M("RN")] },
  { ref: "XG", lib: "RÉSULTAT DES ACTIVITÉS ORDINAIRES (XE + XF)", t: "s", f: S("XE", "XF") },
  { ref: "TN", lib: "Produits des cessions d'immobilisations", t: "d", s: "+" },
  { ref: "TO", lib: "Autres produits HAO", t: "d", s: "+" },
  { ref: "RO", lib: "Valeurs comptables des cessions d'immobilisations", t: "d", s: "-" },
  { ref: "RP", lib: "Autres charges HAO", t: "d", s: "-" },
  { ref: "XH", lib: "RÉSULTAT HORS ACTIVITÉS ORDINAIRES (Somme TN à RP)", t: "s", f: [[1, "TN"], [1, "TO"], M("RO"), M("RP")] },
  { ref: "RQ", lib: "Participation des travailleurs", t: "d", s: "-" },
  { ref: "RS", lib: "Impôts sur le résultat", t: "d", s: "-" },
  { ref: "XI", lib: "RÉSULTAT NET (XG + XH + RQ + RS)", t: "t", f: [[1, "XG"], [1, "XH"], M("RQ"), M("RS")] },
];
export const TFT = [
  { ref: "ZA", lib: "Trésorerie nette au 1er janvier (Trésorerie actif N-1 − Trésorerie passif N-1)", t: "t" },
  { ref: "_1", lib: "Flux de trésorerie provenant des activités opérationnelles", t: "h" },
  { ref: "FA", lib: "Capacité d'Autofinancement Globale (CAFG)", t: "d" },
  { ref: "FB", lib: "− Actif circulant HAO", t: "d" },
  { ref: "FC", lib: "− Variation des stocks", t: "d" },
  { ref: "FD", lib: "− Variation des créances", t: "d" },
  { ref: "FE", lib: "+ Variation du passif circulant", t: "d" },
  { ref: "ZB", lib: "Flux de trésorerie provenant des activités opérationnelles (Somme FA à FE)", t: "s" },
  { ref: "_2", lib: "Flux de trésorerie provenant des activités d'investissement", t: "h" },
  { ref: "FF", lib: "− Décaissements liés aux acquisitions d'immobilisations incorporelles", t: "d" },
  { ref: "FG", lib: "− Décaissements liés aux acquisitions d'immobilisations corporelles", t: "d" },
  { ref: "FH", lib: "− Décaissements liés aux acquisitions d'immobilisations financières", t: "d" },
  { ref: "FI", lib: "+ Encaissements liés aux cessions d'immobilisations incorporelles et corporelles", t: "d" },
  { ref: "FJ", lib: "+ Encaissements liés aux cessions d'immobilisations financières", t: "d" },
  { ref: "ZC", lib: "Flux de trésorerie provenant des activités d'investissement (Somme FF à FJ)", t: "s" },
  { ref: "_3", lib: "Flux de trésorerie provenant du financement par les capitaux propres", t: "h" },
  { ref: "FK", lib: "+ Augmentations de capital par apports nouveaux", t: "d" },
  { ref: "FL", lib: "+ Subventions d'investissement reçues", t: "d" },
  { ref: "FM", lib: "− Prélèvements sur le capital", t: "d" },
  { ref: "FN", lib: "− Dividendes versés", t: "d" },
  { ref: "ZD", lib: "Flux de trésorerie provenant des capitaux propres (Somme FK à FN)", t: "s" },
  { ref: "_4", lib: "Trésorerie provenant du financement par les capitaux étrangers", t: "h" },
  { ref: "FO", lib: "+ Emprunts", t: "d" },
  { ref: "FP", lib: "+ Autres dettes financières", t: "d" },
  { ref: "FQ", lib: "− Remboursements des emprunts et autres dettes financières", t: "d" },
  { ref: "ZE", lib: "Flux de trésorerie provenant des capitaux étrangers (Somme FO à FQ)", t: "s" },
  { ref: "ZF", lib: "Flux de trésorerie provenant des activités de financement (D + E)", t: "s" },
  { ref: "ZG", lib: "VARIATION DE LA TRÉSORERIE NETTE DE LA PÉRIODE (B + C + F)", t: "t" },
  { ref: "ZH", lib: "Trésorerie nette au 31 décembre (G + A)", t: "t" },
];

export const LIB = Object.fromEntries([...ACTIF, ...PASSIF, ...CR, ...TFT].map(x => [x.ref, x.lib]));
export const sideOf = ref => /^[AB]/.test(ref) ? "A" : /^[CD]/.test(ref) ? "P" : /^[TR]/.test(ref) ? "CR" : null;

// ── Utilitaires ─────────────────────────────────────────────────────────────────
export const num = v => {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const s = String(v ?? "").replace(/[\s  ]/g, "").replace(/,/g, ".");
  const n = parseFloat(s.replace(/[^0-9.-]/g, ""));
  return isFinite(n) ? n : 0;
};
const r2 = v => Math.round(v * 100) / 100;

// Import d'une balance collée depuis Excel (tabulations) ou CSV (; ou ,).
// Colonnes : Compte | Intitulé | Débit N | Crédit N | [Débit N-1 | Crédit N-1]
export function parseBalance(text) {
  const out = [];
  for (const raw of String(text || "").split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const sep = raw.includes("\t") ? "\t" : raw.includes(";") ? ";" : ",";
    const p = raw.split(sep).map(x => x.trim().replace(/^"|"$/g, ""));
    const c = (p[0] || "").replace(/\s/g, "");
    if (!/^[1-8]\d+$/.test(c)) continue; // en-têtes, totaux, lignes vides
    out.push({ c, l: p[1] || "", dn: num(p[2]), cn: num(p[3]), dn1: num(p[4]), cn1: num(p[5]) });
  }
  return out;
}

// ── Calcul d'un exercice (per = "n" ou "n1") ─────────────────────────────────────
function computePeriod(lignes, per) {
  const D = per === "n" ? "dn" : "dn1", C = per === "n" ? "cn" : "cn1";
  const A = {}, P = {}, R = {}, nonMap = [], detail = {};
  const add = (o, k, v) => { o[k] = (o[k] || 0) + v; };
  let td = 0, tc = 0, s13 = 0;
  const pref = {}; // soldes débiteurs par préfixe de 2 et 3 chiffres (pour le TFT)
  for (const x of lignes) {
    const d = num(x[D]), c = num(x[C]);
    if (!d && !c) continue;
    td += d; tc += c;
    const solde = d - c;
    for (const n of [2, 3]) add(pref, String(x.c).slice(0, n), solde);
    const m = mapCompte(x.c);
    if (!m) { nonMap.push(x.c); continue; }
    let ref = m.r;
    if (typeof ref === "object") ref = solde >= 0 ? ref.d : ref.c;
    (detail[ref] = detail[ref] || []).push(x.c);
    const side = sideOf(ref);
    if (side === "A") {
      A[ref] = A[ref] || { b: 0, a: 0 };
      if (m.amort) A[ref].a += c - d; else A[ref].b += solde;
    } else if (side === "P") {
      add(P, ref, -solde);
      if (ref === "CJ") s13 += -solde;
    } else {
      add(R, ref, ref[0] === "T" ? -solde : solde);
    }
  }
  // Compte de résultat
  const cr = {};
  for (const x of CR) cr[x.ref] = x.f ? x.f.reduce((s, [sg, r]) => s + sg * (cr[r] || 0), 0) : (R[x.ref] || 0);
  const has678 = lignes.some(x => /^[678]/.test(x.c) && (num(x[D]) || num(x[C])));
  // Le résultat de la balance (classes 6 à 8) vient s'ajouter au solde éventuel du compte 13
  P.CJ = (P.CJ || 0) + cr.XI;
  // Actif
  const act = {};
  const isTot = x => x.f && x.f.length;
  for (const x of ACTIF) if (!isTot(x)) { const v = A[x.ref] || { b: 0, a: 0 }; act[x.ref] = { b: v.b, a: v.a, n: v.b - v.a }; }
  for (const x of ACTIF) if (isTot(x)) {
    const b = x.f.reduce((s, [sg, r]) => s + sg * act[r].b, 0), a = x.f.reduce((s, [sg, r]) => s + sg * act[r].a, 0);
    act[x.ref] = { b, a, n: b - a };
  }
  const pas = {};
  for (const x of PASSIF) pas[x.ref] = x.f ? x.f.reduce((s, [sg, r]) => s + sg * pas[r], 0) : (P[x.ref] || 0);
  const s = p => pref[p] || 0; // solde débiteur d'un préfixe
  return { act, pas, cr, td: r2(td), tc: r2(tc), nonMap, detail, s13, has678, s, vide: !td && !tc };
}

// ── TFT (méthode SYSCOHADA révisé, variations sur valeurs nettes) ───────────────
// k : compléments saisis par l'apprenant (informations non déductibles de la balance)
function computeTFT(N, P1, k = {}) {
  const t = {};
  const dA = r => N.act[r].n - P1.act[r].n, dAb = r => N.act[r].b - P1.act[r].b, dP = r => N.pas[r] - P1.pas[r];
  const s = N.s;
  t.ZA = P1.act.BT.n - P1.pas.DT;
  // CAFG = Résultat net + dotations − reprises + VCC des cessions − produits des cessions
  const dot = s("68") + s("69") + s("85"), rep = -(s("79") + s("86"));
  t.FA = N.cr.XI + dot - rep + s("81") + s("82");
  t.FB = -dA("BA"); t.FC = -dA("BB"); t.FD = -dA("BG"); t.FE = dP("DP");
  t.ZB = t.FA + t.FB + t.FC + t.FD + t.FE;
  const cb = x => num(k[x]);
  t.FF = -(dAb("AD") + cb("cbIncorp"));
  t.FG = -(dAb("AI") + dAb("AP") + cb("cbCorp"));
  t.FH = -(dAb("AQ") + cb("cbFin"));
  const pcTot = -s("82");
  t.FJ = cb("pcFin"); t.FI = pcTot - t.FJ;
  t.ZC = t.FF + t.FG + t.FH + t.FI + t.FJ;
  t.FK = dP("CA") + dP("CB") + dP("CD");
  t.FL = dP("CL") - s("799");
  t.FM = -cb("prelev");
  t.FN = -(P1.pas.CJ - (dP("CF") + dP("CG") + dP("CH")));
  t.ZD = t.FK + t.FL + t.FM + t.FN;
  const dDette = dP("DA") + dP("DB");
  const nouv = k.nouvEmp !== undefined && k.nouvEmp !== "" ? cb("nouvEmp") : Math.max(dDette, 0);
  t.FO = nouv; t.FP = 0; t.FQ = dDette - nouv;
  t.ZE = t.FO + t.FP + t.FQ;
  t.ZF = t.ZD + t.ZE;
  t.ZG = t.ZB + t.ZC + t.ZF;
  t.ZH = t.ZG + t.ZA;
  t.tresoBilan = N.act.BT.n - N.pas.DT;
  return t;
}

// ── Contrôles de cohérence ─────────────────────────────────────────────────────
const eq = (a, b) => Math.abs(a - b) < 0.5;
function controls(N, P1, tft) {
  const L = [];
  const push = (ok, titre, detail, niv) => L.push({ ok, titre, detail, niv: ok ? "ok" : niv || "err" });
  push(!N.vide, "Balance N renseignée", N.vide ? "Saisissez ou importez la balance de l'exercice N." : `${fmt(N.td)} au débit / ${fmt(N.tc)} au crédit`);
  if (N.vide) return L;
  push(eq(N.td, N.tc), "Balance N équilibrée (Σ Débit = Σ Crédit)", eq(N.td, N.tc) ? "Les totaux débit et crédit sont égaux." : `Écart de ${fmt(N.td - N.tc)}`);
  if (!P1.vide) push(eq(P1.td, P1.tc), "Balance N-1 équilibrée", eq(P1.td, P1.tc) ? "Les totaux N-1 sont égaux." : `Écart de ${fmt(P1.td - P1.tc)}`);
  const nm = [...new Set([...N.nonMap, ...P1.nonMap])];
  push(!nm.length, "Tous les comptes sont rattachés à une rubrique", nm.length ? `Comptes non reconnus : ${nm.join(", ")}` : "Aucun compte orphelin.");
  push(eq(N.act.BZ.n, N.pas.DZ), "Bilan N équilibré (Actif = Passif)", `Actif ${fmt(N.act.BZ.n)} — Passif ${fmt(N.pas.DZ)}${eq(N.act.BZ.n, N.pas.DZ) ? "" : ` — écart ${fmt(N.act.BZ.n - N.pas.DZ)}`}`);
  if (!P1.vide) push(eq(P1.act.BZ.n, P1.pas.DZ), "Bilan N-1 équilibré", `Actif ${fmt(P1.act.BZ.n)} — Passif ${fmt(P1.pas.DZ)}`);
  push(!(N.has678 && Math.abs(N.s13) > 0.5), "Résultat non compté deux fois",
    N.has678 && Math.abs(N.s13) > 0.5 ? "La balance contient à la fois un compte 13 soldé et des comptes de gestion (6, 7, 8) : vérifiez qu'il s'agit bien d'une balance avant détermination du résultat." : `Résultat net ${fmt(N.cr.XI)} = poste CJ du bilan.`, "warn");
  // Sens anormaux
  const anomalies = [];
  for (const [ref, lib] of [["BB", "Stocks"], ["BS", "Trésorerie actif"]]) if (N.act[ref].b < -0.5) anomalies.push(`${lib} à solde créditeur`);
  if (N.pas.CA < -0.5) anomalies.push("Capital à solde débiteur");
  for (const r of ["AD", "AI", "AQ"]) if (N.act[r].n < -0.5) anomalies.push(`${LIB[r]} : valeur nette négative`);
  push(!anomalies.length, "Sens des soldes cohérents", anomalies.length ? anomalies.join(" · ") : "Pas de solde anormal détecté.", "warn");
  if (P1.vide) push(false, "TFT : balance N-1 nécessaire", "Le Tableau des flux de trésorerie se construit à partir des bilans N et N-1. Renseignez les colonnes N-1.", "warn");
  else push(eq(tft.ZH, tft.tresoBilan), "TFT : Trésorerie au 31/12 (ZH) = Trésorerie nette du bilan",
    `ZH ${fmt(tft.ZH)} — Bilan (BT − DT) ${fmt(tft.tresoBilan)}${eq(tft.ZH, tft.tresoBilan) ? "" : ` — écart ${fmt(tft.ZH - tft.tresoBilan)} : vérifiez les compléments (cessions, emprunts), les écarts de réévaluation ou de conversion.`}`, "warn");
  return L;
}

export const fmt = v => {
  const n = Math.round(num(v));
  return n ? n.toLocaleString("fr-FR").replace(/ /g, " ") : "-";
};

export function computeAll(lignes = [], complements = {}) {
  const N = computePeriod(lignes, "n"), P1 = computePeriod(lignes, "n1");
  const tft = P1.vide ? null : computeTFT(N, P1, complements);
  return { N, P1, tft, ctrl: controls(N, P1, tft || {}) };
}
