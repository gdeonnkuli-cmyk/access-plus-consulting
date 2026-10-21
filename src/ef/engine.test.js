import { computeAll } from "./engine";
import { computeIBP } from "./rdc";
import { CAS_PRATIQUES, CAS_MEUBLES } from "./casPratiques";
import { computeNotes } from "./notes";

const cas = id => CAS_PRATIQUES.find(x => x.id === id);
// Balance d'origine du manuel (IBP du manuel), pour vérifier que le moteur reproduit les états publiés
const manuel = () => ({ ...cas("meubles-fleuve"), lignes: CAS_MEUBLES });

test("le cas du manuel reproduit Bilan, Compte de résultat et TFT publiés", () => {
  const c = manuel();
  const r = computeAll(c.lignes, c.complementsCorriges);
  expect(Math.round(r.N.act.BZ.n)).toBe(1054424478);
  expect(Math.round(r.P1.act.BZ.n)).toBe(446088093);
  expect(Math.round(r.N.cr.XI)).toBe(215389710);
  const t = r.tft;
  const refs = ["ZA", "FA", "FB", "FC", "FD", "FE", "ZB", "FF", "FG", "FH", "FI", "FJ", "ZC", "FK", "FL", "FN", "FO", "FQ", "ZG", "ZH"];
  expect(refs.map(k => Math.round(t[k]))).toEqual([74584157, 241773904, -2000000, -2691705, -45792222, -21054994, 170234983, -2000000,
    -327218000, -601175, 367119, 730043, -328722013, 200000000, 2000000, -90000000, 100000000, -5000000, 48512970, 123097127]);
});

test("le cas KIN NÉGOCE passe tous les contrôles et l'IBP comptabilisé est exact", () => {
  const c = cas("kin-negoce");
  const r = computeAll(c.lignes, c.complementsCorriges);
  expect(r.ctrl.every(x => x.ok)).toBe(true);
  expect(Math.round(computeIBP(r, {}).ecart)).toBe(0);
});

test("avec les mouvements N, le TFT du manuel se calcule sans informations complémentaires", () => {
  const c = manuel();
  const t = computeAll(c.lignes, {}).tft;
  expect([t.FH, t.FJ, t.FO, t.FQ, t.ZH].map(Math.round)).toEqual([-601175, 730043, 100000000, -5000000, 123097127]);
});

test("les notes annexes concordent avec le Bilan et le Compte de résultat", () => {
  for (const id of ["meubles-fleuve", "kin-negoce"]) {
    const c = cas(id);
    const R = computeAll(c.lignes, c.complementsCorriges);
    const notes = computeNotes(R, {});
    const ecarts = notes.flatMap(n => (n.ctrl || []).filter(x => !x.ok).map(x => `${id} note ${n.id} : ${x.lib}`));
    expect(ecarts).toEqual([]);
    const n3a = notes.find(n => n.id === "3A"), tot = n3a.rows[n3a.rows.length - 1].cells;
    expect(Math.round(tot[0] + tot[1] - tot[2])).toBe(Math.round(tot[3]));
  }
});

test("saisies structurées : échéancier, associés, effectifs", () => {
  const c = cas("meubles-fleuve");
  const R = computeAll(c.lignes, {});
  const saisies = {
    "16A": { ech: { 1: { a: 5000000, b: 10000000 } } },
    "13": { act: { nominal: 10000, rows: [{ nom: "A", nb: 30000 }, { nom: "B", nb: 10000 }] } },
    "27B": { eff: { YA: { e: [3, 1], m: [60000000, 20000000] }, YF: { e: [4] } } },
  };
  const notes = computeNotes(R, saisies);
  const n16 = notes.find(n => n.id === "16A"), l = n16.ech.rows.find(r => r.i === 1);
  expect([l.n, l.a, l.b, l.c].map(Math.round)).toEqual([92499075, 5000000, 10000000, 77499075]);
  const n13 = notes.find(n => n.id === "13");
  expect(n13.act.total).toBe(400000000);
  expect(n13.act.ok).toBe(true);
  expect(n13.act.rows[0].pct).toBe(75);
  const n27 = notes.find(n => n.id === "27B");
  expect(n27.applicable).toBe(true);
  expect(n27.eff.tot.YE.te).toBe(4);
  expect(n27.ctrl[0].ok).toBe(true);
  expect(n27.ctrl[1].ok).toBe(false); // 80 M saisis contre 179,5 M comptabilisés
});

