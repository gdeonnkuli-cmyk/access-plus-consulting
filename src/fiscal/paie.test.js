import { calculPaie, iprMensuel, arrondiDizaine } from "./paie";
import F11 from "./modules/F11";

test("bulletin de l'exemple 1 du module F11 (SARL BOMOKO)", () => {
  const r = calculPaie({ base: 1200000, primes: 150000, logement: 300000, transport: 120000, allocations: 90000, charges: 4, taille: "1-50" });
  expect(r).toMatchObject({ brut: 1860000, assiette: 1350000, cnssSalarie: 67500, imposable: 1282500, ipr: 159100, net: 1633400,
    cnssEmployeur: 175500, inpp: 47250, onem: 6750, coutEmployeur: 2089500 });
});

test("logement au-delà de 30 % du salaire de base : l'excédent est imposable (exemple 3)", () => {
  const r = calculPaie({ base: 800000, logement: 400000, transport: 60000, charges: 2 });
  expect(r).toMatchObject({ logementImmunise: 240000, logementImposable: 160000, assiette: 960000, ipr: 112666, net: 1099334 });
});

test("IPR : SMIG, minimum mensuel, plafond de 30 % et 9 personnes à charge au plus", () => {
  expect(calculPaie({ base: 559000 }).ipr).toBe(60218);
  expect(iprMensuel(20000)).toBe(2000);
  // 100 000 000 FC par an : barème 32 206 720, ramené au plafond de 30 000 000
  expect(iprMensuel(100000000 / 12)).toBe(2500000);
  expect(iprMensuel(1282500, 12)).toBe(iprMensuel(1282500, 9));
});

test("arrondi à la dizaine (art. 88) et taux INPP selon l'effectif", () => {
  expect([arrondiDizaine(1234), arrondiDizaine(1235), arrondiDizaine(1236)]).toEqual([1230, 1230, 1240]);
  const a = { base: 1200000, primes: 150000 };
  expect(["1-50", "51-300", "300+", "public"].map(t => calculPaie({ ...a, taille: t }).inpp)).toEqual([47250, 40500, 27000, 54000]);
});

test("les exemples chiffrés du module F11 sont cohérents avec le moteur", () => {
  const ex = F11.blocs.filter(b => b.type === "exemple");
  const fin = e => e.lignes[e.lignes.length - 1][1];
  expect(fin(ex[0])).toBe(1633400);
  expect(fin(ex[1])).toBe(2089500);
  expect(fin(ex[2])).toBe(1099334);
  expect(fin(ex[3])).toBe(calculPaie({ base: 559000 }).net);
});
