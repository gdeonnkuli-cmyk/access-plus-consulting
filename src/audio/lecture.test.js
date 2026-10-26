import { pourLecture, decouperPhrases, texteModuleFiscal, texteFiche, texteModuleCours, dureeMinutes, texteNarration, paragraphesNarration } from "./lecture";
import { MODULES_FISC } from "../fiscal/modules";

test("réécriture pour l'oral : abréviations, symboles, grands nombres", () => {
  expect(pourLecture("**IPR** : 30 % (art. 84 O.-L. n° 69/009)")).toBe("IPR: 30 pour cent, article 84 ordonnance-loi numéro 69/009");
  expect(pourLecture("Plafond de 10 000 000 FC")).toBe("Plafond de 10000000 francs congolais");
  expect(pourLecture("CA ≤ 80 000 000 FC → petite entreprise")).toBe("chiffre d'affaires inférieur ou égal à 80000000 francs congolais, petite entreprise");
  expect(pourLecture("actif/passif · SYSCOHADA")).toBe("actif ou passif, Syscohada");
  expect(pourLecture("Brut − CNSS")).toBe("Brut moins CNSS");
  expect(pourLecture("Le Code des impôts de la RDC")).toBe("Le Code des impôts de la République démocratique du Congo");
  expect(pourLecture("1 % du CA, prix HT et TTC, résultat H.A.O.")).toBe("1 pour cent du chiffre d'affaires, prix hors taxes et toutes taxes comprises, résultat hors activités ordinaires");
  expect(pourLecture("art. 2 L.F. 2025 ; AMR ; R.H.A.O.")).toBe("article 2 loi de finances 2025; avis de mise en recouvrement; résultat hors activités ordinaires");
  expect(pourLecture("CARDINAL SARL")).toBe("CARDINAL SARL");
  expect(pourLecture("Les retenues (CNSS et IPR) sont versées le 15.")).toBe("Les retenues, CNSS et IPR, sont versées le 15.");
  expect(pourLecture("Tranche 2 : (6 000 000 − 1 944 000) = 4 056 000")).toBe("Tranche 2: 6000000 moins 1944000, égale 4056000");
  expect(pourLecture("INPP : 3,5 % (1 à 50 travailleurs) ; ONEM : 0,5 %.")).toBe("INPP: 3,5 pour cent, 1 à 50 travailleurs; ONEM: 0,5 pour cent.");
});

test("découpage en phrases de longueur limitée", () => {
  const long = Array(30).fill("Une phrase de longueur moyenne pour tester le découpage.").join(" ");
  const P = decouperPhrases(long, 220);
  expect(P.length).toBeGreaterThan(5);
  expect(P.every(p => p.length <= 240)).toBe(true);
  const virgules = Array(20).fill("taux de 3,5 pour cent pour la tranche").join(", ");
  expect(decouperPhrases(virgules, 120).join(" ")).toMatch(/3,5 pour cent/);
  expect(decouperPhrases(virgules, 120).join(" ")).not.toMatch(/3, 5/);
  const long2 = Array(12).fill("Le taux est de 30 %. Il s'applique au bénéfice imposable, après réintégrations, déductions et reports").join(", ");
  expect(decouperPhrases(long2, 120).some(p => /[.;:]\s*,|^,/.test(p))).toBe(false);
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

test("narration d'une présentation", () => {
  expect(texteNarration({ titre: "Préparer les états financiers", narration: "" })).toEqual([]);
  expect(paragraphesNarration("Diapositive 1. Bienvenue\n\n\nDiapositive 2.\nLe calendrier  ")).toEqual(["Diapositive 1. Bienvenue", "Diapositive 2. Le calendrier"]);
  expect(texteNarration({ titre: "Clôture", narration: "Diapositive 1. Le compte 585 doit être nul au 31/12\n\nDiapositive 2. Fin" }))
    .toEqual(["Clôture.", "Diapositive 1. Le compte 585 doit être nul au 31/12.", "Diapositive 2. Fin."]);
});
