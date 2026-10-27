import { GROUPES_APPRENANT, GROUPES_ADMIN, VUES_APPRENANT, VUES_ADMIN, vuesDe, normaliserVue, groupeDe, badgeGroupe } from "./navigation";

test("aucun écran n'apparaît dans deux rubriques", () => {
  for (const G of [GROUPES_APPRENANT, GROUPES_ADMIN]) {
    const v = vuesDe(G);
    expect(new Set(v).size).toBe(v.length);
    expect(new Set(G.map(g => g.k)).size).toBe(G.length);
    expect(new Set(G.map(g => g.label)).size).toBe(G.length);
    G.forEach(g => expect(g.vues.length).toBeGreaterThan(0));
  }
  expect(new Set(VUES_APPRENANT).size).toBe(VUES_APPRENANT.length);
  expect(new Set(VUES_ADMIN).size).toBe(VUES_ADMIN.length);
});

test("tous les écrans existants restent accessibles", () => {
  // écrans de l'apprenant avant la réorganisation (prog est fusionné dans res)
  ["home", "msg", "pres", "stages", "videos", "ef", "jrn", "cpt", "audio", "fisc", "fin", "psycho", "services", "res", "param", "sugg", "apropos"]
    .forEach(v => expect(VUES_APPRENANT).toContain(v));
  // les 25 onglets de l'admin
  ["home", "val", "d", "a", "e", "t", "s", "m", "v", "pr", "st", "dm", "p", "fo", "an", "au", "pl", "ef", "fisc", "fin", "ac", "att", "nt", "sg", "msg"]
    .forEach(t => expect(VUES_ADMIN).toContain(t));
  expect(GROUPES_APPRENANT.length).toBe(6);
  expect(GROUPES_ADMIN.length).toBe(10);
});

test("adresses : alias, vues inconnues et rubriques", () => {
  expect(normaliserVue("prog")).toBe("res");
  expect(normaliserVue("fin")).toBe("fin");
  expect(normaliserVue("n'importe quoi")).toBe("home");
  expect(normaliserVue(null)).toBe("home");
  expect(groupeDe(GROUPES_APPRENANT, "cpt").k).toBe("parcours");
  expect(groupeDe(GROUPES_ADMIN, "dm").k).toBe("ech");
  expect(groupeDe(GROUPES_APPRENANT, "param")).toBe(null);
  expect(badgeGroupe(groupeDe(GROUPES_ADMIN, "d"), { d: 3, a: 0 })).toBe(3);
});