test("le cas MALACHITE LOGISTIQUE (services) boucle sans informations complémentaires", () => {
  const c = cas("malachite-logistique");
  const R = computeAll(c.lignes, {});
  expect(R.ctrl.every(x => x.ok)).toBe(true);
  const t = R.tft;
  expect([R.N.cr.XI, t.FA, t.FE, t.ZB, t.FG, t.FI, t.FN, t.FQ, t.ZH].map(Math.round))
    .toEqual([17900000, 110900000, 12100000, 83800000, -20000000, 12000000, -12000000, -48000000, 333300000]);
  expect(computeNotes(R, {}).flatMap(n => (n.ctrl || []).filter(x => !x.ok))).toEqual([]);
  expect(Math.round(computeIBP(R, {}).ecart)).toBe(0);
});

test("IBP (art. 92) : le plus élevé de 30 % du résultat fiscal et de l'impôt minimum de 1 % du CA", () => {
  const R = (xi, ca, rs = 0) => ({ N: { cr: { XI: xi, RS: rs, XB: ca }, s: () => 0 } });
  // bénéfice dont l'IBP à 30 % (300 000) est inférieur à 1 % du CA (500 000) : impôt minimum
  const b = computeIBP(R(1000000, 50000000));
  expect(b.ibp).toBe(500000); expect(b.minApplique).toBe(true); expect(b.enPerte).toBe(false);
  // bénéfice dont l'IBP à 30 % (3 000 000) dépasse le minimum : taux de l'IBP
  const g = computeIBP(R(10000000, 50000000));
  expect(g.ibp).toBe(3000000); expect(g.minApplique).toBe(false);
  // perte : impôt minimum
  const p = computeIBP(R(-2000000, 50000000));
  expect(p.ibp).toBe(500000); expect(p.minApplique).toBe(true); expect(p.enPerte).toBe(true);
  // résultat fiscal nul après imputation des déficits : impôt minimum
  const z = computeIBP(R(1000000, 50000000), { deficits: 3000000 });
  expect(z.rf).toBe(0); expect(z.ibp).toBe(500000);
  // aucun chiffre d'affaires : impôt forfaitaire selon la catégorie
  expect(computeIBP(R(-1000000, 0)).ibp).toBe(750000);
  expect(computeIBP(R(-1000000, 0), { categorie: "GE" }).ibp).toBe(2500000);
  expect(computeIBP(R(-1000000, 0), { categorie: "PE" }).sansCA).toBe(true);
});

test("cas MEUBLES DU FLEUVE adapté à la RDC : IBP de 30 % comptabilisé, états équilibrés", () => {
  const c = cas("meubles-fleuve");
  const r = computeAll(c.lignes, c.complementsCorriges);
  const I = computeIBP(r, {});
  expect(Math.round(I.ibp)).toBe(73974573);
  expect(Math.round(I.ecart)).toBe(0);
  expect(Math.round(r.N.cr.XI)).toBe(215389710 - 42872373);
  expect(Math.round(r.N.act.BZ.n)).toBe(Math.round(r.N.pas.DZ));
  expect(Math.round(r.tft.ZH)).toBe(123097127);
});

test("cas MINOTERIE DU KASAÏ en perte : minimum d'IBP de 1 % du CA, TFT hors écart de conversion", () => {
  const c = cas("minoterie-kasai");
  const r = computeAll(c.lignes, c.complementsCorriges);
  expect(r.ctrl.every(x => x.ok)).toBe(true);
  expect(r.N.nonMap).toEqual([]);
  const I = computeIBP(r, {});
  expect([I.rai, I.rf, I.ibp, I.ecart].map(Math.round)).toEqual([-48500000, -47000000, 4800000, 0]);
  expect(I.enPerte).toBe(true);
  expect(Math.round(r.N.cr.XI)).toBe(-53300000);
  expect(Math.round(r.N.act.BZ.n)).toBe(Math.round(r.N.pas.DZ));
  expect(Math.round(r.N.pas.CP)).toBe(263500000);
  const t = r.tft;
  // la réévaluation de l'emprunt en USD (16 crédité par 4784) n'est pas un nouvel emprunt
  expect([t.FA, t.ZB, t.ZC, t.FN, t.FO, t.FQ, t.ZG, t.ZH].map(Math.round))
    .toEqual([6700000, -11200000, -30000000, -15000000, 0, -30000000, -86200000, 66300000]);
  expect(computeNotes(r, {}).flatMap(n => (n.ctrl || []).filter(x => !x.ok))).toEqual([]);
});
