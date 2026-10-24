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

const cache = {};
let planP = null;

export function chargerClasse(k) {
  if (!cache[k]) cache[k] = import(`./classe${k}.json`).then(m => m.default || m);
  return cache[k];
}
export const chargerTout = () => Promise.all(CLASSES_REV.map(([k]) => chargerClasse(k)));

// Plan : [[numéro, intitulé], …] trié par numéro → { liste, index }
export function chargerPlan() {
  if (!planP) planP = import("./plan.json").then(m => {
    const liste = m.default || m;
    return { liste, index: new Map(liste) };
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
    const blocs = [...(x.contenu || []), ...(x.commentaires || []), ...(x.fonctionnement?.credit || []), ...(x.fonctionnement?.debit || []), ...(x.exclusions || []), ...(x.changements || [])];
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
