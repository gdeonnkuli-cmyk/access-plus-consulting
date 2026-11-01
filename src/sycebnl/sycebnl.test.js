import { MODULES_SYC } from "./modules";
import { EXAMEN_SYC, NB_Q_FINAL } from "./examen";
import { tirerSerie } from "../fiscal/tirage";
import { texteModuleSycebnl, pourLecture } from "../audio/lecture";

const KINDS = ["flux", "chronologie", "arbre", "tableau", "cartes"];
const valeurs = (m, titre) => {
  const b = m.blocs.find(x => x.type === "exemple" && x.titre.startsWith(titre));
  expect(b).toBeTruthy();
  return b.lignes.map(l => l[1]);
};

test("8 modules complets : essentiel, schémas, pièges, narration et banque de 12 questions", () => {
  expect(MODULES_SYC.map(m => m.id)).toEqual(["SB1", "SB2", "SB3", "SB4", "SB5", "SB6", "SB7", "SB8"]);
  expect(MODULES_SYC.filter(m => m.libre).map(m => m.id)).toEqual(["SB1"]);
  for (const m of MODULES_SYC) {
    expect(m.blocs[0].type).toBe("essentiel");
    expect(m.blocs.some(b => b.type === "pieges")).toBe(true);
    const schemas = m.blocs.filter(b => b.type === "schema");
    expect(schemas.length).toBeGreaterThanOrEqual(3);
    schemas.forEach(b => expect(KINDS).toContain(b.kind));
    m.blocs.filter(b => b.type === "exemple").forEach(b => b.lignes.forEach(l => expect(typeof l[1]).toBe("number")));
    expect(m.narration.length).toBeGreaterThanOrEqual(7);
    expect(m.qcm).toHaveLength(12);
    for (const q of m.qcm) {
      expect(q.r).toHaveLength(4);
      expect(new Set(q.r).size).toBe(4);
      expect(q.b).toBeGreaterThanOrEqual(0);
      expect(q.b).toBeLessThan(4);
      expect(q.e.length).toBeGreaterThan(10);
    }
    expect(new Set(m.qcm.map(q => q.q)).size).toBe(12);
  }
});

test("examen final : au moins 40 questions couvrant les 8 modules, séries de 30 renouvelées", () => {
  const Q = EXAMEN_SYC.qcm;
  expect(NB_Q_FINAL).toBeGreaterThanOrEqual(30);
  expect(Q.length).toBeGreaterThanOrEqual(40);
  expect(new Set(Q.map(q => q.q)).size).toBe(Q.length);
  for (const m of MODULES_SYC) expect(Q.filter(q => q.m === m.id).length).toBeGreaterThanOrEqual(5);
  Q.forEach(q => { expect(q.r).toHaveLength(4); expect(new Set(q.r).size).toBe(4); expect(q.b).toBe(0); });
  const s1 = tirerSerie(Q, [], { n: NB_Q_FINAL }), s2 = tirerSerie(Q, s1.map(x => x.idx), { n: NB_Q_FINAL });
  expect(s1).toHaveLength(30);
  expect(s2).toHaveLength(30);
  const prec = new Set(s1.map(x => x.idx));
  expect(s2.filter(x => !prec.has(x.idx)).length).toBeGreaterThanOrEqual(9);
});

test("exemples chiffrés justes", () => {
  const sb1 = valeurs(MODULES_SYC[0], "Exercice : les 5 000 000");
  expect(sb1[0] + sb1[1] + sb1[2]).toBe(sb1[3]);
  const sb2 = valeurs(MODULES_SYC[1], "Exercice : fournitures");
  expect(sb2[1] + sb2[2]).toBe(sb2[0]);
  expect(sb2[2] / 4).toBe(sb2[3]);
  const ana = valeurs(MODULES_SYC[1], "Comptabilité analytique");
  expect(ana[1] + ana[2] + ana[3]).toBe(ana[0]);
  const av = valeurs(MODULES_SYC[3], "Exercice : solder");
  expect(av[0] + av[1] + av[2]).toBe(av[3]);
  const cot = valeurs(MODULES_SYC[4], "Tableau nominatif");
  expect(cot[0] + cot[1] + cot[2]).toBe(cot[3]);
  const fa = valeurs(MODULES_SYC[5], "Cas : 12 000 000");
  expect(fa[0] + fa[1]).toBe(fa[2]);
  expect(fa[2] + fa[3]).toBe(fa[4]);
  const sub = valeurs(MODULES_SYC[5], "Exercice : subvention");
  expect(sub.slice(0, 4).reduce((a, b) => a + b, 0)).toBe(sub[4]);
  const rb = valeurs(MODULES_SYC[6], "Rapprochement bancaire");
  expect(rb[0] + rb[1]).toBe(rb[2]);
  expect(rb[3] + rb[4]).toBe(rb[5]);
  expect(rb[2]).toBe(rb[5]);
  const ben = valeurs(MODULES_SYC[6], "Valoriser 120 heures");
  expect(ben[0]).toBe(120 * 5000);
  expect(ben[0] + ben[1]).toBe(ben[2]);
  const exe = valeurs(MODULES_SYC[7], "Exercice : exécution");
  expect(exe[0] + exe[1] + exe[2]).toBe(exe[3]);
  const lib = valeurs(MODULES_SYC[7], "Exercice : combien");
  expect(lib.slice(0, 4).reduce((a, b) => a + b, 0)).toBe(lib[4]);
});

test("audio : chaque module se lit, sans sigle illisible", () => {
  for (const m of MODULES_SYC) {
    const segs = texteModuleSycebnl(m);
    expect(segs.length).toBeGreaterThan(8);
    segs.forEach(x => expect(x).not.toMatch(/SYCEBNL|EBNL/));
  }
  expect(pourLecture("Le SYCEBNL s'applique aux EBNL")).toBe("Le S Y C E B N L s'applique aux E B N L");
});
