import { MODULES_EDUF, NB_Q_FINAL_EDUF } from "./modules";
import { SIMULATEURS_EDUF } from "./Simulateurs";
import { budget, credit, epargne, pouvoirAchat } from "./calculs";
import { EXAMENS, elementsParcours, etatParcours, evaluer, PARCOURS } from "../attest/regles";
import { EXAMENS_FINAUX } from "../parcours/examens";
import { texteModuleEduf } from "../audio/lecture";

const KINDS = ["flux", "arbre", "tableau", "cartes", ...Object.keys(SIMULATEURS_EDUF)];

test("8 modules complets : essentiel, schémas, pièges, références, narration et 15 questions", () => {
  expect(MODULES_EDUF.map(m => m.id)).toEqual(["EF1", "EF2", "EF3", "EF4", "EF5", "EF6", "EF7", "EF8"]);
  expect(MODULES_EDUF.filter(m => m.libre).map(m => m.id)).toEqual(["EF1", "EF2", "EF3"]);
  const titres = new Set();
  for (const m of MODULES_EDUF) {
    expect(m.blocs[0].type).toBe("essentiel");
    expect(m.blocs.some(b => b.type === "pieges")).toBe(true);
    expect(m.blocs.some(b => b.type === "articles")).toBe(true);
    const sch = m.blocs.filter(b => b.type === "schema");
    expect(sch.length).toBeGreaterThanOrEqual(1);
    sch.forEach(b => expect(KINDS).toContain(b.kind));
    m.blocs.filter(b => b.type === "exemple").forEach(b => b.lignes.forEach(l => expect(typeof l[1]).toBe("number")));
    expect(m.narration.length).toBeGreaterThanOrEqual(5);
    expect(texteModuleEduf(m).length).toBeGreaterThan(m.narration.length);
    expect(m.qcm).toHaveLength(15);
    m.qcm.forEach(q => {
      expect(q.r).toHaveLength(4); expect(new Set(q.r).size).toBe(4); expect(q.b).toBe(0); expect(q.e).toBeTruthy();
      expect(titres.has(q.q)).toBe(false); titres.add(q.q);
    });
  }
});

test("les trois simulateurs sont utilisés dans les leçons", () => {
  const kinds = MODULES_EDUF.flatMap(m => m.blocs.filter(b => b.type === "schema").map(b => b.kind));
  for (const k of Object.keys(SIMULATEURS_EDUF)) expect(kinds).toContain(k);
});

test("les exemples chiffrés des leçons sont justes", () => {
  const ex = (id, titre) => MODULES_EDUF.find(m => m.id === id).blocs.find(b => b.type === "exemple" && b.titre.includes(titre)).lignes.map(l => l[1]);
  // EF1 : 800 000 − 580 000 − 140 000
  expect(budget({ revenu: 800000, essentiel: 580000, autres: 140000 })).toMatchObject({ reste: 80000, tauxEpargne: 10 });
  expect(ex("EF1", "KABEYA").at(-1)).toBe(80000);
  // EF4 : crédit de M. LUKUSA
  const c = credit({ capital: 1000000, tauxAnnuel: 24, mois: 12, frais: 20000 });
  expect(ex("EF4", "LUKUSA")).toEqual([1000000, c.mensualite, c.totalRembourse, c.interets, 20000, c.coutTotal]);
  // EF2 : 10 000 FC par semaine pendant un an
  expect(epargne({ versement: 10000, frequence: "semaine", mois: 12 }).verse).toBe(520000);
  // EF5 : sac de riz à 30 USD ; perte de pouvoir d'achat à 1 % d'inflation mensuelle
  expect(ex("EF5", "riz")).toEqual([30 * 2800, 30 * 3080, 30 * 280]);
  expect(pouvoirAchat(100000, 1, 12)).toBe(88745);
  // EF6 : 500 000 FC à « 20 % par mois » pendant 12 mois, contre 6 % par an
  expect(ex("EF6", "20 %")).toEqual([500000, Math.round(500000 * 1.2 ** 12), 530000]);
  // EF7 : 104 000 − 24 000 ; EF8 : (3 000 000 − 500 000) ÷ 24
  expect(ex("EF7", "congélateur").at(-1)).toBe(4000 * 26 - 24000);
  expect(ex("EF8", "Esther").at(-1)).toBe(Math.round(2500000 / 24));
});

test("parcours certifiant : 8 modules d'une heure, examen final de 30 questions tiré des QCM", () => {
  expect(PARCOURS.find(p => p.id === "EDUF")).toMatchObject({ certificat: true, court: "Éducation financière" });
  expect(EXAMENS.EDUF).toMatchObject({ cle: "EF-FINAL", nbQ: NB_Q_FINAL_EDUF, vue: "eduf", progressif: true });
  const el = elementsParcours("EDUF", []);
  expect(el.map(e => e.cle)).toEqual(["EF-EF1", "EF-EF2", "EF-EF3", "EF-EF4", "EF-EF5", "EF-EF6", "EF-EF7", "EF-EF8", "EF-FINAL"]);
  expect(evaluer("EDUF", [], {}).heures).toBe(9);
  const banque = EXAMENS_FINAUX.EDUF.charger();
  expect(banque).toHaveLength(120);
  expect(new Set(banque.map(q => q.m))).toEqual(new Set(MODULES_EDUF.map(m => m.id)));
  // ouverture progressive : EF2 s'ouvre après EF1 réussi
  const et = etatParcours("EDUF", [], { scores: { "EF-EF1": { pct: 80 } } });
  expect(et.elements.map(e => e.ouvert).slice(0, 3)).toEqual([true, true, false]);
});
