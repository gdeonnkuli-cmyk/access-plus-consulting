// ══════════════ SCORES DES EXERCICES ══════════════
// users/{uid}.scores contient, sous des clés distinctes :
// - les QCM des modules (clé = id du module) et des modules fiscaux (« FISC-… ») ;
// - les exercices : « Quel compte ? » (« CPT-1 » … « CPT-9 », « CPT-T » pour toutes les classes)
//   et la monographie ZAO (« JRN-ZAO »).
// Les exercices sont suivis à part et ne comptent pas dans le score moyen des QCM.

export const CLES_CPT = ["CPT-T", ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `CPT-${k}`)];
export const cleCpt = k => `CPT-${k || "T"}`;
export const estExercice = cle => /^(CPT-|JRN-)/.test(cle);

// Pourcentages des QCM seuls (exercices exclus)
export const pctQcm = u => Object.entries((u && u.scores) || {}).filter(([c]) => !estExercice(c)).map(([, s]) => s && s.pct).filter(p => p != null);
export const moyenne = L => (L.length ? Math.round(L.reduce((a, b) => a + b, 0) / L.length) : null);

// Nouveau résultat d'une série → meilleur score conservé, nombre de séries, dernière série
export function fusionScore(ancien, { s, t }, date = new Date().toISOString()) {
  const derniere = { s, t, pct: t ? Math.round((s / t) * 100) : 0, date };
  const n = ((ancien && ancien.n) || (ancien && ancien.pct != null ? 1 : 0)) + 1;
  const garderAncien = ancien && ancien.pct != null && ancien.pct > derniere.pct;
  const meilleur = garderAncien ? { s: ancien.s, t: ancien.t, pct: ancien.pct, date: ancien.date } : derniere;
  return { ...meilleur, n, derniere };
}

// Résumé « Quel compte ? » d'un apprenant : { "CPT-4": { pct, n, date, derniere }, … }, moyenne des meilleurs scores
export function resumeCpt(scores = {}) {
  const parCle = {};
  CLES_CPT.forEach(c => { if (scores[c] && scores[c].pct != null) parCle[c] = scores[c]; });
  const L = Object.values(parCle).map(x => x.pct);
  return { parCle, moyenne: moyenne(L), nSeries: Object.values(parCle).reduce((a, x) => a + (x.n || 1), 0) };
}

// Niveau d'un pourcentage pour le code couleur
export const niveau = pct => (pct == null ? "aucun" : pct >= 80 ? "bon" : pct >= 50 ? "moyen" : "faible");
