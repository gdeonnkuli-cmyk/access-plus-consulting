// ══════════════════ NAVIGATION : RUBRIQUES ET SOUS-RUBRIQUES ══════════════════
// Chaque écran (« vue » de l'apprenant, « onglet » de l'admin) appartient à une seule rubrique :
// le menu principal affiche les rubriques, une barre de sous-rubriques affiche leurs écrans.
// Une vue = [clé, icône Tabler, libellé]. navigation.test.js vérifie qu'aucun écran n'apparaît deux fois.

export const GROUPES_APPRENANT = [
  { k: "home", ico: "home-2", label: "Accueil", vues: [["home", "home-2", "Accueil"]] },
  { k: "apprendre", ico: "book-2", label: "Apprendre", vues: [
    ["mods", "book-2", "Modules de cours"], ["pres", "presentation", "Présentations"],
    ["videos", "video", "Vidéos"], ["audio", "headphones", "Écouter les cours"],
  ] },
  { k: "parcours", ico: "route", label: "Parcours métier", court: "Parcours", vues: [
    ["ef", "report-money", "États financiers"], ["jrn", "notebook", "Monographie ZAO"], ["cpt", "books", "Guide des comptes"],
    ["fisc", "receipt-tax", "Code des impôts"], ["fin", "chart-pie", "Finance d'entreprise"],
  ] },
  { k: "resultats", ico: "trophy", label: "Mes résultats", court: "Résultats", vues: [["res", "trophy", "Mes résultats"]] },
  { k: "carriere", ico: "briefcase", label: "Carrière", vues: [["stages", "briefcase", "Stages"], ["psycho", "brain", "Tests psychotechniques"]] },
  { k: "echanges", ico: "message-circle", label: "Échanges", vues: [["msg", "message-circle", "Messages"], ["sugg", "bulb", "Suggestions"]] },
];
// Accessibles par le profil (Paramètres) et la page À propos, hors menu
export const HORS_MENU_APPRENANT = ["param", "apropos", "services"];
// Anciennes adresses (?vue=prog) et liens des notifications déjà envoyées
export const ALIAS_APPRENANT = { prog: "res" };

export const GROUPES_ADMIN = [
  { k: "home", ico: "layout-grid", label: "Accueil", vues: [["home", "layout-grid", "Tableau de bord"]] },
  { k: "val", ico: "checklist", label: "À valider", vues: [["val", "checklist", "Contenus à valider"]] },
  { k: "app", ico: "users", label: "Apprenants", vues: [
    ["d", "clock", "Demandes d'accès"], ["a", "circle-check", "Actifs"], ["e", "clock-off", "Expirés"],
    ["t", "users", "Tous les inscrits"], ["pl", "calendar-check", "Présentiel"],
  ] },
  { k: "fo", ico: "school", label: "Formateurs", vues: [["fo", "school", "Formateurs"]] },
  { k: "cont", ico: "books", label: "Contenus", vues: [
    ["m", "book-2", "Modules de cours"], ["pr", "presentation", "Présentations"], ["v", "video", "Vidéos"],
    ["p", "file-text", "PDF"], ["st", "briefcase", "Stages"],
  ] },
  { k: "parc", ico: "route", label: "Parcours métier", court: "Parcours", vues: [
    ["ef", "report-money", "États financiers"], ["fisc", "receipt-tax", "Code des impôts"], ["fin", "chart-pie", "Finance d'entreprise"],
  ] },
  { k: "ech", ico: "message-circle", label: "Échanges", vues: [
    ["msg", "message-circle", "Messages"], ["sg", "bulb", "Suggestions"], ["dm", "building", "Demandes de services"],
  ] },
  { k: "com", ico: "speakerphone", label: "Communication", vues: [["an", "speakerphone", "Annonces"], ["nt", "bell", "Notifications et bannière"]] },
  { k: "acc", ico: "ticket", label: "Accès et attestations", court: "Accès", vues: [["ac", "ticket", "Tarifs et codes offerts"], ["att", "certificate", "Attestations"]] },
  { k: "pil", ico: "chart-bar", label: "Pilotage", vues: [["s", "chart-bar", "Statistiques"], ["au", "shield-check", "Audit"]] },
];
export const HORS_MENU_ADMIN = ["param"];

export const vuesDe = groupes => groupes.flatMap(g => g.vues.map(v => v[0]));
export const VUES_APPRENANT = [...vuesDe(GROUPES_APPRENANT), ...HORS_MENU_APPRENANT];
export const VUES_ADMIN = [...vuesDe(GROUPES_ADMIN), ...HORS_MENU_ADMIN];

// Vue demandée (adresse, notification, bannière) → vue existante, l'accueil à défaut
export const normaliserVue = (v, valides = VUES_APPRENANT, alias = ALIAS_APPRENANT) => {
  const x = alias[v] || v;
  return valides.includes(x) ? x : "home";
};
export const groupeDe = (groupes, vue) => groupes.find(g => g.vues.some(x => x[0] === vue)) || null;
// Pastille d'une rubrique : somme des pastilles de ses écrans (seuls les écrans « à traiter » en ont)
export const badgeGroupe = (g, badges = {}) => g.vues.reduce((s, [k]) => s + (badges[k] || 0), 0);
