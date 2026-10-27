import { detecterPlayStore, parlePrix } from "./plateforme";

const memoire = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; };

test("repérage de l'application du Play Store", () => {
  const s = memoire();
  expect(detecterPlayStore("?source=app", "", s)).toBe(false); // application installée depuis Chrome (PWA)
  expect(detecterPlayStore("?source=android", "", s)).toBe(true);
  expect(detecterPlayStore("", "", s)).toBe(true); // navigations suivantes
  expect(detecterPlayStore("?source=web", "", s)).toBe(false);
  expect(detecterPlayStore("", "android-app://cd.ecocampus.rdc/", memoire())).toBe(true);
  expect(detecterPlayStore("?source=android", "", null)).toBe(true);
  expect(detecterPlayStore("", "https://google.com", null)).toBe(false);
});

test("messages de la bannière qui parlent de prix", () => {
  expect(parlePrix({ titre: "3 mois d'accès complet pour {t} $" })).toBe(true);
  expect(parlePrix({ titre: "Commencez", vue: "acces" })).toBe(true);
  expect(parlePrix({ titre: "Vous avez reçu un code ?", vue: "home" })).toBe(false);
  expect(parlePrix({ titre: "Défi du moment : 80 % au QCM TVA", vue: "fisc" })).toBe(false);
});
