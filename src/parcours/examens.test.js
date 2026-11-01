import { BANQUE_SYS1, EXAMENS_FINAUX, construireBanqueSys2 } from "./examens";
import { EXAMENS, PARCOURS } from "../attest/regles";
import { tirerSerie } from "../fiscal/tirage";
import complements from "../ef/syscohada/complements.json";
import planListe from "../ef/syscohada/plan.json";

const plan = new Map(planListe);
const valide = q => { expect(q.r).toHaveLength(4); expect(new Set(q.r).size).toBe(4); expect(q.b).toBe(0); expect(q.e.length).toBeGreaterThan(5); };

test("SYSCOHADA N1 : 45 questions, comptes cités présents dans le plan révisé", () => {
  expect(BANQUE_SYS1.length).toBeGreaterThanOrEqual(45);
  expect(new Set(BANQUE_SYS1.map(q => q.q)).size).toBe(BANQUE_SYS1.length);
  BANQUE_SYS1.forEach(valide);
  for (const q of BANQUE_SYS1) for (const c of q.c || []) expect([q.q, c, plan.has(c)]).toEqual([q.q, c, true]);
});

test("SYSCOHADA N2 : examen pratique construit à partir des écritures types", () => {
  const titre = n => plan.get(n) || "";
  const B = construireBanqueSys2(complements, titre);
  expect(B.length).toBeGreaterThanOrEqual(150);
  B.forEach(valide);
  expect(new Set(B.map(q => q.q)).size).toBe(B.length);
  expect(construireBanqueSys2(complements, titre)).toEqual(B); // déterministe
  expect(B[0].r[0]).toMatch(/^Débit .+ — Crédit .+/);
});

test("chaque parcours a un examen dont la banque permet de renouveler 30 % des questions", async () => {
  for (const p of PARCOURS) {
    const F = EXAMENS_FINAUX[p.id], n = EXAMENS[p.id].nbQ;
    expect(F).toBeTruthy();
    const banque = p.id === "SYS-N2" ? construireBanqueSys2(complements, n => plan.get(n) || "") : await F.charger();
    expect(banque.length).toBeGreaterThanOrEqual(Math.ceil(n * 1.3));
    const s1 = tirerSerie(banque, [], { n }), s2 = tirerSerie(banque, s1.map(x => x.idx), { n });
    expect(s1).toHaveLength(n);
    const prec = new Set(s1.map(x => x.idx));
    expect(s2.filter(x => !prec.has(x.idx)).length).toBeGreaterThanOrEqual(Math.ceil(n * 0.3));
  }
});
