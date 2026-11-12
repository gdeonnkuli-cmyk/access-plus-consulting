// ══════════════════ ÉDUCATION FINANCIÈRE : CALCULS DES SIMULATEURS ══════════════════
// Fonctions pures (testées dans calculs.test.js) : budget mensuel, crédit à mensualités constantes, épargne régulière.
// Les montants sont en francs congolais (ou en dollars : les formules ne dépendent pas de la monnaie).

const arrondi = x => Math.round(x) || 0; // jamais « -0 »

// Budget : revenu, dépenses indispensables, autres dépenses → reste, taux d'épargne possible, repères
export function budget({ revenu = 0, essentiel = 0, autres = 0 } = {}) {
  const depenses = essentiel + autres, reste = revenu - depenses;
  const pct = v => (revenu > 0 ? Math.round((v / revenu) * 1000) / 10 : 0);
  return {
    depenses, reste, tauxEpargne: reste > 0 ? pct(reste) : 0, partEssentiel: pct(essentiel), partAutres: pct(autres),
    deficit: reste < 0, objectif10: arrondi(revenu * 0.1), // repère : mettre de côté au moins 10 % du revenu
  };
}

// Crédit à mensualités constantes : capital, taux annuel (en %), durée en mois, frais de dossier
export function credit({ capital = 0, tauxAnnuel = 0, mois = 1, frais = 0 } = {}) {
  const n = Math.max(1, Math.round(mois)), i = tauxAnnuel / 100 / 12;
  const mensualite = i === 0 ? capital / n : (capital * i) / (1 - Math.pow(1 + i, -n));
  const totalRembourse = mensualite * n, interets = totalRembourse - capital;
  return { mensualite: arrondi(mensualite), totalRembourse: arrondi(totalRembourse), interets: arrondi(interets),
    coutTotal: arrondi(interets + frais), totalAvecFrais: arrondi(totalRembourse + frais) };
}

// Part du revenu consacrée aux remboursements (repère prudent : 33 % au plus)
export const tauxEndettement = (mensualites, revenu) => (revenu > 0 ? Math.round((mensualites / revenu) * 1000) / 10 : 0);

// Épargne régulière : versement par semaine ou par mois, durée en mois, taux annuel (intérêts composés chaque mois)
export function epargne({ versement = 0, frequence = "mois", mois = 12, tauxAnnuel = 0 } = {}) {
  const parMois = frequence === "semaine" ? (versement * 52) / 12 : versement;
  const i = tauxAnnuel / 100 / 12;
  let solde = 0;
  for (let k = 0; k < mois; k++) solde = solde * (1 + i) + parMois;
  const verse = parMois * mois;
  return { parMois: arrondi(parMois), verse: arrondi(verse), interets: arrondi(solde - verse), total: arrondi(solde) };
}

// Inflation : pouvoir d'achat d'une somme après n mois à un taux d'inflation mensuel donné (en %)
export const pouvoirAchat = (somme, inflationMensuelle, mois) => arrondi(somme / Math.pow(1 + inflationMensuelle / 100, mois));
