// ══════════════ CONTENU ET FONCTIONNEMENT DES COMPTES — SYSCOHADA RÉVISÉ ══════════════
// Données du guide (9 classes, ≈ 85 comptes à deux chiffres) et liste des 1 330 comptes du plan révisé.
// Chargées à la demande (un fichier par classe) pour ne pas alourdir le premier affichage.

export const CLASSES_REV = [
  [1, "Comptes de ressources durables"], [2, "Comptes d'actif immobilisé"], [3, "Comptes de stocks"],
  [4, "Comptes de tiers"], [5, "Comptes de trésorerie"], [6, "Comptes de charges des activités ordinaires"],
  [7, "Comptes de produits des activités ordinaires"], [8, "Comptes des autres charges et des autres produits"],
  [9, "Engagements hors bilan et comptabilité analytique de gestion"],
];

export const REMARQUES = [
  "Le compte 10 — Capital n'apparaît pas dans la liste source (seuls ses sous-comptes 101 à 109 y figurent) : il a été rétabli.",
  "Les comptes 90 et 91 (engagements obtenus, accordés et leurs contreparties) ne figurent pas dans la liste source : la classe 9 les présente sans citer de numéros absents de la liste.",
  "La liste source rattache au compte 55 (instruments de monnaie électronique) les comptes 5561 et 5667 (intérêts courus bancaires), qui relèvent logiquement du compte 526 : ils sont reproduits tels quels.",
  "Le compte 478 est subdivisé en 4781 (diminution des créances), 4782 (augmentation des dettes) et 4788 (différences compensées par couverture de change) ; il n'y a pas de 4784.",
];

// Repères généraux de fonctionnement (sens des comptes)
export const REPERES = [
  { n: "Actif : immobilisations, stocks, créances, trésorerie (classes 2 à 5)", plus: "Débit", moins: "Crédit", r: "Les comptes correcteurs (28, 29, 39, 49, 59) fonctionnent en sens inverse : ils augmentent au crédit." },
  { n: "Charges (classe 6 et charges H.A.O. 81, 83, 85, 87, 89)", plus: "Débit", moins: "Crédit", r: "Une charge payée d'avance est retirée du résultat par le compte 476 — Charges constatées d'avance." },
  { n: "Capitaux propres, dettes et provisions (classe 1, dettes de la classe 4)", plus: "Crédit", moins: "Débit", r: "Un compte de tiers peut changer de sens : un fournisseur débiteur (409) est une créance, un client créditeur (419) une dette." },
  { n: "Produits (classe 7 et produits H.A.O. 82, 84, 86, 88)", plus: "Crédit", moins: "Débit", r: "Une avance reçue d'un client (4191) est une dette, pas un produit acquis." },
  { n: "Engagements hors bilan (90, 91)", plus: "À la naissance, contre la contrepartie", moins: "À l'extinction ou à l'utilisation", r: "Ils ne dispensent pas d'enregistrer l'actif ou la dette au bilan dès que les critères sont réunis." },
];

// Synthèse des contrôles de clôture
export const CLOTURE = [
  "Rapprocher les capitaux propres, emprunts, dettes de location-acquisition et provisions avec les contrats et les décisions des organes compétents.",
  "Vérifier les immobilisations : acquisitions, mises en service, amortissements, dépréciations, cessions et inventaire physique.",
  "Réaliser les inventaires de stocks et d'encours ; analyser les écarts, les biens détenus par des tiers, l'obsolescence et les dépréciations.",
  "Lettrer les comptes de tiers, confirmer les soldes significatifs et examiner les créances anciennes, les avances, les retenues et les comptes d'attente.",
  "Effectuer les rapprochements bancaires et les comptages de caisse ; apurer les virements internes (585) et les régies d'avances (581).",
  "Rattacher les charges et les produits au bon exercice : factures non parvenues (408), produits à recevoir (418), charges et produits constatés d'avance (476, 477), intérêts courus.",
  "Documenter les provisions, les dépréciations, les engagements hors bilan et les comptes analytiques.",
  "Vérifier l'égalité débit/crédit et la concordance entre balance, grand livre, inventaires et états financiers.",
];

// Points clés de la mise à jour par rapport au chapitre de 2000
export const POINTS_CLES = [
  "Le compte 20 (charges immobilisées) n'est pas repris : frais d'établissement et charges à répartir sont comptabilisés en charges ; les actifs incorporels sont classés en 21 selon leur nature.",
  "Le compte 17 devient « Dettes de location-acquisition » : le bien est inscrit à l'actif du preneur, la redevance est ventilée entre capital (17) et intérêts (672).",
  "Le compte 55 — Instruments de monnaie électronique (cartes carburant, mobile money, porte-monnaie électronique) est créé ; ses soldes se rapprochent des relevés des opérateurs.",
  "Les dépréciations des stocks et des créances à court terme passent par les comptes 659 et 759 ; les comptes 69 et 79 restent pour les provisions et les dépréciations des immobilisations.",
  "Les comptes de régularisation sont réorganisés : 474 (répartition périodique), 475 (ajustement lié à la révision du SYSCOHADA), 476 et 477 (charges et produits constatés d'avance).",
  "Champ d'application : depuis le 1er janvier 2024, les entités à but non lucratif relèvent en principe du SYCEBNL et non du SYSCOHADA général.",
];

