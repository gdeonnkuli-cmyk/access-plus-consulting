import { liquidationTVA, prorata, arrondiCentaine } from "./tva";
import F12 from "./modules/F12";

test("déclaration de juin de la SARL BOMOKO (exemple 1 du module F12)", () => {
  const r = liquidationTVA({ ventes: 60000000, services: 6000000, achats: 35000000, immobilisations: 5000000, carburant: 3000000, exclus: 2700000, douane: 2400000, credit: 400000 });
  expect(r).toMatchObject({ collectee: 10560000, deductible: 9040000, aPayer: 1120000, creditReporte: 0, perdue: 672000 });
});

test("prorata arrondi à l'unité supérieure (exemple 2) et sans effet d'arrondi flottant", () => {
  expect(prorata(45, 70)).toBe(65);
  expect(prorata(70, 100)).toBe(70);
  expect(prorata(38, 50)).toBe(76);
  expect(prorata(0, 0)).toBe(100);
  expect(liquidationTVA({ ventes: 45000000, exonerees: 25000000, achats: 25000000 })).toMatchObject({ prorata: 65, deductible: 2600000, aPayer: 4600000 });
});

test("exportateur en crédit : remboursement plafonné à 16 % des exportations (cas du module F6)", () => {
  const r = liquidationTVA({ ventes: 20000000, exportations: 200000000, achats: 250000000 });
  expect(r).toMatchObject({ collectee: 3200000, creditReporte: 36800000, remboursable: 32000000, aPayer: 0 });
});

test("arrondi de la déclaration à la centaine (D. art. 137)", () => {
  expect([arrondiCentaine(3520049), arrondiCentaine(3520050), arrondiCentaine(1234560)]).toEqual([3520000, 3520100, 1234600]);
});

test("les résultats des exemples du module F12 sont exacts", () => {
  const ex = F12.blocs.filter(b => b.type === "exemple");
  const fin = e => e.lignes[e.lignes.length - 1][1];
  expect(ex.map(fin)).toEqual([1120000, 4600000, 3200000]);
  const somme = (e, a, b) => e.lignes.slice(a, b).reduce((s, l) => s + l[1], 0);
  expect(somme(ex[0], 0, 2)).toBe(10560000);
  expect(somme(ex[0], 3, 8)).toBe(9040000);
});
