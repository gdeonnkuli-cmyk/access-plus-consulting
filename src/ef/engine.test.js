import { computeAll } from "./engine";
import { computeIBP } from "./rdc";
import { CAS_PRATIQUES } from "./casPratiques";

const cas = id => CAS_PRATIQUES.find(x => x.id === id);

test("le cas du manuel reproduit Bilan, Compte de résultat et TFT publiés", () => {
  const c = cas("meubles-fleuve");
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
