import { FISC, FIN, PARCOURS, SEUIL_ELEMENT, SEUIL_MOYENNE, elementsParcours, evaluer, mention, numeroAttestation, numeroValide } from "./regles";
import { MODULES_FISC } from "../fiscal/modules";
import { MODULES_FIN } from "../finance/modules";

const mods = [{ id: "m1", titre: "Fondements SYSCOHADA", ordre: 1 }, { id: "m2", titre: "Journal", ordre: 2, evalType: "none" }, { id: "m3", titre: "Brouillon", on: false }];

test("catalogue fiscal aligné sur les modules de l'application", () => {
  expect(FISC.map(([id, t]) => [id, t])).toEqual(MODULES_FISC.map(m => [m.id, m.titre]));
  expect(FIN.map(([id, t]) => [id, t])).toEqual(MODULES_FIN.map(m => [m.id, m.titre]));
  expect(PARCOURS.map(p => p.id)).toEqual(["SYS-N1", "FISC", "SYS-N2", "FIN"]);
  expect([SEUIL_ELEMENT, SEUIL_MOYENNE]).toEqual([70, 80]);
});

test("éléments des parcours", () => {
  expect(elementsParcours("SYS-N1", mods).map(e => e.cle)).toEqual(["m1", "m2", "CPT-T"]);
  expect(elementsParcours("FISC", mods)).toHaveLength(14);
  expect(elementsParcours("FIN", mods).map(e => e.cle)).toEqual(["FIN-FE1", "FIN-FE2", "FIN-FE3", "FIN-FE4", "FIN-FE5", "FIN-FE6", "FIN-FE7"]);
  expect(elementsParcours("SYS-N2", mods).map(e => e.cle)).toEqual(["JRN-ZAO", "CPT-1", "CPT-2", "CPT-3", "CPT-4", "CPT-5", "CPT-6", "CPT-7", "CPT-8", "CPT-9"]);
});

test("suivi sans réussite : un QCM sous 70 %", () => {
  const r = evaluer("SYS-N1", mods, { scores: { m1: { pct: 60 }, "CPT-T": { pct: 100 } }, progress: { m1: "done", m2: "done" } });
  expect(r.suivi).toBe(true);
  expect(r.reussite).toBe(false);
  expect(r.moyenne).toBe(80);
  expect(r.aAmeliorer).toEqual(["Fondements SYSCOHADA"]);
});

test("réussite : chaque élément ≥ 70 % et moyenne ≥ 80 %, avec mention", () => {
  const ok = evaluer("SYS-N1", mods, { scores: { m1: { pct: 75 }, "CPT-T": { pct: 90 } }, progress: { m2: "done" } });
  expect(ok).toMatchObject({ suivi: true, reussite: true, moyenne: 83, mention: "Bien", heures: 6 });
  const moyTropBasse = evaluer("SYS-N1", mods, { scores: { m1: { pct: 72 }, "CPT-T": { pct: 74 } }, progress: { m2: "done" } });
  expect(moyTropBasse.reussite).toBe(false);
  expect([mention(80), mention(90), mention(97), mention(79)]).toEqual(["Bien", "Très bien", "Excellent", null]);
});

test("parcours incomplet : ni suivi ni réussite", () => {
  const r = evaluer("FISC", mods, { scores: { "FISC-F1": { pct: 100 } } });
  expect(r).toMatchObject({ suivi: false, reussite: false, nFaits: 1, nTotal: 14 });
  expect(r.aFaire).toHaveLength(13);
});

test("numéro d'attestation", () => {
  const n = numeroAttestation(() => 0.5, 2026);
  expect(n).toMatch(/^EC-2026-[A-Z2-9]{6}$/);
  expect(numeroValide(n)).toBe(true);
  expect(numeroValide("EC-2026-0O1IL0")).toBe(false);
  expect(numeroValide("x")).toBe(false);
});

test("finance d'entreprise : réussite avec les 7 QCM ≥ 70 % et une moyenne ≥ 80 %", () => {
  const scores = Object.fromEntries(["FE1", "FE2", "FE3", "FE4", "FE5", "FE6", "FE7"].map((f, i) => [`FIN-${f}`, { pct: i === 6 ? 75 : 88 }]));
  expect(evaluer("FIN", mods, { scores })).toMatchObject({ suivi: true, reussite: true, moyenne: 86, heures: 14, nTotal: 7 });
  expect(evaluer("FIN", mods, { scores: { ...scores, "FIN-FE3": { pct: 60 } } })).toMatchObject({ suivi: true, reussite: false });
});
