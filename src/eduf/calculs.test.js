import { budget, credit, epargne, tauxEndettement, pouvoirAchat } from "./calculs";

test("budget : reste, taux d'épargne et déficit", () => {
  expect(budget({ revenu: 800000, essentiel: 520000, autres: 180000 })).toMatchObject({ depenses: 700000, reste: 100000, tauxEpargne: 12.5, deficit: false, objectif10: 80000 });
  expect(budget({ revenu: 500000, essentiel: 450000, autres: 100000 })).toMatchObject({ reste: -50000, tauxEpargne: 0, deficit: true });
});

test("crédit : mensualité constante, intérêts et coût total", () => {
  // 1 000 000 FC à 24 % par an sur 12 mois : mensualité 94 560 FC (formule de l'annuité)
  const r = credit({ capital: 1000000, tauxAnnuel: 24, mois: 12, frais: 20000 });
  expect(r.mensualite).toBe(94560);
  expect(r.interets).toBe(134715);
  expect(r.coutTotal).toBe(154715);
  expect(credit({ capital: 600000, tauxAnnuel: 0, mois: 6 })).toMatchObject({ mensualite: 100000, interets: 0 });
  expect(tauxEndettement(300000, 800000)).toBe(37.5);
});

test("épargne : versements hebdomadaires et intérêts composés", () => {
  expect(epargne({ versement: 10000, frequence: "semaine", mois: 12 })).toMatchObject({ verse: 520000, interets: 0, total: 520000 });
  const r = epargne({ versement: 50000, frequence: "mois", mois: 12, tauxAnnuel: 6 });
  expect(r.verse).toBe(600000);
  expect(r.interets).toBeGreaterThan(16000);
  expect(r.interets).toBeLessThan(17000);
  expect(pouvoirAchat(100000, 1, 12)).toBe(88745);
});
