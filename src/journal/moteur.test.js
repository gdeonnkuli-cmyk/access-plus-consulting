import * as ZAO from "./zao";
import { verifier, corrigeComplet, groupes } from "./moteur";
import { ACTIF, PASSIF, CR } from "../ef/engine";

const { ops, R, lignes, fisc, ibp } = corrigeComplet(ZAO);
const net = l => (l.d || 0) - (l.cr || 0);

test("chaque écriture du corrigé est équilibrée et se valide elle-même", () => {
  for (const o of ops) {
    expect([o.n, o.lignes.reduce((s, l) => s + net(l), 0)]).toEqual([o.n, 0]);
    expect([o.n, verifier(o, o.lignes).ok]).toEqual([o.n, true]);
  }
});

test("la vérification accepte les variantes et refuse les erreurs typiques", () => {
  const op = ops.find(o => o.enonce.includes("Médias Congo pour le projet"));
  // TVA calculée à 16 % du TTC (erreur du corrigé initial) : refusée
  const faux = [{ c: "6271", d: 302400 }, { c: "4454", d: 57600 }, { c: "401", d: 234000, cr: 360000 }, { c: "571", cr: 234000 }];
  const r = verifier(op, faux);
  expect(r.ok).toBe(false);
  expect(r.detail.find(g => g.r === "627").ok).toBe(false);
  // Comptes à 3 chiffres et fournisseur soldé en net : acceptés
  const g = groupes(op.lignes), ht = g.find(x => x.r === "627").attendu, tva = g.find(x => x.r === "445").attendu;
  expect(verifier(op, [{ c: "627", d: ht }, { c: "445", d: tva }, { c: "401", cr: 126000 }, { c: "571", cr: 234000 }]).ok).toBe(true);
  // Compte inattendu et déséquilibre
  expect(verifier(op, [{ c: "6271", d: ht }, { c: "4454", d: tva }, { c: "4011", cr: 126000 }, { c: "5711", cr: 234000 }, { c: "6588", d: 10 }]).inattendus).toEqual(["6588"]);
  expect(verifier(op, [{ c: "6271", d: 360000 }, { c: "5711", cr: 234000 }]).equilibre).toBe(false);
});

test("états financiers cohérents : bilan équilibré, contrôles du moteur, IBP", () => {
  const N = R.N;
  expect(Math.abs(N.act.BZ.n - N.pas.DZ)).toBeLessThan(2);
  const erreurs = R.ctrl.filter(c => c.niveau === "err" || c.lvl === "err" || c.t === "err");
  expect(erreurs.map(e => e.lib || e.msg || e.m)).toEqual([]);
  expect(ibp).toBeGreaterThan(0);
  expect(ibp).toBe(Math.round(Math.max(Math.max(fisc.rf, 0) * 0.3, fisc.minimum)));
  if (process.env.ZAO_DUMP) require("fs").writeFileSync(process.env.ZAO_DUMP, JSON.stringify({ ops, lignes, cr: N.cr, act: N.act, pas: N.pas, fisc, ibp, ctrl: R.ctrl, hyp: ZAO.HYPOTHESES, ouverture: ZAO.OUVERTURE, lib: ZAO.LIBELLES, struct: { ACTIF, PASSIF, CR }, p1: { act: R.P1.act, pas: R.P1.pas } }, null, 1));
});
