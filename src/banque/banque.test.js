import { MODULES_BQ } from "./modules";
import { BANQUE_BQ } from "./examen";
import { elementsParcours, etatParcours } from "../attest/regles";
import { texteModuleBanque } from "../audio/lecture";
import planListe from "./plan.json";

const plan = new Map(planListe);
const KINDS = ["flux", "chronologie", "arbre", "tableau", "cartes"];
// Numéros de comptes GCEC cités dans un texte : 2 à 4 chiffres précédés d'un repère comptable (D, C, compte, en, /)
const comptesCites = t => [...String(t).matchAll(/(?:\b[DC] |compte |comptes |\(|\/ ?|en |, )(\d{2,4})\b/g)].map(m => m[1]).filter(n => !/^(19|20)\d\d$/.test(n));

test("8 modules complets, chacun avec schémas, pièges, narration et 12 questions", () => {
  expect(MODULES_BQ.map(m => m.id)).toEqual(["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"]);
  expect(MODULES_BQ.filter(m => m.libre).map(m => m.id)).toEqual(["B1"]);
  for (const m of MODULES_BQ) {
    expect(m.blocs[0].type).toBe("essentiel");
    expect(m.blocs.some(b => b.type === "pieges")).toBe(true);
    const sch = m.blocs.filter(b => b.type === "schema");
    expect(sch.length).toBeGreaterThanOrEqual(2);
    sch.forEach(b => expect(KINDS).toContain(b.kind));
    m.blocs.filter(b => b.type === "exemple").forEach(b => b.lignes.forEach(l => expect(typeof l[1]).toBe("number")));
    expect(m.narration.length).toBeGreaterThanOrEqual(6);
    expect(m.qcm).toHaveLength(12);
    m.qcm.forEach(q => { expect(q.r).toHaveLength(4); expect(new Set(q.r).size).toBe(4); expect(q.b).toBe(0); });
  }
});

test("les numéros de comptes cités dans les tableaux et les écritures existent dans le plan du GCEC", () => {
  const manquants = [];
  let verifies = 0;
  for (const m of MODULES_BQ) for (const b of m.blocs) {
    // tableaux dont la première colonne liste des comptes ; écritures « D … / C … » des exemples
    const colComptes = b.type === "schema" && b.kind === "tableau" && /^(Compte|Sous-compte)/.test(b.entetes[0]);
    const nums = colComptes ? b.lignes.flatMap(l => String(l[0]).split(/[^0-9]+/).filter(x => x.length >= 2))
      : b.type === "exemple" ? b.lignes.flatMap(l => comptesCites(String(l[0]).replace(/^.*?\(?(D \d)/, "$1"))).filter(n => /[DC] \d/.test(b.lignes.map(x => x[0]).join(" "))) : [];
    for (const n of nums) { verifies++; if (!plan.has(n)) manquants.push(`${m.id}:${n}`); }
  }
  for (const q of [...MODULES_BQ.flatMap(m => m.qcm), ...BANQUE_BQ]) for (const n of q.c || []) { verifies++; if (!plan.has(n)) manquants.push(`QCM:${n}`); }
  expect(manquants).toEqual([]);
  expect(verifies).toBeGreaterThan(80);
  expect(comptesCites("D 570 / C 331")).toEqual(["570", "331"]);
});

test("exemples chiffrés justes", () => {
  const ex = (id, titre) => MODULES_BQ.find(m => m.id === id).blocs.find(b => b.type === "exemple" && b.titre.startsWith(titre)).lignes.map(l => l[1]);
  const b3 = ex("B3", "Un client");
  expect(b3[3]).toBe(20000000 * 0.18 * 2 / 12);
  expect(b3[4]).toBeCloseTo(10000000 * 0.06 * 2 / 12);
  const b4 = ex("B4", "Solde");
  expect(b4[0] + b4[1]).toBe(b4[2]);
  const b5 = ex("B5", "Refinancement");
  expect(b5[1]).toBe(Math.round(50000000 * 0.26 * 7 / 360));
  expect(ex("B6", "Conversion")[0]).toBe(100000 * (2790 + 2810) / 2);
  const b7 = ex("B7", "Déclassement");
  expect(b7[0] + b7[1]).toBe(b7[2]);
  expect(b7[2] + b7[3]).toBe(b7[4]);
  expect(b7[4] * 0.5).toBe(b7[5]);
  const b8 = ex("B8", "Calcul");
  expect(b8[0] + b8[1]).toBe(b8[2]);
  expect(b8[2] + b8[3]).toBe(b8[4]);
  expect(b8[4] + b8[5]).toBe(b8[6]);
  expect(b8[6] + b8[7]).toBe(b8[8]);
  expect(b8[8] + b8[9]).toBe(b8[10]);
  expect(Math.round(b8[8] * 0.3)).toBe(-b8[9]);
});

test("examen final : 45 questions couvrant les 8 modules ; parcours avec examen coefficient 2", () => {
  expect(BANQUE_BQ.length).toBeGreaterThanOrEqual(45);
  expect(new Set(BANQUE_BQ.map(q => q.q)).size).toBe(BANQUE_BQ.length);
  for (const m of MODULES_BQ) expect(BANQUE_BQ.filter(q => q.m === m.id).length).toBeGreaterThanOrEqual(5);
  BANQUE_BQ.forEach(q => { expect(q.r).toHaveLength(4); expect(new Set(q.r).size).toBe(4); });
  const el = elementsParcours("BANQUE", []);
  expect(el.map(e => e.cle)).toEqual(["BQ-B1", "BQ-B2", "BQ-B3", "BQ-B4", "BQ-B5", "BQ-B6", "BQ-B7", "BQ-B8", "BQ-FINAL"]);
  expect(el[8].coef).toBe(2);
  expect(etatParcours("BANQUE", [], { scores: { "BQ-B1": { pct: 75 } } }).elements.slice(0, 3).map(e => e.ouvert)).toEqual([true, true, false]);
});

test("audio : narration lisible, sans sigle épelé de travers", () => {
  for (const m of MODULES_BQ) {
    const segs = texteModuleBanque(m);
    expect(segs.length).toBeGreaterThan(6);
    segs.forEach(x => expect(x).not.toMatch(/\bGCEC\b|\bBCC\b|\bPNB\b/));
  }
});
