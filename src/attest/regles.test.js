import { FISC, FIN, SYC, BQ, EF, etatSyc, etatParcours, EXAMENS, PARCOURS, SEUIL_ELEMENT, SEUIL_MOYENNE, elementsParcours, evaluer, mention, numeroAttestation, numeroValide } from "./regles";
import { MODULES_FISC } from "../fiscal/modules";
import { MODULES_FIN } from "../finance/modules";
import { MODULES_SYC } from "../sycebnl/modules";
import { MODULES_BQ } from "../banque/modules";
import { MODULES_EDUF } from "../eduf/modules";

const mods = [{ id: "m1", titre: "Fondements SYSCOHADA", ordre: 1 }, { id: "m2", titre: "Journal", ordre: 2, evalType: "none" }, { id: "m3", titre: "Brouillon", on: false }];

test("catalogue fiscal aligné sur les modules de l'application", () => {
  expect(FISC.map(([id, t]) => [id, t])).toEqual(MODULES_FISC.map(m => [m.id, m.titre]));
  expect(FIN.map(([id, t]) => [id, t])).toEqual(MODULES_FIN.map(m => [m.id, m.titre]));
  expect(SYC.map(([id, t]) => [id, t])).toEqual(MODULES_SYC.map(m => [m.id, m.titre]));
  expect(BQ.map(([id, t]) => [id, t])).toEqual(MODULES_BQ.map(m => [m.id, m.titre]));
  expect(EF.map(([id, t]) => [id, t])).toEqual(MODULES_EDUF.map(m => [m.id, m.titre]));
  expect(PARCOURS.map(p => p.id)).toEqual(["SYS-N1", "FISC", "SYS-N2", "FIN", "SYCEBNL", "BANQUE", "EDUF"]);
  expect([SEUIL_ELEMENT, SEUIL_MOYENNE]).toEqual([70, 80]);
});

test("éléments des parcours", () => {
  expect(elementsParcours("SYS-N1", mods).map(e => e.cle)).toEqual(["m1", "m2", "CPT-T", "SYS1-FINAL"]);
  expect(elementsParcours("FISC", mods)).toHaveLength(16);
  expect(elementsParcours("FIN", mods).map(e => e.cle)).toEqual(["FIN-FE1", "FIN-FE2", "FIN-FE3", "FIN-FE4", "FIN-FE5", "FIN-FE6", "FIN-FE7", "FIN-FINAL"]);
  expect(elementsParcours("SYS-N2", mods).map(e => e.cle)).toEqual(["JRN-ZAO", "CPT-1", "CPT-2", "CPT-3", "CPT-4", "CPT-5", "CPT-6", "CPT-7", "CPT-8", "CPT-9", "SYS2-FINAL"]);
  // chaque parcours se termine par un examen final coefficient 2 et délivre un certificat
  for (const p of PARCOURS) {
    const el = elementsParcours(p.id, mods), f = el[el.length - 1];
    expect(f).toMatchObject({ cle: EXAMENS[p.id].cle, coef: 2, final: true, evalue: true });
    expect(f.titre).toBe(`Examen final (${EXAMENS[p.id].nbQ} questions)`);
    expect(p.certificat).toBe(true);
    expect(EXAMENS[p.id].nbQ).toBeGreaterThanOrEqual(30);
  }
});

test("suivi sans réussite : un QCM sous 70 %", () => {
  const r = evaluer("SYS-N1", mods, { scores: { m1: { pct: 60 }, "CPT-T": { pct: 100 }, "SYS1-FINAL": { pct: 80 } }, progress: { m1: "done", m2: "done" } });
  expect(r.suivi).toBe(true);
  expect(r.reussite).toBe(false);
  expect(r.moyenne).toBe(80);
  expect(r.aAmeliorer).toEqual(["Fondements SYSCOHADA"]);
});

test("réussite : chaque élément ≥ 70 % et moyenne ≥ 80 %, avec mention", () => {
  // (75 + 90 + 2 × 84) / 4 = 83
  const ok = evaluer("SYS-N1", mods, { scores: { m1: { pct: 75 }, "CPT-T": { pct: 90 }, "SYS1-FINAL": { pct: 84 } }, progress: { m2: "done" } });
  expect(ok).toMatchObject({ suivi: true, reussite: true, moyenne: 83, mention: "Bien", heures: 7 });
  const moyTropBasse = evaluer("SYS-N1", mods, { scores: { m1: { pct: 72 }, "CPT-T": { pct: 74 }, "SYS1-FINAL": { pct: 75 } }, progress: { m2: "done" } });
  expect(moyTropBasse.reussite).toBe(false);
  expect([mention(80), mention(90), mention(97), mention(79)]).toEqual(["Bien", "Très bien", "Excellent", null]);
});

