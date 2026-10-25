import { pourLecture, decouperPhrases, texteModuleFiscal, texteFiche, texteModuleCours, dureeMinutes } from "./lecture";
import { MODULES_FISC } from "../fiscal/modules";

test("réécriture pour l'oral : abréviations, symboles, grands nombres", () => {
  expect(pourLecture("**IPR** : 30 % (art. 84 O.-L. n° 69/009)")).toBe("IPR: 30 pour cent (article 84 ordonnance-loi numéro 69/009)");
  expect(pourLecture("Plafond de 10 000 000 FC")).toBe("Plafond de 10000000 francs congolais");
  expect(pourLecture("CA ≤ 80 000 000 FC → petite entreprise")).toBe("CA inférieur ou égal à 80000000 francs congolais, petite entreprise");
  expect(pourLecture("actif/passif · SYSCOHADA")).toBe("actif ou passif, Syscohada");
  expect(pourLecture("Brut − CNSS")).toBe("Brut moins CNSS");
});

test("découpage en phrases de longueur limitée", () => {
  const long = Array(30).fill("Une phrase de longueur moyenne pour tester le découpage.").join(" ");
  const P = decouperPhrases(long, 220);
  expect(P.length).toBeGreaterThan(5);
  expect(P.every(p => p.length <= 240)).toBe(true);
});

test("les 12 leçons fiscales produisent un texte lisible, sans balises ni symboles bruts", () => {
  expect(MODULES_FISC.length).toBe(12);
  for (const m of MODULES_FISC) {
    const S = texteModuleFiscal(m);
    expect(S.length).toBeGreaterThan(10);
    expect(S[0]).toMatch(new RegExp(`^Module ${m.id}`));
    const tout = S.join(" ");
    expect(tout).not.toMatch(/\*\*|≤|≥|→|undefined|\[object/);
    expect(dureeMinutes(S)).toBeGreaterThan(0);
  }
});

test("fiche du guide et module de cours", () => {
  const x = { c: "41", titre: "Clients et comptes rattachés", contenu: ["Le compte **41** suit les créances."], ecr: [{ op: "Vente à crédit", l: [[["4111"], ["7011", "4431"]]] }], fonctionnement: { credit: ["Crédité des règlements."], debit: [] }, dist: "Distinguer 414 et 485.", ctrl: "Balance âgée." };
  const S = texteFiche(x, n => ({ 4111: "Clients", 7011: "Ventes de marchandises", 4431: "TVA facturée sur ventes" })[n]);
  expect(S[0]).toBe("Compte 41. Clients et comptes rattachés.");
  expect(S.join(" ")).toMatch(/Vente à crédit: au débit, 4111 Clients; au crédit, 7011 Ventes de marchandises et 4431 TVA facturée sur ventes\./);
  const mod = { titre: "Bilan SYSCOHADA", desc: "Établir le bilan", ex: { ti: "Bilan", en: "Établissez le bilan.", dn: [{ a: "211 Terrains", b: "2 000 000" }], tv: ["1. Classez."] } };
  expect(texteModuleCours(mod, true).join(" ")).toMatch(/Données\. 211 Terrains: 2000000\./);
  expect(texteModuleCours(mod, false).join(" ")).not.toMatch(/Données/);
});
