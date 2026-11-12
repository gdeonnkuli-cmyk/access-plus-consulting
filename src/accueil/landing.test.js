import { catalogue } from "./Landing";
import { PARCOURS } from "../attest/regles";

test("la page d'accueil publique présente tous les parcours certifiants, avec des chiffres tirés du catalogue", () => {
  const cat = catalogue();
  expect(cat.map(c => c.id).sort()).toEqual(PARCOURS.map(p => p.id).sort());
  for (const c of cat) { expect(c.court).toBeTruthy(); expect(c.resume).toBeTruthy(); expect(c.nbQ).toBeGreaterThanOrEqual(30); expect(c.contenu).toBeTruthy(); }
  expect(cat.find(c => c.id === "FISC").contenu).toBe("15 modules");
  expect(cat.find(c => c.id === "BANQUE").contenu).toBe("12 modules");
  // « 50+ modules et exercices » affiché dans l'en-tête
  expect(cat.reduce((a, c) => a + c.n, 0)).toBeGreaterThanOrEqual(50);
  expect(cat.filter(c => c.libre)).toHaveLength(5);
  // Éducation financière : 8 modules dont 3 gratuits (EF1 à EF3)
  expect(cat.find(c => c.id === "EDUF")).toMatchObject({ contenu: "8 modules", nLibres: 3 });
});
