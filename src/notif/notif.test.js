import { destsPour, estLue, rappelsLocaux, depuis } from "./notif";
import { recommandations } from "./Recommandations";

test("destinataires lus par chaque rôle", () => {
  expect(destsPour("u1", "apprenant")).toEqual(["u1", "all", "apprenants"]);
  expect(destsPour("f1", "formateur")).toEqual(["f1", "all", "formateurs"]);
  expect(destsPour("x", "admin")).toEqual(["admin", "all"]);
});

test("état de lu : tout ce qui précède « vu », ou marqué une à une", () => {
  const etat = { vu: 1000, lues: { b: true } };
  expect(estLue({ id: "a", t: 900 }, etat)).toBe(true);
  expect(estLue({ id: "b", t: 5000 }, etat)).toBe(true);
  expect(estLue({ id: "c", t: 5000 }, etat)).toBe(false);
});

test("rappel local d'abonnement à 7 jours ou moins de l'expiration", () => {
  const dans = j => new Date(Date.now() + j * 864e5).toISOString();
  expect(rappelsLocaux({ abonnement: "actif", dateExpiration: dans(3) })[0].titre).toMatch(/expire dans 3 jours/);
  expect(rappelsLocaux({ abonnement: "actif", dateExpiration: dans(30) })).toHaveLength(0);
  expect(rappelsLocaux({ abonnement: "aucun" })).toHaveLength(0);
  expect(depuis(Date.now() - 30 * 1000)).toBe("à l'instant");
});

test("recommandations : accès, QCM à refaire, module suivant, Code des impôts", () => {
  const mods = [{ id: "m1", titre: "Fondements", ordre: 1 }, { id: "m2", titre: "Bilan", ordre: 2 }, { id: "m3", titre: "TFT", ordre: 3 }];
  const sansAcces = recommandations({ mods, pr: {}, sc: {}, ok: false });
  expect(sansAcces[0].k).toBe("acces");
  const R = recommandations({ mods, pr: { m1: "done", m2: "done" }, sc: { m1: { pct: 80 }, m2: { pct: 40 } }, ok: true });
  expect(R.map(r => r.k)).toEqual(["refaire", "suivant", "fisc"]);
  expect(R[0].mod.id).toBe("m2"); expect(R[1].mod.id).toBe("m3");
});
