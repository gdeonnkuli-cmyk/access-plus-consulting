import plan from "./plan.json";
import { CLASSES_REV, chercherPlan, chercherTexte, decouper, subdivisions } from ".";

const classes = CLASSES_REV.map(([k]) => require(`./classe${k}.json`));
const index = new Map(plan);

test("le guide couvre les 9 classes et chaque fiche a un contenu et un fonctionnement", () => {
  expect(classes.map(C => C.classe)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const fiches = classes.flatMap(C => C.comptes);
  expect(fiches.length).toBeGreaterThanOrEqual(80);
  for (const x of fiches) {
    expect(x.c).toMatch(/^\d{2}$/);
    expect(String(x.c)[0]).toBe(String(classes.find(C => C.comptes.includes(x)).classe));
    expect((x.contenu || []).length).toBeGreaterThan(0);
  }
});

test("le plan révisé : 4782 existe, 4784 non ; subdivisions du 478", () => {
  expect(index.get("4782")).toMatch(/augmentation des dettes/i);
  expect(index.has("4784")).toBe(false);
  expect(subdivisions(plan, "47").map(([c]) => c)).toEqual(expect.arrayContaining(["478", "4781", "4782", "4788"]));
  expect(plan.every(([, l]) => !/^\d{3} · /.test(l))).toBe(true);
});

test("recherche par numéro et par mot-clé", () => {
  expect(chercherPlan(plan, "601")[0][0]).toBe("601");
  expect(chercherPlan(plan, "location acquisition").length).toBeGreaterThan(0);
  expect(chercherPlan(plan, "credit bail", 5).length).toBeLessThanOrEqual(5);
  const r = chercherTexte(classes, "location-acquisition");
  expect(r.map(x => x.c)).toContain("17");
});

test("découpage : gras et numéros de compte cliquables, années et pourcentages exclus", () => {
  const p = decouper("Le **compte 40** reçoit, au compte 4011 — Fournisseurs, en 2018 un taux de 16 % ; voir comptes 21 et 24.", index);
  expect(p.find(x => x.gras).t).toBe("compte 40");
  const liens = p.filter(x => x.compte).map(x => x.compte);
  expect(liens).toEqual(["4011", "21", "24"]);
  expect(liens).not.toContain("2018");
});
