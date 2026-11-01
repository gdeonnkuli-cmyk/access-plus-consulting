import { FORMATIONS, prochaineEtape } from "./MesFormations";
import { PARCOURS, etatParcours, evaluer, FISC } from "../attest/regles";

const etape = (id, user, mods = []) => prochaineEtape(id, etatParcours(id, mods, user), evaluer(id, mods, user));
const tous = p => Object.fromEntries(FISC.map(([f]) => [`FISC-${f}`, { pct: p }]));

test("les 5 formations, dans l'ordre conseillé, correspondent aux parcours certifiants", () => {
  expect(FORMATIONS.map(f => f.id)).toEqual(["SYS-N1", "SYS-N2", "FISC", "FIN", "SYCEBNL"]);
  expect(new Set(FORMATIONS.map(f => f.id))).toEqual(new Set(PARCOURS.map(p => p.id)));
});

test("prochaine étape : commencer, continuer, reprendre, examen, certificat", () => {
  expect(etape("FISC", {})).toMatchObject({ go: "fisc", lib: "Commencer : F1 · Panorama du système fiscal congolais".replace("F1 · ", "") });
  expect(etape("FISC", { scores: { "FISC-F1": { pct: 90 } } }).lib).toMatch(/^Continuer : Impôt sur les bénéfices/);
  expect(etape("FISC", { scores: { "FISC-F1": { pct: 50 } } }).lib).toMatch(/^Reprendre : Panorama/);
  expect(etape("FISC", { scores: tous(85) })).toMatchObject({ go: "exam", v: "fisc", lib: "Passer l'examen final" });
  expect(etape("FISC", { scores: tous(75) }).lib).toMatch(/portez-la à 80 %/);
  expect(etape("FISC", { scores: { ...tous(85), "FISC-FINAL": { pct: 90 } } })).toMatchObject({ go: "res", lib: "Obtenir mon certificat" });
  // SYS-N2 : la monographie ZAO d'abord, puis le guide des comptes
  expect(etape("SYS-N2", {}).go).toBe("jrn");
  expect(etape("SYS-N2", { scores: { "JRN-ZAO": { pct: 80 } } })).toMatchObject({ go: "cpt", lib: "Continuer : Exercice « Quel compte ? » — classe 1" });
});
