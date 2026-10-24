import { CLASSES_REV } from ".";
import { corriger, enonce, reservoir, tirer } from "./exercice";

const X = require("./complements.json");
const classes = CLASSES_REV.map(([k]) => {
  const C = require(`./classe${k}.json`);
  return { ...C, comptes: C.comptes.map(x => ({ ...x, ...X[x.c] })) };
});
const vente = { op: "Vente de marchandises à crédit", l: [[["4111"], ["7011", "4431"]]] };

test("réservoir : toutes les écritures types, par classe ou en entier", () => {
  expect(reservoir(classes).length).toBe(270);
  expect(reservoir(classes, 4).every(q => q.k === 4)).toBe(true);
  const t = tirer(reservoir(classes, 4), 10, () => 0.5);
  expect(t.length).toBe(10);
  expect(new Set(t.map(q => q.id)).size).toBe(10);
});

test("correction : bonne réponse, racine à 3 chiffres acceptée, ordre libre", () => {
  expect(corriger(vente, [{ c: "4111", s: "D" }, { c: "7011", s: "C" }, { c: "4431", s: "C" }]).ok).toBe(true);
  expect(corriger(vente, [{ c: "443", s: "C" }, { c: "701", s: "C" }, { c: "411", s: "D" }]).ok).toBe(true);
  const r = corriger(vente, [{ c: "4112", s: "D" }, { c: "7015", s: "C" }, { c: "4431", s: "C" }]);
  expect(r.ok).toBe(true);
  expect(r.lignes.map(l => l.etat)).toEqual(["ok", "proche", "ok"]);
});

test("correction : sens inversé, compte trop vague, compte faux, ligne manquante", () => {
  const r = corriger(vente, [{ c: "4111", s: "C" }, { c: "70", s: "C" }, { c: "4452", s: "D" }]);
  expect(r.ok).toBe(false);
  expect(r.lignes.map(l => l.etat)).toEqual(["sens", "vague", "faux"]);
  expect(r.manquants.map(m => m.n)).toEqual(["4111", "7011", "4431"]);
  const r2 = corriger(vente, [{ c: "4111", s: "D" }, { c: "7011", s: "C" }]);
  expect(r2.ok).toBe(false);
  expect(r2.nOk).toBe(2);
  expect(r2.manquants).toEqual([{ n: "4431", s: "C" }]);
});

test("correction : banque X / Banque Y équivalentes, compte de liaison au débit et au crédit", () => {
  const e = { op: "Retrait en banque pour alimenter la caisse", l: [[["585"], ["5211"]], [["5711"], ["585"]]] };
  expect(corriger(e, [{ c: "585", s: "D" }, { c: "5212", s: "C" }, { c: "571", s: "D" }, { c: "585", s: "C" }]).ok).toBe(true);
  expect(corriger(e, [{ c: "585", s: "D" }, { c: "52", s: "C" }, { c: "571", s: "D" }, { c: "585", s: "C" }]).lignes[1].etat).toBe("vague");
});

test("énoncés : précision du moyen de règlement et énoncés dédiés", () => {
  expect(enonce({ op: "Avance au personnel", l: [[["4211"], ["5711"]]] })).toBe("Avance au personnel (en espèces)");
  expect(enonce({ op: "Dividendes reçus", l: [[["5211"], ["772"]]] })).toBe("Dividendes reçus (par banque)");
  const q = reservoir(classes, 6).find(x => x.c === "64" && x.e.op === "Paiement");
  expect(enonce(q.e)).toMatch(/impôt foncier/);
  // chaque écriture type est réussie avec sa propre correction
  for (const { e } of reservoir(classes)) {
    const saisie = e.l.flatMap(([D, C]) => [...D.map(c => ({ c, s: "D" })), ...C.map(c => ({ c, s: "C" }))]);
    expect(corriger(e, saisie).ok).toBe(true);
  }
});
