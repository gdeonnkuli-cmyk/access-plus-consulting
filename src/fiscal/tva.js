// ══════════════════ LIQUIDATION MENSUELLE DE LA TVA (module F12) ══════════════════
// Code des impôts mis à jour au 31 mars 2021 (O.-L. n° 10/001, D. n° 011/42) :
//   taux 16 % (0 % à l'export, art. 35) ; services taxés à l'encaissement (art. 26) ;
//   carburant déductible à 50 % hors cas particuliers (art. 41-3 ter) ; prorata arrondi à l'unité
//   supérieure (art. 43) ; ordre de liquidation (D. art. 136) ; arrondi à la centaine (D. art. 137) ;
//   remboursement exportateur plafonné à 16 % des exportations du mois (art. 64).
export const TAUX_TVA = 16;

// Arrondi à la centaine : moins de 50 FC négligés, 50 FC et plus à la centaine supérieure
export const arrondiCentaine = x => { const b = Math.floor(x / 100) * 100; return x - b >= 50 ? b + 100 : b; };
// Prorata de déduction en pourcentage entier, arrondi à l'unité supérieure
export const prorata = (ouvrantDroit, total) => total > 0 ? Math.min(100, Math.ceil(ouvrantDroit / total * 100 - 1e-9)) : 100;

export function liquidationTVA({ ventes = 0, services = 0, exportations = 0, exonerees = 0, achats = 0, immobilisations = 0,
  carburant = 0, exclus = 0, douane = 0, credit = 0 } = {}) {
  const t = TAUX_TVA / 100;
  const collectee = Math.round((ventes + services) * t);
  const pct = prorata(ventes + services + exportations, ventes + services + exportations + exonerees);
  const brute = Math.round((achats + immobilisations) * t + carburant * t * 0.5 + douane);
  const deductible = Math.round(brute * pct / 100);
  const perdue = Math.round(exclus * t + carburant * t * 0.5) + (brute - deductible);
  const solde = collectee - deductible - credit;
  const aPayer = solde > 0 ? arrondiCentaine(solde) : 0;
  const creditReporte = solde < 0 ? -solde : 0;
  const remboursable = exportations > 0 ? Math.min(creditReporte, Math.round(exportations * t)) : 0;
  return { collectee, prorata: pct, brute, deductible, perdue, solde, aPayer, creditReporte, remboursable };
}
