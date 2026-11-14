import { SITES, SITES_UNESCO, TYPES_SITES, NIVEAUX_PARCS, RAYON_SITE, distanceSite, siteLePlusProche, tirageSites } from "./sites";
import { MODULE_PARCS } from "./module";
import { SCHEMAS_PARCS } from "./CarteParcs";
import { provinceEn } from "../psycho/puzzle";
import { PROVINCES } from "../psycho/carteRdc";
import { texteModuleParcs } from "../audio/lecture";

test("14 sites : 9 parcs nationaux, 5 sites UNESCO, chacun dans l'une de ses provinces", () => {
  expect(SITES).toHaveLength(14);
  expect(new Set(SITES.map(s => s.id)).size).toBe(14);
  expect(SITES.filter(s => s.type === "parc")).toHaveLength(9);
  expect(SITES_UNESCO.map(s => s.court)).toEqual(["Virunga", "Garamba", "Kahuzi-Biega", "Salonga", "Réserve à okapis"]);
  const noms = new Set(PROVINCES.map(p => p.nom));
  for (const s of SITES) {
    expect(TYPES_SITES[s.type]).toBeTruthy();
    s.provinces.forEach(p => expect(noms.has(p)).toBe(true));
    const pr = provinceEn(...s.c);
    expect([s.court, pr && s.provinces.includes(pr.nom)]).toEqual([s.court, true]);
    expect(s.indice).toBeTruthy(); expect(s.faune).toBeTruthy();
  }
  expect(Math.min(...SITES.map(s => s.cree))).toBe(1925);
});

test("module : leçon avec la carte interactive, narration et 15 questions", () => {
  const m = MODULE_PARCS;
  expect(m.blocs[0].type).toBe("essentiel");
  expect(m.blocs.some(b => b.kind === "carteParcs")).toBe(true);
  expect(SCHEMAS_PARCS.carteParcs).toBeTruthy();
  expect(m.blocs.find(b => b.kind === "tableau").lignes).toHaveLength(9);
  expect(m.qcm).toHaveLength(15);
  m.qcm.forEach(q => { expect(q.r).toHaveLength(4); expect(new Set(q.r).size).toBe(4); expect(q.b).toBe(0); expect(q.e).toBeTruthy(); });
  expect(texteModuleParcs(m).length).toBeGreaterThan(m.narration.length);
});

test("jeu : niveaux, minuteurs décroissants, tirage, réponse", () => {
  expect(NIVEAUX_PARCS.map(n => n.id)).toEqual(["facile", "moyen", "difficile", "tresdiff"]);
  expect(NIVEAUX_PARCS.map(n => n.parQ)).toEqual([20, 15, 12, 10]);
  expect(tirageSites(NIVEAUX_PARCS[0])).toHaveLength(6);
  expect(new Set(tirageSites(NIVEAUX_PARCS[3])).size).toBe(14);
  for (const s of SITES) expect(siteLePlusProche(...s.c).id).toBe(s.id);
  const v = SITES.find(s => s.id === "virunga");
  expect(distanceSite(v, v.c[0] + 50, v.c[1])).toBeLessThanOrEqual(RAYON_SITE);
  // deux sites distincts ne se confondent pas au niveau des repères (écart minimal entre points)
  let min = Infinity; for (const a of SITES) for (const b of SITES) if (a !== b) min = Math.min(min, distanceSite(a, ...b.c));
  expect(min).toBeGreaterThan(30);
});
