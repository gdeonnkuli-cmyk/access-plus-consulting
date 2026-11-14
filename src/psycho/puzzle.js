// ══════════════════ PUZZLE DE LA CARTE DE LA RDC : LOGIQUE ══════════════════
// Géométrie (point dans un polygone, distance à un contour), niveaux, tirage et score.
// Les coordonnées sont celles de carteRdc.js (repère LARGEUR × HAUTEUR).
import { PROVINCES } from "./carteRdc";

export const NIVEAUX_CARTE = [
  { id: "facile", label: "Facile", n: 8, dur: 240, cases: true, etiquette: "nom", col: "#15803D", ico: "puzzle",
    d: "8 provinces à placer, les autres sont déjà en place. Les emplacements sont dessinés." },
  { id: "moyen", label: "Moyen", n: 26, dur: 480, cases: true, etiquette: "nom", col: "#1E4FA3", ico: "puzzle-2",
    d: "Les 26 provinces à placer. Les emplacements sont dessinés." },
  { id: "difficile", label: "Difficile", n: 26, dur: 600, cases: false, etiquette: "nom", col: "#B7791F", ico: "map-2",
    d: "Les 26 provinces, avec seulement le contour du pays." },
  { id: "expert", label: "Chefs-lieux", n: 26, dur: 720, cases: false, etiquette: "chef", col: "#A3122A", ico: "building-community",
    d: "Chaque pièce porte le nom du chef-lieu : retrouvez sa province, sur le seul contour du pays." },
];

// Point (x, y) dans un anneau [x, y, x, y, …] (règle pair-impair)
function dansAnneau(r, x, y) {
  let dedans = false;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}
export const dansProvince = (p, x, y) => p.r.some(r => dansAnneau(r, x, y));

// Distance du point au contour le plus proche de la province (0 si le point est dedans)
export function distanceProvince(p, x, y) {
  if (dansProvince(p, x, y)) return 0;
  let min = Infinity;
  for (const r of p.r) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const ax = r[j], ay = r[j + 1], bx = r[i], by = r[i + 1], dx = bx - ax, dy = by - ay;
    const t = dx || dy ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))) : 0;
    min = Math.min(min, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return min;
}

// Province réellement touchée en (x, y), ou null (hors du pays)
export const provinceEn = (x, y) => PROVINCES.find(p => dansProvince(p, x, y)) || null;

// La pièce est-elle posée au bon endroit ? Tolérance (en unités de la carte) pour les petites provinces (Kinshasa)
export const bienPlacee = (p, x, y, tol = 0) => distanceProvince(p, x, y) <= tol;

// Rectangle englobant d'une province (miniature de la pièce)
export function cadre(p) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of p.r) for (let i = 0; i < r.length; i += 2) {
    x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]);
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
export const chemin = p => p.r.map(r => "M" + r.reduce((s, v, i) => s + (i % 2 ? "," + v : (i ? "L" : "") + v), "") + "Z").join("");

// Tirage : provinces à placer (dans un ordre aléatoire) et provinces déjà posées
export function tirage(niveau, alea = Math.random) {
  const melange = PROVINCES.map(p => p.nom).map(n => [alea(), n]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const aPlacer = melange.slice(0, Math.min(niveau.n, PROVINCES.length));
  return { aPlacer, dejaPosees: PROVINCES.map(p => p.nom).filter(n => !aPlacer.includes(n)) };
}

// Score : pièces bien placées, pénalisées par les erreurs (0 à 100 %)
export const scoreCarte = (placees, total, erreurs) => (total ? Math.round((100 * placees) / (total + erreurs)) : 0);
