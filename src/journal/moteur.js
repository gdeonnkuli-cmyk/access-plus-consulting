// ══════════════════ MOTEUR DE L'ATELIER « TENUE COMPTABLE » ══════════════════
// Vérifie l'écriture saisie par l'apprenant, complète le corrigé (liquidation de la TVA, IBP) et
// produit la balance N / N-1 au format du moteur des états financiers (src/ef/engine.js).
import { computeAll } from "../ef/engine";
import { computeIBP } from "../ef/rdc";

const net = l => (Number(l.d) || 0) - (Number(l.cr) || 0);
const chiffres = c => String(c || "").replace(/\D/g, "");
export const TOLERANCE = 5; // écart d'arrondi accepté par compte, en FC

// Groupes du corrigé : lignes rassemblées par racine de compte (préfixe accepté), avec leur solde attendu
export function groupes(lignes) {
  const G = [];
  for (const l of lignes) {
    const r = l.r || chiffres(l.c).slice(0, 3), alt = l.alt || [];
    const g = G.find(x => x.r === r);
    if (g) { g.attendu += net(l); g.comptes.push(l.c); g.alt = [...new Set([...g.alt, ...alt])]; }
    else G.push({ r, alt, comptes: [l.c], attendu: net(l) });
  }
  return G;
}
// Racine reconnue pour un compte saisi : la plus longue parmi les racines et variantes acceptées
const correspondance = (a, G) => {
  let best = null, lg = 0;
  G.forEach((g, i) => [g.r, ...g.alt].forEach(p => { if (a.startsWith(p) && p.length > lg) { best = i; lg = p.length; } }));
  return best;
};

// Vérification d'une écriture saisie : [{ c, d, cr }] → détail par compte attendu, comptes inattendus, équilibre
export function verifier(op, saisie = []) {
  const G = groupes(op.lignes).map(g => ({ ...g, saisi: 0, lignes: 0 }));
  const lignes = saisie.filter(l => chiffres(l.c) || Number(l.d) || Number(l.cr));
  const inattendus = [];
  let totD = 0, totC = 0;
  for (const l of lignes) {
    const a = chiffres(l.c), d = Number(l.d) || 0, c = Number(l.cr) || 0;
    totD += d; totC += c;
    const i = a.length >= 2 ? correspondance(a, G) : null;
    if (i == null) { if (d || c || a) inattendus.push(a || "?"); continue; }
    G[i].saisi += d - c; G[i].lignes++;
  }
  const detail = G.map(g => ({ ...g, ok: Math.abs(g.saisi - g.attendu) <= TOLERANCE }));
  const equilibre = Math.abs(totD - totC) <= 1 && totD > 0;
  const nOk = detail.filter(g => g.ok).length;
  return { ok: equilibre && !inattendus.length && nOk === detail.length, equilibre, totD, totC, detail, inattendus, nOk, nTotal: detail.length };
}

// ── Corrigé complet : opérations + liquidation de la TVA + IBP ──
const somme = (ops, pref) => ops.reduce((s, o) => s + o.lignes.filter(l => l.c.startsWith(pref)).reduce((t, l) => t + net(l), 0), 0);
export function liquidationTVA(ops, ouverture) {
  const collectee = -somme(ops, "443"), immo = somme(ops, "4451"), serv = somme(ops, "4454");
  const credit = ouverture.filter(l => l.c === "4449").reduce((s, l) => s + net(l), 0);
  const solde = collectee - immo - serv - credit;
  const L = (c, d, cr, x = {}) => ({ c, d, cr, ...x });
  return {
    date: "31/12/2021", inventaire: true, calcule: true,
    enonce: "Liquidez la TVA de l'exercice en une écriture de centralisation : soldez la TVA facturée et la TVA récupérable, imputez le crédit de TVA de l'ouverture et constatez la TVA due.",
    lignes: [L("4431", collectee, 0, { r: "443" }), L("4451", 0, immo, { r: "4451" }), L("4454", 0, serv, { r: "4454", alt: ["4452", "4453"] }), L("4449", 0, credit, { r: "4449" }),
      solde >= 0 ? L("4441", 0, solde, { r: "4441" }) : L("4449", -solde, 0, { r: "4449" })],
    expl: `TVA collectée ${collectee.toLocaleString("fr-FR")} − TVA récupérable sur immobilisations ${immo.toLocaleString("fr-FR")} − sur services ${serv.toLocaleString("fr-FR")} − crédit d'ouverture ${credit.toLocaleString("fr-FR")} = ${solde >= 0 ? `TVA due de ${solde.toLocaleString("fr-FR")} FC (4441)` : `crédit de ${(-solde).toLocaleString("fr-FR")} FC à reporter (4449)`}. Dans la réalité, cette liquidation se fait chaque mois, au plus tard le 15 du mois suivant (module F12).`,
  };
}

// Balance au format du moteur EF : soldes N-1 (ouverture), mouvements et soldes N
export function balance(ouverture, ops, libelles = {}) {
  const B = new Map();
  const get = c => { if (!B.has(c)) B.set(c, { c, l: libelles[c] || c, o: 0, md: 0, mc: 0 }); return B.get(c); };
  ouverture.forEach(l => { get(l.c).o += net(l); });
  ops.forEach(o => o.lignes.forEach(l => { const x = get(l.c); x.md += Number(l.d) || 0; x.mc += Number(l.cr) || 0; }));
  return [...B.values()].sort((a, b) => a.c.localeCompare(b.c)).map(x => {
    const s = x.o + x.md - x.mc;
    return { c: x.c, l: x.l, dn1: Math.max(x.o, 0), cn1: Math.max(-x.o, 0), md: x.md, mc: x.mc, dn: Math.max(s, 0), cn: Math.max(-s, 0) };
  });
}

export function corrigeComplet(cas) {
  const tva = liquidationTVA(cas.OPERATIONS, cas.OUVERTURE);
  const avantIBP = [...cas.OPERATIONS, tva];
  const R = computeAll(balance(cas.OUVERTURE, avantIBP, cas.LIBELLES));
  const fisc = computeIBP(R, {});
  const ibp = Math.round(fisc.ibp);
  const opIBP = {
    date: "31/12/2021", inventaire: true, calcule: true,
    enonce: "Constatez l'impôt sur les bénéfices (IBP) de l'exercice 2021 : 30 % du résultat fiscal (provisions réintégrées), sans pouvoir être inférieur à 1 % du chiffre d'affaires.",
    lignes: [{ c: "891", d: ibp, cr: 0, r: "891", alt: ["89"] }, { c: "441", d: 0, cr: ibp, r: "441" }],
    expl: `Résultat avant impôt ${Math.round(fisc.rai).toLocaleString("fr-FR")} FC + réintégrations ${Math.round(fisc.tR).toLocaleString("fr-FR")} (provisions, art. 46-6°) − déductions ${Math.round(fisc.tD).toLocaleString("fr-FR")} (reprises de provisions déjà réintégrées) = résultat fiscal ${Math.round(fisc.rf).toLocaleString("fr-FR")} FC. IBP = max(30 % × résultat fiscal ; 1 % × CA de ${Math.round(fisc.minimum / 0.01).toLocaleString("fr-FR")}) = ${ibp.toLocaleString("fr-FR")} FC.`,
  };
  const ops = [...avantIBP, opIBP].map((o, i) => ({ ...o, n: i + 1 }));
  const lignes = balance(cas.OUVERTURE, ops, cas.LIBELLES);
  return { ops, lignes, R: computeAll(lignes), fisc, ibp };
}
