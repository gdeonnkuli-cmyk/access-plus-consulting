import { indicateurs, dateInscription } from "./indicateurs";

const J = 86400000, maintenant = new Date(2026, 10, 14, 12);
const users = [
  { uid: "a", nom: "Grâce Kabeya", mail: "grace@ex.cd", demandeTel: "0990000000", activationCode: "EC-SECRET1", createdAt: "3/11/2026", abonnement: "actif", dateExpiration: "2027-01-01", lastLogin: +maintenant - 2 * J,
    progress: { m1: "done" }, scores: { m1: { pct: 90 }, "EF-EF1": { pct: 80 }, "EF-FINAL": { pct: 85 }, "CPT-1": { pct: 20 } } },
  { uid: "b", nom: "Jean Lukusa", mail: "jean@ex.cd", createdAt: "15/9/2026", abonnement: "demande", lastLogin: +maintenant - 10 * J, scores: { "FISC-F1": { pct: 50 } } },
  { uid: "c", nom: "Ancien", mail: "c@ex.cd", createdAt: "1/1/2025", abonnement: "actif", dateExpiration: "2026-01-01" },
  { uid: "f", nom: "Patrick", mail: "f@ex.cd", role: "formateur", createdAt: "20/10/2026" },
  { uid: "adm", mail: "admin@accessplus.com" },
];
const r = indicateurs({ users, modules: [{ id: "m1", on: true, status: "approved" }, { id: "m2", status: "pending" }],
  attestations: [{ parcours: "EDUF", type: "reussite", statut: "valide" }, { parcours: "FISC", type: "suivi", statut: "valide" }, { parcours: "FISC", type: "reussite", statut: "revoquee" }],
  psycho: [{ pct: 60 }, { pct: 80 }], maintenant });
const kpi = (g, l) => r.groupes.find(x => x.titre === g).kpis.find(k => k.l.startsWith(l)).v;

test("indicateurs agrégés : comptes, abonnements, engagement, notes, certificats", () => {
  expect(dateInscription("3/11/2026")).toEqual(new Date(2026, 10, 3));
  expect(kpi("Utilisateurs", "Inscrits")).toBe(4); // administrateur exclu
  expect(kpi("Utilisateurs", "Nouveaux ce mois")).toBe(1);
  expect(kpi("Utilisateurs", "Nouveaux sur 30")).toBe(2);
  expect([kpi("Utilisateurs", "Apprenants"), kpi("Utilisateurs", "Formateurs")]).toEqual([3, 1]);
  expect([kpi("Abonnements", "Abonnements actifs"), kpi("Abonnements", "Demandes"), kpi("Abonnements", "Expirés")]).toEqual([1, 1, 1]);
  expect([kpi("Engagement des apprenants", "Engagés"), kpi("Engagement des apprenants", "À surveiller"), kpi("Engagement des apprenants", "Inactifs")]).toEqual([1, 1, 1]);
  // notes hors exercices (CPT-1 exclu) : 90, 80, 85, 50
  expect(kpi("Évaluations et certificats", "Évaluations passées")).toBe(4);
  expect(kpi("Évaluations et certificats", "Score moyen")).toBe(76);
  expect(kpi("Évaluations et certificats", "Taux de réussite")).toBe(75);
  expect(kpi("Évaluations et certificats", "Certificats")).toBe(1); // révoqué exclu
  expect(kpi("Contenus", "Modules de cours")).toBe(1);
  expect(kpi("Tests psychotechniques et services", "Score moyen")).toBe(70);
  expect(r.parcours.find(p => p.id === "EDUF")).toMatchObject({ commence: 1, finalReussi: 1, certificats: 1 });
  expect(r.parcours.find(p => p.id === "FISC")).toMatchObject({ commence: 1, finalReussi: 0, certificats: 0 });
});

test("aucune donnée personnelle dans la réponse", () => {
  const texte = JSON.stringify(r);
  for (const u of users) for (const v of [u.nom, u.mail, u.uid, u.demandeTel, u.activationCode].filter(x => x && x.length > 2)) expect(texte).not.toContain(v);
});