test("parcours incomplet : ni suivi ni réussite", () => {
  const r = evaluer("FISC", mods, { scores: { "FISC-F1": { pct: 100 } } });
  expect(r).toMatchObject({ suivi: false, reussite: false, nFaits: 1, nTotal: 16 });
  expect(r.aFaire).toHaveLength(15);
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
  expect(evaluer("FIN", mods, { scores })).toMatchObject({ suivi: false, reussite: false, nTotal: 8, aFaire: ["Examen final (30 questions)"] });
  // (6 × 88 + 75 + 2 × 85) / 9 = 85,9 → 86
  const avecFinal = { ...scores, "FIN-FINAL": { pct: 85 } };
  expect(evaluer("FIN", mods, { scores: avecFinal })).toMatchObject({ suivi: true, reussite: true, moyenne: 86, heures: 15, nTotal: 8 });
  expect(evaluer("FIN", mods, { scores: { ...avecFinal, "FIN-FE3": { pct: 60 } } })).toMatchObject({ suivi: true, reussite: false });
});

test("SYCEBNL : 8 modules et l'examen final coefficient 2, moyenne pondérée", () => {
  const el = elementsParcours("SYCEBNL", mods);
  expect(el.map(e => e.cle)).toEqual(["SYC-SB1", "SYC-SB2", "SYC-SB3", "SYC-SB4", "SYC-SB5", "SYC-SB6", "SYC-SB7", "SYC-SB8", "SYC-FINAL"]);
  expect(el[8].coef).toBe(2);
  const scores = Object.fromEntries(["SB1", "SB2", "SB3", "SB4", "SB5", "SB6", "SB7", "SB8"].map(f => [`SYC-${f}`, { pct: 80 }]));
  // (8 × 80 + 2 × 95) / 10 = 83
  expect(evaluer("SYCEBNL", mods, { scores: { ...scores, "SYC-FINAL": { pct: 95 } } })).toMatchObject({ suivi: true, reussite: true, moyenne: 83, mention: "Bien", heures: 13 });
  // examen sous 70 % : pas de certificat
  expect(evaluer("SYCEBNL", mods, { scores: { ...scores, "SYC-FINAL": { pct: 65 } } }).reussite).toBe(false);
  // examen non passé : parcours incomplet
  expect(evaluer("SYCEBNL", mods, { scores })).toMatchObject({ suivi: false, aFaire: ["Examen final (30 questions)"] });
  expect(PARCOURS.find(p => p.id === "SYCEBNL").certificat).toBe(true);
});

test("SYCEBNL : ouverture progressive des modules et de l'examen final", () => {
  const e0 = etatSyc({});
  expect(e0.modules.map(m => m.ouvert)).toEqual([true, false, false, false, false, false, false, false]);
  expect(e0.finalOuvert).toBe(false);
  const e1 = etatSyc({ "SYC-SB1": { pct: 70 }, "SYC-SB2": { pct: 60 } });
  expect(e1.modules.slice(0, 4).map(m => m.ouvert)).toEqual([true, true, false, false]);
  const tous = p => Object.fromEntries(["SB1", "SB2", "SB3", "SB4", "SB5", "SB6", "SB7", "SB8"].map(f => [`SYC-${f}`, { pct: p }]));
  expect(etatSyc(tous(75))).toMatchObject({ tousReussis: true, moyenneModules: 75, finalOuvert: false });
  expect(etatSyc(tous(80))).toMatchObject({ tousReussis: true, moyenneModules: 80, finalOuvert: true });
  expect(etatSyc({ ...tous(100), "SYC-SB5": { pct: 60 } }).finalOuvert).toBe(false);
});

test("ouverture progressive : acquis conservés et examen final", () => {
  // F1 réussi, F2 à 60 % : F3 fermé ; F5 déjà commencé reste ouvert
  const e = etatParcours("FISC", [], { scores: { "FISC-F1": { pct: 90 }, "FISC-F2": { pct: 60 }, "FISC-F5": { pct: 40 } } });
  expect(e.elements.slice(0, 6).map(x => x.ouvert)).toEqual([true, true, false, false, true, false]);
  expect(e.finalOuvert).toBe(false);
  const tous = p => Object.fromEntries(FISC.map(([f]) => [`FISC-${f}`, { pct: p }]));
  expect(etatParcours("FISC", [], { scores: tous(79) })).toMatchObject({ tousReussis: true, finalOuvert: false, moyenne: 79 });
  expect(etatParcours("FISC", [], { scores: tous(80) })).toMatchObject({ tousReussis: true, finalOuvert: true, nReussis: 15 });
  // SYS-N1 : module sans évaluation réussi quand il est terminé ; SYS-N2 : pas d'ordre imposé
  const n1 = etatParcours("SYS-N1", mods, { scores: { m1: { pct: 70 } }, progress: {} });
  expect(n1.elements.map(x => [x.cle, x.ouvert])).toEqual([["m1", true], ["m2", true], ["CPT-T", false]]);
  const n1b = etatParcours("SYS-N1", mods, { scores: { m1: { pct: 70 } }, progress: { m2: "done" } });
  expect(n1b.elements[2].ouvert).toBe(true);
  expect(etatParcours("SYS-N2", [], {}).elements.every(x => x.ouvert)).toBe(true);
});
