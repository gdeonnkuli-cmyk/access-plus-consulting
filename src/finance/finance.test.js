import { MODULES_FIN } from "./modules";
import { CAS, valeurs } from "./cas";
import { texteModuleFinance, dureeMinutes } from "../audio/lecture";
import { tirerSerie } from "../fiscal/tirage";

const KINDS = ["flux", "chronologie", "arbre", "tableau", "cartes"];

test("7 modules complets : leçon, cas, narration et QCM cohérents", () => {
  expect(MODULES_FIN.map(m => m.id)).toEqual(["FE1", "FE2", "FE3", "FE4", "FE5", "FE6", "FE7"]);
  expect(MODULES_FIN.filter(m => m.libre).map(m => m.id)).toEqual(["FE1"]);
  // chaque cas est rattaché à un seul module, dans l'ordre
  expect(MODULES_FIN.flatMap(m => m.cas)).toEqual(CAS.map(c => c.n));
  for (const m of MODULES_FIN) {
    const types = m.blocs.map(b => b.type);
    expect(types[0]).toBe("essentiel");
    expect(types).toContain("pieges");
    m.blocs.filter(b => b.type === "schema").forEach(b => expect(KINDS).toContain(b.kind));
    expect(m.narration.length).toBeGreaterThanOrEqual(7);
    expect(m.qcm).toHaveLength(10);
    expect(new Set(m.qcm.map(q => q.q.trim().toLowerCase())).size).toBe(10);
    const REF = /\b(r[ée]ponses? [abcd]\b|[abcd] et [abcd]\b|toutes les (r[ée]ponses|propositions)|aucune des (r[ée]ponses|propositions)|ci-dessus)/i;
    m.qcm.forEach(q => {
      expect(q.r.length).toBe(4); expect(new Set(q.r).size).toBe(4);
      expect(q.b).toBeGreaterThanOrEqual(0); expect(q.b).toBeLessThan(q.r.length); expect(q.e).toBeTruthy();
      q.r.forEach(r => expect(REF.test(r)).toBe(false));
    });
    const serie = tirerSerie(m.qcm, [], { n: 8 });
    expect(serie).toHaveLength(8);
    serie.forEach(q => expect(q.r[q.b]).toBe(m.qcm[q.idx].r[m.qcm[q.idx].b]));
  }
});

test("cas : structure complète, une réponse par question", () => {
  expect(CAS).toHaveLength(16);
  for (const c of CAS) {
    expect(c.titre && c.theme && c.retenir).toBeTruthy();
    expect(c.enonce.length).toBeGreaterThan(0);
    expect(c.corrige.map(x => x.q)).toEqual(c.questions.map((_, i) => i + 1));
    for (const t of [c.tableau, ...c.corrige.map(x => x.tab)].filter(Boolean)) t.l.forEach(l => expect(l.length).toBe(t.e.length));
    // aucun calcul raté ne doit s'afficher
    expect(JSON.stringify(c)).not.toMatch(/NaN|undefined|Infinity/);
  }
});

test("chiffres clés des corrigés (validés par le responsable pédagogique)", () => {
  const txt = n => JSON.stringify(CAS[n - 1]).replace(/\u00a0/g, " ");
  expect(txt(1)).toContain("20,40 %");
  expect(txt(2)).toContain("16,16 %");
  expect(txt(3)).toContain("21,28 %");
  expect(txt(4)).toContain("16,33 %"); expect(txt(4)).toContain("4,67 %");
  expect(txt(5)).toContain("120 000"); expect(txt(5)).toContain("35 000");
  expect(txt(6)).toContain("9 873"); expect(txt(6)).toContain("15,55 %");
  expect(txt(9)).toContain("9,09 %"); expect(txt(9)).toContain("9,64 %");
  expect(txt(10)).toContain("995,0");
  expect(txt(11)).toContain("2 822,2"); expect(txt(11)).toContain("28,22");
  expect(txt(13)).toContain("13 867");
  expect(txt(14)).toContain("2 934,24");
  expect(txt(15)).toContain("2 889,24");
  expect(txt(16)).toContain("3 100 FC"); expect(txt(16)).toContain("49 600 000");
  // l'écriture d'affectation est équilibrée
  const j = CAS[15].corrige.find(x => x.q === 4).tab.l.slice(0, 7);
  const n = v => Number(String(v).replace(/\s/g, "") || 0);
  expect(j.reduce((s, l) => s + n(l[2]), 0)).toBe(j.reduce((s, l) => s + n(l[3]), 0));
});

test("outils de calcul : VAN, TRI et annuités", () => {
  const { act, tri, ann } = valeurs;
  expect(act([-100, 110], 0.1)).toBeCloseTo(0, 9);
  expect(tri([-100, 110])).toBeCloseTo(0.1, 6);
  expect(ann(0.1, 3)).toBeCloseTo(2.48685, 5);
});

test("narration : lisible par la voix (phrases courtes, pas de symboles de formule)", () => {
  for (const m of MODULES_FIN) {
    const segs = texteModuleFinance(m);
    expect(segs[0]).toMatch(/^Finance d'entreprise, module \d\./);
    segs.forEach(s => { expect(s.length).toBeLessThanOrEqual(220); expect(s).not.toMatch(/[ₑ_×=/√Σ]/); });
    expect(dureeMinutes(segs)).toBeGreaterThanOrEqual(2);
  }
});
