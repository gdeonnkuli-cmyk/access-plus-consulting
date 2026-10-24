import { cleCpt, estExercice, fusionScore, niveau, pctQcm, resumeCpt } from "./scores";

test("clés et filtrage : les exercices sortent du score moyen des QCM", () => {
  expect(cleCpt(0)).toBe("CPT-T");
  expect(cleCpt(4)).toBe("CPT-4");
  expect(estExercice("CPT-4") && estExercice("JRN-ZAO")).toBe(true);
  expect(estExercice("FISC-F2") || estExercice("m3")).toBe(false);
  const u = { scores: { m1: { pct: 80 }, "FISC-F2": { pct: 60 }, "CPT-4": { pct: 10 }, "JRN-ZAO": { pct: 30 } } };
  expect(pctQcm(u).sort()).toEqual([60, 80]);
});

test("meilleur score conservé, séries comptées, dernière série gardée", () => {
  const a = fusionScore(undefined, { s: 7, t: 10 }, "d1");
  expect(a).toMatchObject({ s: 7, t: 10, pct: 70, n: 1, date: "d1", derniere: { pct: 70 } });
  const b = fusionScore(a, { s: 4, t: 10 }, "d2");
  expect(b).toMatchObject({ pct: 70, date: "d1", n: 2, derniere: { pct: 40, date: "d2" } });
  const c = fusionScore(b, { s: 9, t: 10 }, "d3");
  expect(c).toMatchObject({ pct: 90, date: "d3", n: 3 });
  // ancien format (dernier score seul, sans compteur) : compté comme une série
  expect(fusionScore({ s: 5, t: 10, pct: 50, date: "d0" }, { s: 6, t: 10 }, "d1")).toMatchObject({ pct: 60, n: 2 });
});

test("résumé par apprenant et niveaux", () => {
  const r = resumeCpt({ "CPT-4": { pct: 80, n: 2 }, "CPT-T": { pct: 40, n: 1 }, m1: { pct: 100 } });
  expect(Object.keys(r.parCle).sort()).toEqual(["CPT-4", "CPT-T"]);
  expect(r.moyenne).toBe(60);
  expect(r.nSeries).toBe(3);
  expect([niveau(null), niveau(85), niveau(60), niveau(20)]).toEqual(["aucun", "bon", "moyen", "faible"]);
});
