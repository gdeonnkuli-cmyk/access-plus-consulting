import { BANQUE, candidats, rotation, intervalleMs, TYPES_MKT, CIBLES } from "./marketing";

const abonne = { abonnement: "actif", dateExpiration: "2999-01-01T00:00:00.000Z" };
const J = 864e5;

test("banque : identifiants uniques, types et publics connus, textes courts", () => {
  expect(new Set(BANQUE.map(m => m.id)).size).toBe(BANQUE.length);
  for (const m of BANQUE) {
    expect(TYPES_MKT[m.type]).toBeTruthy(); expect(CIBLES[m.cible]).toBeTruthy();
    expect(m.titre.length).toBeLessThanOrEqual(90); expect(m.texte.length).toBeLessThanOrEqual(240);
  }
});

test("offres pour les visiteurs, défis pour les abonnés, astuces pour tous", () => {
  const v = candidats({}, false), a = candidats({}, true);
  expect(v.some(m => m.type === "offre")).toBe(true);
  expect(a.some(m => m.type === "offre")).toBe(false);
  expect(a.some(m => m.cible === "abonnes")).toBe(true);
  expect(v.some(m => m.cible === "abonnes")).toBe(false);
});

test("rotation : ordre aléatoire stable dans la journée, propre à chaque utilisateur, renouvelé le lendemain", () => {
  const t = 20000 * J;
  const ids = (uid, now) => rotation({ uid, user: {}, cfg: {}, now }).map(m => m.id).join();
  expect(ids("u1", t + 1000)).toBe(ids("u1", t + J - 1000));
  expect(ids("u1", t)).not.toBe(ids("u2", t));
  expect(ids("u1", t)).not.toBe(ids("u1", t + J));
  expect(rotation({ uid: "u1", user: {}, cfg: {}, now: t }).length).toBe(candidats({}, false).length);
});

test("réglages admin : désactivation, rythme de 30 s par défaut, annonces ajoutées et prix remplacés", () => {
  expect(rotation({ uid: "u1", user: {}, cfg: { actif: false } })).toEqual([]);
  expect(intervalleMs({})).toBe(30000);
  expect(intervalleMs({ intervalleS: 45 })).toBe(45000);
  const perso = [{ id: "p1", cible: "visiteurs", type: "offre", titre: "Promo : 3 mois pour {t} $", texte: "Mensuel {m} $, annuel {a} $", vue: "acces" }];
  const seuls = { desactives: BANQUE.map(m => m.id), perso };
  const L = rotation({ uid: "u1", user: {}, cfg: seuls, prix: { m: 6, t: 15, a: 45.5 } });
  expect(L.map(m => [m.titre, m.texte])).toEqual([["Promo : 3 mois pour 15 $", "Mensuel 6 $, annuel 45,5 $"]]);
  expect(rotation({ uid: "u1", user: abonne, cfg: seuls })).toEqual([]);
});