// Sous-comptes de la classe 9 cités par le guide mais absents de la liste source
const TITRES_EXTRA = [["9011", "Crédits confirmés obtenus"], ["9051", "Crédits accordés non décaissés"]];

const cache = {};
let planP = null, complP = null;

const chargerComplements = () => complP || (complP = import("./complements.json").then(m => m.default || m));
// Classe + compléments (distinctions, éléments de contrôle, écritures types) fusionnés par compte
export function chargerClasse(k) {
  if (!cache[k]) cache[k] = Promise.all([import(`./classe${k}.json`), chargerComplements()]).then(([m, X]) => {
    const C = m.default || m;
    return { ...C, comptes: C.comptes.map(x => ({ ...x, ...(X[x.c] || {}) })) };
  });
  return cache[k];
}
export const chargerTout = () => Promise.all(CLASSES_REV.map(([k]) => chargerClasse(k)));

// Plan : [[numéro, intitulé], …] trié par numéro → { liste, index }
export function chargerPlan() {
  if (!planP) planP = import("./plan.json").then(m => {
    const liste = m.default || m;
    return { liste, index: new Map([...liste, ...TITRES_EXTRA]) };
  });
  return planP;
}

// Subdivisions d'un compte à deux chiffres (comptes à 3 et 4 chiffres et plus)
export const subdivisions = (liste, c2) => liste.filter(([c]) => c.length > 2 && c.startsWith(c2));

// Recherche sans accents ni casse
export const norm = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[-\u2011'\u2019]/g, " ").toLowerCase();

// Recherche par numéro (préfixe) ou par intitulé dans le plan
export function chercherPlan(liste, q, max = 40) {
  const t = String(q || "").trim();
  if (!t) return [];
  if (/^\d+$/.test(t)) return liste.filter(([c]) => c.startsWith(t)).slice(0, max);
  const mots = norm(t).split(/\s+/).filter(Boolean);
  return liste.filter(([, l]) => { const n = norm(l); return mots.every(m => n.includes(m)); }).slice(0, max);
}

// Recherche plein texte dans les fiches (comptes à deux chiffres) déjà chargées
export function chercherTexte(classes, q, max = 12) {
  const mots = norm(q).split(/\s+/).filter(m => m.length > 1);
  if (!mots.length) return [];
  const R = [];
  for (const C of classes) for (const x of C.comptes) {
    const blocs = [...(x.contenu || []), ...(x.commentaires || []), ...(x.fonctionnement?.credit || []), ...(x.fonctionnement?.debit || []), x.dist || "", ...(x.exclusions || []), x.ctrl || "", ...(x.ecr || []).map(e => e.op), ...(x.changements || [])];
    const n = norm(blocs.join(" "));
    if (!mots.every(m => n.includes(m))) continue;
    const b = blocs.find(t => norm(t).includes(mots[0])) || "";
    const i = norm(b).indexOf(mots[0]);
    const d = i > 60 ? b.indexOf(" ", i - 60) + 1 : 0, f = i + 140 < b.length ? b.lastIndexOf(" ", i + 140) : b.length;
    const extrait = (d ? "… " : "") + b.slice(d, f).replace(/\*\*/g, "") + (f < b.length ? " …" : "");
    R.push({ c: x.c, titre: x.titre, extrait });
    if (R.length >= max) return R;
  }
  return R;
}

// Numéros de compte cités dans un texte, transformables en liens vers le plan
const ANNEE = n => n.length === 4 && +n >= 1990 && +n <= 2035;
export function decouper(texte, index) {
  const out = [];
  const re = /\*\*(.+?)\*\*|\b(\d{2,6})\b/g;
  let last = 0, m;
  while ((m = re.exec(texte))) {
    if (m.index > last) out.push({ t: texte.slice(last, m.index) });
    if (m[1] != null) out.push({ t: m[1], gras: true });
    else {
      const n = m[2], apres = texte.slice(re.lastIndex, re.lastIndex + 3), avant = texte.slice(Math.max(0, m.index - 40), m.index);
      const tiret = /^\s?[—–-]\s/.test(apres) || apres.startsWith(" —");
      const cite = /comptes?\s+(?:n°\s*)?(?:[\d]+(?:\s*(?:,|et|ou|à)\s*)?)*$/i.test(avant);
      const lien = index && index.has(n) && !/^\s?%/.test(apres) && (tiret || cite || (n.length >= 3 && !ANNEE(n)));
      out.push(lien ? { t: n, compte: n } : { t: n });
    }
    last = re.lastIndex;
  }
  if (last < texte.length) out.push({ t: texte.slice(last) });
  return out;
}
