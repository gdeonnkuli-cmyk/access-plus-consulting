import { BANQUE, candidats, messageDuMoment, TYPES_MKT, CIBLES } from "./marketing";

const abonne = { abonnement: "actif", dateExpiration: "2999-01-01T00:00:00.000Z" };
const H = 36e5;

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

test("même message pendant un créneau de 2 h, renouvelé au créneau suivant", () => {
  const t0 = 1000 * 2 * H;
  const a = messageDuMoment({ uid: "u1", user: {}, cfg: {}, now: t0 + 60e3 });
  const b = messageDuMoment({ uid: "u1", user: {}, cfg: {}, now: t0 + 2 * H - 60e3 });
  expect(a.id).toBe(b.id);
  const ids = new Set(Array.from({ length: 12 }, (_, i) => messageDuMoment({ uid: "u1", user: {}, cfg: {}, now: t0 + i * 2 * H }).id));
  expect(ids.size).toBe(12);
  expect(new Set(Array.from({ length: 12 }, (_, i) => messageDuMoment({ uid: "u1", user: {}, cfg: {}, now: t0 + i * 2 * H }).mid)).size).toBeGreaterThan(4);
});

test("réglages admin : désactivation, fréquence, messages ajoutés et prix remplacés", () => {
  expect(messageDuMoment({ uid: "u1", user: {}, cfg: { actif: false } })).toBeNull();
  const perso = [{ id: "p1", cible: "visiteurs", type: "offre", titre: "Promo : 3 mois pour {t} $", texte: "Mensuel {m} $, annuel {a} $", vue: "acces" }];
  const seuls = { desactives: BANQUE.map(m => m.id), perso };
  const m = messageDuMoment({ uid: "u1", user: {}, cfg: seuls, prix: { m: 6, t: 15, a: 45.5 } });
  expect(m.titre).toBe("Promo : 3 mois pour 15 $");
  expect(m.texte).toBe("Mensuel 6 $, annuel 45,5 $");
  expect(messageDuMoment({ uid: "u1", user: abonne, cfg: seuls })).toBeNull();
  const t = 50 * 24 * H, c6 = { intervalleH: 6 };
  expect(messageDuMoment({ uid: "u1", user: {}, cfg: c6, now: t + H }).id).toBe(messageDuMoment({ uid: "u1", user: {}, cfg: c6, now: t + 5 * H }).id);
});
