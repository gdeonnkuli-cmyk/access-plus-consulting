import { PROVINCES, PAYS, LARGEUR, HAUTEUR } from "./carteRdc";
import { NIVEAUX_CARTE, dansProvince, distanceProvince, provinceEn, bienPlacee, tirage, scoreCarte, cadre, chemin } from "./puzzle";

test("les 26 provinces de 2015, chacune avec son chef-lieu, dans le cadre de la carte", () => {
  expect(PROVINCES).toHaveLength(26);
  expect(new Set(PROVINCES.map(p => p.nom)).size).toBe(26);
  const chefs = Object.fromEntries(PROVINCES.map(p => [p.nom, p.chef]));
  expect(chefs).toMatchObject({ Kinshasa: "Kinshasa", "Kongo-Central": "Matadi", Lualaba: "Kolwezi", "Haut-Katanga": "Lubumbashi", Tshopo: "Kisangani",
    "Nord-Kivu": "Goma", "Sud-Kivu": "Bukavu", "Kasaï-Central": "Kananga", "Kasaï-Oriental": "Mbuji-Mayi", Équateur: "Mbandaka", Ituri: "Bunia", Tanganyika: "Kalemie" });
  for (const p of PROVINCES) {
    const c = cadre(p);
    expect(c.x0).toBeGreaterThanOrEqual(0); expect(c.x1).toBeLessThanOrEqual(LARGEUR);
    expect(c.y0).toBeGreaterThanOrEqual(0); expect(c.y1).toBeLessThanOrEqual(HAUTEUR);
    expect(chemin(p)).toMatch(/^M\d/);
  }
  expect(PAYS.length).toBeGreaterThanOrEqual(1);
});

test("le point d'étiquette de chaque province est dans cette province et dans aucune autre", () => {
  for (const p of PROVINCES) {
    const [x, y] = p.l;
    expect([p.nom, dansProvince(p, x, y)]).toEqual([p.nom, true]);
    expect(provinceEn(x, y).nom).toBe(p.nom);
    expect(bienPlacee(p, x, y)).toBe(true);
  }
});

test("une pièce posée sur une province éloignée est refusée ; la tolérance aide pour les petites provinces", () => {
  const P = n => PROVINCES.find(p => p.nom === n);
  const [x, y] = P("Haut-Katanga").l;
  expect(bienPlacee(P("Kinshasa"), x, y, 20)).toBe(false);
  expect(distanceProvince(P("Kinshasa"), x, y)).toBeGreaterThan(300);
  // juste à côté du contour de Kinshasa : accepté avec la tolérance, refusé sans
  const k = P("Kinshasa").r[0], hors = [k[0] - 8, k[1]];
  if (!dansProvince(P("Kinshasa"), ...hors)) {
    expect(bienPlacee(P("Kinshasa"), ...hors, 20)).toBe(true);
  }
  expect(provinceEn(-50, -50)).toBeNull();
});

test("niveaux, tirage et score", () => {
  expect(NIVEAUX_CARTE.map(n => n.id)).toEqual(["facile", "moyen", "difficile", "expert"]);
  let s = 1; const alea = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const t = tirage(NIVEAUX_CARTE[0], alea);
  expect(t.aPlacer).toHaveLength(8); expect(t.dejaPosees).toHaveLength(18);
  expect(new Set([...t.aPlacer, ...t.dejaPosees]).size).toBe(26);
  expect(tirage(NIVEAUX_CARTE[1], alea).aPlacer).toHaveLength(26);
  expect(scoreCarte(26, 26, 0)).toBe(100);
  expect(scoreCarte(8, 8, 2)).toBe(80);
  expect(scoreCarte(10, 26, 0)).toBe(38);
});
