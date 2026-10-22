import { MODULES_FISC } from "./modules";

const KINDS = ["flux", "chronologie", "arbre", "tableau", "bareme", "chaine", "cartes"];

test("les 10 modules (Code des impôts et import-export) sont complets et leurs QCM cohérents", () => {
  expect(MODULES_FISC.map(m => m.id)).toEqual(["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10"]);
  expect(MODULES_FISC.filter(m => m.libre).map(m => m.id)).toEqual(["F1"]);
  for (const m of MODULES_FISC) {
    const types = m.blocs.map(b => b.type);
    expect(types[0]).toBe("essentiel");
    expect(types[types.length - 1]).toBe("articles");
    expect(types.filter(t => t === "schema").length).toBeGreaterThanOrEqual(2);
    expect(types).toContain("exemple"); expect(types).toContain("pieges"); expect(types).toContain("maj");
    m.blocs.filter(b => b.type === "schema").forEach(b => expect(KINDS).toContain(b.kind));
    m.blocs.filter(b => b.type === "exemple").forEach(b => b.lignes.forEach(l => expect(typeof l[1]).toBe("number")));
    expect(m.qcm).toHaveLength(15);
    // propositions mélangées à chaque tentative : aucune ne doit dépendre de l'ordre des réponses
    const REF = /\b(r[ée]ponses? [abcd]\b|[abcd] et [abcd]\b|toutes les (r[ée]ponses|propositions)|aucune des (r[ée]ponses|propositions)|les deux pr[ée]c[ée]dentes|ci-dessus)/i;
    m.qcm.forEach(q => q.r.forEach(r => expect(REF.test(r)).toBe(false)));
    expect(new Set(m.qcm.map(q => q.q.trim().toLowerCase())).size).toBe(m.qcm.length);
    m.qcm.forEach(q => { expect(q.r.length).toBeGreaterThanOrEqual(3); expect(q.b).toBeGreaterThanOrEqual(0); expect(q.b).toBeLessThan(q.r.length); expect(q.e).toBeTruthy(); });
  }
});

test("l'IBP est présenté à 30 % avec l'impôt minimum de l'article 92", () => {
  const f2 = JSON.stringify(MODULES_FISC.find(m => m.id === "F2"));
  expect(f2).toContain("30 %"); expect(f2).toContain("art. 92"); expect(f2).toContain("60 %");
});

test("modules alignés sur le Code des impôts mis à jour au 31 mars 2021", () => {
  const mod = id => MODULES_FISC.find(m => m.id === id);
  const bareme = mod("F3").blocs.find(b => b.kind === "bareme").tranches;
  expect(bareme.map(t => t.taux)).toEqual([3, 15, 30, 40]);
  expect(bareme.map(t => t.a)).toEqual([1944000, 21600000, 43200000, null]);
  for (const m of MODULES_FISC) expect(JSON.stringify(m.blocs.filter(b => b.type === "maj"))).toContain("2021");
  expect(JSON.stringify(mod("F2"))).toContain("4 × 20 %");
});
