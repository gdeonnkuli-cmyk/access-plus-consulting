import { etatEssai, lireConfigEssai, dateEnMs, parrainDepuisUrl, lienParrainage, prolonger, bilanParrainage, texteParrainage } from "./essai";
import { SITE_URL } from "../site";

const J = 86400000, t0 = Date.UTC(2026, 10, 20, 10);
const C = { depuis: "2026-01-01T00:00:00Z" }; // essai en service depuis le début de l'année (comptes de test)

test("essai de 7 jours à partir de la création du compte", () => {
  const e = etatEssai({ creeLe: t0 - 2 * J, cfg: C, maintenant: t0 });
  expect(e).toMatchObject({ actif: true, jours: 7, joursRestants: 5, enCours: true, termine: false });
  expect(etatEssai({ creeLe: t0 - 7 * J, cfg: C, maintenant: t0 })).toMatchObject({ enCours: false, termine: true, joursRestants: 0 });
  expect(etatEssai({ creeLe: t0 - 6.5 * J, cfg: C, maintenant: t0 }).joursRestants).toBe(1);
});

test("parrainage : 14 jours ; campagne : l'essai repart pour les anciens comptes ; essai désactivable", () => {
  expect(etatEssai({ creeLe: t0 - 10 * J, parrainUid: "abc", cfg: C, maintenant: t0 })).toMatchObject({ jours: 14, joursRestants: 4, enCours: true, parrainBonus: true });
  const cfg = { campagne: new Date(t0 - 1 * J).toISOString() };
  expect(etatEssai({ creeLe: "3/9/2026", cfg, maintenant: t0 })).toMatchObject({ enCours: true, joursRestants: 6 });
  // une campagne future ou antérieure au compte ne change rien
  expect(etatEssai({ creeLe: t0 - 2 * J, cfg: { ...C, campagne: new Date(t0 - 5 * J).toISOString() }, maintenant: t0 }).joursRestants).toBe(5);
  expect(etatEssai({ creeLe: t0 - 20 * J, cfg: { campagne: new Date(t0 + 2 * J).toISOString() }, maintenant: t0 }).enCours).toBe(false);
  expect(etatEssai({ creeLe: t0, cfg: { actif: false }, maintenant: t0 })).toMatchObject({ actif: false, enCours: false });
  expect(etatEssai({ creeLe: null, maintenant: t0 }).enCours).toBe(false);
});

test("comptes antérieurs à la mise en service : pas d'essai (ni de message de fin), sauf campagne", () => {
  const ancien = Date.UTC(2026, 9, 1);
  expect(etatEssai({ creeLe: ancien, maintenant: t0 })).toMatchObject({ actif: false, enCours: false, termine: false });
  expect(etatEssai({ creeLe: ancien, cfg: { campagne: new Date(t0 - 10 * J).toISOString() }, maintenant: t0 })).toMatchObject({ actif: true, enCours: false, termine: true });
  expect(etatEssai({ creeLe: ancien, cfg: { depuis: "2026-01-01T00:00:00Z" }, maintenant: t0 }).termine).toBe(true);
});

test("configuration bornée et dates", () => {
  expect(lireConfigEssai({ jours: "10", bonusParrain: -3, recompenseJours: 9999 })).toMatchObject({ jours: 10, bonusParrain: 7, recompenseJours: 30 });
  expect(dateEnMs("3/11/2026")).toBe(new Date(2026, 10, 3).getTime());
  expect(dateEnMs("n'importe quoi")).toBeNull();
});

test("lien de parrainage, lecture sécurisée, texte à partager, prolongation", () => {
  const uid = "aB3dE6fG9hJ2kL5mN8pQ";
  expect(lienParrainage(uid)).toBe(`${SITE_URL}/?parrain=${uid}`);
  expect(parrainDepuisUrl(`?parrain=${uid}`)).toBe(uid);
  expect(parrainDepuisUrl("?parrain=<script>")).toBeNull();
  expect(parrainDepuisUrl("?vue=home")).toBeNull();
  expect(texteParrainage("L", {})).toContain("14 jours");
  expect(prolonger(null, 30, t0)).toBe(new Date(t0 + 30 * J).toISOString());
  expect(prolonger(new Date(t0 + 10 * J).toISOString(), 30, t0)).toBe(new Date(t0 + 40 * J).toISOString());
});

test("bilan du parrainage : récompense due seulement quand le filleul est abonné, une seule fois", () => {
  const fut = new Date(t0 + 30 * J).toISOString();
  const users = [{ uid: "P1", nom: "Parrain" }, { uid: "F1", parrainUid: "P1", abonnement: "actif", dateExpiration: fut },
    { uid: "F2", parrainUid: "P1", abonnement: "aucun" }, { uid: "F3", parrainUid: "P1", abonnement: "actif", dateExpiration: fut, parrainRecompense: "2026-11-01" },
    { uid: "F4", parrainUid: "INCONNU", abonnement: "actif", dateExpiration: fut }];
  const b = bilanParrainage(users, t0);
  expect(b.map(x => [x.filleul.uid, x.aRecompenser])).toEqual([["F1", true], ["F3", false], ["F4", false], ["F2", false]]);
});
